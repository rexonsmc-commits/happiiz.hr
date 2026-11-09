/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SubscriptionPlanItem, TenantSubscription } from '../../types';
import { getSubscriptionPlans, getAllSubscriptions } from '../../services/platformService';
import {
  CreditCard,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Users,
  Shield,
  Zap,
  ArrowRight,
  Sparkles,
  Receipt,
  Check,
  X,
} from 'lucide-react';

interface SubscriptionModuleProps {
  onOpenUpgradeModal?: () => void;
}

export const SubscriptionModule: React.FC<SubscriptionModuleProps> = () => {
  const { currentCompany } = useAuth();

  const [plans, setPlans] = useState<SubscriptionPlanItem[]>([]);
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>('growth');
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'annual'>('monthly');
  const [upgradeSubmitted, setUpgradeSubmitted] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, [currentCompany]);

  async function loadSubscriptionData() {
    if (!currentCompany) return;
    setLoading(true);
    try {
      const [allPlans, allSubs] = await Promise.all([
        getSubscriptionPlans(),
        getAllSubscriptions(),
      ]);
      setPlans(allPlans);

      const matchedSub = allSubs.find((s: TenantSubscription) => s.companyId === currentCompany.id);
      if (matchedSub) {
        setSubscription(matchedSub);
      }
    } catch (err) {
      console.error('Failed to load subscription data:', err);
    } finally {
      setLoading(false);
    }
  }

  const currentPlan = plans.find((p) => p.code === currentCompany?.subscriptionPlan) || {
    name: (currentCompany?.subscriptionPlan || 'Enterprise').toUpperCase(),
    code: currentCompany?.subscriptionPlan || 'enterprise',
    pricePerEmployee: 45,
    minMonthlyFee: currentCompany?.monthlyFee || 49999,
    minEmployees: 1,
    maxEmployees: currentCompany?.maxEmployees || 1000,
  };

  const employeeCount = currentCompany?.employeeCount || 0;
  const maxEmployees = currentCompany?.maxEmployees || 1000;
  const remainingCapacity = Math.max(0, maxEmployees - employeeCount);
  const usagePercentage = Math.min(100, Math.round((employeeCount / maxEmployees) * 100));

  function handleRequestUpgrade(e: React.FormEvent) {
    e.preventDefault();
    setUpgradeSubmitted(true);
    setTimeout(() => {
      setUpgradeSubmitted(false);
      setIsUpgradeModalOpen(false);
    }, 3000);
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {currentCompany?.tenantId}
            </span>
            <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
              SaaS Billing & Tier
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900">Subscription & Employee Licensing</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor licensed workforce quota, renewal schedule, and connected Phase 2 per-employee billing engine.
          </p>
        </div>

        <button
          onClick={() => setIsUpgradeModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Upgrade Licensing Plan</span>
        </button>
      </div>

      {/* Main Tier Overview & Meter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan Overview Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Current Active Plan</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
              {currentCompany?.subscriptionStatus}
            </span>
          </div>

          <div>
            <h2 className="text-3xl font-black text-white capitalize">{currentCompany?.subscriptionPlan} Tier</h2>
            <p className="text-xs text-slate-400 mt-1">
              ₹{currentCompany?.monthlyFee?.toLocaleString('en-IN') || '49,999'} / month (Base Flat Rate)
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Payment Status:</span>
              <span className="text-emerald-400 font-bold">In Good Standing</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Billing Cycle:</span>
              <span className="text-white font-medium">Monthly Postpaid</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Next Renewal:</span>
              <span className="font-mono text-sky-300">
                {subscription?.nextRenewalDate
                  ? new Date(subscription.nextRenewalDate).toLocaleDateString()
                  : '30 Nov 2026'}
              </span>
            </div>
          </div>
        </div>

        {/* Capacity Meter */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Workforce License Capacity Meter</h3>
              <p className="text-xs text-slate-500">Live active guards & staff against your maximum licensed quota</p>
            </div>
            <span className="text-sm font-black text-blue-600">{usagePercentage}% Utilized</span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usagePercentage > 90
                    ? 'bg-rose-500'
                    : usagePercentage > 75
                    ? 'bg-amber-500'
                    : 'bg-blue-600'
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>0 Employees</span>
              <span>Capacity Ceiling: {maxEmployees} Employees</span>
            </div>
          </div>

          {/* Stat Chips */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Active Count</span>
              <div className="text-xl font-black text-slate-900 mt-0.5">{employeeCount}</div>
              <span className="text-[10px] text-slate-500">Current Workforce</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">License Floor</span>
              <div className="text-xl font-black text-slate-900 mt-0.5">{maxEmployees}</div>
              <span className="text-[10px] text-slate-500">Total Headroom</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-800 uppercase">Remaining</span>
              <div className="text-xl font-black text-emerald-700 mt-0.5">{remainingCapacity}</div>
              <span className="text-[10px] text-emerald-600">Available Seats</span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Plans & Features Comparison */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900">Happiiz HR Subscription Plans Overview</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              name: 'Micro Agency',
              code: 'micro',
              range: '1 – 50 Guards',
              price: '₹4,999/mo',
              features: ['Up to 50 employees', '2 client sites', 'Basic duty roster', 'Email alerts'],
            },
            {
              name: 'Starter Tier',
              code: 'starter',
              range: '51 – 150 Guards',
              price: '₹12,499/mo',
              features: ['Up to 150 employees', '10 client sites', 'GPS geofenced punch', 'Standard reports'],
            },
            {
              name: 'Growth Enterprise',
              code: 'growth',
              range: '151 – 500 Guards',
              price: '₹24,999/mo',
              features: ['Up to 500 employees', 'Unlimited sites', 'Multi-shift roster', 'Automated GST billing'],
              isPopular: true,
            },
            {
              name: 'Custom Corporate',
              code: 'enterprise',
              range: '500+ Workforce',
              price: 'Custom Scale',
              features: ['Unlimited workforce', 'Dedicated branch hubs', '24/7 priority SLA', 'Custom API access'],
            },
          ].map((plan) => {
            const isCurrent = currentCompany?.subscriptionPlan === plan.code;
            return (
              <div
                key={plan.code}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-slate-900">{plan.name}</span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-600 text-white">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-blue-700">{plan.price}</div>
                  <div className="text-[10px] text-slate-500 font-mono mb-3">{plan.range}</div>

                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  {isCurrent ? (
                    <span className="text-center block text-xs font-bold text-blue-600 py-1">
                      Current Plan
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedPlanCode(plan.code);
                        setIsUpgradeModalOpen(true);
                      }}
                      className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Select Plan
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade Request Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Upgrade Subscription Tier</h3>
                <p className="text-xs text-slate-500">Request expansion of workforce capacity.</p>
              </div>
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {upgradeSubmitted ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Upgrade Request Forwarded</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your request has been routed to the Super Admin Billing Engine. A revised GST pro-forma invoice will be issued.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestUpgrade} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Subscription Tier</label>
                  <select
                    value={selectedPlanCode}
                    onChange={(e) => setSelectedPlanCode(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="growth">Growth Enterprise (Up to 500 Guards • ₹24,999/mo)</option>
                    <option value="enterprise">Custom Corporate (500+ Guards • Custom Scale)</option>
                    <option value="starter">Starter Tier (Up to 150 Guards • ₹12,499/mo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Billing Frequency</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCycle('monthly')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedCycle === 'monthly'
                          ? 'border-blue-600 bg-blue-50 text-blue-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCycle('annual')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedCycle === 'annual'
                          ? 'border-blue-600 bg-blue-50 text-blue-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Annual (15% Discount)
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  <div className="font-bold text-slate-900 mb-1">Billing Terms:</div>
                  Upgrading increases your licensed headroom instantly upon Super Admin confirmation. Prorated adjustments will reflect in your next invoice.
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsUpgradeModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                  >
                    Submit Upgrade Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
