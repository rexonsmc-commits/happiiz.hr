/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Receipt,
  Download,
  Printer,
  Share2,
  Eye,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  X,
  Building2,
  CreditCard,
} from 'lucide-react';
import {
  SubscriptionInvoice,
  Company,
  SubscriptionPlanItem,
  PlatformSettings,
} from '../../../types';
import {
  createSubscriptionInvoice,
  markInvoiceAsPaid,
} from '../../../services/platformService';

interface InvoicesModuleProps {
  invoices: SubscriptionInvoice[];
  companies: Company[];
  plans: SubscriptionPlanItem[];
  settings: PlatformSettings;
  onRefresh: () => void;
  adminEmail: string;
}

export const InvoicesModule: React.FC<InvoicesModuleProps> = ({
  invoices,
  companies,
  plans,
  settings,
  onRefresh,
  adminEmail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<SubscriptionInvoice | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [markPaidModal, setMarkPaidModal] = useState<SubscriptionInvoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<any>('upi');
  const [paymentRef, setPaymentRef] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // New Invoice Form state
  const [selectedCompId, setSelectedCompId] = useState<string>(companies[0]?.id || '');
  const [invoicePeriod, setInvoicePeriod] = useState('Nov 2026');

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.tenantId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleGenerateInvoice = async () => {
    const comp = companies.find((c) => c.id === selectedCompId);
    if (!comp) return;

    setIsProcessing(true);
    try {
      const plan = plans.find((p) => p.code === comp.subscriptionPlan) || plans[0];
      const rate = plan.pricePerEmployee;
      const active = comp.employeeCount || 25;
      const billable = active;
      const subtotal = Math.max(plan.minMonthlyFee, billable * rate);
      const cgst = Math.round((subtotal * 9) / 100);
      const sgst = Math.round((subtotal * 9) / 100);
      const total = subtotal + cgst + sgst;

      const nextSeq = (settings.nextInvoiceSeq || 1045);
      const invoiceNumber = `${settings.invoicePrefix || 'HAP-INV-'}${new Date().getFullYear()}-${nextSeq}`;

      const now = new Date();
      const due = new Date();
      due.setDate(due.getDate() + 7);

      await createSubscriptionInvoice(
        {
          invoiceNumber,
          companyId: comp.id,
          tenantId: comp.tenantId,
          companyName: comp.name,
          customerGst: comp.gstNumber || comp.taxId || '',
          customerAddress: `${comp.address}, ${comp.city || ''}`,
          customerEmail: comp.adminEmail,
          customerPhone: comp.phone,
          planCode: plan.code,
          planName: `${plan.name} (${billable} Staff @ ₹${rate}/emp)`,
          billingPeriod: invoicePeriod,
          billingCycle: 'monthly',
          activeEmployees: active,
          onLeaveEmployees: 0,
          billableEmployees: billable,
          ratePerEmployee: rate,
          minimumMonthlyFee: plan.minMonthlyFee,
          subtotal,
          discountAmount: 0,
          taxableAmount: subtotal,
          cgstRate: 9,
          cgstAmount: cgst,
          sgstRate: 9,
          sgstAmount: sgst,
          igstRate: 0,
          igstAmount: 0,
          totalAmount: total,
          currency: 'INR',
          status: 'pending',
          dueDate: due.toISOString(),
          issueDate: now.toISOString(),
          createdAdminEmail: adminEmail,
        },
        adminEmail
      );

      setIsCreating(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmMarkPaid = async () => {
    if (!markPaidModal) return;
    setIsProcessing(true);
    try {
      await markInvoiceAsPaid(
        markPaidModal.id,
        {
          paymentMethod,
          transactionReference: paymentRef || `MANUAL-${Date.now()}`,
          notes: 'Marked as paid by authorized finance admin',
        },
        adminEmail
      );
      setMarkPaidModal(null);
      setPaymentRef('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Subscription Invoices & Tax Billing</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
              GST Compliant
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Automated tax invoice generation with Happiiz HR corporate header, customer GSTIN verification, CGST/SGST line items, and print/PDF support.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search invoice or tenant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 w-52"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-700 focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Invoices</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>

          <button
            onClick={() => setIsCreating(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate Invoice</span>
          </button>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-4 py-3.5">Tenant Company</th>
                <th className="px-4 py-3.5">Billing Period</th>
                <th className="px-4 py-3.5">Plan / Workforce</th>
                <th className="px-4 py-3.5">Taxable (₹)</th>
                <th className="px-4 py-3.5">GST (18%)</th>
                <th className="px-4 py-3.5 font-black">Total (₹)</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-400 font-sans">
                    No invoices match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => {
                  const issueDate = new Date(inv.issueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 text-blue-700 font-bold">
                        {inv.invoiceNumber}
                        <div className="text-[10px] text-slate-400 font-normal font-sans">{issueDate}</div>
                      </td>

                      <td className="px-4 py-3.5 font-sans">
                        <div className="font-extrabold text-slate-900 text-xs">{inv.companyName}</div>
                        <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1 rounded">
                          {inv.tenantId}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-700 font-sans font-medium">
                        {inv.billingPeriod}
                      </td>

                      <td className="px-4 py-3.5 font-sans">
                        <div className="font-bold text-slate-800 text-xs">{inv.planName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {inv.billableEmployees} billable staff
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-800 font-bold">
                        ₹{inv.taxableAmount.toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600">
                        ₹{(inv.cgstAmount + inv.sgstAmount + inv.igstAmount).toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3.5 text-slate-900 font-black text-sm">
                        ₹{inv.totalAmount.toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3.5 font-sans">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            title="View / Print Tax Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {inv.status !== 'paid' && (
                            <button
                              onClick={() => setMarkPaidModal(inv)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] transition-colors"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: VIEW / PRINT / SHARE OFFICIAL TAX INVOICE */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-6 print:border-none print:shadow-none print:max-w-none">
            {/* Action Bar (hidden when printing) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <span className="text-xs text-slate-500 font-medium">Official Tax Invoice View</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Invoice Body (Print-optimized) */}
            <div className="space-y-6 font-sans">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-sky-400 font-black text-sm flex items-center justify-center">
                      H
                    </div>
                    <span className="text-xl font-black text-slate-900 tracking-tight">Happiiz HR</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Multi-Tenant Workforce Management SaaS<br />
                    Bangalore, Karnataka - 560100<br />
                    GSTIN: 29AAACH1234F1Z5 • support@happiiz.io
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900 tracking-tight block">TAX INVOICE</span>
                  <div className="font-mono text-xs font-bold text-blue-700 mt-0.5">
                    {selectedInvoice.invoiceNumber}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Issue Date: <strong>{new Date(selectedInvoice.issueDate).toLocaleDateString()}</strong><br />
                    Due Date: <strong>{new Date(selectedInvoice.dueDate).toLocaleDateString()}</strong>
                  </div>
                </div>
              </div>

              {/* Bill To section */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billed To (Customer)</span>
                  <div className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedInvoice.companyName}</div>
                  <div className="text-slate-600 mt-0.5">{selectedInvoice.customerAddress}</div>
                  <div className="font-mono text-[11px] text-slate-500 mt-1">
                    Tenant ID: <strong>{selectedInvoice.tenantId}</strong>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Tax ID</span>
                  <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                    GSTIN: {selectedInvoice.customerGst || 'Not Registered / B2C'}
                  </div>
                  <div className="mt-2">
                    <span className="text-[10px] text-slate-400 uppercase block">Payment Status</span>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase mt-0.5 ${
                        selectedInvoice.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedInvoice.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center">Workforce Count</th>
                    <th className="p-3 text-right">Rate / Emp</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-medium text-slate-900">
                      <strong>Happiiz HR Subscription — {selectedInvoice.billingPeriod}</strong>
                      <div className="text-[11px] text-slate-500">{selectedInvoice.planName}</div>
                    </td>
                    <td className="p-3 text-center font-mono">{selectedInvoice.billableEmployees} Guards/Staff</td>
                    <td className="p-3 text-right font-mono">₹{selectedInvoice.ratePerEmployee}</td>
                    <td className="p-3 text-right font-mono font-bold">₹{selectedInvoice.taxableAmount.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>

              {/* Tax & Total Summary */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Base:</span>
                    <span className="font-mono font-bold">₹{selectedInvoice.taxableAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (9%):</span>
                    <span className="font-mono">₹{selectedInvoice.cgstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pb-1.5 border-b border-slate-200">
                    <span>SGST (9%):</span>
                    <span className="font-mono">₹{selectedInvoice.sgstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 text-base font-black pt-1">
                    <span>Total Amount:</span>
                    <span className="font-mono">₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Payment Details Footer */}
              {selectedInvoice.paidAt && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                  <div>
                    <span className="font-bold">Payment Received & Reconciled</span>
                    <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
                      Ref: {selectedInvoice.paymentReference || 'Direct Net Banking'} • Method: {selectedInvoice.paymentMethod?.toUpperCase()}
                    </div>
                  </div>
                  <span className="font-mono text-[11px] font-bold">
                    {new Date(selectedInvoice.paidAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MARK AS PAID */}
      {markPaidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <h3 className="text-base font-black text-slate-900">
              Record Payment for #{markPaidModal.invoiceNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Total Amount: <strong className="text-slate-900 font-mono">₹{markPaidModal.totalAmount.toLocaleString('en-IN')}</strong> for {markPaidModal.companyName}.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-blue-600"
                >
                  <option value="upi">UPI (PhonePe, GPay, Paytm)</option>
                  <option value="razorpay">Razorpay Gateway</option>
                  <option value="bank_transfer">Direct Bank Transfer (NEFT/RTGS)</option>
                  <option value="cheque">Bank Cheque</option>
                  <option value="cash">Cash Remittance</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Transaction Reference / UTR Number *</label>
                <input
                  type="text"
                  placeholder="e.g. UTR2611079942 or Cheque #04219"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setMarkPaidModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMarkPaid}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
              >
                {isProcessing ? 'Recording...' : 'Confirm Remittance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: GENERATE INVOICE MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <h3 className="text-base font-black text-slate-900">Generate Tenant Subscription Invoice</h3>
            <p className="text-xs text-slate-500">
              Issue an official GST invoice based on the tenant's current billable workforce headcount.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Tenant Company</label>
                <select
                  value={selectedCompId}
                  onChange={(e) => setSelectedCompId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-blue-600"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.tenantId}) — {c.employeeCount} staff
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Billing Period Label</label>
                <input
                  type="text"
                  value={invoicePeriod}
                  onChange={(e) => setInvoicePeriod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateInvoice}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
              >
                {isProcessing ? 'Generating...' : 'Issue Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
