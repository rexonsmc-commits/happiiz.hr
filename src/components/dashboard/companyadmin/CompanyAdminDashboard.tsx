/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  Employee,
  ClientSite,
  AuditLog,
  CompanyUser,
  CompanyDepartment,
  CompanyBranch,
  CompanyRole,
} from '../../../types';
import {
  getCompanyEmployees,
  getCompanySites,
  getAuditLogs,
  getCompanyUsers,
  getCompanyDepartments,
  getCompanyBranches,
  getCompanyRoles,
} from '../../../services/tenantService';
import { CompanyProfilePage } from '../../company/CompanyProfilePage';
import { SiteManagementModule } from '../../sites/SiteManagementModule';
import { UserManagementModule } from '../../company/UserManagementModule';
import { RoleManagementModule } from '../../company/RoleManagementModule';
import { DepartmentManagementModule } from '../../company/DepartmentManagementModule';
import { BranchManagementModule } from '../../company/BranchManagementModule';
import { CompanySettingsModule } from '../../company/CompanySettingsModule';
import { ActivityLogsModule } from '../../company/ActivityLogsModule';
import { SubscriptionModule } from '../../company/SubscriptionModule';
import { EmployeeManagementModule } from '../../employee/EmployeeManagementModule';
import { ClientManagementModule } from '../../clients/ClientManagementModule';
import { AttendanceManagementModule } from '../../attendance/AttendanceManagementModule';
import {
  Users,
  MapPin,
  Clock,
  Shield,
  Building2,
  Plus,
  Search,
  CheckCircle2,
  Briefcase,
  Layers,
  Banknote,
  Receipt,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  UserCheck,
  CreditCard,
  BarChart3,
  FolderOpen,
  ArrowRight,
  Sparkles,
  Calendar,
  Lock,
  UserPlus,
  Key,
} from 'lucide-react';

interface CompanyAdminDashboardProps {
  activeTab: string;
  onOpenDocs: () => void;
  onOpenForgotPassword: () => void;
  onSelectTab: (tabId: string) => void;
}

