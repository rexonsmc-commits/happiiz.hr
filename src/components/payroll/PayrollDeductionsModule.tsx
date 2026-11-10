/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  PayrollDeductionItem,
  Employee,
} from '../../types';
import {
  formatINR,
  round2,
  savePayrollDeduction,
} from '../../services/payrollService';
import {
  Search,
  Plus,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Clock,
  Shirt,
  X,
  Layers,
} from 'lucide-react';

interface PayrollDeductionsModuleProps {
  companyId: string;
  tenantId: string;
  deductions: PayrollDeductionItem[];
  employees: Employee[];
  onRefresh: () => void;
}

export const PayrollDeductionsModule: React.FC<PayrollDeductionsModuleProps> = ({
  companyId,
  tenantId,
  deductions,
  employees,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form states
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const [category, setCategory] = useState<'uniform' | 'shoes' | 'equipment' | 'id_card' | 'loan' | 'penalty'>('uniform');
  const [description, setDescription] = useState('2 Uniform Sets + Cap & Lanyard');
  const [totalCost, setTotalCost] = useState<number>(2400);
  const [monthlyInstallment, setMonthlyInstallment] = useState<number>(600);

  const filtered = deductions.filter((d) => {
    const matchesSearch =
      d.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || d.deductionCategory === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalAssignedValue = deductions.reduce((s, d) => s + d.originalAmount, 0);
  const totalRecovered = deductions.reduce((s, d) => s + d.totalDeductedAmount, 0);
  const totalBalanceDue = deductions.reduce((s, d) => s + d.remainingBalance, 0);
  const activeCount = deductions.filter((d) => d.status === 'active').length;

  const handleCreateDeduction = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === selectedEmpId);
    if (!emp) return;

    setIsSaving(true);
    try {
      const newItem: PayrollDeductionItem = {
        id: `ded_${companyId}_${Date.now()}`,
        tenantId,
        companyId,
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: emp.fullName,
        deductionCategory: category,
        description,
        originalAmount: round2(totalCost),
        monthlyDeductionAmount: round2(monthlyInstallment),
        totalDeductedAmount: 0,
        remainingBalance: round2(totalCost),
        status: 'active',
        approvedBy: 'Store & Inventory Officer',
        createdAt: new Date().toISOString(),
      };

      await savePayrollDeduction(companyId, newItem);
      setShowNewModal(false);
      setNotification(`Asset deduction plan created for ${emp.fullName}.`);
      setTimeout(() => setNotification(null), 3500);
      onRefresh();
    } catch {
      alert('Failed to create deduction plan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Uniform & Asset Costs
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Shirt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatINR(totalAssignedValue)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Issued to field personnel</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Pending Deductions Due
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900 mt-2 font-mono">
            {formatINR(totalBalanceDue)}
          </div>
          <p className="text-xs text-amber-700 mt-1 font-medium">{activeCount} active plans</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Recovered From Payroll
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-2 font-mono">
            {formatINR(totalRecovered)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Adjusted in monthly pay runs</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Plans
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {activeCount} <span className="text-sm font-normal text-slate-500">Personnel</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Under automatic installments</p>
        </div>
      </div>

      {/* Filter and Action Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex flex-1 items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by employee, asset description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 capitalize"
          >
            <option value="all">All Categories</option>
            <option value="uniform">Uniforms</option>
            <option value="shoes">Safety Shoes</option>
            <option value="equipment">Equipment</option>
            <option value="id_card">ID Cards</option>
          </select>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center space-x-2 transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Assign Asset / Deduction</span>
        </button>
      </div>

      {/* Deductions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Total Cost</th>
                <th className="py-3 px-4">Monthly EMI</th>
                <th className="py-3 px-4">Deduction Progress</th>
                <th className="py-3 px-4">Balance Remaining</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No deduction plans match your search filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const percent = Math.min(
                    100,
                    Math.round((item.totalDeductedAmount / item.originalAmount) * 100)
                  );
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.employeeName}</div>
                        <div className="text-xs text-slate-500 font-mono">{item.employeeCode}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-slate-100 text-slate-700">
                          {item.deductionCategory.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-700 max-w-xs truncate">
                        {item.description}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatINR(item.originalAmount)}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        {formatINR(item.monthlyDeductionAmount)}/mo
                      </td>

                      <td className="py-3 px-4 min-w-[140px]">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1">
                          <span>{formatINR(item.totalDeductedAmount)}</span>
                          <span className="font-bold">{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              percent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-amber-700">
                        {formatINR(item.remainingBalance)}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            item.status === 'settled'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-fadeIn">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Shirt className="w-5 h-5 text-blue-600" />
                <span>Assign Uniform / Equipment Asset Deduction</span>
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeduction} className="space-y-4 mt-6">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Select Employee</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeCode}) - {emp.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Deduction Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 capitalize"
                >
                  <option value="uniform">Uniform Set (Shirts + Trousers + Cap)</option>
                  <option value="shoes">Industrial Safety Shoes</option>
                  <option value="equipment">Security Equipment / Baton / Torch</option>
                  <option value="id_card">RFID Access Smart Card & Badge</option>
                  <option value="penalty">Disciplinary Penalty</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Item Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 2 Pair Safari Suits + Leather Belt + Badge"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Total Cost (₹)</label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={totalCost}
                    onChange={(e) => setTotalCost(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Monthly Deduction (₹)</label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={monthlyInstallment}
                    onChange={(e) => setMonthlyInstallment(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSaving ? 'Processing...' : 'Save Deduction Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
