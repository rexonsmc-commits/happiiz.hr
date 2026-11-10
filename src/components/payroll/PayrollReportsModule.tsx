/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  PayrollRun,
  PayrollEntry,
  Company,
} from '../../types';
import {
  formatINR,
  generatePayrollRegisterCSV,
} from '../../services/payrollService';
import {
  FileSpreadsheet,
  Download,
  Building2,
  ShieldCheck,
  Briefcase,
  Layers,
  MapPin,
  TrendingUp,
} from 'lucide-react';

interface PayrollReportsModuleProps {
  currentRun: PayrollRun | null;
  entries: PayrollEntry[];
  company: Company | null;
}

export const PayrollReportsModule: React.FC<PayrollReportsModuleProps> = ({
  currentRun,
  entries,
  company,
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'register' | 'sitewise' | 'statutory'>(
    'register'
  );

  const handleDownloadRegisterCSV = () => {
    if (entries.length === 0) return;
    const csv = generatePayrollRegisterCSV(entries);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Payroll_Register_${currentRun?.period || 'Current'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Group by site
  const siteMap = new Map<
    string,
    { siteName: string; count: number; totalGross: number; totalNet: number; totalCtc: number; otHours: number }
  >();

  entries.forEach((e) => {
    const key = e.siteId || 'site_hq';
    const existing = siteMap.get(key) || {
      siteName: e.siteName || 'HQ Operations',
      count: 0,
      totalGross: 0,
      totalNet: 0,
      totalCtc: 0,
      otHours: 0,
    };
    existing.count += 1;
    existing.totalGross += e.totalGrossSalary;
    existing.totalNet += e.netPayable;
    existing.totalCtc += e.totalCostToCompany;
    existing.otHours += e.overtimeHours;
    siteMap.set(key, existing);
  });

  const siteList = Array.from(siteMap.values());

  // Statutory Totals
  const totalPfEmployee = entries.reduce((s, e) => s + e.pfEmployee, 0);
  const totalPfEmployer = entries.reduce((s, e) => s + e.pfEmployer, 0);
  const totalEsiEmployee = entries.reduce((s, e) => s + e.esiEmployee, 0);
  const totalEsiEmployer = entries.reduce((s, e) => s + e.esiEmployer, 0);
  const totalPT = entries.reduce((s, e) => s + e.ptAmount, 0);

  return (
    <div className="space-y-6">
      {/* Top Report Tab Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold w-full sm:w-auto">
          <button
            onClick={() => setActiveReportTab('register')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              activeReportTab === 'register'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>Monthly Salary Register</span>
          </button>

          <button
            onClick={() => setActiveReportTab('sitewise')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              activeReportTab === 'sitewise'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Site-Wise Payroll Cost</span>
          </button>

          <button
            onClick={() => setActiveReportTab('statutory')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              activeReportTab === 'statutory'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>PF & ESI Compliance Returns</span>
          </button>
        </div>

        {activeReportTab === 'register' && (
          <button
            onClick={handleDownloadRegisterCSV}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Register CSV</span>
          </button>
        )}
      </div>

      {/* Tab 1: Monthly Salary Register */}
      {activeReportTab === 'register' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Detailed Master Salary Register – Period {currentRun?.period || '2026-11'}
              </h3>
              <p className="text-xs text-slate-500">
                Itemized breakdown of Basic, HRA, Overtime, Deductions, Net and CTC
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
              {entries.length} Employees
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3">Emp Code</th>
                  <th className="py-2.5 px-3">Employee Name</th>
                  <th className="py-2.5 px-3">Site</th>
                  <th className="py-2.5 px-3">Payable Days</th>
                  <th className="py-2.5 px-3">OT (hrs)</th>
                  <th className="py-2.5 px-3">Basic</th>
                  <th className="py-2.5 px-3">HRA</th>
                  <th className="py-2.5 px-3">OT / DD</th>
                  <th className="py-2.5 px-3">Total Gross</th>
                  <th className="py-2.5 px-3">PF (12%)</th>
                  <th className="py-2.5 px-3">ESI (0.75%)</th>
                  <th className="py-2.5 px-3">PT / TDS</th>
                  <th className="py-2.5 px-3">Advances / Unif</th>
                  <th className="py-2.5 px-3">Total Ded</th>
                  <th className="py-2.5 px-3">Net Payable</th>
                  <th className="py-2.5 px-3">Total CTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2 px-3 text-slate-500">{e.employeeCode}</td>
                    <td className="py-2 px-3 font-sans font-semibold text-slate-900">{e.employeeName}</td>
                    <td className="py-2 px-3 font-sans text-slate-600 truncate max-w-[120px]">{e.siteName}</td>
                    <td className="py-2 px-3 text-slate-700 text-center">{e.payableDays}</td>
                    <td className="py-2 px-3 text-slate-700 text-center">{e.overtimeHours}</td>
                    <td className="py-2 px-3 text-slate-800">{formatINR(e.basicEarned)}</td>
                    <td className="py-2 px-3 text-slate-800">{formatINR(e.hraEarned)}</td>
                    <td className="py-2 px-3 text-blue-700">{formatINR(e.overtimeAmount + e.doubleDutyAmount)}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{formatINR(e.totalGrossSalary)}</td>
                    <td className="py-2 px-3 text-slate-700">{formatINR(e.pfEmployee)}</td>
                    <td className="py-2 px-3 text-slate-700">{formatINR(e.esiEmployee)}</td>
                    <td className="py-2 px-3 text-slate-700">{formatINR(e.ptAmount + e.tdsAmount)}</td>
                    <td className="py-2 px-3 text-amber-700">{formatINR(e.advanceDeduction + e.uniformEquipmentDeduction)}</td>
                    <td className="py-2 px-3 font-medium text-rose-700">{formatINR(e.totalDeductions)}</td>
                    <td className="py-2 px-3 font-bold text-emerald-800 bg-emerald-50/40">{formatINR(e.netPayable)}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{formatINR(e.totalCostToCompany)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Site-Wise Cost Distribution */}
      {activeReportTab === 'sitewise' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {siteList.map((site, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{site.siteName}</h4>
                      <p className="text-xs text-slate-500">{site.count} Deployed Staff</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-bold">
                    {site.otHours} hrs OT
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Gross Wages:</span>
                    <span className="font-mono font-medium">{formatINR(site.totalGross)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Net Disbursed:</span>
                    <span className="font-mono font-bold text-emerald-700">{formatINR(site.totalNet)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-100">
                    <span>Internal CTC Cost:</span>
                    <span className="font-mono text-blue-900">{formatINR(site.totalCtc)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Statutory ECR Compliance Returns */}
      {activeReportTab === 'statutory' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PF ECR Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Employees' Provident Fund (EPFO) Monthly Return Summary
                </h3>
                <p className="text-xs text-slate-500">ECR electronic challan calculation</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs divide-y divide-slate-100">
              <div className="flex justify-between pt-1">
                <span className="text-slate-600">Total Covered Employees:</span>
                <span className="font-bold text-slate-900">
                  {entries.filter((e) => e.pfEmployee > 0).length} Personnel
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-600">Employee Share (12% EPF Deduction):</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(totalPfEmployee)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-600">Employer Share (12% EPF + EPS Contribution):</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(totalPfEmployer)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-600">EDLI & Admin Inspection Charges (Est. 0.5%):</span>
                <span className="font-mono text-slate-700">{formatINR(totalPfEmployee * 0.0416)}</span>
              </div>
              <div className="flex justify-between pt-3 font-bold text-sm text-blue-950 bg-blue-50/70 p-3 rounded-xl border border-blue-100">
                <span>Total PF Challan Amount:</span>
                <span className="font-mono">{formatINR(totalPfEmployee + totalPfEmployer + totalPfEmployee * 0.0416)}</span>
              </div>
            </div>
          </div>

          {/* ESIC Monthly Return Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  ESIC Health Insurance Monthly Return
                </h3>
                <p className="text-xs text-slate-500">Form 5 statutory challan statement</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs divide-y divide-slate-100">
              <div className="flex justify-between pt-1">
                <span className="text-slate-600">Covered Workforce (Gross ≤ ₹21,000):</span>
                <span className="font-bold text-slate-900">
                  {entries.filter((e) => e.esiEmployee > 0).length} Personnel
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-600">Employee Contribution (0.75% of Gross):</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(totalEsiEmployee)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-600">Employer Contribution (3.25% of Gross):</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(totalEsiEmployer)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-600">Professional Tax (PT) Deducted:</span>
                <span className="font-mono text-amber-700 font-bold">{formatINR(totalPT)}</span>
              </div>
              <div className="flex justify-between pt-3 font-bold text-sm text-emerald-950 bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                <span>Total ESIC Challan Amount:</span>
                <span className="font-mono">{formatINR(totalEsiEmployee + totalEsiEmployer)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
