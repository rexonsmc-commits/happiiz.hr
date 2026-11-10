/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EmployeeAdvance,
  Employee,
} from '../../types';
import {
  formatINR,
  round2,
  saveEmployeeAdvance,
} from '../../services/payrollService';
import {
  Search,
  Plus,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  User,
  X,
  FileText,
  Building2,
} from 'lucide-react';

interface EmployeeAdvancesModuleProps {
  companyId: string;
  tenantId: string;
  advances: EmployeeAdvance[];
  employees: Employee[];
  onRefresh: () => void;
}

export const EmployeeAdvancesModule: React.FC<EmployeeAdvancesModuleProps> = ({
  companyId,
  tenantId,
  advances,
  employees,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'settled'>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // New Advance form
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const [advanceAmount, setAdvanceAmount] = useState<number>(5000);
  const [monthlyRecovery, setMonthlyRecovery] = useState<number>(1500);
  const [paymentMode, setPaymentMode] = useState<'bank_transfer' | 'upi' | 'cash'>('bank_transfer');
  const [refNumber, setRefNumber] = useState('');
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('Festival advance / Emergency support');

  const filteredAdvances = advances.filter((a) => {
    const matchesSearch =
      a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.referenceNumber && a.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalDisbursed = advances.reduce((s, a) => s + a.advanceAmount, 0);
  const totalOutstanding = advances.reduce((s, a) => s + a.outstandingAmount, 0);
  const totalRecovered = advances.reduce((s, a) => s + a.recoveredAmount, 0);
  const activeCount = advances.filter((a) => a.status === 'active').length;

  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === selectedEmpId);
    if (!emp) return;

    setIsSaving(true);
    try {
      const newAdv: EmployeeAdvance = {
        id: `adv_${companyId}_${Date.now()}`,
        tenantId,
        companyId,
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: emp.fullName,
        advanceDate,
        advanceAmount: round2(advanceAmount),
        monthlyRecoveryAmount: round2(monthlyRecovery),
        recoveredAmount: 0,
        outstandingAmount: round2(advanceAmount),
        paymentMode,
        referenceNumber: refNumber || `REF-${Date.now().toString().slice(-6)}`,
        approvedBy: 'Company Administration',
        status: 'active',
        remarks,
        createdAt: new Date().toISOString(),
      };

      await saveEmployeeAdvance(companyId, newAdv);
      setShowNewModal(false);
      setNotification(`Salary advance of ${formatINR(advanceAmount)} recorded for ${emp.fullName}.`);
      setTimeout(() => setNotification(null), 3500);
      onRefresh();
    } catch {
      alert('Failed to disburse advance.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSettle = async (adv: EmployeeAdvance) => {
    if (!confirm(`Mark advance for ${adv.employeeName} as fully settled?`)) return;
    try {
      const updated: EmployeeAdvance = {
        ...adv,
        recoveredAmount: adv.advanceAmount,
        outstandingAmount: 0,
        status: 'settled',
      };
      await saveEmployeeAdvance(companyId, updated);
      onRefresh();
    } catch {
      alert('Failed to settle advance.');
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Advances Disbursed
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatINR(totalDisbursed)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Across all workforce records</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Active Outstanding Balance
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900 mt-2 font-mono">
            {formatINR(totalOutstanding)}
          </div>
          <p className="text-xs text-amber-700 mt-1 font-medium">{activeCount} active recoveries</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Total Recovered to Date
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-2 font-mono">
            {formatINR(totalRecovered)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Deducted from monthly payroll</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Debtors
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <User className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {activeCount} <span className="text-sm font-normal text-slate-500">Employees</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Under monthly EMI recovery</p>
        </div>
      </div>

      {/* Action and Search Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex flex-1 items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by employee, code, ref #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {(['all', 'active', 'settled'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                  statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center space-x-2 transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Disburse New Advance</span>
        </button>
      </div>

      {/* Advances Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Disbursed Date</th>
                <th className="py-3 px-4">Principal Amount</th>
                <th className="py-3 px-4">Monthly EMI</th>
                <th className="py-3 px-4">Recovery Progress</th>
                <th className="py-3 px-4">Balance Due</th>
                <th className="py-3 px-4">Disbursed Via</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredAdvances.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No advance records match your filter.
                  </td>
                </tr>
              ) : (
                filteredAdvances.map((adv) => {
                  const percent = Math.min(100, Math.round((adv.recoveredAmount / adv.advanceAmount) * 100));
                  return (
                    <tr key={adv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{adv.employeeName}</div>
                        <div className="text-xs text-slate-500 font-mono">{adv.employeeCode}</div>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-600 font-mono">{adv.advanceDate}</td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatINR(adv.advanceAmount)}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        {formatINR(adv.monthlyRecoveryAmount)}/mo
                      </td>

                      <td className="py-3 px-4 min-w-[140px]">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1">
                          <span>{formatINR(adv.recoveredAmount)}</span>
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
                        {formatINR(adv.outstandingAmount)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-xs uppercase font-medium text-slate-700">
                          {adv.paymentMode.replace('_', ' ')}
                        </div>
                        {adv.referenceNumber && (
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[100px]">
                            {adv.referenceNumber}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            adv.status === 'settled'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {adv.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {adv.status === 'active' && (
                          <button
                            onClick={() => handleManualSettle(adv)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200"
                            title="Mark as fully settled"
                          >
                            Settle Balance
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disburse Advance Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-fadeIn">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span>Disburse Employee Salary Advance</span>
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdvance} className="space-y-4 mt-6">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Advance Amount (₹)</label>
                  <input
                    type="number"
                    min="500"
                    step="500"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Monthly EMI Recovery (₹)</label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={monthlyRecovery}
                    onChange={(e) => setMonthlyRecovery(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="upi">UPI</option>
                    <option value="cash">Cash Voucher</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Disbursal Date</label>
                  <input
                    type="date"
                    value={advanceDate}
                    onChange={(e) => setAdvanceDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Bank Reference / UTR #</label>
                <input
                  type="text"
                  placeholder="e.g. UTR182930491 or Cash Voucher #09"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Disbursal Reason / Remarks</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
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
                  {isSaving ? 'Processing...' : 'Disburse Advance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
