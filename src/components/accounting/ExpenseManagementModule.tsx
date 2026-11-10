/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ExpenseRecord, ExpenseCategory, BankAccount } from '../../types';
import { formatINR, round2 } from '../../services/payrollService';
import {
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingDown,
  FileText,
  Calendar,
  CheckCircle2,
  Building2,
  Download,
} from 'lucide-react';

interface ExpenseManagementModuleProps {
  expenses: ExpenseRecord[];
  bankAccounts: BankAccount[];
  currentUser: { name: string; role?: string };
  onRecordExpense: (expenseData: any) => Promise<void>;
}

export const ExpenseManagementModule: React.FC<ExpenseManagementModuleProps> = ({
  expenses,
  bankAccounts,
  currentUser,
  onRecordExpense,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    expenseDate: new Date().toISOString().split('T')[0],
    category: 'transport_fuel' as ExpenseCategory,
    vendorName: '',
    description: '',
    amount: '',
    gstRate: 18,
    isItcEligible: true,
    paymentMode: 'bank_transfer' as 'cash' | 'bank_transfer' | 'cheque' | 'upi',
    bankAccountId: bankAccounts[0]?.id || '',
    invoiceNumber: '',
  });

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalGstPaid = expenses.reduce((sum, e) => sum + e.gstAmount, 0);

  const filteredExpenses = expenses.filter((e) => {
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        e.expenseNumber.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.vendorName && e.vendorName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const grossAmount = Number(formData.amount);
    if (!grossAmount || grossAmount <= 0) return;

    let taxable = grossAmount;
    let gstAmt = 0;
    if (formData.gstRate > 0) {
      taxable = round2(grossAmount / (1 + formData.gstRate / 100));
      gstAmt = round2(grossAmount - taxable);
    }

    await onRecordExpense({
      expenseDate: formData.expenseDate,
      category: formData.category,
      vendorName: formData.vendorName,
      description: formData.description,
      amount: grossAmount,
      taxableAmount: taxable,
      gstAmount: gstAmt,
      gstRate: formData.gstRate,
      isItcEligible: formData.isItcEligible,
      paymentMode: formData.paymentMode,
      bankAccountId: formData.paymentMode !== 'cash' ? formData.bankAccountId : undefined,
      invoiceNumber: formData.invoiceNumber,
    });

    setShowAddModal(false);
    setFormData({
      expenseDate: new Date().toISOString().split('T')[0],
      category: 'transport_fuel',
      vendorName: '',
      description: '',
      amount: '',
      gstRate: 18,
      isItcEligible: true,
      paymentMode: 'bank_transfer',
      bankAccountId: bankAccounts[0]?.id || '',
      invoiceNumber: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400">Total Operational Expenses</span>
          <div className="mt-1 text-2xl font-black text-rose-700">{formatINR(totalExpenseAmount)}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Rent, consumables, transport & utilities</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400">Input GST Paid on Expenses</span>
          <div className="mt-1 text-2xl font-black text-blue-700">{formatINR(totalGstPaid)}</div>
          <p className="text-[10px] text-emerald-600 mt-0.5">Credited to Input CGST/SGST tax ledger</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400">Total Expense Vouchers</span>
            <div className="mt-1 text-2xl font-black text-slate-900">{expenses.length} Records</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Approved & posted to General Ledger</p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Record Expense
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500">Category:</span>
          {[
            { id: 'all', label: 'All Expenses' },
            { id: 'office_rent', label: 'Rent' },
            { id: 'transport_fuel', label: 'Fuel & Transport' },
            { id: 'uniform_kits', label: 'Uniforms' },
            { id: 'cleaning_materials', label: 'Cleaning' },
            { id: 'software_licenses', label: 'Software' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search expense # or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-60 focus:outline-blue-600 bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Expense #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Vendor / Payee</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4 text-right">Taxable (₹)</th>
                <th className="py-3 px-4 text-right">GST (₹)</th>
                <th className="py-3 px-4 text-right">Total (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">{exp.expenseNumber}</td>
                  <td className="py-3 px-4 text-slate-600">{exp.expenseDate}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {exp.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{exp.vendorName || '-'}</td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{exp.description}</td>
                  <td className="py-3 px-4 capitalize text-[11px] text-slate-500">{exp.paymentMode.replace('_', ' ')}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">{formatINR(exp.taxableAmount)}</td>
                  <td className="py-3 px-4 text-right font-mono text-blue-700">{formatINR(exp.gstAmount)}</td>
                  <td className="py-3 px-4 text-right font-mono font-black text-rose-700">{formatINR(exp.amount)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                      {exp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Record Operational Expense</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="office_rent">Office Rent</option>
                    <option value="electricity">Electricity & Utilities</option>
                    <option value="internet_telecom">Internet & SIMs</option>
                    <option value="transport_fuel">Transport & Patrol Fuel</option>
                    <option value="uniform_kits">Uniforms & Guard Kits</option>
                    <option value="security_equipment">Security Gear & Torches</option>
                    <option value="cleaning_materials">Cleaning Chemicals</option>
                    <option value="office_stationery">Stationery & Registers</option>
                    <option value="software_licenses">Software & Cloud Tech</option>
                    <option value="professional_legal_fees">Legal & CA Audit Fees</option>
                    <option value="marketing_advertisement">Marketing</option>
                    <option value="bank_charges">Bank Charges</option>
                    <option value="miscellaneous">Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Total Gross Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 15000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">GST Rate</label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value={18}>18% GST (Standard)</option>
                    <option value={12}>12% GST</option>
                    <option value={5}>5% GST</option>
                    <option value={0}>0% (Exempt / Fuel / Rent)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Vendor / Payee Name</label>
                <input
                  type="text"
                  placeholder="e.g. Indian Oil Petrol Pump, CyberCity"
                  value={formData.vendorName}
                  onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description / Purpose *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fuel for night patrol bike fleet Sector 25"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Payment Mode</label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="cash">Cash (Main Vault)</option>
                    <option value="cheque">Cheque</option>
                    <option value="upi">Corporate UPI</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Invoice / Receipt #</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-99"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
                >
                  Post Expense Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
