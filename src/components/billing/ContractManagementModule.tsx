/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ClientContract,
  Client,
  ClientSite,
} from '../../types';
import {
  formatINR,
  round2,
} from '../../services/billingService';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle,
  Building2,
  Clock,
  Download,
  DollarSign,
  TrendingUp,
  X,
} from 'lucide-react';

interface ContractManagementModuleProps {
  companyId: string;
  tenantId: string;
  contracts: ClientContract[];
  clients: Client[];
  sites: ClientSite[];
  onOpenRateCards: () => void;
  onRefresh: () => void;
}

export const ContractManagementModule: React.FC<ContractManagementModuleProps> = ({
  companyId,
  tenantId,
  contracts,
  clients,
  sites,
  onOpenRateCards,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New Contract states
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [contractTitle, setContractTitle] = useState('Annual Security & Facility Agreement');
  const [contractType, setContractType] = useState<'Security Services' | 'Housekeeping & Facility' | 'Manpower Supply'>('Security Services');
  const [startDate, setStartDate] = useState('2026-04-01');
  const [endDate, setEndDate] = useState('2027-03-31');
  const [contractValue, setContractValue] = useState<number>(2940000);
  const [billingFrequency, setBillingFrequency] = useState<'Monthly' | 'Quarterly' | 'Per Shift'>('Monthly');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days from invoice submission');

  const filteredContracts = contracts.filter((c) => {
    return (
      c.contractTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPortfolioValue = contracts.reduce((s, c) => s + (c.contractValue || 0), 0);
  const activeContractsCount = contracts.filter((c) => c.status === 'Active' || c.status === 'Renewed').length;

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    const cl = clients.find((c) => c.id === clientId) || clients[0];
    setIsSaving(true);
    try {
      const year = new Date().getFullYear();
      const seq = (contracts.length + 1).toString().padStart(3, '0');
      const newContract: ClientContract = {
        id: `con_${companyId}_${Date.now()}`,
        contractNumber: `HHR-CON-${year}-${seq}`,
        tenantId,
        companyId,
        clientId: cl?.id || 'client_01',
        clientName: cl?.clientName || 'Corporate Client',
        contractTitle,
        contractType,
        startDate,
        endDate,
        contractValue: round2(contractValue),
        billingFrequency,
        paymentTerms,
        status: 'Active',
        gstApplicability: true,
        gstRatePercent: 18.0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      contracts.unshift(newContract);
      setShowNewModal(false);
      onRefresh();
    } catch {
      alert('Failed to save contract.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Client Contracts
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {activeContractsCount} <span className="text-sm font-normal text-slate-500">Agreements</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Under formal legal coverage</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Annual Contract Portfolio
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-2 font-mono">
            {formatINR(totalPortfolioValue)}
          </div>
          <p className="text-xs text-emerald-700 mt-1 font-medium">Cumulative contractual value</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
              Configured Rate Cards
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-950 mt-2">
            Multi-Tier <span className="text-sm font-normal text-slate-500">Cards</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Per-shift & per-guard models</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Renewal Monitoring
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-950 mt-2">
            100% <span className="text-sm font-normal text-slate-500">Active</span>
          </div>
          <p className="text-xs text-amber-700 mt-1 font-medium">Auto expiry reminders active</p>
        </div>
      </div>

      {/* Action Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search contract number, client, title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={onOpenRateCards}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-colors shadow-sm"
          >
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Manage Rate Cards</span>
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center space-x-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Client Contract</span>
          </button>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Contract #</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Agreement Title</th>
                <th className="py-3 px-4 font-mono">Contract Value (₹)</th>
                <th className="py-3 px-4">Billing Frequency</th>
                <th className="py-3 px-4">Validity Period</th>
                <th className="py-3 px-4">Payment Terms</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                    No client contracts found. Click "New Client Contract" above.
                  </td>
                </tr>
              ) : (
                filteredContracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-blue-700">{c.contractNumber}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">{c.clientName}</td>
                    <td className="py-3 px-4 font-sans text-slate-800">{c.contractTitle}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatINR(c.contractValue || 0)}</td>
                    <td className="py-3 px-4 font-sans capitalize text-slate-700">{c.billingFrequency}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {c.startDate} to {c.endDate}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-600 truncate max-w-[150px]">
                      {c.paymentTerms}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Contract Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-fadeIn">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Create Client Contract Agreement</span>
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="space-y-4 mt-6">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Client</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.clientName} ({c.gstNumber || 'No GSTIN'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Contract Title</label>
                <input
                  type="text"
                  value={contractTitle}
                  onChange={(e) => setContractTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Service Category</label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Security Services">Security Guard Services</option>
                    <option value="Housekeeping & Facility">Housekeeping & Facility</option>
                    <option value="Manpower Supply">Manpower Supply</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Annual Value (₹)</label>
                  <input
                    type="number"
                    value={contractValue}
                    onChange={(e) => setContractValue(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Payment Terms</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Register Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
