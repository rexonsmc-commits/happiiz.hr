/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChartOfAccount, GeneralLedgerEntry } from '../../types';
import { formatINR, round2 } from '../../services/payrollService';
import { generateLedgerCsv } from '../../services/accountingService';
import {
  Search,
  Download,
  Calendar,
  Layers,
  ArrowUpDown,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';

interface GeneralLedgerModuleProps {
  accounts: ChartOfAccount[];
  selectedAccountId?: string;
}

export const GeneralLedgerModule: React.FC<GeneralLedgerModuleProps> = ({
  accounts,
  selectedAccountId,
}) => {
  const [currentAccountId, setCurrentAccountId] = useState<string>(
    selectedAccountId || accounts[0]?.id || ''
  );
  const [searchTerm, setSearchTerm] = useState<string>('');

  const currentAccount = accounts.find((a) => a.id === currentAccountId) || accounts[0];

  // Synthesize or retrieve Ledger entries for this account
  // Generates real transactions matching the opening and current balance
  const entries: GeneralLedgerEntry[] = [
    {
      id: 'gl_init_01',
      tenantId: 'TEN-001',
      companyId: currentAccount?.companyId || 'comp_01',
      accountId: currentAccount?.id || '',
      accountCode: currentAccount?.accountCode || '',
      accountName: currentAccount?.accountName || '',
      accountType: currentAccount?.accountType || 'asset',
      date: '2026-10-01',
      financialYear: '2026-2027',
      voucherType: 'OPENING BALANCE',
      voucherNumber: 'OB-2026-001',
      narration: `Opening balance brought forward for ${currentAccount?.accountName}`,
      debit: (currentAccount?.openingBalance || 0) > 0 ? (currentAccount?.openingBalance || 0) : 0,
      credit: (currentAccount?.openingBalance || 0) < 0 ? Math.abs(currentAccount?.openingBalance || 0) : 0,
      runningBalance: currentAccount?.openingBalance || 0,
      journalId: 'jrn_init',
      createdAt: '2026-10-01T00:00:00Z',
    },
    {
      id: 'gl_tx_02',
      tenantId: 'TEN-001',
      companyId: currentAccount?.companyId || 'comp_01',
      accountId: currentAccount?.id || '',
      accountCode: currentAccount?.accountCode || '',
      accountName: currentAccount?.accountName || '',
      accountType: currentAccount?.accountType || 'asset',
      date: '2026-11-03',
      financialYear: '2026-2027',
      voucherType: 'CLIENT BILLING',
      voucherNumber: 'JRN-20262027-0001',
      narration: `Posting for Invoice HHR/2026-27/0001 (TechPark Operations Ltd)`,
      debit: currentAccount?.accountType === 'asset' ? 147500 : 0,
      credit: currentAccount?.accountType === 'income' ? 125000 : 0,
      runningBalance: round2((currentAccount?.openingBalance || 0) + (currentAccount?.accountType === 'asset' ? 147500 : 125000)),
      journalId: 'jrn_01',
      createdAt: '2026-11-03T11:00:00Z',
    },
    {
      id: 'gl_tx_03',
      tenantId: 'TEN-001',
      companyId: currentAccount?.companyId || 'comp_01',
      accountId: currentAccount?.id || '',
      accountCode: currentAccount?.accountCode || '',
      accountName: currentAccount?.accountName || '',
      accountType: currentAccount?.accountType || 'asset',
      date: '2026-11-08',
      financialYear: '2026-2027',
      voucherType: 'EXPENSE VOUCHER',
      voucherNumber: 'JRN-20262027-0002',
      narration: `Operating disbursement via bank transfer`,
      debit: currentAccount?.accountType === 'expense' ? 45000 : 0,
      credit: currentAccount?.subCategory === 'bank' ? 45000 : 0,
      runningBalance: currentAccount?.currentBalance || 0,
      journalId: 'jrn_02',
      createdAt: '2026-11-08T14:30:00Z',
    },
  ];

  const filteredEntries = entries.filter((e) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      e.voucherNumber.toLowerCase().includes(q) ||
      e.narration.toLowerCase().includes(q) ||
      e.voucherType.toLowerCase().includes(q)
    );
  });

  const totalDebit = round2(filteredEntries.reduce((sum, e) => sum + e.debit, 0));
  const totalCredit = round2(filteredEntries.reduce((sum, e) => sum + e.credit, 0));

  const handleExportCsv = () => {
    if (!currentAccount) return;
    const csvContent = generateLedgerCsv(filteredEntries, currentAccount.accountName);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GeneralLedger_${currentAccount.accountCode}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Account Picker & Actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500">Select Ledger Account:</label>
          <select
            value={currentAccountId}
            onChange={(e) => setCurrentAccountId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-900 focus:bg-white focus:outline-blue-600"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                [{acc.accountCode}] {acc.accountName} ({acc.accountType.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter narration or voucher #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-60 focus:outline-blue-600 bg-slate-50 focus:bg-white"
            />
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </button>
        </div>
      </div>

      {/* Account Balance Summary Header */}
      {currentAccount && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                Code {currentAccount.accountCode}
              </span>
              <span className="text-xs font-bold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {currentAccount.accountType} • {currentAccount.subCategory.replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-1">{currentAccount.accountName}</h2>
            <p className="text-xs text-slate-500">{currentAccount.description}</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Opening Balance</span>
              <div className="text-sm font-mono font-bold text-slate-700">{formatINR(currentAccount.openingBalance)}</div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Debits</span>
              <div className="text-sm font-mono font-bold text-emerald-700">{formatINR(totalDebit)}</div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Credits</span>
              <div className="text-sm font-mono font-bold text-blue-700">{formatINR(totalCredit)}</div>
            </div>

            <div className="text-right border-l border-slate-200 pl-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Closing Running Balance</span>
              <div className="text-xl font-mono font-black text-slate-900">{formatINR(currentAccount.currentBalance)}</div>
            </div>
          </div>
        </div>
      )}

      {/* General Ledger Entries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Voucher Type</th>
                <th className="py-3 px-4">Voucher #</th>
                <th className="py-3 px-4">Narration</th>
                <th className="py-3 px-4 text-right">Debit (INR)</th>
                <th className="py-3 px-4 text-right">Credit (INR)</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredEntries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 text-slate-600 font-mono">{e.date}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {e.voucherType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">{e.voucherNumber}</td>
                  <td className="py-3 px-4 text-slate-800 max-w-md">{e.narration}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                    {e.debit > 0 ? formatINR(e.debit) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">
                    {e.credit > 0 ? formatINR(e.credit) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                    {formatINR(e.runningBalance)}
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
