/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  RateCardItem,
  Client,
  ClientSite,
  BillingRateType,
} from '../../types';
import {
  saveRateCard,
  formatINR,
  round2,
} from '../../services/billingService';
import {
  X,
  Plus,
  Edit3,
  TrendingUp,
  ShieldCheck,
  Search,
  Filter,
  DollarSign,
  Briefcase,
  CheckCircle,
} from 'lucide-react';

interface RateCardManagementModalProps {
  companyId: string;
  tenantId: string;
  rateCards: RateCardItem[];
  clients: Client[];
  sites: ClientSite[];
  onClose: () => void;
  onRefresh: () => void;
}

export const RateCardManagementModal: React.FC<RateCardManagementModalProps> = ({
  companyId,
  tenantId,
  rateCards,
  clients,
  sites,
  onClose,
  onRefresh,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState('all');
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [siteId, setSiteId] = useState(sites[0]?.id || '');
  const [serviceCategory, setServiceCategory] = useState<'security' | 'housekeeping' | 'manpower'>('security');
  const [designation, setDesignation] = useState('Security Guard (Unarmed)');
  const [rateType, setRateType] = useState<BillingRateType>('per_month');
  const [clientBillingRate, setClientBillingRate] = useState<number>(24500);
  const [otHourlyRate, setOtHourlyRate] = useState<number>(185);
  const [doubleDutyRate, setDoubleDutyRate] = useState<number>(950);
  const [hsnSacCode, setHsnSacCode] = useState('998525');

  const filteredCards = rateCards.filter((rc) => {
    const matchesSearch =
      rc.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rc.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = selectedClientFilter === 'all' || rc.clientId === selectedClientFilter;
    return matchesSearch && matchesClient;
  });

  const handleSaveRateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const cl = clients.find((c) => c.id === clientId) || clients[0];
    const st = sites.find((s) => s.id === siteId);

    setIsSaving(true);
    try {
      const newCard: RateCardItem = {
        id: `rc_${companyId}_${Date.now()}`,
        tenantId,
        companyId,
        clientId: cl?.id || 'client_01',
        clientName: cl?.clientName || 'Client Corporate',
        siteId: st?.id,
        siteName: st?.siteName || 'All Sites',
        serviceCategory,
        designation,
        rateType,
        clientBillingRate: round2(clientBillingRate),
        overtimeHourlyRate: round2(otHourlyRate),
        doubleDutyShiftRate: round2(doubleDutyRate),
        hsnSacCode,
        taxRatePercent: 18.0,
        effectiveFrom: new Date().toISOString().split('T')[0],
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      await saveRateCard(companyId, newCard);
      setShowAddForm(false);
      onRefresh();
    } catch {
      alert('Failed to save rate card.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-950 text-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold">Client Service Rate Cards</h2>
              <p className="text-xs text-slate-400">
                Independent client billing rates, overtime hourly rates and SAC codes
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter and Top Action Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex flex-1 items-center space-x-3 w-full sm:w-auto">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search designation or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <select
              value={selectedClientFilter}
              onChange={(e) => setSelectedClientFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-white text-slate-700"
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
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm w-full sm:w-auto justify-center"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Close Form' : 'New Rate Card'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add Rate Card Form Drawer */}
          {showAddForm && (
            <form onSubmit={handleSaveRateCard} className="bg-blue-50/50 p-5 rounded-2xl border border-blue-200 space-y-4 animate-fadeIn">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center space-x-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Configure New Billing Rate Card</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Client</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-blue-500/20"
                    required
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.clientName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Site (Optional)</label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">All Sites of Client</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.siteName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Service Category</label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setServiceCategory(val);
                      if (val === 'security') setHsnSacCode('998525');
                      else if (val === 'housekeeping') setHsnSacCode('998513');
                      else setHsnSacCode('998519');
                    }}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="security">Security Services (SAC 998525)</option>
                    <option value="housekeeping">Housekeeping Services (SAC 998513)</option>
                    <option value="manpower">Manpower Supply (SAC 998519)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Armed Security Guard, Lady Guard, Sweeper"
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rate Billing Type</label>
                  <select
                    value={rateType}
                    onChange={(e) => setRateType(e.target.value as any)}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5"
                  >
                    <option value="per_month">Per Employee Per Month</option>
                    <option value="per_day">Per Employee Per Day</option>
                    <option value="per_shift">Per Shift Rate</option>
                    <option value="per_hour">Per Hour Rate</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Client Billing Rate (₹)</label>
                  <input
                    type="number"
                    value={clientBillingRate}
                    onChange={(e) => setClientBillingRate(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Overtime Billing Rate (₹/hr)</label>
                  <input
                    type="number"
                    value={otHourlyRate}
                    onChange={(e) => setOtHourlyRate(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Double Duty Shift Rate (₹/shift)</label>
                  <input
                    type="number"
                    value={doubleDutyRate}
                    onChange={(e) => setDoubleDutyRate(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">HSN / SAC Code</label>
                  <input
                    type="text"
                    value={hsnSacCode}
                    onChange={(e) => setHsnSacCode(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Rate Card'}
                </button>
              </div>
            </form>
          )}

          {/* Rate Cards Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-2.5 px-3">Client / Site</th>
                  <th className="py-2.5 px-3">Designation & SAC</th>
                  <th className="py-2.5 px-3">Billing Model</th>
                  <th className="py-2.5 px-3 font-mono">Client Rate</th>
                  <th className="py-2.5 px-3 font-mono">OT Rate (1h)</th>
                  <th className="py-2.5 px-3 font-mono">Double Duty</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredCards.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                      No rate cards match your search.
                    </td>
                  </tr>
                ) : (
                  filteredCards.map((rc) => (
                    <tr key={rc.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-bold text-slate-900">{rc.clientName}</div>
                        <div className="text-[10px] text-slate-500">{rc.siteName || 'All Sites'}</div>
                      </td>

                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-semibold text-slate-800">{rc.designation}</div>
                        <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-bold">
                          SAC: {rc.hsnSacCode}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-sans capitalize text-slate-600">
                        {rc.rateType.replace('_', ' ')}
                      </td>

                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {formatINR(rc.clientBillingRate)}
                      </td>

                      <td className="py-2.5 px-3 text-slate-700">₹{rc.overtimeHourlyRate}/hr</td>

                      <td className="py-2.5 px-3 text-slate-700">₹{rc.doubleDutyShiftRate}/shift</td>

                      <td className="py-2.5 px-3 font-sans">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {rc.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
