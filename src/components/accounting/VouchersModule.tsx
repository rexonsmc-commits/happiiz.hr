/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PaymentVoucher, ReceiptVoucher, Company } from '../../types';
import { formatINR, numberToIndianWords } from '../../services/payrollService';
import {
  FileText,
  Printer,
  Search,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  Calendar,
  CreditCard,
  Download,
} from 'lucide-react';

interface VouchersModuleProps {
  paymentVouchers: PaymentVoucher[];
  receiptVouchers: ReceiptVoucher[];
  currentCompany: Company | null;
}

export const VouchersModule: React.FC<VouchersModuleProps> = ({
  paymentVouchers,
  receiptVouchers,
  currentCompany,
}) => {
  const [activeTab, setActiveTab] = useState<'payment' | 'receipt'>('payment');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [previewVoucher, setPreviewVoucher] = useState<{
    type: 'payment' | 'receipt';
    data: PaymentVoucher | ReceiptVoucher;
  } | null>(null);

  const filteredPayments = paymentVouchers.filter((p) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.voucherNumber.toLowerCase().includes(q) ||
      p.payeeName.toLowerCase().includes(q) ||
      p.narration.toLowerCase().includes(q)
    );
  });

  const filteredReceipts = receiptVouchers.filter((r) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.voucherNumber.toLowerCase().includes(q) ||
      r.receivedFrom.toLowerCase().includes(q) ||
      r.narration.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('payment')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'payment'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-rose-400" />
            Payment Vouchers ({paymentVouchers.length})
          </button>
          <button
            onClick={() => setActiveTab('receipt')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'receipt'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            Receipt Vouchers ({receiptVouchers.length})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search voucher # or party..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-60 focus:outline-blue-600 bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      {/* 1. PAYMENT VOUCHERS TABLE */}
      {activeTab === 'payment' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Voucher #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payee / Beneficiary</th>
                  <th className="py-3 px-4">Debit Account</th>
                  <th className="py-3 px-4">Credit Account</th>
                  <th className="py-3 px-4">Mode / UTR</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPayments.map((pv) => (
                  <tr key={pv.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{pv.voucherNumber}</td>
                    <td className="py-3 px-4 text-slate-600">{pv.voucherDate}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{pv.payeeName}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{pv.debitAccountName}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{pv.creditAccountName}</td>
                    <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                      {pv.paymentMode.replace('_', ' ')} • {pv.chequeOrUtrNumber || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-rose-700">{formatINR(pv.amount)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                        {pv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setPreviewVoucher({ type: 'payment', data: pv })}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors ml-auto"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. RECEIPT VOUCHERS TABLE */}
      {activeTab === 'receipt' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Voucher #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Received From</th>
                  <th className="py-3 px-4">Debit Account (Bank/Cash)</th>
                  <th className="py-3 px-4">Credit Account (Receivable)</th>
                  <th className="py-3 px-4">Mode / UTR</th>
                  <th className="py-3 px-4 text-right">Gross Amount</th>
                  <th className="py-3 px-4 text-right">TDS (194C)</th>
                  <th className="py-3 px-4 text-right">Net Received</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredReceipts.map((rv) => (
                  <tr key={rv.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{rv.voucherNumber}</td>
                    <td className="py-3 px-4 text-slate-600">{rv.voucherDate}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{rv.receivedFrom}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{rv.debitAccountName}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{rv.creditAccountName}</td>
                    <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                      {rv.paymentMode.replace('_', ' ')} • {rv.chequeOrUtrNumber || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">{formatINR(rv.amount)}</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-700">{formatINR(rv.tdsDeducted || 0)}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                      {formatINR(rv.netReceivedAmount || rv.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                        {rv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setPreviewVoucher({ type: 'receipt', data: rv })}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors ml-auto"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Voucher Card Modal */}
      {previewVoucher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase text-slate-400">Formal ERP Voucher Document</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Voucher
                </button>
                <button
                  onClick={() => setPreviewVoucher(null)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Printable Voucher Paper */}
            <div className="border border-slate-300 rounded-xl p-6 bg-white space-y-4 font-sans text-slate-900 shadow-xs">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900">
                    {currentCompany?.name || 'Happiiz Workforce Solutions Pvt Ltd'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {currentCompany?.address || 'Plot 44, Udyog Vihar Phase 4, Sector 18, Gurugram, Haryana - 122015'}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    GSTIN: {currentCompany?.gstNumber || '06AAACH8921P1Z5'} • PAN: {currentCompany?.panNumber || 'AAACH8921P'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider ${
                    previewVoucher.type === 'payment' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {previewVoucher.type === 'payment' ? 'PAYMENT VOUCHER' : 'RECEIPT VOUCHER'}
                  </span>
                  <div className="mt-1 font-mono font-bold text-xs text-blue-700">{previewVoucher.data.voucherNumber}</div>
                  <div className="text-[11px] text-slate-500">
                    Date: {(previewVoucher.data as any).voucherDate}
                  </div>
                </div>
              </div>

              {/* Main Party & Accounts Details */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {previewVoucher.type === 'payment' ? 'Paid To (Beneficiary)' : 'Received From (Payer)'}
                  </span>
                  <div className="font-bold text-sm text-slate-900 mt-0.5">
                    {previewVoucher.type === 'payment'
                      ? (previewVoucher.data as PaymentVoucher).payeeName
                      : (previewVoucher.data as ReceiptVoucher).receivedFrom}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Mode & Instrument</span>
                  <div className="font-bold text-slate-800 mt-0.5 capitalize">
                    {previewVoucher.data.paymentMode.replace('_', ' ')}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Ref / UTR: {previewVoucher.data.chequeOrUtrNumber || 'DIRECT-NEFT'}
                  </div>
                </div>
              </div>

              {/* Account Distribution Table */}
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3 border-r border-slate-200">Account Particulars</th>
                    <th className="py-2 px-3 text-right">Debit (₹)</th>
                    <th className="py-2 px-3 text-right">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-200">
                      <div className="font-bold text-slate-900">{previewVoucher.data.debitAccountName}</div>
                      <div className="text-[10px] text-slate-500 italic">{previewVoucher.data.narration}</div>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {formatINR(previewVoucher.data.amount)}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-400 font-mono">-</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-200">
                      <div className="font-bold text-slate-900">{previewVoucher.data.creditAccountName}</div>
                    </td>
                    <td className="py-2 px-3 text-right text-slate-400 font-mono">-</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {formatINR(previewVoucher.data.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Amount In Words */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Amount in Words</span>
                <span className="font-bold text-slate-800 italic">
                  {numberToIndianWords(previewVoucher.data.amount)}
                </span>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-8 text-center text-xs text-slate-600">
                <div className="border-t border-slate-300 pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Prepared By</span>
                  <div className="font-bold text-slate-800 mt-0.5">Accounts Officer</div>
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Verified By</span>
                  <div className="font-bold text-slate-800 mt-0.5">Finance Manager</div>
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Authorized Signatory</span>
                  <div className="font-bold text-slate-800 mt-0.5">For {currentCompany?.name || 'Happiiz HR'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
