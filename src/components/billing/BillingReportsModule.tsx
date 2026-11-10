/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ClientInvoice,
  Client,
} from '../../types';
import {
  formatINR,
  generateGstReportCSV,
  generateInvoiceRegisterCSV,
} from '../../services/billingService';
import {
  FileSpreadsheet,
  Download,
  Building2,
  Calendar,
  ShieldCheck,
  Clock,
  Printer,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

interface BillingReportsModuleProps {
  invoices: ClientInvoice[];
  clients: Client[];
}

export const BillingReportsModule: React.FC<BillingReportsModuleProps> = ({
  invoices,
  clients,
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'gstr1' | 'aging' | 'client_summary'>(
    'gstr1'
  );

  const handleDownloadGSTR1 = () => {
    const csv = generateGstReportCSV(invoices);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GSTR1_B2B_Summary_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadRegister = () => {
    const csv = generateInvoiceRegisterCSV(invoices);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_Register_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Tax calculations
  const nonCancelledInvoices = invoices.filter((i) => i.status !== 'cancelled');
  const totalTaxable = nonCancelledInvoices.reduce((s, i) => s + i.taxableAmount, 0);
  const totalCgst = nonCancelledInvoices.reduce((s, i) => s + i.cgstAmount, 0);
  const totalSgst = nonCancelledInvoices.reduce((s, i) => s + i.sgstAmount, 0);
  const totalIgst = nonCancelledInvoices.reduce((s, i) => s + i.igstAmount, 0);
  const totalGst = totalCgst + totalSgst + totalIgst;
  const grandTotal = nonCancelledInvoices.reduce((s, i) => s + i.grandTotal, 0);

  // Aging Buckets
  const currentOverdue = nonCancelledInvoices.filter((i) => i.outstandingAmount > 0);
  const bucket0to30 = currentOverdue.filter((i) => i.billingPeriod === '2026-11');
  const bucket31to60 = currentOverdue.filter((i) => i.billingPeriod === '2026-10');
  const bucketOlder = currentOverdue.filter((i) => i.billingPeriod < '2026-10');

  return (
    <div className="space-y-6">
      {/* Tab Navigation & Export Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold w-full sm:w-auto">
          <button
            onClick={() => setActiveReportTab('gstr1')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              activeReportTab === 'gstr1'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>GSTR-1 Tax Summary</span>
          </button>

          <button
            onClick={() => setActiveReportTab('aging')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              activeReportTab === 'aging'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Outstanding Aging Analysis</span>
          </button>

          <button
            onClick={() => setActiveReportTab('client_summary')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              activeReportTab === 'client_summary'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Client Revenue Summary</span>
          </button>
        </div>

        <button
          onClick={activeReportTab === 'gstr1' ? handleDownloadGSTR1 : handleDownloadRegister}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export {activeReportTab === 'gstr1' ? 'GSTR-1 CSV' : 'Register CSV'}</span>
        </button>
      </div>

      {/* Tab 1: GSTR-1 Tax Summary */}
      {activeReportTab === 'gstr1' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Taxable Value
              </span>
              <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                {formatINR(totalTaxable)}
              </div>
              <p className="text-xs text-slate-500 mt-1">B2B taxable supply</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                Total Output GST
              </span>
              <div className="text-2xl font-black text-purple-950 mt-2 font-mono">
                {formatINR(totalGst)}
              </div>
              <p className="text-xs text-purple-700 mt-1 font-medium">CGST + SGST + IGST liability</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                CGST & SGST (Intra-State)
              </span>
              <div className="text-xl font-black text-blue-950 mt-2 font-mono">
                {formatINR(totalCgst + totalSgst)}
              </div>
              <p className="text-xs text-slate-500 mt-1">CGST: {formatINR(totalCgst)} | SGST: {formatINR(totalSgst)}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Total Invoiced Value
              </span>
              <div className="text-2xl font-black text-emerald-950 mt-2 font-mono">
                {formatINR(grandTotal)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Inclusive of GST taxes</p>
            </div>
          </div>

          {/* GSTR-1 Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  GSTR-1 Table 4A: B2B Taxable Invoices Statement
                </h3>
                <p className="text-xs text-slate-500">
                  Itemized recipient GSTIN, place of supply, taxable value and output tax
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">
                    <th className="py-2.5 px-3">Recipient GSTIN</th>
                    <th className="py-2.5 px-3">Client Name</th>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Place of Supply</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value</th>
                    <th className="py-2.5 px-3 text-right">CGST</th>
                    <th className="py-2.5 px-3 text-right">SGST</th>
                    <th className="py-2.5 px-3 text-right">IGST</th>
                    <th className="py-2.5 px-3 text-right">Total Invoice Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {nonCancelledInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 text-slate-700">{inv.clientGstin}</td>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">{inv.clientName}</td>
                      <td className="py-2.5 px-3 font-bold text-blue-700">{inv.invoiceNumber}</td>
                      <td className="py-2.5 px-3 text-slate-600">{inv.invoiceDate}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-sans">{inv.placeOfSupply}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-900">{formatINR(inv.taxableAmount)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{formatINR(inv.cgstAmount)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{formatINR(inv.sgstAmount)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{formatINR(inv.igstAmount)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatINR(inv.grandTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Aging & Overdue Analysis */}
      {activeReportTab === 'aging' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Current (0 - 30 Days)
              </span>
              <div className="text-2xl font-black text-emerald-950 mt-2 font-mono">
                {formatINR(bucket0to30.reduce((s, i) => s + i.outstandingAmount, 0))}
              </div>
              <p className="text-xs text-slate-500 mt-1">{bucket0to30.length} pending invoices</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                Aging (31 - 60 Days)
              </span>
              <div className="text-2xl font-black text-amber-950 mt-2 font-mono">
                {formatINR(bucket31to60.reduce((s, i) => s + i.outstandingAmount, 0))}
              </div>
              <p className="text-xs text-amber-700 mt-1 font-medium">{bucket31to60.length} follow-up invoices</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
                Overdue (60+ Days)
              </span>
              <div className="text-2xl font-black text-rose-950 mt-2 font-mono">
                {formatINR(bucketOlder.reduce((s, i) => s + i.outstandingAmount, 0))}
              </div>
              <p className="text-xs text-rose-700 mt-1 font-medium">{bucketOlder.length} critical overdue</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Client Revenue Summary */}
      {activeReportTab === 'client_summary' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Client Cumulative Billing Summary</h3>
            <p className="text-xs text-slate-500">Total volume, paid collections and outstanding per client</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Total Invoices</th>
                  <th className="py-3 px-4 font-mono text-right">Total Billed</th>
                  <th className="py-3 px-4 font-mono text-right">Total Paid</th>
                  <th className="py-3 px-4 font-mono text-right">Balance Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {clients.map((c) => {
                  const clientInvs = nonCancelledInvoices.filter((i) => i.clientId === c.id);
                  const billed = clientInvs.reduce((s, i) => s + i.grandTotal, 0);
                  const paid = clientInvs.reduce((s, i) => s + i.paidAmount, 0);
                  const due = clientInvs.reduce((s, i) => s + i.outstandingAmount, 0);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-sans font-bold text-slate-900">{c.clientName}</td>
                      <td className="py-3 px-4 font-sans text-slate-700">{clientInvs.length} Invoices</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(billed)}</td>
                      <td className="py-3 px-4 text-right text-emerald-700">{formatINR(paid)}</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-800">{formatINR(due)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
