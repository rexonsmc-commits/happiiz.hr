/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  PayrollRun,
  PayrollEntry,
  SalaryStructure,
  EmployeeAdvance,
  PayrollDeductionItem,
  Company,
} from '../../types';
import { formatINR } from '../../services/payrollService';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Building2,
  Users,
  Play,
  Download,
  Calendar,
  Clock,
  ArrowRight,
  Briefcase,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface PayrollDashboardProps {
  company: Company | null;
  runs: PayrollRun[];
  currentRun: PayrollRun | null;
  entries: PayrollEntry[];
  structures: SalaryStructure[];
  advances: EmployeeAdvance[];
  deductions: PayrollDeductionItem[];
  onNavigateTab: (tab: string) => void;
}

export const PayrollDashboard: React.FC<PayrollDashboardProps> = ({
  company,
  runs,
  currentRun,
  entries,
  structures,
  advances,
  deductions,
  onNavigateTab,
}) => {
  const totalCTC = (currentRun?.totalGrossAmount || 0) + (currentRun?.totalEmployerContribution || 0);
  const totalNet = currentRun?.totalNetAmount || 0;
  const totalOtAndDD = (currentRun?.totalOvertimeAmount || 0) + (currentRun?.totalDoubleDutyAmount || 0);
  const totalOutstandingAdvances = advances.reduce((s, a) => s + a.outstandingAmount, 0);

  // Statutory liability
  const pfTotal = entries.reduce((s, e) => s + e.pfEmployee + e.pfEmployer, 0);
  const esiTotal = entries.reduce((s, e) => s + e.esiEmployee + e.esiEmployer, 0);
  const ptTotal = entries.reduce((s, e) => s + e.ptAmount, 0);
  const totalStatutoryLiability = pfTotal + esiTotal + ptTotal;

  // Department Breakdown
  const deptMap = new Map<string, number>();
  entries.forEach((e) => {
    const d = e.department || 'Operations';
    deptMap.set(d, (deptMap.get(d) || 0) + e.totalGrossSalary);
  });
  const deptList = Array.from(deptMap.entries());

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold backdrop-blur-md mb-3 border border-blue-400/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Phase 7: Payroll & Salary Management System</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
              {company?.name || 'Happiiz HR Services'} – Payroll Operations
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Automatic wages synced with Phase 6 attendance roster, overtime calculations, statutory EPF/ESIC/PT, advance deductions and 1-click bank transfer advice.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => onNavigateTab('processing')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all shadow-md shadow-blue-600/30 w-full sm:w-auto justify-center"
            >
              <Play className="w-4 h-4" />
              <span>Open Payroll Cockpit</span>
            </button>

            <button
              onClick={() => onNavigateTab('disbursement')}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all backdrop-blur-md border border-white/10 w-full sm:w-auto justify-center"
            >
              <CreditCard className="w-4 h-4" />
              <span>Bank Advice (NEFT)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Monthly Cost (CTC)
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatINR(totalCTC)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Gross + Employer PF/ESI contributions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Net Take-Home Salary
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-2 font-mono">
            {formatINR(totalNet)}
          </div>
          <p className="text-xs text-emerald-700 mt-1 font-medium">To be disbursed into bank accounts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
              Statutory Liabilities
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-950 mt-2 font-mono">
            {formatINR(totalStatutoryLiability)}
          </div>
          <p className="text-xs text-slate-500 mt-1">EPFO + ESIC + Professional Tax dues</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Active Advances Due
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-950 mt-2 font-mono">
            {formatINR(totalOutstandingAdvances)}
          </div>
          <p className="text-xs text-amber-700 mt-1 font-medium">
            {advances.filter((a) => a.status === 'active').length} active salary advances
          </p>
        </div>
      </div>

      {/* Two Column Section: Department Breakdown & Quick Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Cost Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Departmental Payroll Allocation
              </h3>
              <p className="text-xs text-slate-500">Gross wages distribution across operational divisions</p>
            </div>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>Full Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {deptList.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No calculated entries found yet.</p>
            ) : (
              deptList.map(([dept, amount], idx) => {
                const totalGross = currentRun?.totalGrossAmount || 1;
                const pct = Math.round((amount / totalGross) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{dept}</span>
                      <span className="font-mono text-slate-900">
                        {formatINR(amount)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Shortcut Navigation */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Quick Modules
          </h3>

          <div className="space-y-2">
            <button
              onClick={() => onNavigateTab('structures')}
              className="w-full p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 text-left transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 block">Salary Structures</span>
                <span className="text-[11px] text-slate-400">{structures.length} employee structures active</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </button>

            <button
              onClick={() => onNavigateTab('advances')}
              className="w-full p-3 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 text-left transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 block">Salary Advances & Recovery</span>
                <span className="text-[11px] text-slate-400">{advances.length} records in ledger</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
            </button>

            <button
              onClick={() => onNavigateTab('deductions')}
              className="w-full p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/50 text-left transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 block">Uniform & Asset Deductions</span>
                <span className="text-[11px] text-slate-400">{deductions.length} active asset plans</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
            </button>

            <button
              onClick={() => onNavigateTab('compliance')}
              className="w-full p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 text-left transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 block">Statutory Rules (PF/ESI/PT)</span>
                <span className="text-[11px] text-slate-400">Configure rates & 26/30 divisor</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Payroll Runs History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Payroll Runs History</h3>
            <p className="text-xs text-slate-500">Audit of calculated and finalized periods</p>
          </div>

          <button
            onClick={() => onNavigateTab('processing')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            Go to Processing →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Headcount</th>
                <th className="py-3 px-4">Total Gross</th>
                <th className="py-3 px-4">Overtime & DD</th>
                <th className="py-3 px-4">Net Disbursable</th>
                <th className="py-3 px-4">Employer CTC</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {runs.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 font-sans">
                    {r.monthName} {r.year} ({r.period})
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-blue-50 text-blue-800">
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-sans">{r.totalEmployees} Staff</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{formatINR(r.totalGrossAmount)}</td>
                  <td className="py-3 px-4 text-blue-700">
                    {formatINR(r.totalOvertimeAmount + r.totalDoubleDutyAmount)}
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-800 bg-emerald-50/40">
                    {formatINR(r.totalNetAmount)}
                  </td>
                  <td className="py-3 px-4 text-slate-800">
                    {formatINR(r.totalGrossAmount + r.totalEmployerContribution)}
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    <button
                      onClick={() => onNavigateTab('processing')}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      View Run
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
