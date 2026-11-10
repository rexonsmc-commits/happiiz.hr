/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ClientInvoice,
  Client,
  ClientSite,
  ClientContract,
  Company,
} from '../../types';
import { formatINR } from '../../services/billingService';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Play,
  ArrowRight,
  ShieldCheck,
  Percent,
} from 'lucide-react';

interface ClientBillingDashboardProps {
  company: Company | null;
  invoices: ClientInvoice[];
  clients: Client[];
  sites: ClientSite[];
  contracts: ClientContract[];
  onNavigateTab: (tab: string) => void;
  onOpenViewInvoice: (invoice: ClientInvoice) => void;
}

export const ClientBillingDashboard: React.FC<ClientBillingDashboardProps> = ({
  company,
  invoices,
  clients,
  sites,
  contracts,
  onNavigateTab,
  onOpenViewInvoice,
}) => {
  const nonCancelled = invoices.filter((i) => i.status !== 'cancelled');
  const totalBilled = nonCancelled.reduce((s, i) => s + i.grandTotal, 0);
  const totalPaid = nonCancelled.reduce((s, i) => s + i.paidAmount, 0);
  const totalOutstanding = nonCancelled.reduce((s, i) => s + i.outstandingAmount, 0);
  const totalGst = nonCancelled.reduce((s, i) => s + i.totalGst, 0);
  const totalServiceCharges = nonCancelled.reduce((s, i) => s + i.serviceChargeAmount, 0);

  const activeContractsCount = contracts.filter((c) => c.status === 'Active' || c.status === 'Renewed').length;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Hero */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold backdrop-blur-md mb-3 border border-blue-400/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Phase 8: Complete Client Billing & GST Management</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
              {company?.name || 'Happiiz HR Services'} – Invoicing & Billing ERP
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Automated client invoices synced with Phase 6 attendance roster, client rate cards, SAC 998525/998513 GST billing, UTR payment receipts, client ledgers and profitability analysis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => onNavigateTab('generate')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all shadow-md shadow-blue-600/30 w-full sm:w-auto justify-center"
            >
              <Play className="w-4 h-4" />
              <span>Generate Invoices</span>
            </button>

            <button
              onClick={() => onNavigateTab('payments')}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all backdrop-blur-md border border-white/10 w-full sm:w-auto justify-center"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Invoiced Billing
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatINR(totalBilled)}
          </div>
          <p className="text-xs text-slate-500 mt-1">{invoices.length} invoices generated</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Total Payments Received
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-2 font-mono">
            {formatINR(totalPaid)}
          </div>
          <p className="text-xs text-emerald-700 mt-1 font-medium">Reconciled bank collections</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Outstanding Accounts Receivable
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-950 mt-2 font-mono">
            {formatINR(totalOutstanding)}
          </div>
          <p className="text-xs text-amber-700 mt-1 font-medium">Pending client clearance</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
              Output GST Collected
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-950 mt-2 font-mono">
            {formatINR(totalGst)}
          </div>
          <p className="text-xs text-purple-700 mt-1 font-medium">CGST + SGST + IGST liability</p>
        </div>
      </div>

      {/* Two Column Section: Quick Actions & Client Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Revenue Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Client Revenue Allocation</h3>
              <p className="text-xs text-slate-500">Gross billing share across client organizations</p>
            </div>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>Full Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4 pt-2">
            {clients.map((c) => {
              const clientInvs = nonCancelled.filter((i) => i.clientId === c.id);
              const clientTotal = clientInvs.reduce((s, i) => s + i.grandTotal, 0);
              const pct = totalBilled > 0 ? Math.round((clientTotal / totalBilled) * 100) : 0;

              return (
                <div key={c.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800">{c.clientName}</span>
                    <span className="font-mono text-slate-900">
                      {formatINR(clientTotal)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Module Navigation Links */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Billing Modules
          </h3>

          <div className="space-y-2">
            <button
              onClick={() => onNavigateTab('invoices')}
              className="w-full p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 text-left transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 block">Invoice Master Register</span>
                <span className="text-[11px] text-slate-400">{invoices.length} invoices in registry</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </button>

            <button
              onClick={() => onNavigateTab('contracts')}
              className="w-full p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 text-left transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 block">Contracts & Rate Cards</span>
                <span className="text-[11px] text-slate-400">{contracts.length} agreements active</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </button>

            <button
              onClick={() => onNavigateTab('ledger')}
              className="w-full p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/50 text-left transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 block">Client Account Ledgers</span>
                <span className="text-[11px] text-slate-400">Debit / credit transaction trail</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
            </button>

            <button
              onClick={() => onNavigateTab('profitability')}
              className="w-full p-3 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 text-left transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 block">Profitability Analysis</span>
                <span className="text-[11px] text-slate-400">Client Revenue vs Workforce Cost</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Generated Tax Invoices</h3>
            <p className="text-xs text-slate-500">Latest billing cycles and payment progress</p>
          </div>

          <button
            onClick={() => onNavigateTab('invoices')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            View All Invoices →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4 font-mono text-right">Taxable</th>
                <th className="py-3 px-4 font-mono text-right">Grand Total</th>
                <th className="py-3 px-4 font-mono text-right">Outstanding</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {invoices.slice(0, 5).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-blue-700">{inv.invoiceNumber}</td>
                  <td className="py-3 px-4 font-sans font-semibold text-slate-900">{inv.clientName}</td>
                  <td className="py-3 px-4 text-slate-700">{inv.billingPeriod}</td>
                  <td className="py-3 px-4 text-right text-slate-700">{formatINR(inv.taxableAmount)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(inv.grandTotal)}</td>
                  <td className="py-3 px-4 text-right font-bold text-amber-700">
                    {formatINR(inv.outstandingAmount)}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-800">
                      {inv.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    <button
                      onClick={() => onOpenViewInvoice(inv)}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                    >
                      View Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
