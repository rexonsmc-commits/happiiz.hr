/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  PayrollRun,
  PayrollEntry,
  Company,
  Employee,
  PayrollReadyAttendanceSummary,
  PayrollStatus,
} from '../../types';
import {
  formatINR,
  executeMonthlyPayrollCalculation,
  updatePayrollRunStatus,
  generateBankPaymentCSV,
  generatePayrollRegisterCSV,
} from '../../services/payrollService';
import { SalarySlipModal } from './SalarySlipModal';
import {
  Calendar,
  Play,
  CheckCircle,
  AlertCircle,
  Lock,
  Unlock,
  FileText,
  Printer,
  Download,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
  Eye,
  RefreshCw,
  X,
} from 'lucide-react';

interface PayrollProcessingModuleProps {
  companyId: string;
  tenantId: string;
  company: Company | null;
  runs: PayrollRun[];
  currentRun: PayrollRun | null;
  entries: PayrollEntry[];
  employees: Employee[];
  attendanceSummaries: PayrollReadyAttendanceSummary[];
  currentUser: { name: string; role?: string };
  onRefresh: () => void;
  onSelectRun: (runId: string) => void;
}

export const PayrollProcessingModule: React.FC<PayrollProcessingModuleProps> = ({
  companyId,
  tenantId,
  company,
  runs,
  currentRun,
  entries,
  employees,
  attendanceSummaries,
  currentUser,
  onRefresh,
  onSelectRun,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    currentRun?.period || '2026-11'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState('all');
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedEntryForSlip, setSelectedEntryForSlip] = useState<PayrollEntry | null>(null);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('Discrepancy in attendance overtime hours');
  const [notification, setNotification] = useState<string | null>(null);

  const filteredEntries = entries.filter((e) => {
    const matchesSearch =
      e.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSite = siteFilter === 'all' || e.siteId === siteFilter;
    return matchesSearch && matchesSite;
  });

  const uniqueSites = Array.from(new Set(entries.map((e) => e.siteName))).filter(Boolean);

  const handleRunCalculation = async () => {
    setIsCalculating(true);
    try {
      await executeMonthlyPayrollCalculation(
        companyId,
        tenantId,
        selectedPeriod,
        currentUser.name || 'HR Operations',
        employees,
        attendanceSummaries
      );
      setNotification(`Payroll calculation completed for ${selectedPeriod} across ${employees.length} employees.`);
      setTimeout(() => setNotification(null), 3500);
      onRefresh();
    } catch {
      alert('Failed to calculate payroll.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleStatusChange = async (newStatus: PayrollStatus) => {
    if (!currentRun) return;
    try {
      await updatePayrollRunStatus(companyId, currentRun.id, newStatus, currentUser);
      setNotification(`Payroll status changed to ${newStatus.replace('_', ' ').toUpperCase()}.`);
      setTimeout(() => setNotification(null), 3500);
      onRefresh();
    } catch {
      alert('Failed to update payroll status.');
    }
  };

  const handleConfirmReopen = async () => {
    if (!currentRun || !reopenReason) return;
    try {
      await updatePayrollRunStatus(companyId, currentRun.id, 'draft', currentUser, reopenReason);
      setReopenModalOpen(false);
      setNotification('Payroll run successfully unlocked & reopened for revisions.');
      setTimeout(() => setNotification(null), 3500);
      onRefresh();
    } catch {
      alert('Failed to reopen payroll run.');
    }
  };

  const handleBulkPrintAll = () => {
    window.print();
  };

  const getStatusBadge = (status: PayrollStatus) => {
    switch (status) {
      case 'draft':
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold uppercase tracking-wider">Draft</span>;
      case 'calculated':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase tracking-wider">Calculated</span>;
      case 'pending_approval':
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider">Pending Approval</span>;
      case 'approved':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">Approved</span>;
      case 'finalized':
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-1"><Lock className="w-3 h-3" /><span>Finalized & Locked</span></span>;
      case 'paid':
        return <span className="px-3 py-1 bg-green-100 text-green-900 rounded-full text-xs font-bold uppercase tracking-wider">✓ Paid & Disbursed</span>;
      case 'partially_paid':
        return <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-bold uppercase tracking-wider">Partially Disbursed</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Control Header & Period Selector */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-black text-slate-900">Monthly Payroll Cockpit</h2>
            {currentRun && getStatusBadge(currentRun.status)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automatic wages, overtime, double duty, statutory PF/ESI, advance adjustments & net calculations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Period Dropdown */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-slate-500" />
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                const matched = runs.find((r) => r.period === e.target.value);
                if (matched) onSelectRun(matched.id);
              }}
              className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none"
            >
              <option value="2026-11">November 2026</option>
              <option value="2026-10">October 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-08">August 2026</option>
            </select>
          </div>

          {/* Recalculate Button */}
          <button
            onClick={handleRunCalculation}
            disabled={isCalculating || currentRun?.status === 'finalized' || currentRun?.status === 'paid'}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center space-x-2 transition-colors shadow-sm disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isCalculating ? 'animate-spin' : ''}`} />
            <span>{isCalculating ? 'Calculating...' : 'Run Calculation'}</span>
          </button>

          {/* Workflow Action Buttons */}
          {currentRun?.status === 'calculated' && (
            <button
              onClick={() => handleStatusChange('pending_approval')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              Submit for Approval
            </button>
          )}

          {currentRun?.status === 'pending_approval' && (
            <button
              onClick={() => handleStatusChange('approved')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              Approve Payroll
            </button>
          )}

          {currentRun?.status === 'approved' && (
            <button
              onClick={() => handleStatusChange('finalized')}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-sm font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Lock className="w-4 h-4" />
              <span>Finalize & Lock</span>
            </button>
          )}

          {(currentRun?.status === 'finalized' || currentRun?.status === 'approved') && (
            <button
              onClick={() => setReopenModalOpen(true)}
              className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Unlock className="w-3.5 h-3.5 text-slate-500" />
              <span>Reopen Run</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Summary Banner */}
      {currentRun && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Headcount</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">
              {currentRun.totalEmployees} <span className="text-xs font-normal text-slate-400">Staff</span>
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Gross Wages</span>
            <span className="text-xl font-black font-mono text-slate-900 mt-1 block">
              {formatINR(currentRun.totalGrossAmount)}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-blue-600 block">OT & Double Duty</span>
            <span className="text-xl font-black font-mono text-blue-900 mt-1 block">
              {formatINR(currentRun.totalOvertimeAmount + currentRun.totalDoubleDutyAmount)}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-rose-600 block">Total Deductions</span>
            <span className="text-xl font-black font-mono text-rose-800 mt-1 block">
              {formatINR(currentRun.totalDeductionsAmount)}
            </span>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-4 rounded-2xl shadow-sm">
            <span className="text-[10px] uppercase font-bold text-emerald-100 block">Net Payable</span>
            <span className="text-xl font-black font-mono mt-1 block">
              {formatINR(currentRun.totalNetAmount)}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-purple-600 block">Employer CTC</span>
            <span className="text-xl font-black font-mono text-purple-900 mt-1 block">
              {formatINR(currentRun.totalGrossAmount + currentRun.totalEmployerContribution)}
            </span>
          </div>
        </div>
      )}

      {/* Audit Trail Strip */}
      {currentRun && (
        <div className="bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center space-x-4">
            <span>Prepared: <strong className="text-slate-700">{currentRun.preparedBy || 'Operations'}</strong></span>
            {currentRun.approvedBy && (
              <span>Approved by: <strong className="text-emerald-700">{currentRun.approvedBy}</strong></span>
            )}
            {currentRun.finalizedBy && (
              <span>Locked by: <strong className="text-purple-700">{currentRun.finalizedBy}</strong></span>
            )}
            {currentRun.reopenedBy && (
              <span className="text-amber-700">Reopened: {currentRun.reopenedBy} ("{currentRun.reopenReason}")</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleBulkPrintAll}
              className="text-xs font-semibold text-slate-700 hover:text-blue-600 flex items-center space-x-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Run Summary</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex flex-1 items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee, designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="all">All Sites</option>
            {uniqueSites.map((s, idx) => (
              <option key={idx} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Showing <strong>{filteredEntries.length}</strong> calculated personnel
        </div>
      </div>

      {/* Payroll Entries Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3">Days (P / A / W)</th>
                <th className="py-3 px-3">OT (hrs)</th>
                <th className="py-3 px-3">Double Duty</th>
                <th className="py-3 px-3">Earned Basic</th>
                <th className="py-3 px-3">OT + DD Pay</th>
                <th className="py-3 px-3">Gross Salary</th>
                <th className="py-3 px-3">Statutory (PF+ESI+PT)</th>
                <th className="py-3 px-3">Adv & Uniform</th>
                <th className="py-3 px-3">Total Deductions</th>
                <th className="py-3 px-3">Net Payable</th>
                <th className="py-3 px-3 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400 font-sans">
                    No payroll entries calculated for this period yet. Click "Run Calculation" above.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-sans font-semibold text-slate-900">{e.employeeName}</div>
                      <div className="text-[10px] text-slate-400">
                        {e.employeeCode} • {e.designation}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-slate-700">
                      <span className="text-emerald-700 font-bold">{e.presentDays}</span> /{' '}
                      <span className="text-rose-600">{e.absentDays}</span> /{' '}
                      <span className="text-blue-600">{e.weeklyOffDays}</span>
                    </td>

                    <td className="py-2.5 px-3 text-slate-700">{e.overtimeHours}h</td>

                    <td className="py-2.5 px-3 text-slate-700">{e.doubleDutyCount}s</td>

                    <td className="py-2.5 px-3 text-slate-800">{formatINR(e.basicEarned)}</td>

                    <td className="py-2.5 px-3 text-blue-700">
                      {formatINR(e.overtimeAmount + e.doubleDutyAmount)}
                    </td>

                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {formatINR(e.totalGrossSalary)}
                    </td>

                    <td className="py-2.5 px-3 text-slate-700">
                      {formatINR(e.pfEmployee + e.esiEmployee + e.ptAmount)}
                    </td>

                    <td className="py-2.5 px-3 text-amber-700">
                      {formatINR(e.advanceDeduction + e.uniformEquipmentDeduction)}
                    </td>

                    <td className="py-2.5 px-3 font-medium text-rose-700">
                      {formatINR(e.totalDeductions)}
                    </td>

                    <td className="py-2.5 px-3 font-bold text-emerald-800 bg-emerald-50/50">
                      {formatINR(e.netPayable)}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedEntryForSlip(e)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold font-sans flex items-center space-x-1 ml-auto transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Slip</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Slip Modal */}
      {selectedEntryForSlip && (
        <SalarySlipModal
          entry={selectedEntryForSlip}
          company={company}
          onClose={() => setSelectedEntryForSlip(null)}
        />
      )}

      {/* Reopen Audit Modal */}
      {reopenModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Unlock className="w-5 h-5 text-amber-600" />
                <span>Reopen Payroll Run</span>
              </h3>
              <button onClick={() => setReopenModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-6">
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                Reopening an approved or locked payroll run requires a mandatory audit trail reason and will return the run to editable draft mode.
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Reason for Unlocking / Revision
                </label>
                <textarea
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="State reason: e.g. Manual correction of missing punch for Guard Dharamveer, retroactive increment..."
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setReopenModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReopen}
                disabled={!reopenReason.trim()}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                Confirm & Reopen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
