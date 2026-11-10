/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ClientPaymentRecord,
  ClientInvoice,
  Client,
  ClientPaymentMode,
} from '../../types';
import {
  recordClientPayment,
  formatINR,
  round2,
} from '../../services/billingService';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle,
  Clock,
  DollarSign,
  Building2,
  FileText,
  X,
  AlertCircle,
} from 'lucide-react';

interface PaymentCollectionModuleProps {
  companyId: string;
  tenantId: string;
  payments: ClientPaymentRecord[];
  invoices: ClientInvoice[];
  clients: Client[];
  currentUser: { name: string; role?: string };
  onRefresh: () => void;
}

export const PaymentCollectionModule: React.FC<PaymentCollectionModuleProps> = ({
  companyId,
  tenantId,
  payments,
  invoices,
  clients,
  currentUser,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form states
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoices[0]?.id || '');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<ClientPaymentMode>('bank_transfer');
  const [bankName, setBankName] = useState('HDFC Bank Ltd');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('Full payment received via corporate RTGS');

  const selectedInv = invoices.find((i) => i.id === selectedInvoiceId) || invoices[0];

  const handleOpenModalWithInvoice = (inv: ClientInvoice) => {
    setSelectedInvoiceId(inv.id);
    setAmountReceived(inv.outstandingAmount);
    setReferenceNumber(`UTR-${Date.now().toString().slice(-8)}`);
    setShowRecordModal(true);
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalCollected = payments.reduce((s, p) => s + p.amountReceived, 0);
  const totalReconciled = payments
    .filter((p) => p.status === 'reconciled')
    .reduce((s, p) => s + p.amountReceived, 0);

  const totalOutstandingAllInvoices = invoices.reduce((s, i) => s + i.outstandingAmount, 0);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInv || amountReceived <= 0) {
      alert('Please select an invoice and enter a valid payment amount.');
      return;
    }

    setIsSaving(true);
    try {
      const year = new Date().getFullYear();
      const seq = Date.now().toString().slice(-4);

      const record: ClientPaymentRecord = {
        id: `pmt_${companyId}_${Date.now()}`,
        receiptNumber: `RCP/${year}-${(year + 1).toString().slice(-2)}/${seq}`,
        tenantId,
        companyId,
        clientId: selectedInv.clientId,
        clientName: selectedInv.clientName,
        invoiceId: selectedInv.id,
        invoiceNumber: selectedInv.invoiceNumber,
        paymentDate,
        amountReceived: round2(amountReceived),
        paymentMode,
        bankName,
        referenceNumber: referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
        utrNumber: referenceNumber,
        status: 'reconciled',
        recordedBy: currentUser.name || 'Accounts Team',
        reconciledBy: currentUser.name || 'Accounts Team',
        reconciledAt: new Date().toISOString(),
        notes,
        createdAt: new Date().toISOString(),
      };

      await recordClientPayment(companyId, tenantId, record);
      setShowRecordModal(false);
      setNotification(`Payment of ${formatINR(amountReceived)} recorded for ${selectedInv.clientName}.`);
      setTimeout(() => setNotification(null), 3500);
      onRefresh();
    } catch {
      alert('Failed to record payment.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
              Total Payments Collected
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatINR(totalCollected)}
          </div>
          <p className="text-xs text-slate-500 mt-1">{payments.length} transactions recorded</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Bank Reconciled Receipts
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-950 mt-2 font-mono">
            {formatINR(totalReconciled)}
          </div>
          <p className="text-xs text-blue-700 mt-1 font-medium">Verified against bank statement</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Total Outstanding Balance
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-950 mt-2 font-mono">
            {formatINR(totalOutstandingAllInvoices)}
          </div>
          <p className="text-xs text-amber-700 mt-1 font-medium">Pending client remittances</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
              Active Debtors
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-950 mt-2">
            {invoices.filter((i) => i.outstandingAmount > 0).length}{' '}
            <span className="text-sm font-normal text-slate-500">Unpaid Invoices</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Under collection follow-up</p>
        </div>
      </div>

      {/* Action Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search receipt #, client, invoice # or UTR..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <button
          onClick={() => {
            if (selectedInv) setAmountReceived(selectedInv.outstandingAmount);
            setShowRecordModal(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center space-x-2 transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Record Client Payment</span>
        </button>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Amount Received</th>
                <th className="py-3 px-4">Mode & Bank</th>
                <th className="py-3 px-4">Reference / UTR</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                    No payment records match your search filter.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pmt) => (
                  <tr key={pmt.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-blue-700">{pmt.receiptNumber}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">{pmt.clientName}</td>
                    <td className="py-3 px-4 text-slate-700">{pmt.invoiceNumber}</td>
                    <td className="py-3 px-4 text-slate-600">{pmt.paymentDate}</td>
                    <td className="py-3 px-4 font-bold text-emerald-800 text-sm">
                      {formatINR(pmt.amountReceived)}
                    </td>
                    <td className="py-3 px-4 font-sans uppercase text-[11px] text-slate-700">
                      {pmt.paymentMode.replace('_', ' ')}
                      {pmt.bankName && <div className="text-[10px] text-slate-400 normal-case">{pmt.bankName}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[140px]">
                      {pmt.utrNumber || pmt.referenceNumber || '—'}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {pmt.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-fadeIn">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>Record Client Payment Receipt</span>
              </h3>
              <button onClick={() => setShowRecordModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 mt-6">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Invoice</label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => {
                    setSelectedInvoiceId(e.target.value);
                    const inv = invoices.find((i) => i.id === e.target.value);
                    if (inv) setAmountReceived(inv.outstandingAmount);
                  }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                >
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - {inv.clientName} (Due: {formatINR(inv.outstandingAmount)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedInv && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Invoice Grand Total:</span>
                    <span className="font-mono font-bold text-slate-900">{formatINR(selectedInv.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Already Paid:</span>
                    <span className="font-mono text-emerald-700 font-bold">{formatINR(selectedInv.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-amber-800 font-bold pt-1 border-t border-slate-200">
                    <span>Current Outstanding:</span>
                    <span className="font-mono">{formatINR(selectedInv.outstandingAmount)}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Amount Received (₹)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="bank_transfer">Bank Transfer (RTGS / NEFT)</option>
                    <option value="upi">UPI Corporate</option>
                    <option value="cheque">Cheque Deposit</option>
                    <option value="cash">Cash Voucher</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Deposited Bank</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Bank Reference Number / UTR / Cheque #
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFCR0019283710 or Cheque #829103"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Receipt Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || amountReceived <= 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSaving ? 'Processing...' : 'Record Payment Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
