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
import { PayrollManagementModule } from '../../payroll/PayrollManagementModule';
import { ClientBillingCoordinator } from '../../billing/ClientBillingCoordinator';
import { AccountingCoordinator } from '../../accounting/AccountingCoordinator';
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

  // Phase 7: Complete Payroll & Salary Management
  if (activeTab === 'ca_payroll') {
    return (
      <PayrollManagementModule
        companyId={currentCompany.id}
        tenantId={currentCompany.tenantId}
        currentCompany={currentCompany}
        employees={employees}
        currentUser={{ name: currentUser?.displayName || 'Company Admin', role: currentUser?.role }}
      />
    );
  }

  // Phase 8: Complete Client Billing, GST Invoices & Payment Management
  if (activeTab === 'ca_invoices') {
    return (
      <ClientBillingCoordinator
        companyId={currentCompany.id}
        tenantId={currentCompany.tenantId}
        currentCompany={currentCompany}
        currentUser={{ name: currentUser?.displayName || 'Company Admin', role: currentUser?.role }}
      />
    );
  }

  // Phase 9: Complete Accounting & Financial Management System
  if (activeTab === 'ca_accounts') {
    return (
      <AccountingCoordinator
        companyId={currentCompany.id}
        tenantId={currentCompany.tenantId}
        currentCompany={currentCompany}
        currentUser={{ name: currentUser?.displayName || 'Company Admin', role: currentUser?.role }}
      />
    );
  }

  // Roadmap modules placeholder
  const comingSoonTitles: Record<string, string> = {
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
    <div className="space-y-4">
      {/* 1. SLIM EXECUTIVE COMMAND BAR */}
      <div className="bg-slate-900 rounded-xl px-4 py-3 text-white border border-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Company Identity */}
          <div className="flex items-center gap-3 min-w-0">
            {currentCompany.logoUrl ? (
              <img
                src={currentCompany.logoUrl}
                alt={currentCompany.name}
                className="w-10 h-10 rounded-lg object-cover bg-white p-0.5 border border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                {currentCompany.name.substring(0, 2).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                  {currentCompany.displayName || currentCompany.name}
                </h1>
                <span className="font-mono text-[10px] text-sky-300 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded">
                  {currentCompany.tenantId}
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  {currentCompany.companyType || currentCompany.industry}
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  {currentCompany.subscriptionPlan} Tier
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {currentCompany.subscriptionStatus}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                Primary Admin: <span className="text-slate-200 font-medium">{currentCompany.adminName || currentCompany.ownerName}</span>
                {' '}• Est: <span className="font-mono text-slate-300">{currentCompany.registrationDate || currentCompany.createdAt?.substring(0, 10) || '2026-01-15'}</span>
              </p>
            </div>
          </div>

          {/* Right Action & Workforce Capacity Gauge */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Slim Capacity Indicator */}
            <div className="hidden sm:flex flex-col items-end text-right">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-400 font-medium">License Slots:</span>
                <span className="font-mono font-bold text-sky-300">{employeeCount}/{maxEmployees} ({capacityPercent}%)</span>
              </div>
              <div className="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1 border border-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    capacityPercent > 90
                      ? 'bg-rose-500'
                      : capacityPercent > 75
                      ? 'bg-amber-400'
                      : 'bg-gradient-to-r from-blue-500 to-sky-400'
                  }`}
                  style={{ width: `${capacityPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onSelectTab('ca_profile')}
                className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => onSelectTab('ca_subscription')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                <span>Plan</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. COMPACT 6-METRIC COMMAND RIBBON */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div
          onClick={() => onSelectTab('ca_employees')}
          className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-400 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Workforce</span>
            <Users className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{employeeCount}</div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
            <span>of {maxEmployees} cap</span>
            <span className="text-blue-600 font-bold group-hover:underline">Manage →</span>
          </div>
        </div>

        <div
          onClick={() => onSelectTab('ca_users')}
          className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-400 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Staff Users</span>
            <UserCheck className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalTenantUsers}</div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
            <span>Admins & HR</span>
            <span className="text-indigo-600 font-bold group-hover:underline">View →</span>
          </div>
        </div>

        <div
          onClick={() => onSelectTab('ca_sites')}
          className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-400 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Client Sites</span>
            <MapPin className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalSites}</div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
            <span>Active Deployments</span>
            <span className="text-emerald-600 font-bold group-hover:underline">Posts →</span>
          </div>
        </div>

        <div
          onClick={() => onSelectTab('ca_branches')}
          className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-400 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Hubs & Depts</span>
            <Building2 className="w-3.5 h-3.5 text-sky-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalBranches} <span className="text-xs font-normal text-slate-500">/ {totalDepts}</span></div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
            <span>Branches / Depts</span>
            <span className="text-sky-600 font-bold group-hover:underline">List →</span>
          </div>
        </div>

        <div
          onClick={() => onSelectTab('ca_roles')}
          className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-400 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Roles Matrix</span>
            <Shield className="w-3.5 h-3.5 text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{roles.length}</div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
            <span>RBAC Policies</span>
            <span className="text-purple-600 font-bold group-hover:underline">Config →</span>
          </div>
        </div>

        <div
          onClick={() => onSelectTab('ca_subscription')}
          className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-400 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Monthly SaaS</span>
            <CreditCard className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-base font-bold text-slate-900 mt-1 truncate">
            ₹{currentCompany.monthlyFee?.toLocaleString('en-IN') || '49,999'}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold flex items-center justify-between mt-0.5">
            <span>Paid & Active</span>
            <span className="font-bold group-hover:underline">Plan →</span>
          </div>
        </div>
      </div>

      {/* 3. TWO-COLUMN BALANCED COCKPIT (Left 62% Operational pathways & audit, Right 38% Entity Profile & Alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Operational Shortcuts & Recent Activity */}
        <div className="lg:col-span-7 space-y-4">
          {/* Operational Quick Launch Grid */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Operational Command Launch</h3>
                <p className="text-[11px] text-slate-500">Instant access to workforce, financial, and deployment operations</p>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded">
                Modules 1–9 Active
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'ca_employees', title: 'Workforce HRMS', desc: 'KYC, docs & staff', icon: Users, color: 'text-blue-600 bg-blue-50' },
                { id: 'ca_attendance', title: 'GPS Attendance', desc: 'Punches & shifts', icon: Clock, color: 'text-sky-600 bg-sky-50' },
                { id: 'ca_payroll', title: 'Payroll & Wages', desc: 'Pay slips & sheets', icon: Banknote, color: 'text-emerald-600 bg-emerald-50' },
                { id: 'ca_invoices', title: 'GST Billing', desc: 'Invoices & dues', icon: Receipt, color: 'text-indigo-600 bg-indigo-50' },
                { id: 'ca_accounting', title: 'Cash & Ledger', desc: 'Accounts & vouchers', icon: BarChart3, color: 'text-purple-600 bg-purple-50' },
                { id: 'ca_sites', title: 'Client Sites', desc: 'Duty posts & zones', icon: MapPin, color: 'text-amber-600 bg-amber-50' },
                { id: 'ca_users', title: 'Staff Users', desc: 'Admins & managers', icon: UserPlus, color: 'text-rose-600 bg-rose-50' },
                { id: 'ca_roles', title: 'Role Security', desc: 'Access permissions', icon: Shield, color: 'text-slate-700 bg-slate-100' },
              ].map((action) => {
                const ActionIcon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => onSelectTab(action.id)}
                    className="p-2.5 rounded-lg border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/30 text-left transition-all group cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className={`w-6 h-6 rounded-md ${action.color} flex items-center justify-center shrink-0`}>
                        <ActionIcon className="w-3.5 h-3.5" />
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                        {action.title}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-tight truncate">{action.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Tenant Activity Audit Log */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Recent Workspace Activity</h3>
                <p className="text-[11px] text-slate-500">Immutable audit log scoped to {currentCompany.tenantId}</p>
              </div>
              <button
                onClick={() => onSelectTab('ca_audit')}
                className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Full Audit Trail</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {tenantLogs.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                No administrative events recorded yet for this workspace.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {tenantLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 font-mono text-[11px]">{log.action}</span>
                        <span className="text-[9px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded uppercase font-bold">
                          {log.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate mt-0.5">{log.details}</p>
                    </div>
                    <div className="text-right text-[10px] font-mono text-slate-400 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Entity Profile, Subscription Standing & Operational Badges */}
        <div className="lg:col-span-5 space-y-4">
          {/* Company Legal Profile Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Legal Entity Profile</h3>
              <button
                onClick={() => onSelectTab('ca_profile')}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Edit Details
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Legal Entity</span>
                <span className="font-bold text-slate-900 truncate block">{currentCompany.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Director / MD</span>
                <span className="font-bold text-slate-900 truncate block">
                  {currentCompany.directorName || currentCompany.ownerName || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">GSTIN Registration</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[11px] inline-block">
                  {currentCompany.gstNumber || currentCompany.taxId || 'Pending'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">PAN Number</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[11px] inline-block">
                  {currentCompany.panNumber || 'Not provided'}
                </span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Registered Address</span>
                <p className="text-[11px] text-slate-700 leading-tight mt-0.5">
                  {currentCompany.address}, {currentCompany.city}, {currentCompany.state} - {currentCompany.pinCode}
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Standing Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Subscription & Capacity</h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active & Paid
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Plan Tier</span>
                <span className="font-bold text-purple-700 capitalize">{currentCompany.subscriptionPlan} Tier</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Monthly Fee</span>
                <span className="font-mono font-bold text-slate-900">₹{currentCompany.monthlyFee?.toLocaleString('en-IN') || '49,999'}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">License Ceiling</span>
                <span className="font-mono font-bold text-slate-900">{maxEmployees} Slots</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Slots Available</span>
                <span className="font-mono font-bold text-emerald-600">{remainingCapacity} Free</span>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('ca_subscription')}
              className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Manage Plan & Expand License</span>
            </button>
          </div>

          {/* Operational Verification Alerts */}
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs">
            <div className="flex items-center gap-2 text-blue-900 font-bold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Multi-Tenant Enterprise Isolation</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              All company documents, attendance punch logs, payroll calculations, and billing vouchers are strictly sandboxed within tenant <span className="font-mono font-bold">{currentCompany.tenantId}</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
