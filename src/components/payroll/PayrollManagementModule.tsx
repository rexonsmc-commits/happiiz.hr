/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Company,
  Employee,
  PayrollRun,
  PayrollEntry,
  SalaryStructure,
  SalaryRevision,
  EmployeeAdvance,
  PayrollDeductionItem,
  StatutoryConfiguration,
  PayrollReadyAttendanceSummary,
} from '../../types';
import {
  getSalaryStructures,
  getSalaryRevisions,
  getEmployeeAdvances,
  getPayrollDeductions,
  getStatutoryConfiguration,
  getPayrollRuns,
  getPayrollEntries,
  executeMonthlyPayrollCalculation,
} from '../../services/payrollService';
import { getPayrollAttendanceSummaries } from '../../services/attendanceService';
import { PayrollDashboard } from './PayrollDashboard';
import { PayrollProcessingModule } from './PayrollProcessingModule';
import { SalaryStructureModule } from './SalaryStructureModule';
import { EmployeeAdvancesModule } from './EmployeeAdvancesModule';
import { PayrollDeductionsModule } from './PayrollDeductionsModule';
import { StatutoryConfigModule } from './StatutoryConfigModule';
import { BankPaymentModule } from './BankPaymentModule';
import { PayrollReportsModule } from './PayrollReportsModule';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  FileSpreadsheet,
  Clock,
  Shirt,
  Sliders,
  Layers,
  RefreshCw,
  Building2,
  Calendar,
} from 'lucide-react';

interface PayrollManagementModuleProps {
  companyId: string;
  tenantId: string;
  currentCompany: Company | null;
  employees: Employee[];
  currentUser: { name: string; role?: string };
}

export const PayrollManagementModule: React.FC<PayrollManagementModuleProps> = ({
  companyId,
  tenantId,
  currentCompany,
  employees,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Core State
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [revisions, setRevisions] = useState<SalaryRevision[]>([]);
  const [advances, setAdvances] = useState<EmployeeAdvance[]>([]);
  const [deductions, setDeductions] = useState<PayrollDeductionItem[]>([]);
  const [statutoryConfig, setStatutoryConfig] = useState<StatutoryConfiguration | null>(null);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [attendanceSummaries, setAttendanceSummaries] = useState<PayrollReadyAttendanceSummary[]>([]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [
        loadedStructures,
        loadedRevisions,
        loadedAdvances,
        loadedDeductions,
        loadedStatutory,
        loadedRuns,
        loadedSummaries,
      ] = await Promise.all([
        getSalaryStructures(companyId, tenantId, employees),
        getSalaryRevisions(companyId),
        getEmployeeAdvances(companyId, tenantId, employees),
        getPayrollDeductions(companyId, tenantId, employees),
        getStatutoryConfiguration(companyId, tenantId),
        getPayrollRuns(companyId, tenantId),
        getPayrollAttendanceSummaries(companyId, tenantId, '2026-11'),
      ]);

      setStructures(loadedStructures);
      setRevisions(loadedRevisions);
      setAdvances(loadedAdvances);
      setDeductions(loadedDeductions);
      setStatutoryConfig(loadedStatutory);
      setRuns(loadedRuns);
      setAttendanceSummaries(loadedSummaries);

      // Select active run or calculate default
      let activeRun = loadedRuns[0] || null;
      if (activeRun) {
        setSelectedRunId(activeRun.id);
        const loadedEntries = await getPayrollEntries(companyId, activeRun.id);
        if (loadedEntries.length === 0) {
          // Auto calculate entries for the active run
          const { run: updatedRun, entries: newEntries } = await executeMonthlyPayrollCalculation(
            companyId,
            tenantId,
            activeRun.period,
            currentUser.name || 'Admin',
            employees,
            loadedSummaries
          );
          activeRun = updatedRun;
          setEntries(newEntries);
        } else {
          setEntries(loadedEntries);
        }
      } else {
        // Create initial run for November 2026
        const { run: newRun, entries: newEntries } = await executeMonthlyPayrollCalculation(
          companyId,
          tenantId,
          '2026-11',
          currentUser.name || 'Admin',
          employees,
          loadedSummaries
        );
        setRuns([newRun]);
        setSelectedRunId(newRun.id);
        setEntries(newEntries);
      }
    } catch (err) {
      console.error('Error loading payroll data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [companyId, tenantId]);

  const handleSelectRun = async (runId: string) => {
    setSelectedRunId(runId);
    setIsLoading(true);
    try {
      const loaded = await getPayrollEntries(companyId, runId);
      setEntries(loaded);
    } finally {
      setIsLoading(false);
    }
  };

  const currentRun = runs.find((r) => r.id === selectedRunId) || runs[0] || null;

  const tabs = [
    { id: 'dashboard', label: 'Payroll Dashboard', icon: DollarSign },
    { id: 'processing', label: 'Monthly Processing', icon: Calendar, badge: currentRun?.status },
    { id: 'structures', label: 'Salary Structures', icon: TrendingUp },
    { id: 'advances', label: 'Employee Advances', icon: Clock },
    { id: 'deductions', label: 'Uniform & Assets', icon: Shirt },
    { id: 'disbursement', label: 'Bank Advice (NEFT)', icon: CreditCard },
    { id: 'compliance', label: 'Statutory Rules', icon: ShieldCheck },
    { id: 'reports', label: 'Registers & Reports', icon: FileSpreadsheet },
  ];

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Payroll & Wage Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              Phase 7 Complete
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise multi-tenant wage computation engine, automated overtime & double duty calculations, statutory PF/ESI compliance and bank transfers.
          </p>
        </div>

        <button
          onClick={loadAllData}
          disabled={isLoading}
          className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Tabs Navigation Strip - Multi-Line Wrap */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-slate-50/70 border border-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  {tab.badge.replace('_', ' ')}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Rendering */}
      {isLoading && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading payroll engine and employee wage profiles...</p>
        </div>
      )}

      {!isLoading && (
        <>
          {activeTab === 'dashboard' && (
            <PayrollDashboard
              company={currentCompany}
              runs={runs}
              currentRun={currentRun}
              entries={entries}
              structures={structures}
              advances={advances}
              deductions={deductions}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'processing' && (
            <PayrollProcessingModule
              companyId={companyId}
              tenantId={tenantId}
              company={currentCompany}
              runs={runs}
              currentRun={currentRun}
              entries={entries}
              employees={employees}
              attendanceSummaries={attendanceSummaries}
              currentUser={currentUser}
              onRefresh={loadAllData}
              onSelectRun={handleSelectRun}
            />
          )}

          {activeTab === 'structures' && (
            <SalaryStructureModule
              companyId={companyId}
              tenantId={tenantId}
              structures={structures}
              revisions={revisions}
              employees={employees}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'advances' && (
            <EmployeeAdvancesModule
              companyId={companyId}
              tenantId={tenantId}
              advances={advances}
              employees={employees}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'deductions' && (
            <PayrollDeductionsModule
              companyId={companyId}
              tenantId={tenantId}
              deductions={deductions}
              employees={employees}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'disbursement' && (
            <BankPaymentModule
              companyId={companyId}
              tenantId={tenantId}
              company={currentCompany}
              currentRun={currentRun}
              entries={entries}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'compliance' && statutoryConfig && (
            <StatutoryConfigModule
              companyId={companyId}
              tenantId={tenantId}
              config={statutoryConfig}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'reports' && (
            <PayrollReportsModule
              currentRun={currentRun}
              entries={entries}
              company={currentCompany}
            />
          )}
        </>
      )}
    </div>
  );
};
