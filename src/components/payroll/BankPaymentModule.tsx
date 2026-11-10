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
  generateBankPaymentCSV,
  markPayrollEntriesPaid,
} from '../../services/payrollService';
import {
  Building2,
  Download,
  CheckCircle,
  CreditCard,
  AlertCircle,
  Search,
  Filter,
  FileSpreadsheet,
  X,
} from 'lucide-react';

interface BankPaymentModuleProps {
  companyId: string;
  tenantId: string;
  company: Company | null;
  currentRun: PayrollRun | null;
  entries: PayrollEntry[];
  onRefresh: () => void;
}

export const BankPaymentModule: React.FC<BankPaymentModuleProps> = ({
  companyId,
  tenantId,
  company,
  currentRun,
  entries,
  onRefresh,
}) => {
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [paymentMode, setPaymentMode] = useState<'bank_transfer' | 'upi' | 'cash'>('bank_transfer');
  const [transactionRef, setTransactionRef] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const filteredEntries = entries.filter(
    (e) =>
      e.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.bankName && e.bankName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalNet = entries.reduce((s, e) => s + e.netPayable, 0);
  const paidEntries = entries.filter((e) => e.paymentStatus === 'paid');
  const paidAmount = paidEntries.reduce((s, e) => s + e.netPayable, 0);
  const unpaidEntries = entries.filter((e) => e.paymentStatus !== 'paid');
  const unpaidAmount = unpaidEntries.reduce((s, e) => s + e.netPayable, 0);

  const handleSelectAllUnpaid = () => {
    if (selectedEntryIds.length === unpaidEntries.length) {
      setSelectedEntryIds([]);
    } else {
      setSelectedEntryIds(unpaidEntries.map((e) => e.id));
    }
  };

  const handleToggleEntry = (id: string) => {
    setSelectedEntryIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    if (entries.length === 0) return;
    const csv = generateBankPaymentCSV(entries, company?.name || 'Happiiz HR Services');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bank_Advice_NEFT_${currentRun?.period || 'Current'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmDisbursement = async () => {
    if (!currentRun || selectedEntryIds.length === 0) return;
    setIsProcessing(true);
    try {
      const ref = transactionRef || `NEFT-${Date.now().toString().slice(-8)}`;
      await markPayrollEntriesPaid(companyId, currentRun.id, selectedEntryIds, paymentMode, ref);
      setShowPayModal(false);
      setSelectedEntryIds([]);
      setNotification(`Disbursement recorded successfully for ${selectedEntryIds.length} employees.`);
      setTimeout(() => setNotification(null), 3500);
      onRefresh();
    } catch {
      alert('Failed to update disbursement status.');
    } finally {
      setIsProcessing(false);
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
              Total Net Payroll
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatINR(totalNet)}
          </div>
          <p className="text-xs text-slate-500 mt-1">{entries.length} Beneficiaries</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Disbursed & Settled
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-2 font-mono">
            {formatINR(paidAmount)}
          </div>
          <p className="text-xs text-emerald-600 mt-1 font-medium">{paidEntries.length} employees paid</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Pending Disbursement
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900 mt-2 font-mono">
            {formatINR(unpaidAmount)}
          </div>
          <p className="text-xs text-amber-700 mt-1 font-medium">{unpaidEntries.length} unpaid pending</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Run Period
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {currentRun?.period || '2026-11'}
          </div>
          <p className="text-xs text-slate-500 mt-1 capitalize">Status: {currentRun?.status || 'Active'}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee or bank..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-colors"
            title="Download Bank Formatted Advice CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>NEFT / RTGS Advice</span>
          </button>

          <button
            onClick={() => setShowPayModal(true)}
            disabled={selectedEntryIds.length === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center space-x-2 transition-colors shadow-sm disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Mark {selectedEntryIds.length} Paid</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      unpaidEntries.length > 0 &&
                      selectedEntryIds.length === unpaidEntries.length
                    }
                    onChange={handleSelectAllUnpaid}
                    className="rounded text-blue-600"
                  />
                </th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Bank Name</th>
                <th className="py-3 px-4">Account Number</th>
                <th className="py-3 px-4">IFSC Code</th>
                <th className="py-3 px-4">Net Salary Payable</th>
                <th className="py-3 px-4">Disbursement Status</th>
                <th className="py-3 px-4">Payment Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No payroll entries found for this run.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        disabled={e.paymentStatus === 'paid'}
                        checked={selectedEntryIds.includes(e.id)}
                        onChange={() => handleToggleEntry(e.id)}
                        className="rounded text-blue-600 disabled:opacity-40"
                      />
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{e.employeeName}</div>
                      <div className="text-xs text-slate-500 font-mono">{e.employeeCode}</div>
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-700">
                      {e.bankName || 'HDFC Bank Ltd'}
                    </td>

                    <td className="py-3 px-4 text-xs font-mono text-slate-800">
                      {e.bankAccountMasked || '•••• 4857'}
                    </td>

                    <td className="py-3 px-4 text-xs font-mono text-slate-700">
                      {e.ifscCode || 'HDFC0001829'}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {formatINR(e.netPayable)}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          e.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {e.paymentStatus === 'paid' ? 'Paid & Cleared' : 'Unpaid'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                      {e.transactionRef || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disbursement Confirmation Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>Confirm Bank Disbursement</span>
              </h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-6">
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                <span className="text-xs text-slate-600 block">Total Disbursing:</span>
                <span className="text-2xl font-black font-mono text-emerald-900">
                  {formatINR(
                    entries
                      .filter((e) => selectedEntryIds.includes(e.id))
                      .reduce((s, e) => s + e.netPayable, 0)
                  )}
                </span>
                <span className="text-xs text-slate-500 block mt-1">
                  for {selectedEntryIds.length} selected employees
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Disbursement Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="bank_transfer">Corporate NEFT / RTGS</option>
                  <option value="upi">Corporate UPI Batch</option>
                  <option value="cash">Cash Voucher</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Bank Reference Number / UTR
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-HDFC98237190"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setShowPayModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDisbursement}
                disabled={isProcessing}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                {isProcessing ? 'Recording...' : 'Mark as Disbursed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
