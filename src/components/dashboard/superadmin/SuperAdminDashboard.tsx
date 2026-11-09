/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  Company,
  AuditLog,
  TenantSubscription,
  SubscriptionPlanItem,
  SubscriptionInvoice,
  PaymentRecord,
  PlatformSettings,
  PlatformAdminUser,
  SupportTicket,
} from '../../../types';
import { getAuditLogs } from '../../../services/tenantService';
import {
  getAllSubscriptions,
  getSubscriptionPlans,
  getAllInvoices,
  getAllPayments,
  getPlatformSettings,
  getPlatformAdmins,
  getSupportTickets,
} from '../../../services/platformService';

import { MasterMetricsDashboard } from './MasterMetricsDashboard';
import { CompanyManagementModule } from './CompanyManagementModule';
import { ApprovalQueueModule } from './ApprovalQueueModule';
import { TenantUsageModule } from './TenantUsageModule';
import { SubscriptionPlansModule } from './SubscriptionPlansModule';
import { SubscriptionManagementModule } from './SubscriptionManagementModule';
import { BillingEngineModule } from './BillingEngineModule';
import { InvoicesModule } from './InvoicesModule';
import { PaymentsModule } from './PaymentsModule';
import { AdminTeamModule } from './AdminTeamModule';
import { SupportManagementModule } from './SupportManagementModule';
import { PlatformSettingsModule } from './PlatformSettingsModule';

import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Plus,
  BookOpen,
} from 'lucide-react';

