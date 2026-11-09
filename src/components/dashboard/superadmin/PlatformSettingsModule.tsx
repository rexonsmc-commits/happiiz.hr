/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Mail,
  Phone,
  FileText,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { PlatformSettings } from '../../../types';
import { updatePlatformSettings } from '../../../services/platformService';

interface PlatformSettingsModuleProps {
  settings: PlatformSettings;
  onRefresh: () => void;
  adminEmail: string;
}

export const PlatformSettingsModule: React.FC<PlatformSettingsModuleProps> = ({
  settings,
  onRefresh,
  adminEmail,
}) => {
  const [formData, setFormData] = useState<PlatformSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updatePlatformSettings(formData, adminEmail);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Platform Global Settings</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
              Master Config
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure default currency (INR), Asia/Kolkata timezone, registration approval enforcement, default trial/grace periods, and GST rates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved Successfully</span>
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {/* Main Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Branding & Support Contact */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Brand Identity & Support Contact
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Platform Brand Name</label>
              <input
                type="text"
                value={formData.platformName}
                onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Support Official Email</label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Support Telephone Hotline</label>
              <input
                type="text"
                value={formData.supportPhone}
                onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Localization & Regional Defaults */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Regional Defaults & Currency
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Default Base Currency</label>
              <input
                type="text"
                value={formData.defaultCurrency}
                onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-[10px] text-slate-400">Default: INR (₹)</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Default Time Zone</label>
              <input
                type="text"
                value={formData.defaultTimeZone}
                onChange={(e) => setFormData({ ...formData, defaultTimeZone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-[10px] text-slate-400">Default: Asia/Kolkata (IST)</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Default Language Code</label>
              <input
                type="text"
                value={formData.defaultLanguage}
                onChange={(e) => setFormData({ ...formData, defaultLanguage: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Registration Approval & Grace Periods */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Onboarding Verification & Grace Periods
          </h3>

          <div className="space-y-3 text-xs">
            {/* Approval Requirement Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="font-bold text-slate-900 block">Require Super Admin KYC Approval</span>
                <span className="text-[11px] text-slate-500">
                  When enabled, newly registered companies remain pending until manually approved.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.requireApprovalForRegistration}
                onChange={(e) => setFormData({ ...formData, requireApprovalForRegistration: e.target.checked })}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Free Trial Duration (Days)</label>
                <input
                  type="number"
                  value={formData.defaultTrialDays}
                  onChange={(e) => setFormData({ ...formData, defaultTrialDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Grace Period (Days)</label>
                <input
                  type="number"
                  value={formData.defaultGracePeriodDays}
                  onChange={(e) => setFormData({ ...formData, defaultGracePeriodDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Tax Rates & Invoicing Sequence */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Tax Configuration & Invoice Sequence
          </h3>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Default GST Rate (%)</label>
                <input
                  type="number"
                  value={formData.defaultGstRate}
                  onChange={(e) => setFormData({ ...formData, defaultGstRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-[10px] text-slate-400">18% (9% CGST + 9% SGST)</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Invoice Prefix</label>
                <input
                  type="text"
                  value={formData.invoicePrefix}
                  onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Next Invoice Sequence Counter</label>
              <input
                type="number"
                value={formData.nextInvoiceSeq}
                onChange={(e) => setFormData({ ...formData, nextInvoiceSeq: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Maintenance Mode Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/60 border border-rose-200">
              <div>
                <span className="font-bold text-rose-900 block">Platform Maintenance Mode</span>
                <span className="text-[11px] text-rose-700">
                  Temporarily restricts client/employee portals for scheduled upgrades.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.maintenanceMode}
                onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
                className="w-4 h-4 accent-rose-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
