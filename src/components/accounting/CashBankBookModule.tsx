/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CashTransaction, BankAccount, BankTransaction, ChartOfAccount } from '../../types';
import { formatINR, round2 } from '../../services/payrollService';
import {
  Wallet,
  Building2,
  Scale,
  Plus,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileText,
  Calendar,
  Layers,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface CashBankBookModuleProps {
  cashTransactions: CashTransaction[];
  bankAccounts: BankAccount[];
  bankTransactions: BankTransaction[];
  accounts: ChartOfAccount[];
  currentUser: { name: string; role?: string };
  onRecordCashTx: (txData: any) => Promise<void>;
  onReconcileBank: (
    bankAccountId: string,
    statementDate: string,
    statementBalance: number,
    reconciledTxIds: string[]
  ) => Promise<void>;
}

export const CashBankBookModule: React.FC<CashBankBookModuleProps> = ({
  cashTransactions,
  bankAccounts,
  bankTransactions,
  accounts,
  currentUser,
  onRecordCashTx,
  onReconcileBank,
}) => {
  const [subTab, setSubTab] = useState<'cash_book' | 'bank_book' | 'reconciliation'>('cash_book');
  const [selectedBankId, setSelectedBankId] = useState<string>(bankAccounts[0]?.id || '');
  const [showAddCashModal, setShowAddCashModal] = useState<boolean>(false);

  // Cash Transaction Form
  const [cashFormData, setCashFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'cash_out' as 'cash_in' | 'cash_out' | 'deposit_to_bank' | 'withdraw_from_bank',
    amount: '',
    description: '',
    referenceNumber: '',
  });

  // Bank Reconciliation Form State
  const [recStatementDate, setRecStatementDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recStatementBalance, setRecStatementBalance] = useState<number>(0);
  const [selectedTxForRec, setSelectedTxForRec] = useState<string[]>([]);
  const [recSuccessMessage, setRecSuccessMessage] = useState<string | null>(null);

  const selectedBank = bankAccounts.find((b) => b.id === selectedBankId) || bankAccounts[0];
  const activeBankTxs = bankTransactions.filter((t) => !selectedBankId || t.bankAccountId === selectedBankId);

  // Cash In Hand Balance calculation
  const cashAccount = accounts.find((a) => a.accountCode === '1001');
  const currentCashBalance = cashAccount?.currentBalance || 75000;

  // Reconciliation calculations
  const unreconciledTxs = activeBankTxs.filter((t) => !t.isReconciled);
  const selectedUnreconciledTotal = unreconciledTxs
    .filter((t) => selectedTxForRec.includes(t.id))
    .reduce((sum, t) => (t.type === 'credit' ? sum + t.amount : sum - t.amount), 0);

  const estimatedAdjustedBalance = selectedBank ? round2(selectedBank.currentBalance + selectedUnreconciledTotal) : 0;
  const recDifference = round2((recStatementBalance || 0) - estimatedAdjustedBalance);

  const handleCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashFormData.amount || Number(cashFormData.amount) <= 0) return;

    await onRecordCashTx({
      date: cashFormData.date,
      type: cashFormData.type,
      amount: Number(cashFormData.amount),
      accountId: 'coa_1001',
      accountName: 'Cash in Hand (Main Vault)',
      description: cashFormData.description,
      referenceNumber: cashFormData.referenceNumber,
      paymentMode: 'cash',
    });

    setShowAddCashModal(false);
    setCashFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'cash_out',
      amount: '',
      description: '',
      referenceNumber: '',
    });
  };

  const handleExecuteReconciliation = async () => {
    if (!selectedBank) return;
    await onReconcileBank(selectedBank.id, recStatementDate, recStatementBalance, selectedTxForRec);
    setRecSuccessMessage('Bank account statement successfully reconciled!');
    setSelectedTxForRec([]);
    setTimeout(() => setRecSuccessMessage(null), 4000);
  };

  const toggleSelectTx = (txId: string) => {
    if (selectedTxForRec.includes(txId)) {
      setSelectedTxForRec(selectedTxForRec.filter((id) => id !== txId));
    } else {
      setSelectedTxForRec([...selectedTxForRec, txId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'cash_book', label: 'Cash Book (Daily Vault)', icon: Wallet },
          { id: 'bank_book', label: 'Bank Book (Accounts)', icon: Building2 },
          { id: 'reconciliation', label: 'Bank Statement Reconciliation', icon: Scale },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. CASH BOOK VIEW */}
      {subTab === 'cash_book' && (
        <div className="space-y-4">
          {/* Cash Summary Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400">Current Cash in Hand</span>
              <div className="mt-1 text-2xl font-black text-slate-900">{formatINR(currentCashBalance)}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Physical vault float for emergency post expenses</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400">Monthly Cash Inflows</span>
              <div className="mt-1 text-2xl font-black text-emerald-700">
                {formatINR(
                  cashTransactions
                    .filter((t) => t.type === 'cash_in' || t.type === 'withdraw_from_bank')
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </div>
              <p className="text-[10px] text-emerald-600 mt-0.5">Bank withdrawals & cash receipts</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400">Monthly Cash Outflows</span>
                <div className="mt-1 text-2xl font-black text-rose-700">
                  {formatINR(
                    cashTransactions
                      .filter((t) => t.type === 'cash_out' || t.type === 'deposit_to_bank')
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </div>
                <p className="text-[10px] text-rose-600 mt-0.5">Voucher disbursements & bank deposits</p>
              </div>

              <button
                onClick={() => setShowAddCashModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Record Entry
              </button>
            </div>
          </div>

          {/* Cash Transactions Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Cash Transaction Register</h3>
              <span className="text-xs text-slate-500">Automated Contra & Expense Journal Sync</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Voucher #</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4">Reference</th>
                    <th className="py-2.5 px-4 text-right">Inflow (₹)</th>
                    <th className="py-2.5 px-4 text-right">Outflow (₹)</th>
                    <th className="py-2.5 px-4 text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {cashTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-700">{tx.voucherNumber}</td>
                      <td className="py-2.5 px-4 text-slate-600">{tx.date}</td>
                      <td className="py-2.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          tx.type.includes('in') || tx.type === 'withdraw_from_bank'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {tx.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-800 max-w-sm truncate">{tx.description}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">{tx.referenceNumber || '-'}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {tx.type === 'cash_in' || tx.type === 'withdraw_from_bank' ? formatINR(tx.amount) : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-700">
                        {tx.type === 'cash_out' || tx.type === 'deposit_to_bank' ? formatINR(tx.amount) : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatINR(tx.balanceAfter)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. BANK BOOK VIEW */}
      {subTab === 'bank_book' && (
        <div className="space-y-4">
          {/* Bank Accounts Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankAccounts.map((bank) => (
              <div
                key={bank.id}
                onClick={() => setSelectedBankId(bank.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  selectedBankId === bank.id
                    ? 'bg-blue-50/40 border-blue-300 ring-2 ring-blue-600 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{bank.bankName}</h4>
                      <p className="text-[11px] font-mono text-slate-500">{bank.accountNumberMasked} • IFSC: {bank.ifscCode}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    bank.isPrimary ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {bank.isPrimary ? 'Primary Operating' : bank.accountType}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Book Balance</span>
                    <div className="text-lg font-black text-slate-900">{formatINR(bank.currentBalance)}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Branch</span>
                    <div className="text-xs font-semibold text-slate-700">{bank.branchName}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bank Transactions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Bank Transactions Ledger: {selectedBank?.bankName} ({selectedBank?.accountNumberMasked})
                </h3>
                <p className="text-xs text-slate-500">Receipts, disbursements, and contra movements</p>
              </div>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                {activeBankTxs.length} Transactions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Voucher #</th>
                    <th className="py-2.5 px-4">Party / Beneficiary</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4">UTR / Cheque #</th>
                    <th className="py-2.5 px-4 text-right">Credit (Deposit)</th>
                    <th className="py-2.5 px-4 text-right">Debit (Payment)</th>
                    <th className="py-2.5 px-4 text-center">Reconciled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {activeBankTxs.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 text-slate-600">{tx.transactionDate}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-700">{tx.voucherNumber}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{tx.partyName || '-'}</td>
                      <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate">{tx.description}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">{tx.utrNumber || tx.chequeNumber || '-'}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {tx.type === 'credit' ? formatINR(tx.amount) : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-700">
                        {tx.type === 'debit' ? formatINR(tx.amount) : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {tx.isReconciled ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            Cleared ({tx.reconciliationDate})
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            Uncleared
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. BANK RECONCILIATION COCKPIT */}
      {subTab === 'reconciliation' && (
        <div className="space-y-4">
          {recSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {recSuccessMessage}
            </div>
          )}

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Bank Statement Reconciliation: {selectedBank?.bankName} ({selectedBank?.accountNumberMasked})
                </h3>
                <p className="text-xs text-slate-500">
                  Verify bank statement ending balance against internal accounting ledger book balance
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-slate-700">
                Book Balance: {formatINR(selectedBank?.currentBalance || 0)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Bank Statement Cut-off Date</label>
                <input
                  type="date"
                  value={recStatementDate}
                  onChange={(e) => setRecStatementDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Ending Statement Balance (₹) *</label>
                <input
                  type="number"
                  placeholder="Enter exact bank balance"
                  value={recStatementBalance || ''}
                  onChange={(e) => setRecStatementBalance(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Reconciliation Status</span>
                <div className="mt-0.5 text-xs font-bold">
                  {Math.abs(recDifference) < 1 ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Reconciled & Matched
                    </span>
                  ) : (
                    <span className="text-rose-700 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> Discrepancy: {formatINR(recDifference)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Uncleared Transactions Checklist */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900">
                  Select Uncleared / In-Transit Entries to Mark Reconciled ({unreconciledTxs.length})
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedTxForRec.length === unreconciledTxs.length) {
                      setSelectedTxForRec([]);
                    } else {
                      setSelectedTxForRec(unreconciledTxs.map((t) => t.id));
                    }
                  }}
                  className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  {selectedTxForRec.length === unreconciledTxs.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3 w-8">Match</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Party / Narration</th>
                      <th className="py-2 px-3">UTR / Cheque</th>
                      <th className="py-2 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {unreconciledTxs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                          No pending unreconciled transactions. All entries are reconciled!
                        </td>
                      </tr>
                    ) : (
                      unreconciledTxs.map((tx) => {
                        const isSelected = selectedTxForRec.includes(tx.id);
                        return (
                          <tr
                            key={tx.id}
                            onClick={() => toggleSelectTx(tx.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-2 px-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="rounded text-blue-600"
                              />
                            </td>
                            <td className="py-2 px-3 text-slate-600">{tx.transactionDate}</td>
                            <td className="py-2 px-3">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                tx.type === 'credit' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {tx.type}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-800">{tx.partyName || tx.description}</td>
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{tx.utrNumber || tx.chequeNumber || '-'}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {formatINR(tx.amount)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleExecuteReconciliation}
                disabled={selectedTxForRec.length === 0}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
              >
                Confirm Reconciliation ({selectedTxForRec.length} selected)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Cash Entry Modal */}
      {showAddCashModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Record Cash Vault Transaction</h3>
              <button
                onClick={() => setShowAddCashModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCashSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Transaction Type</label>
                <select
                  value={cashFormData.type}
                  onChange={(e) => setCashFormData({ ...cashFormData, type: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                >
                  <option value="cash_out">Cash Out / Direct Expense</option>
                  <option value="withdraw_from_bank">Withdraw from Bank (Contra)</option>
                  <option value="deposit_to_bank">Deposit Cash into Bank (Contra)</option>
                  <option value="cash_in">Cash In / Miscellaneous Receipt</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={cashFormData.date}
                    onChange={(e) => setCashFormData({ ...cashFormData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5000"
                    value={cashFormData.amount}
                    onChange={(e) => setCashFormData({ ...cashFormData, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description / Purpose *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Field supervisor petrol float for DLF post"
                  value={cashFormData.description}
                  onChange={(e) => setCashFormData({ ...cashFormData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reference Bill / Cheque #</label>
                <input
                  type="text"
                  placeholder="Optional bill or cheque number"
                  value={cashFormData.referenceNumber}
                  onChange={(e) => setCashFormData({ ...cashFormData, referenceNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddCashModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
                >
                  Post Cash Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
