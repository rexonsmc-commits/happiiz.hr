/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Building2,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Receipt,
  Calendar,
  Layers,
  ShieldCheck,
  ArrowUpRight,
  Filter,
  Plus,
  Search,
  ExternalLink,
} from 'lucide-react';
import { Company, TenantSubscription, SubscriptionInvoice, PaymentRecord } from '../../../types';

interface MasterMetricsDashboardProps {
  companies: Company[];
  subscriptions: TenantSubscription[];
  invoices: SubscriptionInvoice[];
  payments: PaymentRecord[];
  onSelectTab: (tab: string) => void;
  onOpenRegister: () => void;
}

export const MasterMetricsDashboard: React.FC<MasterMetricsDashboardProps> = ({
  companies,
  subscriptions,
  invoices,
  payments,
  onSelectTab,
  onOpenRegister,
}) => {
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 12 Real Metrics Computed
  const totalRegisteredCompanies = companies.length;
  const activeCompanies = companies.filter((c) => c.subscriptionStatus === 'active' && !c.isArchived).length;
  const pendingApproval = companies.filter(
    (c) => c.subscriptionStatus === 'pending' || c.verificationStatus === 'pending'
  ).length;
  const suspendedCompanies = companies.filter((c) => c.subscriptionStatus === 'suspended' && !c.isArchived).length;
  const trialCompanies = subscriptions.filter((s) => s.status === 'trial').length;
  const expiredSubscriptions = subscriptions.filter(
    (s) => s.status === 'expired' || s.status === 'grace_period'
  ).length;

  const totalActiveEmployees = companies.reduce((acc, c) => acc + (c.employeeCount || 0), 0);
  const totalRegisteredUsers = totalActiveEmployees + companies.length + 5;

  const monthlyRecurringRevenue = subscriptions
    .filter((s) => s.status === 'active' || s.status === 'trial')
    .reduce((sum, s) => sum + (s.calculatedMonthlyFee || s.minMonthlyFee || 0), 0);

  const totalSubscriptionRevenue = payments
    .filter((p) => p.status === 'successful')
    .reduce((sum, p) => sum + (p.totalAmount || 0), 0);

  const pendingSubscriptionPayments = invoices
    .filter((inv) => inv.status === 'pending' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  const now = new Date();
  const upcomingRenewals = subscriptions.filter((s) => {
    if (!s.nextRenewalDate || s.status === 'cancelled' || s.status === 'suspended') return false;
    const renewal = new Date(s.nextRenewalDate);
    const diffDays = Math.ceil((renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 15;
  }).length;

  const activePercent = totalRegisteredCompanies > 0 ? Math.round((activeCompanies / totalRegisteredCompanies) * 100) : 0;

  // Mini Chart Revenue Trend
  const revenueHistory = [
    { month: 'Jun', mrr: 24000, height: '35%' },
    { month: 'Jul', mrr: 38000, height: '48%' },
    { month: 'Aug', mrr: 52000, height: '62%' },
    { month: 'Sep', mrr: 68000, height: '75%' },
    { month: 'Oct', mrr: 84000, height: '88%' },
    { month: 'Nov', mrr: monthlyRecurringRevenue || 98000, height: '100%' },
  ];

  // Plan Distribution
  const tierCounts: Record<string, number> = { micro: 0, starter: 0, growth: 0, enterprise: 0 };
  companies.forEach((c) => {
    const tier = c.subscriptionPlan || 'starter';
    if (tierCounts[tier] !== undefined) tierCounts[tier]++;
    else tierCounts['starter']++;
  });

  const filteredCompanies = companies.filter((c) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.tenantId.toLowerCase().includes(q) ||
      c.adminEmail.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* 1. COMPACT COMMAND STRIP */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-700 flex items-center justify-center font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-slate-900 tracking-tight">Super Admin Platform Command</h1>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                Live Overview
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Multi-tenant architecture • {totalRegisteredCompanies} Companies • {totalActiveEmployees.toLocaleString('en-IN')} Total Workforce
            </p>
          </div>
        </div>

        {/* Quick Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600">
            {(['today', 'week', 'month', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setDateFilter(period)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold capitalize transition-all cursor-pointer ${
                  dateFilter === period ? 'bg-white text-blue-700 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenRegister}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Onboard Tenant</span>
          </button>
        </div>
      </div>

      {/* 2. HIGH-DENSITY 6-METRIC COMMAND GRID (Replaces 12 bloated cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Tenant Companies */}
        <div
          onClick={() => onSelectTab('sa_companies')}
          className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Tenants</span>
            <Building2 className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-1 text-xl font-black text-slate-900">{totalRegisteredCompanies}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
            {activeCompanies} Active ({activePercent}%)
          </div>
        </div>

        {/* Metric 2: Monthly Recurring Revenue */}
        <div
          onClick={() => onSelectTab('sa_invoices')}
          className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Platform MRR</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-1 text-xl font-black text-slate-900">
            ₹{(monthlyRecurringRevenue / 1000).toFixed(1)}k
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5 truncate">
            ₹{totalSubscriptionRevenue.toLocaleString('en-IN')} Total
          </div>
        </div>

        {/* Metric 3: Total Managed Workforce */}
        <div
          onClick={() => onSelectTab('sa_tenants')}
          className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs hover:border-sky-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Workforce Scale</span>
            <Users className="w-3.5 h-3.5 text-sky-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-1 text-xl font-black text-slate-900">{totalActiveEmployees}</div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
            {totalRegisteredUsers} Total Users
          </div>
        </div>

        {/* Metric 4: KYC Approval Queue */}
        <div
          onClick={() => onSelectTab('sa_approvals')}
          className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer group bg-amber-50/20"
        >
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending KYC</span>
            <Clock className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-1 text-xl font-black text-amber-800">{pendingApproval}</div>
          <div className="text-[10px] text-amber-700 font-bold mt-0.5 flex items-center gap-0.5">
            Review Queue →
          </div>
        </div>

        {/* Metric 5: Upcoming Renewals */}
        <div
          onClick={() => onSelectTab('sa_subscriptions')}
          className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Renewals (15d)</span>
            <Calendar className="w-3.5 h-3.5 text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-1 text-xl font-black text-slate-900">{upcomingRenewals}</div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
            {expiredSubscriptions} Expired
          </div>
        </div>

        {/* Metric 6: Unpaid Invoices */}
        <div
          onClick={() => onSelectTab('sa_invoices')}
          className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs hover:border-rose-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Unpaid Dues</span>
            <Receipt className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-1 text-xl font-black text-rose-700">
            ₹{(pendingSubscriptionPayments / 1000).toFixed(1)}k
          </div>
          <div className="text-[10px] text-rose-600 font-semibold mt-0.5">Overdue Accounts</div>
        </div>
      </div>

      {/* 3. TWO-COLUMN BALANCED COCKPIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (2 Cols): Growth Trends & Plan Adoption */}
        <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wide">MRR & Subscription Growth</h2>
              <p className="text-[11px] text-slate-500">Monthly subscription billing trend across all onboarded agencies</p>
            </div>
            <span className="font-mono text-xs font-black text-blue-700">₹{monthlyRecurringRevenue.toLocaleString('en-IN')}/mo</span>
          </div>

          {/* Compact Mini Bar Chart */}
          <div className="grid grid-cols-6 gap-2 pt-2 items-end h-28">
            {revenueHistory.map((item) => (
              <div key={item.month} className="flex flex-col items-center h-full justify-end group">
                <span className="text-[9px] font-mono font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                  ₹{(item.mrr / 1000).toFixed(0)}k
                </span>
                <div className="w-full bg-slate-100 rounded-t-md h-20 flex items-end overflow-hidden p-0.5">
                  <div
                    className="w-full bg-blue-600 rounded-t-sm transition-all duration-500 group-hover:bg-blue-700"
                    style={{ height: item.height }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-500 mt-1.5">{item.month}</span>
              </div>
            ))}
          </div>

          {/* Plan Distribution Badges Strip */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs flex-wrap gap-2">
            <span className="text-[11px] font-bold text-slate-500">Plan Distribution:</span>
            <div className="flex items-center gap-3">
              {[
                { plan: 'Micro (≤20)', count: tierCounts.micro, color: 'text-slate-700' },
                { plan: 'Starter (≤100)', count: tierCounts.starter, color: 'text-blue-700' },
                { plan: 'Growth (≤300)', count: tierCounts.growth, color: 'text-indigo-700' },
                { plan: 'Enterprise (300+)', count: tierCounts.enterprise, color: 'text-purple-700' },
              ].map((p) => (
                <div key={p.plan} className="flex items-center gap-1 text-[11px]">
                  <span className="text-slate-500">{p.plan}:</span>
                  <strong className={`font-mono ${p.color}`}>{p.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Immediate Action Queue & Alerts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wide">Action Queue</h2>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              {pendingApproval} Pending Review
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {pendingApproval > 0 ? (
              <div
                onClick={() => onSelectTab('sa_approvals')}
                className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 hover:border-amber-300 transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-amber-900 block">{pendingApproval} New Tenant Applications</span>
                  <span className="text-[11px] text-amber-700">Awaiting Super Admin KYC verification</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-amber-700 shrink-0" />
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-center text-[11px]">
                Approval queue is clear. No pending KYC applications.
              </div>
            )}

            <div
              onClick={() => onSelectTab('sa_subscriptions')}
              className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-slate-800 block">{upcomingRenewals} Subscriptions Expiring Soon</span>
                <span className="text-[11px] text-slate-500">Scheduled for monthly renewal within 15 days</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 shrink-0" />
            </div>

            <div
              onClick={() => onSelectTab('sa_invoices')}
              className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-slate-800 block">Pending Invoices (₹{(pendingSubscriptionPayments / 1000).toFixed(0)}k)</span>
                <span className="text-[11px] text-slate-500">Unsettled platform subscription invoices</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. COMPACT TENANTS DIRECTORY TABLE */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">Registered Client Agencies</h3>
            <p className="text-[11px] text-slate-500">Direct switchboard into tenant environments</p>
          </div>

          <div className="relative">
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search tenant name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-3 py-1 text-xs rounded-lg border border-slate-200 w-52 focus:outline-blue-600 bg-slate-50"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] sticky top-0 z-10 border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3.5">Tenant ID</th>
                <th className="py-2.5 px-3.5">Company Name</th>
                <th className="py-2.5 px-3.5">Industry Sector</th>
                <th className="py-2.5 px-3.5">Plan Tier</th>
                <th className="py-2.5 px-3.5 text-center">Workforce</th>
                <th className="py-2.5 px-3.5 text-center">Status</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredCompanies.slice(0, 8).map((comp) => (
                <tr key={comp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3.5 font-mono font-bold text-blue-700">{comp.tenantId}</td>
                  <td className="py-2.5 px-3.5">
                    <div className="font-bold text-slate-900">{comp.name}</div>
                    <div className="text-[10px] text-slate-400">{comp.adminEmail}</div>
                  </td>
                  <td className="py-2.5 px-3.5 capitalize text-slate-600 text-[11px]">
                    {comp.industry.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3.5 capitalize font-bold text-slate-700 text-[11px]">
                    {comp.subscriptionPlan}
                  </td>
                  <td className="py-2.5 px-3.5 text-center font-mono font-bold text-slate-800">
                    {comp.employeeCount} / {comp.maxEmployees}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        comp.subscriptionStatus === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : comp.subscriptionStatus === 'pending'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {comp.subscriptionStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <button
                      onClick={() => onSelectTab('sa_companies')}
                      className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] cursor-pointer transition-colors"
                    >
                      Manage →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
