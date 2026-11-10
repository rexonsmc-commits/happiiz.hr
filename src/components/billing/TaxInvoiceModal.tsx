/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Building2,
  Calendar,
  CheckCircle,
  ShieldCheck,
  CreditCard,
  FileText,
  DollarSign,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { ClientInvoice, Company } from '../../types';
import { formatINR, numberToIndianWords } from '../../services/billingService';

interface TaxInvoiceModalProps {
  invoice: ClientInvoice;
  company: Company | null;
  onClose: () => void;
}

export const TaxInvoiceModal: React.FC<TaxInvoiceModalProps> = ({
  invoice,
  company,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const textData = `
================================================================================
                                TAX INVOICE
                     (Issued under Section 31 of CGST Act, 2017)
================================================================================
SUPPLIER DETAILS:
Name            : ${invoice.bankDetails?.beneficiaryName || company?.name || 'HAPPIIZ WORKFORCE SERVICES PVT LTD'}
Address         : ${invoice.supplierAddress || company?.address || 'Corporate Tower, Cyber City, Gurugram, Haryana'}
GSTIN / UIN     : ${invoice.supplierGstin}
State & Code    : Haryana (${invoice.supplierStateCode})
--------------------------------------------------------------------------------
INVOICE DETAILS:
Invoice Number  : ${invoice.invoiceNumber}
Invoice Date    : ${invoice.invoiceDate}
Due Date        : ${invoice.dueDate}
Billing Period  : ${invoice.billingPeriod}
Place of Supply : ${invoice.placeOfSupply}
Contract Number : ${invoice.contractNumber || 'HHR-CON-2026-001'}
Reverse Charge  : No
--------------------------------------------------------------------------------
BILL TO (RECIPIENT):
Client Name     : ${invoice.clientLegalName || invoice.clientName}
Billing Address : ${invoice.clientAddress}
Client GSTIN    : ${invoice.clientGstin}
Client State    : ${invoice.clientState} (${invoice.clientStateCode})
Site Deployed   : ${invoice.siteName || 'All Assigned Sites'}
================================================================================
LINE ITEMS BREAKDOWN:
--------------------------------------------------------------------------------
${invoice.items
  .map(
    (item, idx) =>
      `${idx + 1}. ${item.description}
   SAC: ${item.hsnSacCode} | Qty: ${item.deployedCount} | Rate: INR ${item.unitRate.toFixed(2)}
   Base: INR ${item.baseAmount.toFixed(2)} | OT/DD: INR ${(item.overtimeAmount + item.doubleDutyAmount).toFixed(2)}
   Item Taxable: INR ${item.taxableValue.toFixed(2)}`
  )
  .join('\n--------------------------------------------------------------------------------\n')}
================================================================================
SUB-TOTAL               : INR ${invoice.subTotal.toFixed(2)}
SERVICE CHARGE (${invoice.serviceChargePercent || 5}%)  : INR ${invoice.serviceChargeAmount.toFixed(2)}
TOTAL TAXABLE VALUE     : INR ${invoice.taxableAmount.toFixed(2)}
${
  invoice.isInterState
    ? `IGST (18%)              : INR ${invoice.igstAmount.toFixed(2)}`
    : `CGST (9%)               : INR ${invoice.cgstAmount.toFixed(2)}
SGST (9%)               : INR ${invoice.sgstAmount.toFixed(2)}`
}
TOTAL GST               : INR ${invoice.totalGst.toFixed(2)}
ROUND OFF               : INR ${invoice.roundOff.toFixed(2)}
GRAND TOTAL (INR)       : INR ${invoice.grandTotal.toFixed(2)}
AMOUNT IN WORDS         : ${invoice.amountInWords}
================================================================================
BANK REMITTANCE DETAILS (FOR RTGS / NEFT):
Beneficiary Name        : ${invoice.bankDetails?.beneficiaryName || company?.name}
Bank Name               : ${invoice.bankDetails?.bankName || 'HDFC Bank Ltd'}
Account Number          : ${invoice.bankDetails?.accountNumber || '50200084920194'}
IFSC Code               : ${invoice.bankDetails?.ifscCode || 'HDFC0001829'}
Branch                  : ${invoice.bankDetails?.branchName || 'Cyber City, Gurugram'}
UPI ID                  : ${invoice.bankDetails?.upiId || 'happiiz@hdfcbank'}
--------------------------------------------------------------------------------
TERMS AND CONDITIONS:
${invoice.termsAndConditions}
================================================================================
This is a digitally verified Tax Invoice generated via Happiiz HR SaaS Platform.
`;

    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tax_Invoice_${invoice.invoiceNumber.replace(/\//g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-fadeIn border border-slate-200">
        {/* Top Control Bar */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 flex items-center justify-center border border-blue-400/30">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold">GST Tax Invoice</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-700/50">
                  {invoice.invoiceNumber}
                </span>
                {invoice.isFinalized && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 rounded flex items-center space-x-1">
                    <Lock className="w-3 h-3" />
                    <span>Finalized</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {invoice.clientName} • Period: {invoice.billingPeriod}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
              title="Print A4 Tax Invoice"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4</span>
            </button>
            <button
              onClick={handleDownloadText}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
              title="Download Statement"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Tax Invoice Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/60">
          <div
            ref={printRef}
            className="bg-white p-6 sm:p-8 rounded-xl border border-slate-300 shadow-sm max-w-3xl mx-auto print:border-none print:shadow-none print:p-0 text-slate-900"
          >
            {/* Invoice Top Header */}
            <div className="border-b-2 border-slate-900 pb-5 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                      H
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {invoice.bankDetails?.beneficiaryName || company?.name || 'HAPPIIZ WORKFORCE SERVICES PVT LTD'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 max-w-md leading-relaxed">
                    {invoice.supplierAddress || 'Cyber City, Sector 25, Gurugram, Haryana - 122002'}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 mt-2 font-mono">
                    <span><strong>GSTIN:</strong> {invoice.supplierGstin}</span>
                    <span><strong>State:</strong> Haryana ({invoice.supplierStateCode})</span>
                    <span><strong>PAN:</strong> {company?.taxId || 'AAACH7281Q'}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="inline-block px-3 py-1 bg-slate-900 text-white rounded text-xs font-black uppercase tracking-wider mb-2">
                    TAX INVOICE
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p><span className="text-slate-500">Invoice No:</span> <strong className="font-mono text-slate-900">{invoice.invoiceNumber}</strong></p>
                    <p><span className="text-slate-500">Invoice Date:</span> <strong className="font-mono">{invoice.invoiceDate}</strong></p>
                    <p><span className="text-slate-500">Due Date:</span> <strong className="font-mono text-rose-700">{invoice.dueDate}</strong></p>
                    <p><span className="text-slate-500">Billing Period:</span> <strong className="font-mono">{invoice.billingPeriod}</strong></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To & Ship To Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Billed To (Client / Recipient)
                </span>
                <div className="font-bold text-sm text-slate-900">{invoice.clientLegalName || invoice.clientName}</div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{invoice.clientAddress}</p>
                <div className="mt-2 text-xs font-mono text-slate-700 space-y-0.5">
                  <p><strong>GSTIN:</strong> {invoice.clientGstin}</p>
                  <p><strong>State:</strong> {invoice.clientState} (Code: {invoice.clientStateCode})</p>
                  <p><strong>Place of Supply:</strong> {invoice.placeOfSupply}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Deployment Site & Contract Reference
                  </span>
                  <div className="font-bold text-sm text-slate-900">{invoice.siteName || 'All Assigned Posts'}</div>
                  <p className="text-xs text-slate-600 mt-1">Contract Ref: <strong>{invoice.contractNumber || 'HHR-CON-2026-001'}</strong></p>
                  <p className="text-xs text-slate-600">Payment Terms: <strong>{invoice.paymentTerms}</strong></p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 text-xs flex justify-between items-center">
                  <span className="text-slate-500">Reverse Charge (RCM):</span>
                  <span className="font-bold text-slate-800">NO</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-2.5 px-3 w-8">#</th>
                    <th className="py-2.5 px-3">Description of Services</th>
                    <th className="py-2.5 px-3">SAC</th>
                    <th className="py-2.5 px-3 text-center">Qty / Guards</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                    <th className="py-2.5 px-3 text-right">OT / Addl (₹)</th>
                    <th className="py-2.5 px-3 text-right">Taxable Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {invoice.items.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-bold text-slate-900">{it.designation}</div>
                        <div className="text-[11px] text-slate-500 leading-tight">{it.description}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{it.hsnSacCode}</td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <span className="font-bold text-slate-900">{it.deployedCount}</span> Staff
                        <div className="text-[10px] text-slate-500 font-mono">{it.billableDays} Days</div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-800">{formatINR(it.unitRate)}</td>
                      <td className="py-2.5 px-3 text-right text-blue-700">
                        {it.overtimeAmount + it.doubleDutyAmount > 0
                          ? `+${formatINR(it.overtimeAmount + it.doubleDutyAmount)}`
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatINR(it.taxableValue)}
                      </td>
                    </tr>
                  ))}

                  {/* Additional Services Lines */}
                  {invoice.additionalServices &&
                    invoice.additionalServices.map((as, idx) => (
                      <tr key={as.id || idx} className="bg-slate-50/50">
                        <td className="py-2.5 px-3 text-slate-500">{invoice.items.length + idx + 1}</td>
                        <td className="py-2.5 px-3 font-sans" colSpan={2}>
                          <div className="font-bold text-slate-900">{as.serviceName}</div>
                          <div className="text-[11px] text-slate-500">{as.description}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans">
                          {as.quantity} {as.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-800">{formatINR(as.unitPrice)}</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">—</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatINR(as.totalAmount)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & GST Summary Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Bank Details & Notes */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-[10px] uppercase font-bold text-blue-700 block mb-2">
                    Bank Remittance Details (RTGS / NEFT)
                  </span>
                  <div className="space-y-1 font-mono text-slate-800">
                    <p><strong>A/C Name:</strong> {invoice.bankDetails?.beneficiaryName || company?.name}</p>
                    <p><strong>Bank:</strong> {invoice.bankDetails?.bankName || 'HDFC Bank Ltd'}</p>
                    <p><strong>A/C No:</strong> <strong className="text-blue-900">{invoice.bankDetails?.accountNumber || '50200084920194'}</strong></p>
                    <p><strong>IFSC Code:</strong> {invoice.bankDetails?.ifscCode || 'HDFC0001829'}</p>
                    <p><strong>Branch:</strong> {invoice.bankDetails?.branchName || 'Cyber City, Gurugram'}</p>
                    {invoice.bankDetails?.upiId && <p><strong>UPI:</strong> {invoice.bankDetails.upiId}</p>}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1 leading-relaxed">
                  <p className="font-bold text-slate-700">Terms & Conditions:</p>
                  <p>{invoice.termsAndConditions}</p>
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-300 text-xs font-mono space-y-2">
                <div className="flex justify-between text-slate-700">
                  <span className="font-sans">Sub-Total Value:</span>
                  <span className="font-bold">{formatINR(invoice.subTotal)}</span>
                </div>

                {invoice.serviceChargeAmount > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span className="font-sans">Service Charge ({invoice.serviceChargePercent || 5}%):</span>
                    <span className="font-bold">{formatINR(invoice.serviceChargeAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-900 font-bold pt-1.5 border-t border-slate-200">
                  <span className="font-sans">Total Taxable Value:</span>
                  <span>{formatINR(invoice.taxableAmount)}</span>
                </div>

                {/* GST Lines */}
                {invoice.isInterState ? (
                  <div className="flex justify-between text-slate-700">
                    <span className="font-sans">IGST ({invoice.igstRate || 18}%):</span>
                    <span>{formatINR(invoice.igstAmount)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-700">
                      <span className="font-sans">CGST ({invoice.cgstRate || 9}%):</span>
                      <span>{formatINR(invoice.cgstAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span className="font-sans">SGST ({invoice.sgstRate || 9}%):</span>
                      <span>{formatINR(invoice.sgstAmount)}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between text-slate-700">
                  <span className="font-sans">Total GST Tax:</span>
                  <span className="font-bold">{formatINR(invoice.totalGst)}</span>
                </div>

                {invoice.roundOff !== 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span className="font-sans">Round Off:</span>
                    <span>{invoice.roundOff > 0 ? `+${invoice.roundOff}` : invoice.roundOff}</span>
                  </div>
                )}

                {/* Grand Total Highlight */}
                <div className="p-3 bg-slate-900 text-white rounded-xl flex justify-between items-center text-sm font-bold mt-3">
                  <span className="font-sans uppercase tracking-wider text-xs">Total Amount Due:</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    {formatINR(invoice.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Amount In Words Highlight Box */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl mb-8">
              <span className="text-[10px] uppercase font-bold text-blue-900 block">Total Amount in Words:</span>
              <p className="text-xs font-bold text-blue-950 italic mt-0.5">
                {invoice.amountInWords || numberToIndianWords(invoice.grandTotal)}
              </p>
            </div>

            {/* Signature Block */}
            <div className="pt-6 border-t border-slate-200 text-slate-500 text-xs flex justify-between items-end">
              <div>
                <p className="font-semibold text-slate-700">Declaration:</p>
                <p className="text-[11px] text-slate-500 max-w-sm">
                  We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-700 mb-8">
                  For {invoice.bankDetails?.beneficiaryName || company?.name}
                </p>
                <div className="h-0.5 w-36 border-b border-dashed border-slate-300 ml-auto mb-1" />
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Authorized Signatory</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
