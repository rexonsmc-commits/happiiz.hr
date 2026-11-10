/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TrialBalanceRow } from '../../types';
import { formatINR } from '../../services/payrollService';
import { generateTrialBalanceCsv } from '../../services/accountingService';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Download,
  Search,
  Filter,
  FileSpreadsheet,
} from 'lucide-react';

interface TrialBalanceModuleProps {
  trialBalanceData: {
    rows: TrialBalanceRow[];
    totalOpeningDebit: number;
    totalOpeningCredit: number;
    totalPeriodDebit: number;
    totalPeriodCredit: number;
    totalClosingDebit: number;
    totalClosingCredit: number;
    isBalanced: boolean;
  };
}

export const TrialBalanceModule: React.FC<TrialBalanceModuleProps> = ({ trialBalanceData }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const {
    rows,
    totalOpeningDebit,
    totalOpeningCredit,
    totalPeriodDebit,
    totalPeriodCredit,
    totalClosingDebit,
    totalClosingCredit,
    isBalanced,
  } = trialBalanceData;

  const filteredRows = rows.filter((r) => {
    if (filterType !== 'all' && r.accountType !== filterType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return r.accountCode.toLowerCase().includes(q) || r.accountName.toLowerCase().includes(q);
    }
    return true;
  });

  const handleExportCsv = () => {
    const csvContent = generateTrialBalanceCsv(rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TrialBalance_FY2026-27_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Mathematical Verification Banner */}
      <div
        className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 shadow-xs ${
          isBalanced ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isBalanced ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                FY 2026-27
              </span>
              <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                isBalanced ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {isBalanced ? 'Audit Verified' : 'Unbalanced Discrepancy'}
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 mt-0.5">
              {isBalanced
                ? 'Trial Balance Perfectly Reconciled: Total Debits == Total Credits'
                : 'Warning: Trial Balance Out of Balance'}
            </h3>
            <p className="text-xs text-slate-600">
              Fundamental double-entry check verified across all asset, liability, equity, income, and expense ledgers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Closing Debit</span>
            <div className="text-lg font-mono font-black text-emerald-700">{formatINR(totalClosingDebit)}</div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Closing Credit</span>
            <div className="text-lg font-mono font-black text-blue-700">{formatINR(totalClosingCredit)}</div>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer transition-all shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'asset', 'liability', 'income', 'expense', 'equity'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                filterType === type ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'all' ? 'All Rows' : `${type}s`}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search code or account name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-60 focus:outline-blue-600 bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      {/* Trial Balance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Account Particulars</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Opening Dr (₹)</th>
                <th className="py-3 px-4 text-right">Opening Cr (₹)</th>
                <th className="py-3 px-4 text-right">Period Dr (₹)</th>
                <th className="py-3 px-4 text-right">Period Cr (₹)</th>
                <th className="py-3 px-4 text-right">Closing Dr (₹)</th>
                <th className="py-3 px-4 text-right">Closing Cr (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRows.map((r) => (
                <tr key={r.accountId} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-mono font-bold text-blue-700">{r.accountCode}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">{r.accountName}</td>
                  <td className="py-2.5 px-4">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      r.accountType === 'asset' ? 'bg-blue-50 text-blue-700' :
                      r.accountType === 'liability' ? 'bg-purple-50 text-purple-700' :
                      r.accountType === 'income' ? 'bg-emerald-50 text-emerald-700' :
                      r.accountType === 'expense' ? 'bg-rose-50 text-rose-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {r.accountType}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                    {r.openingDebit > 0 ? formatINR(r.openingDebit) : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                    {r.openingCredit > 0 ? formatINR(r.openingCredit) : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-emerald-700">
                    {r.periodDebit > 0 ? formatINR(r.periodDebit) : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-blue-700">
                    {r.periodCredit > 0 ? formatINR(r.periodCredit) : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900">
                    {r.closingDebit > 0 ? formatINR(r.closingDebit) : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900">
                    {r.closingCredit > 0 ? formatINR(r.closingCredit) : '-'}
                  </td>
                </tr>
              ))}

              {/* Total Summary Row */}
              <tr className="bg-slate-100 font-black text-xs border-t-2 border-slate-300">
                <td colSpan={3} className="py-3 px-4 text-slate-900 text-right uppercase">
                  Grand Total Balance:
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-800">{formatINR(totalOpeningDebit)}</td>
                <td className="py-3 px-4 text-right font-mono text-slate-800">{formatINR(totalOpeningCredit)}</td>
                <td className="py-3 px-4 text-right font-mono text-emerald-700">{formatINR(totalPeriodDebit)}</td>
                <td className="py-3 px-4 text-right font-mono text-blue-700">{formatINR(totalPeriodCredit)}</td>
                <td className="py-3 px-4 text-right font-mono text-emerald-800 bg-emerald-50/50">{formatINR(totalClosingDebit)}</td>
                <td className="py-3 px-4 text-right font-mono text-blue-800 bg-blue-50/50">{formatINR(totalClosingCredit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
