/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  User,
  Key,
  Bell,
  Globe,
  Shield,
  LogOut,
  CheckCircle2,
  Lock,
  ExternalLink,
} from 'lucide-react';

interface SettingsPageProps {
  onOpenForgotPassword: () => void;
  onOpenDocs: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onOpenForgotPassword,
  onOpenDocs,
}) => {
  const { currentUser, currentCompany, logout } = useAuth();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [language, setLanguage] = useState('English');
  const [timeZone, setTimeZone] = useState('Asia/Kolkata (IST)');
  const [savedNote, setSavedNote] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-extrabold text-slate-900">Platform & Account Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure security credentials, notification preferences, and regional localization.
        </p>
      </div>

      {savedNote && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-900 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Platform preferences saved for this session.</span>
        </div>
      )}

      {/* Account Info Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
          <User className="w-4 h-4 text-blue-600" />
          <span>Account Overview</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500">Authorized Email</span>
            <div className="font-bold text-slate-900 mt-0.5 font-mono">{currentUser?.email}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500">Access Role</span>
            <div className="font-bold text-slate-900 mt-0.5 uppercase">
              {currentUser?.role.replace('_', ' ')}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500">Tenant Workspace</span>
            <div className="font-bold text-slate-900 mt-0.5">
              {currentCompany?.name || 'Happiiz Global System'}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500">Tenant ID Identifier</span>
            <div className="font-bold text-blue-700 mt-0.5 font-mono">
              {currentCompany?.tenantId || 'GLOBAL-SYSTEM'}
            </div>
          </div>
        </div>
      </div>

      {/* Security & Credentials */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
          <Shield className="w-4 h-4 text-blue-600" />
          <span>Security & Authentication</span>
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
          <div>
            <h4 className="text-xs font-bold text-slate-900">Password & Passkey Credentials</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Request a secure password reset link dispatched to your verified administrative email address.
            </p>
          </div>
          <button
            onClick={onOpenForgotPassword}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            Reset Password
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
          <div>
            <h4 className="text-xs font-bold text-slate-900">Zero-Trust Multi-Tenancy Architecture</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Review Google Cloud Firestore security rules, data invariants, and access audit specs.
            </p>
          </div>
          <button
            onClick={onOpenDocs}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-blue-600 text-xs font-bold shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
          >
            <span>View Security Spec</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Basic Preferences */}
      <form onSubmit={handleSavePreferences} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
          <Globe className="w-4 h-4 text-blue-600" />
          <span>Regional & Notification Preferences</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Display Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="English">English (United States / International)</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Arabic">Arabic (العربية)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Operating Time Zone</label>
            <select
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST +5:30)</option>
              <option value="Asia/Dubai (GST)">Asia/Dubai (GST +4:00)</option>
              <option value="America/New_York (EST)">America/New_York (EST -5:00)</option>
              <option value="Europe/London (GMT)">Europe/London (GMT +0:00)</option>
            </select>
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-700 font-medium">
              Receive email notifications for critical workforce shift vacancies and guard post deficits
            </span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-700 font-medium">
              Receive SMS alerts for emergency supervisor dispatch alerts (Phase 2)
            </span>
          </label>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of Session</span>
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
