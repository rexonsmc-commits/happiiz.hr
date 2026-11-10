/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ClientInvoice,
  Client,
  Company,
  InvoiceStatus,
} from '../../types';
import {
  formatINR,
  finalizeClientInvoice,
  saveClientInvoice,
  generateInvoiceRegisterCSV,
} from '../../services/billingService';
import { TaxInvoiceModal } from './TaxInvoiceModal';
import { DebitCreditNoteModal } from './DebitCreditNoteModal';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  Lock,
  DollarSign,
  Download,
  AlertCircle,
  CreditCard,
  Building2,
  FileText,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';

interface InvoiceListModuleProps {
  companyId: string;
  tenantId: string;
  company: Company | null;
  invoices: ClientInvoice[];
  clients: Client[];
  currentUser: { name: string; role?: string };
  onRefresh: () => void;
  onRecordPaymentClick: (invoice: ClientInvoice) => void;
}

export const InvoiceListModule: React.FC<InvoiceListModuleProps> = ({
  companyId,
  tenantId,
  company,
  invoices,
  clients,
  currentUser,
  onRefresh,
  onRecordPaymentClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<ClientInvoice | null>(null);
  const [selectedInvoiceForNote, setSelectedInvoiceForNote] = useState<ClientInvoice | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.siteName && inv.siteName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchesClient = clientFilter === 'all' || inv.clientId === clientFilter;
    return matchesSearch && matchesStatus && matchesClient;
  });

  const handleApprove = async (inv: ClientInvoice) => {
    try {
      const updated: ClientInvoice = {
        ...inv,
        status: 'approved',
        approvedBy: currentUser.name,
        approvedAt: new Date().toISOString(),
      };
      await saveClientInvoice(companyId, updated);
      setNotification(`Invoice ${inv.invoiceNumber} approved.`);
      setTimeout(() => setNotification(null), 3500);
      onRefresh();
    } catch {
      alert('Failed to approve invoice.');
    }
  };

  const handleFinalize = async (inv: ClientInvoice) => {
    if (
      !confirm(
        `Finalize and lock invoice ${inv.invoiceNumber}? Once finalized, invoice lines are legally immutable and will be posted to the Client Account Ledger.`
      )
    )
      return;

    try {
      await finalizeClientInvoice(companyId, tenantId, inv.id, currentUser);
      setNotification(`Invoice ${inv.invoiceNumber} finalized and posted to Client Ledger.`);
      setTimeout(() => setNotification(null), 3500);
      onRefresh();
    } catch {
      alert('Failed to finalize invoice.');
    }
  };

  const handleCancelInvoice = async (inv: ClientInvoice) => {
    const reason = prompt('Please enter mandatory reason for invoice cancellation:');
    if (!reason) return;

    try {
      const updated: ClientInvoice = {
        ...inv,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelReason: reason,
      };
      await saveClientInvoice(companyId, updated);
      setNotification(`Invoice ${inv.invoiceNumber} marked as cancelled.`);
      setTimeout(() => setNotification(null), 3500);
      onRefresh();
    } catch {
      alert('Failed to cancel invoice.');
    }
  };

  const handleDownloadRegisterCSV = () => {
    if (invoices.length === 0) return;
    const csv = generateInvoiceRegisterCSV(invoices);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_Register_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">Draft</span>;
      case 'approved':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200">Approved</span>;
      case 'finalized':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-50 text-purple-800 border border-purple-200 flex items-center space-x-1"><Lock className="w-3 h-3" /><span>Finalized</span></span>;
      case 'partially_paid':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">Partially Paid</span>;
      case 'paid':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">✓ Paid</span>;
      case 'overdue':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-800 border border-rose-200">Overdue</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-400 line-through">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">{status}</span>;
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

      {/* Filter and Actions Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoice #, client, site..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="all">All Invoices Status</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="finalized">Finalized</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid & Cleared</option>
            <option value="overdue">Overdue</option>
          </select>

          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="all">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.clientName}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleDownloadRegisterCSV}
          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors shadow-sm w-full lg:w-auto justify-center"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Invoice Register CSV</span>
        </button>
      </div>

      {/* Invoices Master Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Invoice Number</th>
                <th className="py-3 px-4">Client & Site</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Date / Due</th>
                <th className="py-3 px-4 font-mono text-right">Taxable Value</th>
                <th className="py-3 px-4 font-mono text-right">GST (18%)</th>
                <th className="py-3 px-4 font-mono text-right">Grand Total</th>
                <th className="py-3 px-4 font-mono text-right">Outstanding</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-sans">
                    No client invoices found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-blue-700">{inv.invoiceNumber}</td>

                    <td className="py-3 px-4 font-sans">
                      <div className="font-bold text-slate-900">{inv.clientName}</div>
                      <div className="text-[10px] text-slate-500">{inv.siteName || 'All Posts'}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-700">{inv.billingPeriod}</td>

                    <td className="py-3 px-4 text-slate-600">
                      <div>{inv.invoiceDate}</div>
                      <div className="text-[10px] text-slate-400">Due: {inv.dueDate}</div>
                    </td>

                    <td className="py-3 px-4 text-right text-slate-800">{formatINR(inv.taxableAmount)}</td>

                    <td className="py-3 px-4 text-right text-purple-700">{formatINR(inv.totalGst)}</td>

                    <td className="py-3 px-4 text-right font-bold text-slate-900 text-sm">
                      {formatINR(inv.grandTotal)}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-amber-700">
                      {formatINR(inv.outstandingAmount)}
                    </td>

                    <td className="py-3 px-4 font-sans">{getStatusBadge(inv.status)}</td>

                    <td className="py-3 px-4 text-right font-sans">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedInvoiceForView(inv)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                          title="View & Print Tax Invoice"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>

                        {inv.status === 'draft' && (
                          <button
                            onClick={() => handleApprove(inv)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold"
                            title="Approve Invoice"
                          >
                            Approve
                          </button>
                        )}

                        {inv.status === 'approved' && !inv.isFinalized && (
                          <button
                            onClick={() => handleFinalize(inv)}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold flex items-center space-x-1"
                            title="Finalize & Lock Invoice"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Lock</span>
                          </button>
                        )}

                        {inv.isFinalized && inv.outstandingAmount > 0 && (
                          <button
                            onClick={() => onRecordPaymentClick(inv)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                            title="Record Payment"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Pay</span>
                          </button>
                        )}

                        {inv.isFinalized && (
                          <button
                            onClick={() => setSelectedInvoiceForNote(inv)}
                            className="p-1 text-slate-400 hover:text-slate-800 rounded"
                            title="Issue Debit / Credit Note"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {inv.status !== 'cancelled' && !inv.isFinalized && (
                          <button
                            onClick={() => handleCancelInvoice(inv)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Cancel Invoice"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Invoice Modal */}
      {selectedInvoiceForView && (
        <TaxInvoiceModal
          invoice={selectedInvoiceForView}
          company={company}
          onClose={() => setSelectedInvoiceForView(null)}
        />
      )}

      {/* Debit / Credit Note Modal */}
      {selectedInvoiceForNote && (
        <DebitCreditNoteModal
          invoice={selectedInvoiceForNote}
          companyId={companyId}
          tenantId={tenantId}
          currentUser={currentUser}
          onClose={() => setSelectedInvoiceForNote(null)}
          onSuccess={() => {
            setNotification('Debit / Credit Note issued and posted to Client Ledger.');
            setTimeout(() => setNotification(null), 3500);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
