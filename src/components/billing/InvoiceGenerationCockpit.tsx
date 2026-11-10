/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Client,
  ClientSite,
  ClientInvoice,
  Company,
  RateCardItem,
  AdditionalServiceItem,
} from '../../types';
import {
  generateAutomaticInvoiceDraft,
  formatINR,
  round2,
} from '../../services/billingService';
import {
  Play,
  CheckCircle,
  FileText,
  DollarSign,
  Building2,
  Calendar,
  Layers,
  MapPin,
  Clock,
  ShieldCheck,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

interface InvoiceGenerationCockpitProps {
  companyId: string;
  tenantId: string;
  company: Company | null;
  clients: Client[];
  sites: ClientSite[];
  rateCards: RateCardItem[];
  additionalServices: AdditionalServiceItem[];
  currentUser: { name: string; role?: string };
  onInvoiceGenerated: (newInvoice: ClientInvoice) => void;
}

export const InvoiceGenerationCockpit: React.FC<InvoiceGenerationCockpitProps> = ({
  companyId,
  tenantId,
  company,
  clients,
  sites,
  rateCards,
  additionalServices,
  currentUser,
  onInvoiceGenerated,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [billingPeriod, setBillingPeriod] = useState<string>('2026-11');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewCalculated, setPreviewCalculated] = useState<boolean>(true);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];
  const matchingSites = sites.filter((s) => s.clientId === selectedClientId);

  const matchingRateCards = rateCards.filter(
    (rc) => rc.clientId === selectedClientId && rc.status === 'active'
  );

  const matchingServices = additionalServices.filter(
    (as) => as.clientId === selectedClientId && as.status === 'active'
  );

  // Simulated estimate for preview
  const estimatedGuardCount = 4;
  const estimatedSupervisorCount = 1;
  const guardRate = matchingRateCards.find((r) => r.designation.includes('Guard'))?.clientBillingRate || 24500;
  const supervisorRate = matchingRateCards.find((r) => r.designation.includes('Supervisor'))?.clientBillingRate || 31000;
  const estBase = estimatedGuardCount * guardRate + estimatedSupervisorCount * supervisorRate;
  const estOt = 24 * 185 + 10 * 230;
  const estDoubleDuty = 2 * 950;
  const estAddl = matchingServices.reduce((s, as) => s + as.totalAmount, 0);
  const estSubTotal = estBase + estOt + estDoubleDuty + estAddl;
  const estServiceCharge = round2(estSubTotal * 0.05);
  const estTaxable = estSubTotal + estServiceCharge;
  const estGst = round2(estTaxable * 0.18);
  const estGrandTotal = Math.round(estTaxable + estGst);

  const handleRunGeneration = async () => {
    if (!selectedClient) return;
    setIsGenerating(true);
    try {
      const invoice = await generateAutomaticInvoiceDraft(
        companyId,
        tenantId,
        selectedClient.id,
        billingPeriod,
        clients,
        sites,
        company,
        selectedSiteId || undefined
      );

      onInvoiceGenerated(invoice);
    } catch (err) {
      alert('Failed to generate invoice.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold backdrop-blur-md mb-2 border border-blue-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 8: Automatic Attendance-to-Invoice Engine</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Client Billing & Invoicing Cockpit
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Pulls verified Phase 6 duty shifts, applies contractual client rate cards, adds approved overtime and double duties, computes service charges and generates GST compliant tax invoices.
            </p>
          </div>

          <button
            onClick={handleRunGeneration}
            disabled={isGenerating || !selectedClient}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center space-x-2 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <Play className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generating Invoice...' : 'Generate Tax Invoice Now'}</span>
          </button>
        </div>
      </div>

      {/* Configuration Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Client Selection */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Select Billed Client</span>
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => {
              setSelectedClientId(e.target.value);
              setSelectedSiteId('');
            }}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.clientName}
              </option>
            ))}
          </select>
          <div className="text-[11px] text-slate-500 font-mono">
            GSTIN: {selectedClient?.gstNumber || '06AAACD9182P1Z4'}
          </div>
        </div>

        {/* Site Selection */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Site / Post Location</span>
          </label>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">Consolidated (All Deployed Sites)</option>
            {matchingSites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.siteName}
              </option>
            ))}
          </select>
          <div className="text-[11px] text-slate-500">
            {matchingSites.length} registered sites for this client
          </div>
        </div>

        {/* Billing Period */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span>Billing Month & Cycle</span>
          </label>
          <select
            value={billingPeriod}
            onChange={(e) => setBillingPeriod(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="2026-11">November 2026 (Current Cycle)</option>
            <option value="2026-10">October 2026</option>
            <option value="2026-09">September 2026</option>
          </select>
          <div className="text-[11px] text-slate-500">Divisor basis: 30 Calendar Days</div>
        </div>
      </div>

      {/* Calculation Simulation Preview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Pre-Invoice Calculation Breakdown Preview</span>
            </h3>
            <p className="text-xs text-slate-500">
              Contractual rates applied to {selectedClient?.clientName}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
            Ready to Generate
          </span>
        </div>

        {/* Line Items Preview Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-2.5 px-3">Service & Designation</th>
                <th className="py-2.5 px-3 text-center">Staff Count</th>
                <th className="py-2.5 px-3 font-mono text-right">Client Rate</th>
                <th className="py-2.5 px-3 font-mono text-right">OT / Extra Duty</th>
                <th className="py-2.5 px-3 font-mono text-right">Estimated Taxable (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr>
                <td className="py-2.5 px-3 font-sans">
                  <div className="font-bold text-slate-900">Security Guard (Unarmed)</div>
                  <div className="text-[10px] text-slate-400">SAC: 998525 • 24x7 Post Deployment</div>
                </td>
                <td className="py-2.5 px-3 text-center font-sans font-bold">{estimatedGuardCount} Guards</td>
                <td className="py-2.5 px-3 text-right">{formatINR(guardRate)}/mo</td>
                <td className="py-2.5 px-3 text-right text-blue-700">+{formatINR(24 * 185 + 2 * 950)}</td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                  {formatINR(estimatedGuardCount * guardRate + (24 * 185 + 2 * 950))}
                </td>
              </tr>

              <tr>
                <td className="py-2.5 px-3 font-sans">
                  <div className="font-bold text-slate-900">Security Supervisor</div>
                  <div className="text-[10px] text-slate-400">SAC: 998525 • Patrol & Site Command</div>
                </td>
                <td className="py-2.5 px-3 text-center font-sans font-bold">{estimatedSupervisorCount} Supervisor</td>
                <td className="py-2.5 px-3 text-right">{formatINR(supervisorRate)}/mo</td>
                <td className="py-2.5 px-3 text-right text-blue-700">+{formatINR(10 * 230)}</td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                  {formatINR(estimatedSupervisorCount * supervisorRate + 10 * 230)}
                </td>
              </tr>

              {matchingServices.map((as, idx) => (
                <tr key={idx} className="bg-slate-50/50">
                  <td className="py-2.5 px-3 font-sans" colSpan={2}>
                    <div className="font-bold text-slate-900">{as.serviceName}</div>
                    <div className="text-[10px] text-slate-500">SAC: {as.hsnSacCode} • Additional Service</div>
                  </td>
                  <td className="py-2.5 px-3 text-right">{formatINR(as.unitPrice)}</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">—</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatINR(as.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary Strip */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 font-sans block">Base Services Total</span>
            <span className="text-base font-bold text-slate-900">{formatINR(estSubTotal)}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 font-sans block">Service Charge (5%)</span>
            <span className="text-base font-bold text-blue-900">+{formatINR(estServiceCharge)}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 font-sans block">GST Tax (18% Intra)</span>
            <span className="text-base font-bold text-purple-900">+{formatINR(estGst)}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-700 font-sans block">Estimated Grand Total</span>
            <span className="text-lg font-black text-emerald-900">{formatINR(estGrandTotal)}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={handleRunGeneration}
            disabled={isGenerating || !selectedClient}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center space-x-2 transition-colors shadow-sm disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Generate & Save Invoice Draft</span>
          </button>
        </div>
      </div>
    </div>
  );
};
