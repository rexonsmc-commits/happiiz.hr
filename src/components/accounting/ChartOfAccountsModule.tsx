/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChartOfAccount, AccountType, AccountSubCategory } from '../../types';
import { formatINR } from '../../services/payrollService';
import {
  Search,
  Plus,
  Layers,
  Edit2,
  CheckCircle2,
  XCircle,
  Building2,
  Shield,
  Wallet,
  ArrowUpDown,
  Filter,
  DollarSign,
  Info,
} from 'lucide-react';

interface ChartOfAccountsModuleProps {
  accounts: ChartOfAccount[];
  onCreateAccount: (accountData: Omit<ChartOfAccount, 'id' | 'companyId' | 'tenantId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateAccount: (accountId: string, updates: Partial<ChartOfAccount>) => Promise<void>;
  onDrilldownLedger: (accountId: string) => void;
}

export const ChartOfAccountsModule: React.FC<ChartOfAccountsModuleProps> = ({
  accounts,
  onCreateAccount,
  onUpdateAccount,
  onDrilldownLedger,
}) => {
  const [activeType, setActiveType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    accountCode: '',
    accountName: '',
    accountType: 'asset' as AccountType,
    subCategory: 'current_asset' as AccountSubCategory,
    description: '',
    openingBalance: 0,
    isActive: true,
  });

