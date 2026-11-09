/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  MapPin,
  CalendarDays,
  Clock,
  Banknote,
  Receipt,
  FileText,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard,
  UserCheck,
  BarChart3,
  FolderOpen,
  LogOut,
  Lock,
  Layers,
  Calculator,
  LifeBuoy,
  BadgeCheck,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  pill?: string;
  comingSoon?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { role, currentCompany, logout } = useAuth();

  // Phase 2: Complete Super Admin Master Control Modules
  const superAdminNav: NavItem[] = [
    { id: 'sa_dashboard', label: 'Master Dashboard', icon: LayoutDashboard },
    { id: 'sa_companies', label: 'Company Directory', icon: Building2, badge: 'Live' },
    { id: 'sa_approvals', label: 'Approval Queue', icon: BadgeCheck, badge: 'KYC' },
    { id: 'sa_tenants', label: 'Tenant & Usage', icon: Layers },
    { id: 'sa_plans', label: 'Subscription Plans', icon: TrendingUp },
    { id: 'sa_subscriptions', label: 'Subscriptions', icon: FileText },
    { id: 'sa_billing_engine', label: 'Per-Emp Billing Engine', icon: Calculator },
    { id: 'sa_invoices', label: 'Subscription Invoices', icon: Receipt },
    { id: 'sa_payments', label: 'Payment Gateway', icon: CreditCard },
    { id: 'sa_users', label: 'Admin Team & RBAC', icon: UserCheck },
    { id: 'sa_support', label: 'Support Tickets', icon: LifeBuoy },
    { id: 'sa_audit', label: 'Platform Audit Trail', icon: ShieldCheck },
    { id: 'sa_settings', label: 'Platform Settings', icon: Settings },
  ];

  // Phase 3: Company Admin Navigation Items
  const companyAdminNav: NavItem[] = [
    { id: 'ca_dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ca_profile', label: 'Company Profile', icon: Building2 },
    { id: 'ca_users', label: 'Users & Staff', icon: Users, badge: 'Phase 3' },
    { id: 'ca_roles', label: 'Roles & Permissions', icon: ShieldCheck, badge: 'RBAC' },
    { id: 'ca_departments', label: 'Departments', icon: Layers },
    { id: 'ca_branches', label: 'Branches', icon: Building2 },
    // Phase 5: Client & Site Management Suite
    { id: 'ca_clients', label: 'Clients & Accounts', icon: Building2, badge: 'Phase 5' },
    { id: 'ca_sites', label: 'Sites & Posts (QR)', icon: MapPin, badge: 'Phase 5' },
    { id: 'ca_settings', label: 'Company Settings', icon: Settings },
    { id: 'ca_audit', label: 'Activity Logs', icon: FileText },
    // Phase 4: Live Employee HRMS Module
    { id: 'ca_employees', label: 'Employees (HRMS)', icon: UserCheck, badge: 'Phase 4' },
    // Future HRMS roadmap modules
    { id: 'ca_attendance', label: 'Attendance', icon: Clock, pill: 'Roadmap', comingSoon: true },
    { id: 'ca_roster', label: 'Shifts & Roster', icon: CalendarDays, pill: 'Roadmap', comingSoon: true },
    { id: 'ca_payroll', label: 'Payroll', icon: Banknote, pill: 'Roadmap', comingSoon: true },
    { id: 'ca_invoices', label: 'Invoices', icon: Receipt, pill: 'Roadmap', comingSoon: true },
    { id: 'ca_accounts', label: 'Accounts', icon: BarChart3, pill: 'Roadmap', comingSoon: true },
    { id: 'ca_documents', label: 'Documents', icon: FolderOpen, pill: 'Roadmap', comingSoon: true },
  ];

  const currentNav = role === 'super_admin' ? superAdminNav : companyAdminNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container with Navy Blue enterprise styling (#0B192C / slate-950) */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 flex flex-col bg-slate-950 text-slate-300 border-r border-slate-800 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Tenant info chip inside sidebar (when expanded) */}
        {!collapsed && (
          <div className="p-4 mx-3 mt-3 rounded-xl bg-slate-900/90 border border-slate-800/80">
            <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>{role === 'super_admin' ? 'Master Control' : 'Active Tenant'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="font-bold text-sm text-white truncate">
              {role === 'super_admin' ? 'Happiiz Global Hub' : currentCompany?.name || 'Company Portal'}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
              {role === 'super_admin' ? 'Super Admin Mode' : `ID: ${currentCompany?.tenantId || 'TEN-001'}`}
            </div>
          </div>
        )}

        {/* Navigation list */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {currentNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-300'
                  }`}
                />
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1 truncate">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-900/60 text-sky-300 border border-blue-700/50">
                        {item.badge}
                      </span>
                    )}
                    {item.pill && (
                      <span className="ml-1.5 px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {item.pill}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer actions: Logout & Collapse */}
        <div className="p-3 border-t border-slate-800/80 space-y-1">
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>

          <button
            onClick={onToggleCollapse}
            className="w-full hidden lg:flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
