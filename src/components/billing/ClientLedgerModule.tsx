/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ClientLedgerEntry,
  Client,
} from '../../types';
import {
  formatINR,
  generateClientLedgerCSV,
} from '../../services/billingService';
import {
  FileText,
  Download,
  Printer,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
  Calendar,
} from 'lucide-react';

interface ClientLedgerModuleProps {
  clients: Client[];
  ledgerEntries: ClientLedgerEntry[];
}

export const ClientLedgerModule: React.FC<ClientLedgerModuleProps> = ({
  clients,
  ledgerEntries,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || 'all');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const filteredEntries = ledgerEntries.filter((e) => {
    const matchesClient = selectedClientId === 'all' || e.clientId === selectedClientId;
    const matchesSearch =
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClient && matchesSearch;
  });

  const totalDebits = filteredEntries.reduce((s, e) => s + e.debitAmount, 0);
  const totalCredits = filteredEntries.reduce((s, e) => s + e.creditAmount, 0);
  const netReceivable = totalDebits - totalCredits;

  const handleExportCSV = () => {
    if (filteredEntries.length === 0) return;
    const csv = generateClientLedgerCSV(
      filteredEntries,
      selectedClient?.clientName || 'All Clients'
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Statement_of_Account_${(selectedClient?.clientName || 'All').replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex flex-1 items-center space-x-3 w-full sm:w-auto">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-bold focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Consolidated (All Clients)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.clientName}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ref #, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Statement</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Invoiced (Debits)
          </span>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatINR(totalDebits)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Invoices & Debit notes issued</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Total Payments Received (Credits)
          </span>
          <div className="text-2xl font-black text-emerald-950 mt-2 font-mono">
            {formatINR(totalCredits)}
          </div>
          <p className="text-xs text-emerald-700 mt-1 font-medium">Bank remittances & Credit notes</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-700 text-white p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-100">
            Current Outstanding Balance
          </span>
          <div className="text-2xl font-black mt-2 font-mono">
            {formatINR(netReceivable)}
          </div>
          <p className="text-xs text-amber-100 mt-1">Net pending receivable</p>
        </div>
      </div>

      {/* Statement Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Account Transaction Ledger – {selectedClient?.clientName || 'Consolidated Statement'}
            </h3>
            <p className="text-xs text-slate-500">
              Chronological ledger of invoices, receipts, debit notes and credit notes
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
            {filteredEntries.length} Transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Reference #</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Debit (₹) [Bill]</th>
                <th className="py-3 px-4 text-right">Credit (₹) [Paid]</th>
                <th className="py-3 px-4 text-right">Running Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                    No ledger entries found for this client.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-600">{e.transactionDate}</td>

                    <td className="py-3 px-4 font-sans">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          e.entryType === 'INVOICE'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : e.entryType === 'PAYMENT'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : e.entryType === 'DEBIT_NOTE'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {e.entryType.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900">{e.referenceNumber}</td>

                    <td className="py-3 px-4 font-sans text-slate-700 max-w-sm truncate">
                      {e.description}
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      {e.debitAmount > 0 ? formatINR(e.debitAmount) : '—'}
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-emerald-700">
                      {e.creditAmount > 0 ? formatINR(e.creditAmount) : '—'}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatINR(e.runningBalance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