  const filteredAccounts = accounts.filter((acc) => {
    if (activeType !== 'all' && acc.accountType !== activeType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        acc.accountCode.toLowerCase().includes(q) ||
        acc.accountName.toLowerCase().includes(q) ||
        acc.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate totals per category
  const totalAssets = accounts.filter((a) => a.accountType === 'asset').reduce((sum, a) => sum + a.currentBalance, 0);
  const totalLiabilities = accounts.filter((a) => a.accountType === 'liability').reduce((sum, a) => sum + a.currentBalance, 0);
  const totalIncome = accounts.filter((a) => a.accountType === 'income').reduce((sum, a) => sum + a.currentBalance, 0);
  const totalExpenses = accounts.filter((a) => a.accountType === 'expense').reduce((sum, a) => sum + a.currentBalance, 0);
  const totalEquity = accounts.filter((a) => a.accountType === 'equity').reduce((sum, a) => sum + a.currentBalance, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountCode || !formData.accountName) return;

    if (editingAccount) {
      await onUpdateAccount(editingAccount.id, {
        accountName: formData.accountName,
        description: formData.description,
        isActive: formData.isActive,
      });
      setEditingAccount(null);
    } else {
      await onCreateAccount({
        accountCode: formData.accountCode,
        accountName: formData.accountName,
        accountType: formData.accountType,
        subCategory: formData.subCategory,
        description: formData.description,
        openingBalance: Number(formData.openingBalance) || 0,
        currentBalance: Number(formData.openingBalance) || 0,
        isSystemAccount: false,
        isActive: true,
        currency: 'INR',
      });
      setShowAddModal(false);
    }

    setFormData({
      accountCode: '',
      accountName: '',
      accountType: 'asset',
      subCategory: 'current_asset',
      description: '',
      openingBalance: 0,
      isActive: true,
    });
  };

  const openEdit = (acc: ChartOfAccount) => {
    setEditingAccount(acc);
    setFormData({
      accountCode: acc.accountCode,
      accountName: acc.accountName,
      accountType: acc.accountType,
      subCategory: acc.subCategory,
      description: acc.description,
      openingBalance: acc.openingBalance,
      isActive: acc.isActive,
    });
  };

  return (
    <div className="space-y-6">
      {/* Category Summaries */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { id: 'asset', label: 'Assets (1000s)', total: totalAssets, color: 'text-blue-700 bg-blue-50 border-blue-200' },
          { id: 'liability', label: 'Liabilities (2000s)', total: totalLiabilities, color: 'text-purple-700 bg-purple-50 border-purple-200' },
          { id: 'income', label: 'Income (3000s)', total: totalIncome, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
          { id: 'expense', label: 'Expenses (4000s)', total: totalExpenses, color: 'text-rose-700 bg-rose-50 border-rose-200' },
          { id: 'equity', label: 'Equity (5000s)', total: totalEquity, color: 'text-amber-700 bg-amber-50 border-amber-200' },
        ].map((cat) => (
          <div
            key={cat.id}
            onClick={() => setActiveType(activeType === cat.id ? 'all' : cat.id)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              activeType === cat.id ? 'ring-2 ring-blue-600 shadow-sm' : 'bg-white hover:bg-slate-50'
            }`}
          >
            <div className="text-[11px] font-bold text-slate-500 uppercase">{cat.label}</div>
            <div className="mt-1 text-base font-black text-slate-900">{formatINR(cat.total)}</div>
          </div>
        ))}
      </div>

      {/* Action Header & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'asset', 'liability', 'income', 'expense', 'equity'].map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                activeType === type
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'all' ? 'All Accounts' : `${type}s`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search code or account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-56 focus:outline-blue-600 bg-slate-50 focus:bg-white"
            />
          </div>

          <button
            onClick={() => {
              setEditingAccount(null);
              setFormData({
                accountCode: '',
                accountName: '',
                accountType: 'asset',
                subCategory: 'current_asset',
                description: '',
                openingBalance: 0,
                isActive: true,
              });
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Account
          </button>
        </div>
      </div>

      {/* Accounts Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Account Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Sub-Category</th>
                <th className="py-3 px-4 text-right">Opening Bal</th>
                <th className="py-3 px-4 text-right">Current Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">{acc.accountCode}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{acc.accountName}</div>
                    <div className="text-[11px] text-slate-500 max-w-xs truncate">{acc.description}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      acc.accountType === 'asset' ? 'bg-blue-50 text-blue-700' :
                      acc.accountType === 'liability' ? 'bg-purple-50 text-purple-700' :
                      acc.accountType === 'income' ? 'bg-emerald-50 text-emerald-700' :
                      acc.accountType === 'expense' ? 'bg-rose-50 text-rose-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {acc.accountType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium capitalize text-[11px]">
                    {acc.subCategory.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                    {formatINR(acc.openingBalance)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                    {formatINR(acc.currentBalance)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      acc.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {acc.isActive ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => onDrilldownLedger(acc.id)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      Ledger
                    </button>
                    <button
                      onClick={() => openEdit(acc)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit Account Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Account Modal */}
      {(showAddModal || editingAccount) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingAccount ? `Edit Account (${editingAccount.accountCode})` : 'Create New Chart of Account'}
                </h3>
                <p className="text-xs text-slate-500">Configure double-entry accounting ledger account</p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingAccount(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Account Code</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingAccount}
                    placeholder="e.g. 1504"
                    value={formData.accountCode}
                    onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono disabled:bg-slate-100"
                  />
                  <span className="text-[10px] text-slate-400">Standard range: 1000 to 5999</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Account Type</label>
                  <select
                    disabled={!!editingAccount}
                    value={formData.accountType}
                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value as AccountType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs disabled:bg-slate-100"
                  >
                    <option value="asset">Asset (1000-1999)</option>
                    <option value="liability">Liability (2000-2999)</option>
                    <option value="income">Income (3000-3999)</option>
                    <option value="expense">Expense (4000-4999)</option>
                    <option value="equity">Equity (5000-5999)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Walkie-Talkie Equipment Assets"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Sub-Category</label>
                  <select
                    disabled={!!editingAccount}
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value as AccountSubCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs disabled:bg-slate-100"
                  >
                    <option value="cash">Cash in Hand</option>
                    <option value="bank">Bank Accounts</option>
                    <option value="accounts_receivable">Accounts Receivable</option>
                    <option value="advances">Staff & Vendor Advances</option>
                    <option value="current_asset">Current Asset</option>
                    <option value="fixed_asset">Fixed Asset</option>
                    <option value="accounts_payable">Accounts Payable</option>
                    <option value="salary_payable">Salary Payable</option>
                    <option value="statutory_payable">Statutory Tax Payable</option>
                    <option value="direct_income">Direct Service Revenue</option>
                    <option value="indirect_income">Indirect Income</option>
                    <option value="payroll_expense">Workforce Payroll Expense</option>
                    <option value="direct_operational_expense">Operational Expense</option>
                    <option value="administrative_expense">Administrative Expense</option>
                  </select>
                </div>

                {!editingAccount && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Opening Balance (₹)</label>
                    <input
                      type="number"
                      value={formData.openingBalance}
                      onChange={(e) => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description / Purpose</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Operational purpose of this ledger account..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingAccount(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
                >
                  {editingAccount ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