interface SuperAdminDashboardProps {
  activeTab: string;
  onOpenRegister: () => void;
  onSwitchToCompany: (company: Company) => void;
  onOpenDocs: () => void;
  onSelectTab?: (tab: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  activeTab,
  onOpenRegister,
  onSwitchToCompany,
  onOpenDocs,
  onSelectTab = () => {},
}) => {
  const { availableCompanies, refreshCompanies, currentUser } = useAuth();
  const adminEmail = currentUser?.email || 'rexon.smc@gmail.com';

  // Platform Data state
  const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>([]);
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>({
    platformName: 'Happiiz HR',
    platformLogo: '',
    supportEmail: 'support@happiiz.io',
    supportPhone: '+91 800 234 5678',
    defaultCurrency: 'INR',
    defaultTimeZone: 'Asia/Kolkata',
    defaultLanguage: 'en',
    requireApprovalForRegistration: true,
    defaultTrialDays: 14,
    defaultGracePeriodDays: 7,
    defaultGstRate: 18,
    isInterStateIgstDefault: false,
    invoicePrefix: 'HAP-INV-',
    nextInvoiceSeq: 1045,
    maintenanceMode: false,
    companyTermsUrl: '',
    privacyPolicyUrl: '',
  });
  const [admins, setAdmins] = useState<PlatformAdminUser[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Audit filter state
  const [auditCategory, setAuditCategory] = useState<string>('all');
  const [auditSearch, setAuditSearch] = useState<string>('');

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [
        subsData,
        plansData,
        invsData,
        paysData,
        settData,
        admsData,
        tcksData,
        logsData,
      ] = await Promise.all([
        getAllSubscriptions(),
        getSubscriptionPlans(),
        getAllInvoices(),
        getAllPayments(),
        getPlatformSettings(),
        getPlatformAdmins(),
        getSupportTickets(),
        getAuditLogs(),
      ]);

      setSubscriptions(subsData);
      setPlans(plansData);
      setInvoices(invsData);
      setPayments(paysData);
      setSettings(settData);
      setAdmins(admsData);
      setTickets(tcksData);
      setAuditLogs(logsData);
    } catch (err) {
      console.error('Error loading platform records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [availableCompanies]);

  const handleRefreshEverything = async () => {
    await refreshCompanies();
    await loadAllData();
  };

  // Filter audit logs
  const filteredLogs = auditLogs.filter((log) => {
    const matchesCategory = auditCategory === 'all' || log.category === auditCategory;
    const matchesSearch =
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.actorEmail.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.tenantId.toLowerCase().includes(auditSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Universal Quick Action Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-sky-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-sky-400">
                Happiiz HR • Master Control
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-slate-400 font-mono">Phase 2 Active</span>
            </div>
            <div className="text-sm font-bold text-white mt-0.5 truncate">
              Signed in as: <span className="font-mono text-sky-300">{adminEmail}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenDocs}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Architecture Specs</span>
          </button>

          <button
            onClick={handleRefreshEverything}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh All Records from Firestore"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onOpenRegister}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Tenant</span>
          </button>
        </div>
      </div>

      {/* Module 1: Master Dashboard & 12 KPIs */}
      {activeTab === 'sa_dashboard' && (
        <MasterMetricsDashboard
          companies={availableCompanies}
          subscriptions={subscriptions}
          invoices={invoices}
          payments={payments}
          onSelectTab={onSelectTab}
          onOpenRegister={onOpenRegister}
        />
      )}

      {/* Module 2: Company Directory & Lifecycle Management */}
      {activeTab === 'sa_companies' && (
        <CompanyManagementModule
          companies={availableCompanies}
          onRefresh={handleRefreshEverything}
          onOpenRegister={onOpenRegister}
          onSwitchToCompany={onSwitchToCompany}
          adminEmail={adminEmail}
        />
      )}

      {/* Module 3: KYC & Registration Approval Queue */}
      {activeTab === 'sa_approvals' && (
        <ApprovalQueueModule
          companies={availableCompanies}
          onRefresh={handleRefreshEverything}
          adminEmail={adminEmail}
        />
      )}

      {/* Module 4: Tenant Isolation & Usage Monitoring */}
      {activeTab === 'sa_tenants' && (
        <TenantUsageModule
          companies={availableCompanies}
          onRefresh={handleRefreshEverything}
          onSwitchToCompany={onSwitchToCompany}
          adminEmail={adminEmail}
        />
      )}

      {/* Module 5: Subscription Plans (Micro, Starter, Growth, Enterprise, Custom) */}
      {activeTab === 'sa_plans' && (
        <SubscriptionPlansModule
          plans={plans}
          onRefresh={handleRefreshEverything}
          adminEmail={adminEmail}
        />
      )}

      {/* Module 6: Subscriptions & Renewal Countdown Engine */}
      {activeTab === 'sa_subscriptions' && (
        <SubscriptionManagementModule
          subscriptions={subscriptions}
          plans={plans}
          companies={availableCompanies}
          onRefresh={handleRefreshEverything}
          adminEmail={adminEmail}
        />
      )}

      {/* Module 7: Per-Employee Billing Engine & Formula Simulator */}
      {activeTab === 'sa_billing_engine' && (
        <BillingEngineModule plans={plans} />
      )}

      {/* Module 8: Subscription Invoices (GST & Printable) */}
      {activeTab === 'sa_invoices' && (
        <InvoicesModule
          invoices={invoices}
          companies={availableCompanies}
          plans={plans}
          settings={settings}
          onRefresh={handleRefreshEverything}
          adminEmail={adminEmail}
        />
      )}

      {/* Module 9: Payment Gateway & Reconciliation */}
      {activeTab === 'sa_payments' && (
        <PaymentsModule
          payments={payments}
          companies={availableCompanies}
          invoices={invoices}
          onRefresh={handleRefreshEverything}
          adminEmail={adminEmail}
        />
      )}

      {/* Module 10: Admin Team & RBAC Permissions */}
      {activeTab === 'sa_users' && (
        <AdminTeamModule
          admins={admins}
          onRefresh={handleRefreshEverything}
          currentAdminEmail={adminEmail}
        />
      )}

      {/* Module 11: Customer Support & Help Desk */}
      {activeTab === 'sa_support' && (
        <SupportManagementModule
          tickets={tickets}
          companies={availableCompanies}
          onRefresh={handleRefreshEverything}
          adminEmail={adminEmail}
        />
      )}

      {/* Module 12: Platform Audit Trail (Immutable Log) */}
      {activeTab === 'sa_audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">Immutable Platform Audit Trail</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                  Write-Once • No Edits
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cryptographic and administrative log of company verifications, plan transitions, status updates, and security events.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter logs by keyword..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 w-52"
                />
              </div>

              <select
                value={auditCategory}
                onChange={(e) => setAuditCategory(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 text-slate-700 font-bold"
              >
                <option value="all">All Categories</option>
                <option value="billing">Billing & Payments</option>
                <option value="approval">Company KYC / Approval</option>
                <option value="tenant">Tenant Lifecycle</option>
                <option value="role">RBAC & Roles</option>
                <option value="security">Security & Auth</option>
                <option value="settings">Global Settings</option>
              </select>
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No audit log entries match your filter.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="font-mono text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded font-bold">
                        {log.tenantId}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-sm bg-slate-200 text-slate-700 text-[10px] uppercase font-bold">
                        {log.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{log.details}</p>
                    {log.reason && (
                      <div className="text-[11px] text-slate-500 italic">
                        Reason: {log.reason}
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[11px] font-mono text-slate-700 font-bold">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                      {log.actorEmail}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Module 13: Platform Settings */}
      {activeTab === 'sa_settings' && (
        <PlatformSettingsModule
          settings={settings}
          onRefresh={handleRefreshEverything}
          adminEmail={adminEmail}
        />
      )}
    </div>
  );
};
