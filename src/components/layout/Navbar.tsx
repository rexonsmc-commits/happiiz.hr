/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  Shield,
  Building2,
  ChevronDown,
  LogOut,
  Sparkles,
  BookOpen,
  Menu,
  CheckCircle2,
  Users,
  Briefcase,
  Layers,
  Activity,
  Globe,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onOpenDocs?: () => void;
  onOpenRegister?: () => void;
  onGoToLanding?: () => void;
  onGoToUserProfile?: () => void;
  onGoToSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenDocs,
  onOpenRegister,
  onGoToLanding,
  onGoToUserProfile,
  onGoToSettings,
}) => {
  const {
    currentUser,
    currentCompany,
    availableCompanies,
    role,
    loginAsRole,
    logout,
    setCurrentCompany,
    isDbConnected,
  } = useAuth();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [tenantMenuOpen, setTenantMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const roleLabels: Record<UserRole, { label: string; bg: string; text: string }> = {
    platform_owner: { label: 'Platform Owner', bg: 'bg-purple-100', text: 'text-purple-900 font-bold' },
    super_admin: { label: 'Super Admin', bg: 'bg-purple-100', text: 'text-purple-800' },
    company_admin: { label: 'Company Admin', bg: 'bg-blue-100', text: 'text-blue-800' },
    hr_admin: { label: 'HR Administrator', bg: 'bg-cyan-100', text: 'text-cyan-800' },
    site_admin: { label: 'Site Operations Admin', bg: 'bg-indigo-100', text: 'text-indigo-800' },
    supervisor: { label: 'Field Supervisor', bg: 'bg-teal-100', text: 'text-teal-800' },
    employee: { label: 'Field Staff / Guard', bg: 'bg-emerald-100', text: 'text-emerald-800' },
    client: { label: 'Client Representative', bg: 'bg-amber-100', text: 'text-amber-800' },
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Hamburger + Brand logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Toggle Navigation Sidebar"
              aria-label="Toggle Navigation Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={onGoToLanding}
              className="flex items-center gap-2.5 text-left cursor-pointer hover:opacity-90 transition-opacity"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-900 via-blue-900 to-blue-700 flex items-center justify-center shadow-md shadow-blue-900/20 text-white font-black text-lg">
                <Shield className="w-5 h-5 text-sky-300" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-extrabold text-xl tracking-tight text-slate-900">
                    Happiiz
                  </span>
                  <span className="font-black text-xl tracking-tight text-blue-600">
                    HR
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-slate-900 text-sky-300 rounded-sm">
                    SaaS
                  </span>
                </div>
                <span className="hidden md:inline-block text-[11px] font-medium text-slate-500 leading-tight">
                  Workforce & Facility Operating System
                </span>
              </div>
            </button>
          </div>

          {/* Center section: Multi-Tenant Context Switcher (for Company Admin mode) */}
          <div className="hidden lg:flex items-center gap-3">
            {role === 'company_admin' && currentCompany && (
              <div className="relative">
                <button
                  onClick={() => setTenantMenuOpen(!tenantMenuOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors"
                >
                  <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-800 line-clamp-1 max-w-[160px]">
                        {currentCompany.name}
                      </span>
                      <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[10px] font-mono font-bold rounded">
                        {currentCompany.tenantId}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {tenantMenuOpen && (
                  <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Switch Active Tenant
                    </div>
                    {availableCompanies.map((comp) => (
                      <button
                        key={comp.id}
                        onClick={() => {
                          setCurrentCompany(comp);
                          setTenantMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left flex items-start gap-2.5 hover:bg-slate-50 transition-colors ${
                          currentCompany.id === comp.id ? 'bg-blue-50/60 font-semibold' : ''
                        }`}
                      >
                        <Building2
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            currentCompany.id === comp.id ? 'text-blue-600' : 'text-slate-400'
                          }`}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs text-slate-800 truncate">{comp.name}</span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {comp.tenantId} • {comp.industry}
                          </span>
                        </div>
                      </button>
                    ))}
                    <div className="px-3 pt-2 mt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setTenantMenuOpen(false);
                          if (onOpenRegister) onOpenRegister();
                        }}
                        className="w-full text-center py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        + Register New Company
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DB Live status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isDbConnected ? 'Firestore Multi-Tenant Active' : 'Offline Cache'}</span>
            </div>
          </div>

          {/* Right section: Role switcher & User menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Documentation Trigger */}
            <button
              onClick={onOpenDocs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
              title="View Architecture & API Specs"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Docs & Spec</span>
            </button>

            {/* Role Switcher Dropdown (Allows seamless evaluation of all personas) */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  role === 'super_admin'
                    ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                    : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Role:</span>
                <span>{roleLabels[role]?.label || role}</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Persona View
                  </div>
                  <button
                    onClick={() => {
                      loginAsRole('super_admin');
                      setRoleMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-purple-50 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-purple-900">Super Admin Portal</span>
                      <span className="text-[10px] text-slate-500">Platform-wide multi-tenant controls</span>
                    </div>
                    {role === 'super_admin' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                  </button>
                  <button
                    onClick={() => {
                      loginAsRole('company_admin');
                      setRoleMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-blue-900">Company Admin Portal</span>
                      <span className="text-[10px] text-slate-500">Workforce, sites, roster & billing</span>
                    </div>
                    {role === 'company_admin' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </button>
                  <button
                    onClick={() => {
                      loginAsRole('employee');
                      setRoleMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-emerald-50 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-emerald-900">Field Guard / Staff View</span>
                      <span className="text-[10px] text-slate-500">Attendance punch, shift slip</span>
                    </div>
                    {role === 'employee' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </button>
                </div>
              )}
            </div>

            {/* User Account Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 pl-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-slate-900 text-sky-300 font-bold text-xs flex items-center justify-center">
                  {currentUser?.displayName?.[0] || 'U'}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 mr-1 hidden sm:block" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{currentUser?.displayName || 'User'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${roleLabels[role]?.bg} ${roleLabels[role]?.text}`}>
                        {roleLabels[role]?.label}
                      </span>
                    </div>
                  </div>
                  <div className="py-1 divide-y divide-slate-100">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          if (onGoToUserProfile) onGoToUserProfile();
                          setUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>User Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          if (onGoToSettings) onGoToSettings();
                          setUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                      >
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Settings & Security</span>
                      </button>

                      <button
                        onClick={() => {
                          if (onGoToLanding) onGoToLanding();
                          setUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span>Public Website</span>
                      </button>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