export const CompanyAdminDashboard: React.FC<CompanyAdminDashboardProps> = ({
  activeTab,
  onOpenDocs,
  onOpenForgotPassword,
  onSelectTab,
}) => {
  const { currentCompany, currentUser } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sites, setSites] = useState<ClientSite[]>([]);
  const [tenantLogs, setTenantLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [departments, setDepartments] = useState<CompanyDepartment[]>([]);
  const [branches, setBranches] = useState<CompanyBranch[]>([]);
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Load tenant-scoped data
  useEffect(() => {
    async function loadData() {
      if (!currentCompany) return;
      setLoading(true);
      try {
        const [empList, siteList, allLogs, userList, deptList, branchList, roleList] = await Promise.all([
          getCompanyEmployees(currentCompany.id),
          getCompanySites(currentCompany.id),
          getAuditLogs(),
          getCompanyUsers(currentCompany.id),
          getCompanyDepartments(currentCompany.id, currentCompany.tenantId),
          getCompanyBranches(currentCompany.id, currentCompany.tenantId),
          getCompanyRoles(currentCompany.id, currentCompany.tenantId),
        ]);
        setEmployees(empList);
        setSites(siteList);
        setUsers(userList);
        setDepartments(deptList);
        setBranches(branchList);
        setRoles(roleList);
        // Tenant scoped logs
        setTenantLogs(
          allLogs.filter(
            (l) => l.tenantId === currentCompany.tenantId || l.tenantId === 'general'
          )
        );
      } catch (err) {
        console.error('Failed to load company data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentCompany]);

  if (!currentCompany) {
    return (
      <div className="p-8 text-center text-slate-500">
        Please select a company to view the tenant workspace.
      </div>
    );
  }

  // Handle direct tab routing
  if (activeTab === 'ca_profile') {
    return <CompanyProfilePage />;
  }

  if (activeTab === 'ca_users') {
    return <UserManagementModule />;
  }

  if (activeTab === 'ca_roles') {
    return <RoleManagementModule />;
  }

  if (activeTab === 'ca_departments') {
    return <DepartmentManagementModule />;
  }

  if (activeTab === 'ca_branches') {
    return <BranchManagementModule />;
  }

  if (activeTab === 'ca_sites') {
    return <SiteManagementModule />;
  }

  if (activeTab === 'ca_settings') {
    return <CompanySettingsModule />;
  }

  if (activeTab === 'ca_audit') {
    return <ActivityLogsModule />;
  }

  if (activeTab === 'ca_subscription') {
    return <SubscriptionModule />;
  }

  // Phase 4: Employee Management & HRMS
  if (activeTab === 'ca_employees') {
    return <EmployeeManagementModule />;
  }

  // Phase 5: Client & Account Management Suite
  if (activeTab === 'ca_clients') {
    return <ClientManagementModule />;
  }

  // Phase 6: Advanced Attendance & Duty Rosters
  if (activeTab === 'ca_attendance' || activeTab === 'ca_roster') {
    return <AttendanceManagementModule />;
  }

  // Roadmap modules placeholder
  const comingSoonTitles: Record<string, string> = {
    ca_payroll: 'Automated Payroll, Wages, PF & ESIC',
    ca_invoices: 'GST Client Invoicing & Billing',
    ca_accounts: 'Accounts Ledger & Operational Expenses',
    ca_reports: 'Statutory Muster & Inspection Reports',
    ca_documents: 'Digital KYC Verification & Document Vault',
  };

  if (comingSoonTitles[activeTab]) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {currentCompany.tenantId}
            </span>
            <span className="text-xs font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              Future HRMS Architecture
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">{comingSoonTitles[activeTab]}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Phase 3 Role & Permission architecture is fully active. Specific granular permissions for this module can be configured in Role Management.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">Module Provisioned in Permissions Engine</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            The multi-tenant data schema, subcollections, role permissions, and backend authorization hooks are established. The full interactive operational workflow will connect seamlessly in upcoming phases.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => onSelectTab('ca_dashboard')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-all"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => onSelectTab('ca_roles')}
              className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer transition-all"
            >
              Configure Role Permissions
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard calculations
  const employeeCount = currentCompany.employeeCount || employees.length || 0;
  const maxEmployees = currentCompany.maxEmployees || 1000;
  const remainingCapacity = Math.max(0, maxEmployees - employeeCount);
  const capacityPercent = Math.min(100, Math.round((employeeCount / maxEmployees) * 100));
  const totalTenantUsers = users.length || 1;
  const totalDepts = departments.length;
  const totalBranches = branches.length;
  const totalSites = sites.length;

  return (
    <div className="space-y-6">
      {/* 1. WELCOME & CONTEXT HEADER */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {currentCompany.logoUrl ? (
              <img
                src={currentCompany.logoUrl}
                alt={currentCompany.name}
                className="w-14 h-14 rounded-2xl object-cover bg-white p-1 border border-blue-400/30 shrink-0 shadow-lg"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-600/40 shrink-0">
                {currentCompany.name.substring(0, 2).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="font-mono text-[10px] text-sky-300 bg-sky-950/90 border border-sky-800 px-2.5 py-0.5 rounded-full font-bold">
                  ID: {currentCompany.tenantId}
                </span>
                <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-blue-900/60 text-blue-200 border border-blue-700/50">
                  {currentCompany.companyType || currentCompany.industry}
                </span>
                <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{currentCompany.subscriptionStatus}</span>
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/50">
                  {currentCompany.subscriptionPlan} Tier
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentCompany.displayName || currentCompany.name}
              </h1>

              <p className="text-xs text-slate-300 mt-1">
                Primary Administrator:{' '}
                <span className="text-white font-semibold">
                  {currentCompany.adminName || currentCompany.ownerName}
                </span>{' '}
                • Reg Date:{' '}
                <span className="font-mono text-sky-300">
                  {currentCompany.registrationDate || currentCompany.createdAt?.substring(0, 10) || '2026-01-15'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onSelectTab('ca_profile')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Company Profile</span>
            </button>
            <button
              onClick={() => onSelectTab('ca_settings')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* 2. DASHBOARD CAPACITY & HEADCOUNT METER */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>Workforce Capacity Usage</span>
              </span>
              <span className="font-mono text-sky-300 font-bold">
                {employeeCount} / {maxEmployees} Employees ({capacityPercent}%)
              </span>
            </div>

            <div className="w-full bg-slate-900/80 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  capacityPercent > 90
                    ? 'bg-rose-500'
                    : capacityPercent > 75
                    ? 'bg-amber-400'
                    : 'bg-gradient-to-r from-blue-500 to-sky-400'
                }`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-400">
              <span>{remainingCapacity} employee license slots remaining</span>
              <button
                onClick={() => onSelectTab('ca_subscription')}
                className="text-sky-400 hover:underline font-bold"
              >
                Upgrade Plan →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total Staff Users</span>
              <div className="text-xl font-black text-sky-400 mt-0.5">{totalTenantUsers}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Client Sites</span>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{totalSites}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => onSelectTab('ca_users')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total Users</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{totalTenantUsers}</div>
          <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">Staff & Admins →</span>
        </div>

        <div
          onClick={() => onSelectTab('ca_departments')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Departments</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{totalDepts}</div>
          <span className="text-[10px] text-indigo-600 font-semibold mt-0.5 block">Divisions →</span>
        </div>

        <div
          onClick={() => onSelectTab('ca_branches')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Branch Hubs</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{totalBranches}</div>
          <span className="text-[10px] text-sky-600 font-semibold mt-0.5 block">Regional Offices →</span>
        </div>

        <div
          onClick={() => onSelectTab('ca_roles')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Configured Roles</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{roles.length}</div>
          <span className="text-[10px] text-purple-600 font-semibold mt-0.5 block">RBAC Matrices →</span>
        </div>
      </div>

      {/* 4. QUICK ACTIONS & IMPORTANT ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Panel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Administrative Quick Actions</h3>
              <p className="text-xs text-slate-500">Fast pathways to configure workforce and operations</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Phase 3 Live
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { id: 'ca_users', title: 'Add New User', desc: 'Invite staff & assign role', icon: UserPlus },
              { id: 'ca_roles', title: 'Create Custom Role', desc: 'Configure permissions', icon: Shield },
              { id: 'ca_departments', title: 'New Department', desc: 'Add operational division', icon: Layers },
              { id: 'ca_branches', title: 'Add Branch Office', desc: 'Regional deployment hub', icon: Building2 },
              { id: 'ca_sites', title: 'Add Client Site', desc: 'Deployment post & shifts', icon: MapPin },
              { id: 'ca_profile', title: 'Company Profile', desc: 'Update GSTIN & details', icon: FileText },
            ].map((action) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => onSelectTab(action.id)}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-all group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <ActionIcon className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition-colors">
                    {action.title}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{action.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Important Notifications Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900">Notifications & Alerts</h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-blue-900 block">Phase 3 System Activated</span>
                <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                  Company User Management, RBAC Roles, Departments, Branches, and Settings are fully operational.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">KYC Verification Confirmed</span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Tenant status verified by Happiiz Super Admin team.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Subscription Renews in 22 Days</span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Plan: {currentCompany.subscriptionPlan.toUpperCase()} (₹{currentCompany.monthlyFee?.toLocaleString('en-IN')}/mo).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. COMPANY PROFILE & SUBSCRIPTION SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Profile Details Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900">Company Overview</h3>
            <button
              onClick={() => onSelectTab('ca_profile')}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3.5 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">Legal Entity Name</span>
              <span className="font-bold text-slate-900">{currentCompany.name}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Brand Display Name</span>
              <span className="font-bold text-slate-900">{currentCompany.displayName || currentCompany.name}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Managing Director</span>
              <span className="font-bold text-slate-900">{currentCompany.directorName || currentCompany.ownerName}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Business Sector</span>
              <span className="font-bold text-slate-900">{currentCompany.companyType || currentCompany.industry}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">GSTIN Registration</span>
              <span className="font-mono font-bold text-slate-900">
                {currentCompany.gstNumber || currentCompany.taxId || 'Pending'}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">PAN Number</span>
              <span className="font-mono font-bold text-slate-900">
                {currentCompany.panNumber || 'Not provided'}
              </span>
            </div>

            <div className="col-span-2">
              <span className="text-[11px] text-slate-400 block">Headquarters Address</span>
              <span className="font-medium text-slate-800">
                {currentCompany.address}, {currentCompany.city}, {currentCompany.state} - {currentCompany.pinCode}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Engine Integration Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900">SaaS Subscription & Billing</h3>
            <button
              onClick={() => onSelectTab('ca_subscription')}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Subscription Details
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3.5 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">Active Plan Tier</span>
              <span className="font-black text-purple-700 capitalize text-sm">
                {currentCompany.subscriptionPlan} Tier
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Payment Standing</span>
              <span className="font-bold text-emerald-600 uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Paid & In Good Standing</span>
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Employee License Ceiling</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{maxEmployees} Workforce Slots</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Current Headcount</span>
              <span className="font-mono font-bold text-blue-600 text-sm">{employeeCount} Active</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Monthly Flat Base Fee</span>
              <span className="font-mono font-bold text-slate-900">
                ₹{currentCompany.monthlyFee?.toLocaleString('en-IN') || '49,999'} / month
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Renewal Cycle</span>
              <span className="font-bold text-slate-800">Monthly Postpaid (Auto)</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onSelectTab('ca_subscription')}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Expand License Capacity / Upgrade Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6. RECENT TENANT ACTIVITY TRAIL */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900">Recent Tenant Activity</h3>
            <p className="text-xs text-slate-500">Immutable audit log scoped to {currentCompany.tenantId}</p>
          </div>
          <button
            onClick={() => onSelectTab('ca_audit')}
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>View All Activity Logs</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {tenantLogs.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No administrative events recorded yet for this workspace.
          </div>
        ) : (
          <div className="space-y-2.5">
            {tenantLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-mono text-[11px]">{log.action}</span>
                    <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.2 rounded uppercase font-bold">
                      {log.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">{log.details}</p>
                </div>
                <div className="text-right text-[11px] font-mono text-slate-400 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
