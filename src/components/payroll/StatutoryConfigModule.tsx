/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StatutoryConfiguration } from '../../types';
import { saveStatutoryConfiguration } from '../../services/payrollService';
import {
  ShieldCheck,
  CheckCircle,
  Save,
  Building2,
  Percent,
  Sliders,
  DollarSign,
  AlertCircle,
  X,
} from 'lucide-react';

interface StatutoryConfigModuleProps {
  companyId: string;
  tenantId: string;
  config: StatutoryConfiguration;
  onRefresh: () => void;
}

export const StatutoryConfigModule: React.FC<StatutoryConfigModuleProps> = ({
  companyId,
  tenantId,
  config,
  onRefresh,
}) => {
  const [form, setForm] = useState<StatutoryConfiguration>({ ...config });
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveStatutoryConfiguration(companyId, form);
      setNotification('Statutory rules and wage divisor policy saved successfully.');
      setTimeout(() => setNotification(null), 3500);
      onRefresh();
    } catch {
      alert('Failed to save statutory configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Header Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>Statutory Compliance & Divisor Settings</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure mandatory Indian labor compliance rates (EPFO, ESIC, PT) and wage calculation rules
            </p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center space-x-2 transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>

        {/* EPFO Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Employees' Provident Fund (EPFO)</h3>
              <p className="text-xs text-slate-500">
                Statutory provident fund applied on Basic Salary (capped up to ceiling)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Employee Share (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={form.pfEmployeePercent}
                onChange={(e) =>
                  setForm({ ...form, pfEmployeePercent: parseFloat(e.target.value) || 0 })
                }
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Default: 12.0%</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Employer Share (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={form.pfEmployerPercent}
                onChange={(e) =>
                  setForm({ ...form, pfEmployerPercent: parseFloat(e.target.value) || 0 })
                }
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Default: 12.0% (EPF + EPS)</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Statutory Wage Ceiling (₹)
              </label>
              <input
                type="number"
                value={form.pfWageCeiling}
                onChange={(e) =>
                  setForm({ ...form, pfWageCeiling: parseFloat(e.target.value) || 0 })
                }
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Statutory limit: ₹15,000</span>
            </div>
          </div>
        </div>

        {/* ESIC Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Employees' State Insurance (ESIC)
              </h3>
              <p className="text-xs text-slate-500">
                Health & social security insurance calculated on total gross wages
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Employee Share (%)
              </label>
              <input
                type="number"
                step="0.05"
                value={form.esiEmployeePercent}
                onChange={(e) =>
                  setForm({ ...form, esiEmployeePercent: parseFloat(e.target.value) || 0 })
                }
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Standard: 0.75%</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Employer Share (%)
              </label>
              <input
                type="number"
                step="0.05"
                value={form.esiEmployerPercent}
                onChange={(e) =>
                  setForm({ ...form, esiEmployerPercent: parseFloat(e.target.value) || 0 })
                }
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Standard: 3.25%</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Wage Ceiling Eligibility (₹)
              </label>
              <input
                type="number"
                value={form.esiWageCeiling}
                onChange={(e) =>
                  setForm({ ...form, esiWageCeiling: parseFloat(e.target.value) || 0 })
                }
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Standard limit: ₹21,000 gross</span>
            </div>
          </div>
        </div>

        {/* Divisor Policy */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Monthly Wage Divisor & Pro-Rata Policy
              </h3>
              <p className="text-xs text-slate-500">
                Specifies how daily rate is derived for monthly salaried workforce
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Standard Working Days Divisor
              </label>
              <select
                value={form.standardDivisor}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({
                    ...form,
                    standardDivisor: val === 'calendar_days' ? 'calendar_days' : (parseInt(val, 10) as any),
                  });
                }}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                <option value="30">30 Days (Standard Monthly Basis)</option>
                <option value="26">26 Days (Excluding 4 Sundays - Standard for Security / Manpower)</option>
                <option value="calendar_days">Actual Days in Month (28/30/31)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                TDS Annual Exemption Threshold (₹)
              </label>
              <input
                type="number"
                value={form.tdsStandardExemptionAnnual}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tdsStandardExemptionAnnual: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">New Tax Regime Standard: ₹7,00,000</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
