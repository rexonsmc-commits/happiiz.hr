/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  Receipt,
  X,
  FileCheck,
} from 'lucide-react';
import { PaymentRecord, Company, SubscriptionInvoice } from '../../../types';
import { recordPayment } from '../../../services/platformService';

interface PaymentsModuleProps {
  payments: PaymentRecord[];
  companies: Company[];
  invoices: SubscriptionInvoice[];
  onRefresh: () => void;
  adminEmail: string;
}

export const PaymentsModule: React.FC<PaymentsModuleProps> = ({
  payments,
  companies,
  invoices,
  onRefresh,
  adminEmail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isArchDocOpen, setIsArchDocOpen] = useState(false);

  // Manual payment form
  const [formData, setFormData] = useState({
    companyId: companies[0]?.id || '',
    invoiceId: invoices[0]?.id || '',
    amount: 3600,
    taxAmount: 648,
    paymentMethod: 'bank_transfer' as PaymentRecord['paymentMethod'],
    transactionReference: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = payments.filter((p) => {
    const matchesSearch =
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.transactionReference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRecordManualPayment = async () => {
    if (!formData.transactionReference) return;
    setIsSubmitting(true);
    try {
      const comp = companies.find((c) => c.id === formData.companyId) || companies[0];
      const inv = invoices.find((i) => i.id === formData.invoiceId) || invoices[0];
      const total = Number(formData.amount) + Number(formData.taxAmount);

      await recordPayment(
        {
          companyId: comp.id,
          tenantId: comp.tenantId,
          companyName: comp.name,
          invoiceId: inv?.id || 'manual_inv',
          invoiceNumber: inv?.invoiceNumber || 'HAP-INV-MANUAL',
          amount: Number(formData.amount),
          taxAmount: Number(formData.taxAmount),
          totalAmount: total,
          currency: 'INR',
          paymentMethod: formData.paymentMethod,
          paymentDate: new Date().toISOString(),
          status: 'successful',
          transactionReference: formData.transactionReference,
          notes: formData.notes || 'Manual administrative reconciliation with bank proof',
          recordedBy: adminEmail,
        },
        adminEmail
      );

      setIsManualModalOpen(false);
      setFormData({
        ...formData,
        transactionReference: '',
        notes: '',
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Payment Reconciliation & Gateways</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
              Audit Guarded
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Immutable settlement ledger. Transactions are cryptographically validated via server-side webhooks (Razorpay / Stripe) or authorized manual audit entry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsArchDocOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            Gateway Architecture
          </button>
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Manual Payment</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search payment ID, transaction UTR, tenant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-700 focus:ring-2 focus:ring-blue-600 font-semibold"
        >
          <option value="all">All Payment Statuses</option>
          <option value="successful">Successful</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
          <option value="partially_refunded">Partially Refunded</option>
        </select>
      </div>

      {/* Payment Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Payment ID</th>
                <th className="px-4 py-3.5">Tenant Company</th>
                <th className="px-4 py-3.5">Invoice #</th>
                <th className="px-4 py-3.5">Base Amount</th>
                <th className="px-4 py-3.5">Tax (GST)</th>
                <th className="px-4 py-3.5 font-black">Total Paid</th>
                <th className="px-4 py-3.5">Method</th>
                <th className="px-4 py-3.5">Transaction Ref</th>
                <th className="px-4 py-3.5">Payment Date</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-8 text-center text-slate-400 font-sans">
                    No payment records match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-blue-700">
                      {pay.id}
                    </td>

                    <td className="px-4 py-3.5 font-sans">
                      <div className="font-extrabold text-slate-900 text-xs">{pay.companyName}</div>
                      <span className="font-mono text-[10px] text-slate-500">{pay.tenantId}</span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-700 font-bold">
                      {pay.invoiceNumber}
                    </td>

                    <td className="px-4 py-3.5 text-slate-700">
                      ₹{pay.amount.toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3.5 text-slate-500">
                      ₹{pay.taxAmount.toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3.5 text-slate-900 font-black text-sm">
                      ₹{pay.totalAmount.toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3.5 uppercase text-[11px] font-sans font-bold text-slate-700">
                      {pay.paymentMethod.replace('_', ' ')}
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 truncate max-w-[150px]" title={pay.transactionReference}>
                      {pay.transactionReference}
                    </td>

                    <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                      {new Date(pay.paymentDate).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="px-5 py-3.5 text-right font-sans">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          pay.status === 'successful'
                            ? 'bg-emerald-100 text-emerald-800'
                            : pay.status === 'failed'
                            ? 'bg-rose-100 text-rose-800'
                            : pay.status === 'refunded'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {pay.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: RECORD MANUAL PAYMENT */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <h3 className="text-base font-black text-slate-900">Record Offline / Manual Settlement</h3>
            <p className="text-xs text-slate-500">
              Only authorized administrators can enter manual payments. All entries are immutably logged with the recording administrator UID and bank proof reference.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Tenant</label>
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-blue-600"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.tenantId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Associated Invoice (Optional)</label>
                <select
                  value={formData.invoiceId}
                  onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-600"
                >
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — ₹{inv.totalAmount} ({inv.companyName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Base Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tax Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.taxAmount}
                    onChange={(e) => setFormData({ ...formData, taxAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Remittance Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="bank_transfer">Direct Bank Transfer (NEFT)</option>
                    <option value="upi">Corporate UPI</option>
                    <option value="cheque">Bank Cheque</option>
                    <option value="cash">Cash Counter</option>
                    <option value="razorpay">Razorpay Virtual Account</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bank UTR / Transaction Ref *</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR2611084812"
                    value={formData.transactionReference}
                    onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Audit Verification Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Verified in ICICI Corporate Current Account #9942"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordManualPayment}
                disabled={isSubmitting || !formData.transactionReference}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
              >
                {isSubmitting ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: GATEWAY INTEGRATION ARCHITECTURE */}
      {isArchDocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Secure Payment Architecture</h3>
              </div>
              <button onClick={() => setIsArchDocOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>Security Directives Enforced:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Never store raw credit card numbers, CVVs, or bank credentials anywhere in Happiiz HR database.</li>
                <li>Zero client-side trust: Frontend success callbacks do NOT settle payments.</li>
                <li>Cloud Run server endpoint <code>/api/webhooks/razorpay</code> verifies HMAC SHA256 signatures before transitioning invoice status to <code>paid</code>.</li>
                <li>Idempotency keys prevent duplicate billing or double charging.</li>
              </ul>
            </div>

            <div className="pt-3 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setIsArchDocOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
