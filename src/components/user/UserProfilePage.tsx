/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Building2, Shield, CheckCircle2, Lock, Save } from 'lucide-react';

export const UserProfilePage: React.FC = () => {
  const { currentUser, updateUser } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  if (!currentUser) {
    return <div className="p-8 text-center text-slate-500">No active user session.</div>;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      displayName,
      phone,
    });
    setSuccessMsg('Personal profile information updated successfully.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-extrabold text-slate-900">User Account Profile</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal details, verified email address, and view your organizational credentials.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-900 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 to-blue-700 text-sky-300 font-black text-2xl flex items-center justify-center shadow-md">
            {displayName[0] || 'U'}
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">{displayName}</h3>
            <p className="text-xs text-slate-500 font-mono">{currentUser.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                {currentUser.role.replace('_', ' ')}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                {currentUser.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Legal Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Direct Contact Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98000 00000"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Registered Email (Verified)
            </label>
            <div className="relative">
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-mono"
              />
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Associated Company / Tenant
            </label>
            <div className="relative">
              <input
                type="text"
                disabled
                value={currentUser.associatedCompany || 'Happiiz Platform'}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-semibold"
              />
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Role & tenant associations are protected by server-side claims</span>
          </p>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
};
