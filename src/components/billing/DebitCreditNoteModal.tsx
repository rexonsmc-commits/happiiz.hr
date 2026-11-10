/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ClientInvoice,
  DebitNoteItem,
  CreditNoteItem,
} from '../../types';
import {
  createDebitNote,
  createCreditNote,
  round2,
  formatINR,
} from '../../services/billingService';
import {
  X,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface DebitCreditNoteModalProps {
  invoice: ClientInvoice;
  companyId: string;
  tenantId: string;
  currentUser: { name: string; role?: string };
  onClose: () => void;
  onSuccess: () => void;
}

export const DebitCreditNoteModal: React.FC<DebitCreditNoteModalProps> = ({
  invoice,
  companyId,
  tenantId,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const [noteType, setNoteType] = useState<'DEBIT_NOTE' | 'CREDIT_NOTE'>('CREDIT_NOTE');
  const [taxableAmount, setTaxableAmount] = useState<number>(5000);
  const [reason, setReason] = useState<string>('Contractual volume discount / SLA rebate');
  const [documentDate, setDocumentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isSaving, setIsSaving] = useState(false);

  const gstRate = 18.0;
  const gstAmount = round2(taxableAmount * (gstRate / 100));
  const totalAmount = round2(taxableAmount + gstAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (taxableAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    setIsSaving(true);
    try {
      const year = new Date().getFullYear();
      const seq = Date.now().toString().slice(-4);

      if (noteType === 'DEBIT_NOTE') {
        const note: DebitNoteItem = {
          id: `dn_${companyId}_${Date.now()}`,
          documentNumber: `DN/${year}-${(year + 1).toString().slice(-2)}/${seq}`,
          tenantId,
          companyId,
          clientId: invoice.clientId,
          clientName: invoice.clientName,
          originalInvoiceId: invoice.id,
          originalInvoiceNumber: invoice.invoiceNumber,
          documentDate,
          reason,
          taxableAmount: round2(taxableAmount),
          gstAmount,
          totalAmount,
          status: 'approved',
          approvedBy: currentUser.name,
          approvedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        await createDebitNote(companyId, tenantId, note);
      } else {
        const note: CreditNoteItem = {
          id: `cn_${companyId}_${Date.now()}`,
          documentNumber: `CN/${year}-${(year + 1).toString().slice(-2)}/${seq}`,
          tenantId,
          companyId,
          clientId: invoice.clientId,
          clientName: invoice.clientName,
          originalInvoiceId: invoice.id,
          originalInvoiceNumber: invoice.invoiceNumber,
          documentDate,
          reason,
          taxableAmount: round2(taxableAmount),
          gstAmount,
          totalAmount,
          status: 'approved',
          approvedBy: currentUser.name,
          approvedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        await createCreditNote(companyId, tenantId, note);
      }

      onSuccess();
      onClose();
    } catch (err) {
      alert('Failed to issue note.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-fadeIn">
        <div className="flex justify-between items-center pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Issue Debit / Credit Note</span>
            </h3>
            <p className="text-xs text-slate-500">
              Linked to Invoice: <strong className="font-mono text-slate-800">{invoice.invoiceNumber}</strong>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* Note Type Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Select Note Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setNoteType('CREDIT_NOTE');
                  setReason('Contractual volume discount / SLA rebate');
                }}
                className={`p-3 rounded-xl border text-left flex items-start space-x-2.5 transition-all ${
                  noteType === 'CREDIT_NOTE'
                    ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <TrendingDown className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs block">Credit Note</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Reduces client receivable (Discounts / Rebate)
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNoteType('DEBIT_NOTE');
                  setReason('Additional unbilled emergency duty shifts');
                }}
                className={`p-3 rounded-xl border text-left flex items-start space-x-2.5 transition-all ${
                  noteType === 'DEBIT_NOTE'
                    ? 'border-blue-500 bg-blue-50/60 text-blue-950 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs block">Debit Note</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Increases client receivable (Extra duties)
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Document Date</label>
            <input
              type="date"
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Taxable Value Before GST (₹)
            </label>
            <input
              type="number"
              min="100"
              step="50"
              value={taxableAmount}
              onChange={(e) => setTaxableAmount(parseFloat(e.target.value) || 0)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          {/* Tax Calculation Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 font-mono">
            <div className="flex justify-between text-slate-600">
              <span className="font-sans">Taxable Value:</span>
              <span>{formatINR(taxableAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="font-sans">GST (18%):</span>
              <span>{formatINR(gstAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
              <span className="font-sans">Total Note Amount:</span>
              <span className="text-blue-900">{formatINR(totalAmount)}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Reason for Adjustment
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Contractual 2% discount, or Unbilled holiday security surcharge..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || taxableAmount <= 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              {isSaving ? 'Issuing...' : `Issue ${noteType === 'CREDIT_NOTE' ? 'Credit Note' : 'Debit Note'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
