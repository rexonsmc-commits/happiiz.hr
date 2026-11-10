/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ChartOfAccount,
  JournalEntry,
  BankAccount,
  CashTransaction,
  ExpenseRecord,
  PurchaseBill,
  PaymentVoucher,
  ReceiptVoucher,
} from '../../types';
import { formatINR } from '../../services/payrollService';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  Wallet,
  Receipt,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers,
  Scale,
  CreditCard,
  PieChart,
  ShieldCheck,
  RefreshCw,
  Plus,
} from 'lucide-react';

interface AccountingDashboardProps {
  accounts: ChartOfAccount[];
  journals: JournalEntry[];
  bankAccounts: BankAccount[];
  cashTransactions: CashTransaction[];
  expenses: ExpenseRecord[];
  purchaseBills: PurchaseBill[];
  pnlData: {
    totalRevenue: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
    profitMarginPercentage: number;
  };
  balanceSheetData: {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    isBalanced: boolean;
  };
  onNavigateTab: (tabId: string) => void;
  onOpenSync: () => void;
  onOpenNewJournal: () => void;
  onOpenNewExpense: () => void;
}

export const AccountingDashboard: React.FC<AccountingDashboardProps> = ({
  accounts,
  journals,
  bankAccounts,
  cashTransactions,
  expenses,
  purchaseBills,
  pnlData,
  balanceSheetData,
  onNavigateTab,
  onOpenSync,
  onOpenNewJournal,
  onOpenNewExpense,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-11');

  // Balances
  const cashInHand = accounts.find((a) => a.accountCode === '1001')?.currentBalance || 0;
  const totalBankBalance = bankAccounts.reduce((sum, b) => sum + b.currentBalance, 0);
  const accountsReceivable = accounts.find((a) => a.accountCode === '1100')?.currentBalance || 0;
  const accountsPayable = accounts.find((a) => a.accountCode === '2001')?.currentBalance || 0;
  const salaryPayable = accounts.find((a) => a.accountCode === '2101')?.currentBalance || 0;
  const outputGstPayable =
    (accounts.find((a) => a.accountCode === '2301')?.currentBalance || 0) +
    (accounts.find((a) => a.accountCode === '2302')?.currentBalance || 0) +
    (accounts.find((a) => a.accountCode === '2303')?.currentBalance || 0);
  const inputGstCredit =
    (accounts.find((a) => a.accountCode === '1301')?.currentBalance || 0) +
    (accounts.find((a) => a.accountCode === '1302')?.currentBalance || 0) +
    (accounts.find((a) => a.accountCode === '1303')?.currentBalance || 0);
  const netGstPayable = Math.max(0, outputGstPayable - inputGstCredit);
  const tdsPayable = accounts.find((a) => a.accountCode === '2401')?.currentBalance || 0;

  // Monthly Revenue breakdown
  const securityRevenue = accounts.find((a) => a.accountCode === '3001')?.currentBalance || 0;
  const housekeepingRevenue = accounts.find((a) => a.accountCode === '3002')?.currentBalance || 0;
  const manpowerRevenue = accounts.find((a) => a.accountCode === '3003')?.currentBalance || 0;
  const serviceChargeRevenue = accounts.find((a) => a.accountCode === '3004')?.currentBalance || 0;

  // Monthly Expenses breakdown
  const payrollExpense =
    (accounts.find((a) => a.accountCode === '4001')?.currentBalance || 0) +
    (accounts.find((a) => a.accountCode === '4002')?.currentBalance || 0);
  const statutoryExpense =
    (accounts.find((a) => a.accountCode === '4003')?.currentBalance || 0) +
    (accounts.find((a) => a.accountCode === '4004')?.currentBalance || 0);
  const operationalExpense = accounts
    .filter((a) => a.subCategory === 'direct_operational_expense')
    .reduce((sum, a) => sum + a.currentBalance, 0);
  const adminExpense = accounts
    .filter((a) => a.subCategory === 'administrative_expense')
    .reduce((sum, a) => sum + a.currentBalance, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner with Period Filter & Action Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              FY 2026-27 (Q3)
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" />
              Double-Entry Balanced
            </span>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
              Phase 9 Live
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            Enterprise Financial & Accounting Management
          </h1>
          <p className="text-xs text-slate-500">
            Real-time double-entry general ledger, automated Phase 7 & 8 integration, cash book, bank book & statutory registers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="2026-11">November 2026 (Current)</option>
              <option value="2026-10">October 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-Q3">Q3 FY 2026-27</option>
              <option value="FY2026-27">Full Financial Year 2026-27</option>
            </select>
          </div>

          <button
            onClick={onOpenSync}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs cursor-pointer transition-all border border-indigo-200"
            title="Auto-Sync Phase 7 Payroll & Phase 8 Invoices"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Phase 7/8
          </button>

          <button
            onClick={onOpenNewJournal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Journal
          </button>

          <button
            onClick={onOpenNewExpense}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Record Expense
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Billed Revenue */}
        <div
          onClick={() => onNavigateTab('statements')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">{formatINR(pnlData.totalRevenue)}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            Direct Security & Facility Billings
          </div>
        </div>

        {/* Total Operating Expenses */}
        <div
          onClick={() => onNavigateTab('expenses')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Expenses</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">{formatINR(pnlData.totalExpenses)}</div>
          <div className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
            <ArrowDownLeft className="w-3 h-3" />
            Wages, Supplies & Administrative
          </div>
        </div>

        {/* Net Operating Profit */}
        <div
          onClick={() => onNavigateTab('statements')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Net Profit</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`mt-2 text-xl font-black ${pnlData.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatINR(pnlData.netProfit)}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-1">
            Operating Margin: <span className="text-blue-700 font-bold">{pnlData.profitMarginPercentage}%</span>
          </div>
        </div>

        {/* Liquid Cash & Bank Position */}
        <div
          onClick={() => onNavigateTab('cash_bank')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cash & Bank Liquidity</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">{formatINR(cashInHand + totalBankBalance)}</div>
          <div className="text-[10px] text-slate-500 font-semibold mt-1 flex items-center justify-between">
            <span>Bank: {formatINR(totalBankBalance)}</span>
            <span>Cash: {formatINR(cashInHand)}</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics: Debtors, Creditors, GST & TDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Accounts Receivable */}
        <div
          onClick={() => onNavigateTab('general_ledger')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Client Receivables (Debtors)</span>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">Asset 1100</span>
          </div>
          <div className="mt-2 text-lg font-black text-slate-900">{formatINR(accountsReceivable)}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Uncollected client invoice balances</p>
        </div>

        {/* Accounts Payable */}
        <div
          onClick={() => onNavigateTab('purchases')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Vendor Payables (Creditors)</span>
            <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Liab 2001</span>
          </div>
          <div className="mt-2 text-lg font-black text-slate-900">{formatINR(accountsPayable)}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Uniforms & supplies bill dues</p>
        </div>

        {/* GST Payable / Net Liability */}
        <div
          onClick={() => onNavigateTab('gst_tds')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Net GST Liability</span>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">GSTR-3B</span>
          </div>
          <div className="mt-2 text-lg font-black text-slate-900">{formatINR(netGstPayable)}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Output: {formatINR(outputGstPayable)} | ITC: {formatINR(inputGstCredit)}
          </p>
        </div>

        {/* TDS Payable */}
        <div
          onClick={() => onNavigateTab('gst_tds')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>TDS Payable</span>
            <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">Sec 194C</span>
          </div>
          <div className="mt-2 text-lg font-black text-slate-900">{formatINR(tdsPayable)}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Withheld contractor & staff taxes</p>
        </div>
      </div>

      {/* Main Analysis Section: Revenue Streams & Expense Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Distribution Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Revenue Composition by Service Line</h3>
              <p className="text-xs text-slate-500">Contractual billing recognized from posted sales invoices</p>
            </div>
            <span className="font-mono text-xs font-bold text-slate-700">{formatINR(pnlData.totalRevenue)}</span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Security Guarding (SAC 998525)', amount: securityRevenue, color: 'bg-blue-600', code: '3001' },
              { label: 'Housekeeping & Janitorial (SAC 998513)', amount: housekeepingRevenue, color: 'bg-emerald-600', code: '3002' },
              { label: 'Manpower Supply & Technical', amount: manpowerRevenue, color: 'bg-indigo-600', code: '3003' },
              { label: 'Agency Service & Management Charges (5%)', amount: serviceChargeRevenue, color: 'bg-purple-600', code: '3004' },
            ].map((item) => {
              const pct = pnlData.totalRevenue > 0 ? Math.round((item.amount / pnlData.totalRevenue) * 100) : 0;
              return (
                <div key={item.code} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.label}</span>
                    <span className="font-bold text-slate-900">
                      {formatINR(item.amount)} <span className="text-[11px] text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operating Expense Breakdown Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Expense Allocation</h3>
              <p className="text-xs text-slate-500">Workforce salaries, consumables & operational overheads</p>
            </div>
            <span className="font-mono text-xs font-bold text-slate-700">{formatINR(pnlData.totalExpenses)}</span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Direct Workforce Wages & Overtime', amount: payrollExpense, color: 'bg-rose-500', code: '4001' },
              { label: 'Employer Statutory PF & ESIC Contribution', amount: statutoryExpense, color: 'bg-amber-500', code: '4003' },
              { label: 'Field Consumables, Uniforms & Fuel', amount: operationalExpense, color: 'bg-sky-500', code: '4101' },
              { label: 'Branch Rent, IT & Administration', amount: adminExpense, color: 'bg-indigo-500', code: '4201' },
            ].map((item) => {
              const pct = pnlData.totalExpenses > 0 ? Math.round((item.amount / pnlData.totalExpenses) * 100) : 0;
              return (
                <div key={item.code} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.label}</span>
                    <span className="font-bold text-slate-900">
                      {formatINR(item.amount)} <span className="text-[11px] text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Balance Sheet Equation Verification Banner */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${balanceSheetData.isBalanced ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${balanceSheetData.isBalanced ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900">
              {balanceSheetData.isBalanced ? 'Fundamental Accounting Equation Satisfied: Assets = Liabilities + Equity' : 'Balance Sheet Discrepancy Detected'}
            </h4>
            <p className="text-[11px] text-slate-600">
              Total Assets: <strong className="text-slate-900">{formatINR(balanceSheetData.totalAssets)}</strong> = Total Liabilities: <strong className="text-slate-900">{formatINR(balanceSheetData.totalLiabilities)}</strong> + Total Equity: <strong className="text-slate-900">{formatINR(balanceSheetData.totalEquity)}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('statements')}
          className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shrink-0 cursor-pointer"
        >
          View Balance Sheet →
        </button>
      </div>

      {/* Recent Posted Double-Entry Journal Audit Trail */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900">Recent Double-Entry Journal Entries</h3>
            <p className="text-xs text-slate-500">Immutable posted transactions with balanced debits and credits</p>
          </div>
          <button
            onClick={() => onNavigateTab('journals')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
          >
            View All ({journals.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4">Journal #</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Narration</th>
                <th className="py-2.5 px-4 text-right">Debit</th>
                <th className="py-2.5 px-4 text-right">Credit</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {journals.slice(0, 5).map((j) => (
                <tr key={j.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-blue-700">{j.journalNumber}</td>
                  <td className="py-2.5 px-4 text-slate-600">{j.accountingDate}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-700 uppercase text-[10px]">
                    <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600">
                      {j.referenceType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 max-w-xs truncate">{j.narration}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">{formatINR(j.totalDebit)}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-700">{formatINR(j.totalCredit)}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      j.status === 'posted' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {j.status}
                    </span>
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
