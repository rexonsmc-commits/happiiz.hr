/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ClientProfitabilityReport,
} from '../../types';
import {
  formatINR,
  generateProfitabilityCSV,
} from '../../services/billingService';
import {
  TrendingUp,
  Download,
  DollarSign,
  PieChart,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

interface ProfitabilityAnalysisModuleProps {
  reports: ClientProfitabilityReport[];
  selectedPeriod: string;
  onPeriodChange: (p: string) => void;
}

export const ProfitabilityAnalysisModule: React.FC<ProfitabilityAnalysisModuleProps> = ({
  reports,
  selectedPeriod,
  onPeriodChange,
}) => {
  const totalRevenue = reports.reduce((s, r) => s + r.totalClientRevenue, 0);
  const totalCost = reports.reduce((s, r) => s + r.totalCostOfService, 0);
  const totalMargin = totalRevenue - totalCost;
  const avgMarginPercent = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

  const handleExportCSV = () => {
    if (reports.length === 0) return;
    const csv = generateProfitabilityCSV(reports);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Profitability_Analysis_${selectedPeriod}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Filter */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span>Client & Site Profitability Analysis</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time margin calculation comparing billed client revenue against internal workforce payroll and employer statutory costs
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="bg-transparent text-slate-800 focus:outline-none"
            >
              <option value="2026-11">November 2026</option>
              <option value="2026-10">October 2026</option>
              <option value="2026-09">September 2026</option>
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Billed Revenue
          </span>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatINR(totalRevenue)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Invoiced service & management fees</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
            Workforce Cost of Service
          </span>
          <div className="text-2xl font-black text-rose-950 mt-2 font-mono">
            {formatINR(totalCost)}
          </div>
          <p className="text-xs text-rose-700 mt-1 font-medium">Internal wages + PF/ESI + Ops</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Estimated Gross Margin
          </span>
          <div className="text-2xl font-black text-emerald-950 mt-2 font-mono">
            {formatINR(totalMargin)}
          </div>
          <p className="text-xs text-emerald-700 mt-1 font-medium">Billed revenue minus direct cost</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
            Average Profit Margin
          </span>
          <div className="text-3xl font-black mt-2 font-mono">
            {avgMarginPercent.toFixed(1)}%
          </div>
          <p className="text-xs text-emerald-100 mt-1">Healthy enterprise margin</p>
        </div>
      </div>

      {/* Client-by-Client Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Contract Profitability Breakdown – Period {selectedPeriod}
            </h3>
            <p className="text-xs text-slate-500">
              Segregated internal salary cost versus contractual client billing
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Client / Site</th>
                <th className="py-3 px-4 font-mono text-right">Billed Revenue</th>
                <th className="py-3 px-4 font-mono text-right">Workforce Wages</th>
                <th className="py-3 px-4 font-mono text-right">Employer PF/ESI</th>
                <th className="py-3 px-4 font-mono text-right">Total Cost</th>
                <th className="py-3 px-4 font-mono text-right">Gross Margin (₹)</th>
                <th className="py-3 px-4 font-mono text-right">Margin %</th>
                <th className="py-3 px-4 font-mono text-right">Est. Operating Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                    No profitability records calculated for this period.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-sans">
                      <div className="font-bold text-slate-900">{r.clientName}</div>
                      <div className="text-[10px] text-slate-500">{r.siteName}</div>
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatINR(r.totalClientRevenue)}
                    </td>

                    <td className="py-3 px-4 text-right text-slate-700">
                      {formatINR(r.workforceGrossWages)}
                    </td>

                    <td className="py-3 px-4 text-right text-purple-700">
                      {formatINR(r.employerStatutoryCost)}
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-rose-700">
                      {formatINR(r.totalCostOfService)}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-emerald-800 bg-emerald-50/40">
                      +{formatINR(r.estimatedGrossMargin)}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {r.grossMarginPercentage.toFixed(1)}%
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-blue-900">
                      {formatINR(r.estimatedOperatingProfit)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
