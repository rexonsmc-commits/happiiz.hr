/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CompanyFullSettings } from '../../types';
import {
  getCompanyFullSettings,
  updateCompanyFullSettings,
} from '../../services/tenantService';
import {
  Settings,
  Building2,
  Globe,
  Bell,
  Shield,
  FileText,
  Briefcase,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
  Key,
  Calendar,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';

export const CompanySettingsModule: React.FC = () => {
  const { currentCompany, currentUser, updateCurrentCompany } = useAuth();

  const [settings, setSettings] = useState<CompanyFullSettings | null>(null);
  const [activeTab, setActiveTab] = useState<
    'general' | 'regional' | 'notifications' | 'security' | 'documents' | 'business'
  >('general');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentCompany) {
      loadSettings();
    }
  }, [currentCompany]);

  async function loadSettings() {
    if (!currentCompany) return;
    setLoading(true);
    try {
      const data = await getCompanyFullSettings(currentCompany);
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!currentCompany || !settings) return;

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await updateCompanyFullSettings(currentCompany.id, settings, currentUser?.email || 'admin@happiiz.io');

      // Also sync company profile basic fields if general changed
      await updateCurrentCompany({
        name: settings.general.companyLegalName,
        displayName: settings.general.displayName,
        logoUrl: settings.general.logoUrl,
        phone: settings.general.contactNumber,
        alternateNumber: settings.general.alternateNumber,
        gstNumber: settings.general.gstNumber,
        panNumber: settings.general.panNumber,
        cinNumber: settings.general.cinNumber,
        address: settings.general.businessAddress,
        city: settings.general.city,
        state: settings.general.state,
        pinCode: settings.general.pinCode,
        website: settings.general.website,
        description: settings.general.description,
      });

      setSuccessMsg('Company settings successfully saved to Cloud Firestore.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update company settings.');
    } finally {
      setIsSaving(false);
    }
  }

  if (!currentCompany || !settings) {
    return (
      <div className="p-8 text-center text-slate-400">
        Loading company configuration...
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General & Identity', icon: Building2 },
    { id: 'regional', label: 'Regional & Localization', icon: Globe },
    { id: 'notifications', label: 'Notifications & Alerts', icon: Bell },
    { id: 'security', label: 'Security & Access Policy', icon: Shield },
    { id: 'documents', label: 'Document Preferences', icon: FileText },
    { id: 'business', label: 'Business & Financial', icon: Briefcase },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {currentCompany.tenantId}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Configuration Center
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900">Company Settings & Preferences</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure enterprise branding, regional timezones, notification channels, password rules, and operational defaults.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Workspace Mode</span>
          <span className="text-xs font-mono font-bold text-emerald-600">Enterprise Tenant Active</span>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-900 font-semibold animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Container with Sidebar Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col md:flex-row">
        {/* Settings Navigation Tabs */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-100 p-3 space-y-1 bg-slate-50/50 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 p-6 sm:p-8">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* TAB A: GENERAL SETTINGS */}
            {activeTab === 'general' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-black text-slate-900">General Company Identity</h3>
                  <p className="text-xs text-slate-500">Legal business entity details, contact hotlines, and branding.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Company Legal Name *</label>
                    <input
                      type="text"
                      required
                      value={settings.general.companyLegalName}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          general: { ...settings.general, companyLegalName: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Brand Display Name</label>
                    <input
                      type="text"
                      value={settings.general.displayName}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          general: { ...settings.general, displayName: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Managing Director / Owner</label>
                    <input
                      type="text"
                      value={settings.general.directorName}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          general: { ...settings.general, directorName: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Company Logo URL</label>
                    <input
                      type="url"
                      value={settings.general.logoUrl}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          general: { ...settings.general, logoUrl: e.target.value },
                        })
                      }
                      placeholder="https://example.com/logo.png"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Primary Email</label>
                    <input
                      type="email"
                      value={settings.general.companyEmail}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          general: { ...settings.general, companyEmail: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Primary Phone</label>
                    <input
                      type="tel"
                      value={settings.general.contactNumber}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          general: { ...settings.general, contactNumber: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN Number</label>
                    <input
                      type="text"
                      value={settings.general.gstNumber}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          general: { ...settings.general, gstNumber: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs font-mono uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">PAN Number</label>
                    <input
                      type="text"
                      value={settings.general.panNumber}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          general: { ...settings.general, panNumber: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs font-mono uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Business Headquarters Address</label>
                    <input
                      type="text"
                      value={settings.general.businessAddress}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          general: { ...settings.general, businessAddress: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB B: REGIONAL SETTINGS */}
            {activeTab === 'regional' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Regional & Localization</h3>
                  <p className="text-xs text-slate-500">Operating timezone, calendar formatting, and financial currency.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Country of Operations</label>
                    <input
                      type="text"
                      value={settings.regional.country}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          regional: { ...settings.regional, country: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Operating Time Zone</label>
                    <select
                      value={settings.regional.timeZone}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          regional: { ...settings.regional, timeZone: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    >
                      <option value="Asia/Kolkata (IST +5:30)">Asia/Kolkata (IST +5:30)</option>
                      <option value="Asia/Dubai (GST +4:00)">Asia/Dubai (GST +4:00)</option>
                      <option value="Asia/Singapore (SGT +8:00)">Asia/Singapore (SGT +8:00)</option>
                      <option value="Europe/London (GMT +0:00)">Europe/London (GMT +0:00)</option>
                      <option value="America/New_York (EST -5:00)">America/New_York (EST -5:00)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date Format</label>
                    <select
                      value={settings.regional.dateFormat}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          regional: { ...settings.regional, dateFormat: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 15/01/2026)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Format)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Currency Code & Symbol</label>
                    <input
                      type="text"
                      value={settings.regional.currency}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          regional: { ...settings.regional, currency: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Portal Display Language</label>
                    <select
                      value={settings.regional.language}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          regional: { ...settings.regional, language: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi (हिंदी)</option>
                      <option value="Arabic">Arabic (العربية)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB C: NOTIFICATION SETTINGS */}
            {activeTab === 'notifications' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Notification Preferences</h3>
                  <p className="text-xs text-slate-500">Configure alert channels for operational incidents and muster reports.</p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.emailAlerts}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, emailAlerts: e.target.checked },
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded border-slate-300"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Email Notifications</span>
                      <span className="text-[11px] text-slate-500 block">
                        Receive operational alerts, new user invitations, and invoice notices via email.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.smsAlerts}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, smsAlerts: e.target.checked },
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded border-slate-300"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">SMS Dispatch Alerts</span>
                      <span className="text-[11px] text-slate-500 block">
                        Direct SMS alerts for critical post absences and emergency supervisor calls.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.shiftVacancies}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, shiftVacancies: e.target.checked },
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded border-slate-300"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Shift Vacancy & Guard Deficit Alerts</span>
                      <span className="text-[11px] text-slate-500 block">
                        Instant notification when a deployment site falls short of mandatory guard headcount.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.dailyMuster}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, dailyMuster: e.target.checked },
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded border-slate-300"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Daily Muster Summary Email</span>
                      <span className="text-[11px] text-slate-500 block">
                        Automated morning report with previous night's attendance and incident logs.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* TAB D: SECURITY SETTINGS */}
            {activeTab === 'security' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Security & Authentication Policies</h3>
                  <p className="text-xs text-slate-500">Configure password strength requirements and session timeouts.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Password Length</label>
                    <input
                      type="number"
                      min={6}
                      max={32}
                      value={settings.security.passwordMinLength}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: { ...settings.security, passwordMinLength: Number(e.target.value) },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Session Inactivity Timeout (Minutes)</label>
                    <input
                      type="number"
                      min={15}
                      max={480}
                      value={settings.security.sessionTimeoutMinutes}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: { ...settings.security, sessionTimeoutMinutes: Number(e.target.value) },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.security.requireSpecialChar}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: { ...settings.security, requireSpecialChar: e.target.checked },
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded border-slate-300"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Require Symbols & Numbers</span>
                      <span className="text-[11px] text-slate-500 block">
                        Enforces at least one numerical digit and special character (@#$%) in user passwords.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.security.twoFactorEnabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: { ...settings.security, twoFactorEnabled: e.target.checked },
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded border-slate-300"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Two-Factor Authentication (2FA)</span>
                      <span className="text-[11px] text-slate-500 block">
                        Require secondary one-time passcodes for administrative logins.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* TAB E: DOCUMENT SETTINGS */}
            {activeTab === 'documents' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Document Upload Preferences</h3>
                  <p className="text-xs text-slate-500">File size limits, allowed extensions, and compliance watermarking.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Max Document Size (MB)</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={settings.documents.maxFileSizeMb}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          documents: { ...settings.documents, maxFileSizeMb: Number(e.target.value) },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Allowed File Formats</label>
                    <input
                      type="text"
                      value={settings.documents.allowedExtensions.join(', ')}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          documents: {
                            ...settings.documents,
                            allowedExtensions: e.target.value.split(',').map((x) => x.trim()),
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.documents.autoWatermark}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        documents: { ...settings.documents, autoWatermark: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Automatic Security Watermark</span>
                    <span className="text-[11px] text-slate-500 block">
                      Overlay company tenant watermark on sensitive KYC police verification and Aadhaar uploads.
                    </span>
                  </div>
                </label>
              </div>
            )}

            {/* TAB F: BUSINESS SETTINGS */}
            {activeTab === 'business' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Business & Operational Settings</h3>
                  <p className="text-xs text-slate-500">Financial accounting year, working week days, and primary business model.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Financial Year Cycle</label>
                    <select
                      value={settings.business.financialYearStart}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          business: { ...settings.business, financialYearStart: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    >
                      <option value="April (01/04)">April to March (India Standard)</option>
                      <option value="January (01/01)">January to December (Calendar Year)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Default Business Sector</label>
                    <select
                      value={settings.business.defaultBusinessType}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          business: { ...settings.business, defaultBusinessType: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    >
                      <option value="Security Guard Services">Security Guard Services</option>
                      <option value="Housekeeping Services">Housekeeping & Cleaning Services</option>
                      <option value="Manpower Supply">Contractual Manpower Supply</option>
                      <option value="Facility Management">Integrated Facility Management</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button Footer */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Changes persist automatically across all tenant sessions.
              </span>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Configuration'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
