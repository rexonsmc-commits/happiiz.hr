/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  CreditCard,
  Edit2,
  Plus,
  RefreshCw,
  Search,
  Filter,
  X,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import {
  TenantSubscription,
  SubscriptionPlanItem,
  Company,
} from '../../../types';
import { updateSubscription } from '../../../services/platformService';
import { evaluateRenewalUrgency } from '../../../services/billingEngine';

interface SubscriptionManagementModuleProps {
  subscriptions: TenantSubscription[];
  plans: SubscriptionPlanItem[];
  companies: Company[];
  onRefresh: () => void;
  adminEmail: string;
}

export const SubscriptionManagementModule: React.FC<SubscriptionManagementModuleProps> = ({
  subscriptions,
  plans,
  companies,
  onRefresh,
  adminEmail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSubForEdit, setSelectedSubForEdit] = useState<TenantSubscription | null>(null);
  const [editPlanCode, setEditPlanCode] = useState('');
  const [editStatus, setEditStatus] = useState<TenantSubscription['status']>('active');
  const [editDaysToAdd, setEditDaysToAdd] = useState<number>(30);
  const [editDiscount, setEditDiscount] = useState<number>(0);
  const [editNotes, setEditNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Evaluate renewal urgency for each subscription
  const subWithAlerts = subscriptions.map((sub) => {
    const alert = evaluateRenewalUrgency(sub.nextRenewalDate, sub.gracePeriodEndDate);
    return { ...sub, alert };
  });

  // Urgent alerts list (renewing in 15 days or less, or in grace, or expired)
  const urgentAlerts = subWithAlerts.filter(
    (s) => ['expired', 'in_grace_period', 'today', '3_days', '7_days', '15_days'].includes(s.alert.urgency)
  );

  const filtered = subWithAlerts.filter((s) => {
    const matchesSearch =
      s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.tenantId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.planName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenEdit = (sub: TenantSubscription) => {
    setSelectedSubForEdit(sub);
    setEditPlanCode(sub.planCode);
    setEditStatus(sub.status);
    setEditDiscount(sub.discountPercent || 0);
    setEditNotes(sub.notes || '');
  };

  const handleSaveSubChanges = async () => {
    if (!selectedSubForEdit) return;
    setIsUpdating(true);
    try {
      const selectedPlan = plans.find((p) => p.code === editPlanCode) || plans[0];
      const rate = selectedPlan.pricePerEmployee;
      const minFee = selectedPlan.minMonthlyFee;
      const calculatedFee = Math.max(minFee, (selectedSubForEdit.billableEmployees || 25) * rate);

      // Extend date if requested
      const renewalDate = new Date(selectedSubForEdit.nextRenewalDate || new Date());
      if (editDaysToAdd !== 0) {
        renewalDate.setDate(renewalDate.getDate() + editDaysToAdd);
      }

      await updateSubscription(
        selectedSubForEdit.id,
        {
          planCode: selectedPlan.code,
          planName: selectedPlan.name,
          ratePerEmployee: rate,
          minMonthlyFee: minFee,
          calculatedMonthlyFee: calculatedFee,
          status: editStatus,
          discountPercent: editDiscount,
          nextRenewalDate: renewalDate.toISOString(),
          notes: editNotes,
        },
        adminEmail,
        `Subscription modified: Plan ${selectedPlan.name}, Status ${editStatus}`
      );

      setSelectedSubForEdit(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Tenant Subscription Central</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
              Automated Lifecycle
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Track active billing terms, per-employee recurring rates, renewal countdowns, grace period governance, and plan changes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search tenant or plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 w-56"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-700 focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="grace_period">Grace Period</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="suspended">Suspended</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Urgent Renewal & Expiry Alerts Carousel */}
      {urgentAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-amber-900 font-extrabold text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Automated Renewal Monitoring ({urgentAlerts.length} Action Items)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {urgentAlerts.slice(0, 6).map((sub) => (
              <div
                key={sub.id}
                onClick={() => handleOpenEdit(sub)}
                className="p-3 rounded-xl bg-white border border-amber-200/90 shadow-2xs hover:border-amber-400 cursor-pointer flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 truncate max-w-[170px]">{sub.companyName}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Plan: {sub.planName} (₹{sub.calculatedMonthlyFee}/mo)
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] border font-bold ${sub.alert.badgeClass}`}>
                  {sub.alert.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Subscriptions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Company Name</th>
                <th className="px-4 py-3.5">Plan Tier</th>
                <th className="px-4 py-3.5">Workforce Headcount</th>
                <th className="px-4 py-3.5">Billing Amount</th>
                <th className="px-4 py-3.5">Billing Cycle</th>
                <th className="px-4 py-3.5">Start Date</th>
                <th className="px-4 py-3.5">Next Renewal</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-400">
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => {
                  const startDate = sub.startDate ? new Date(sub.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
                  const renewalDate = sub.nextRenewalDate ? new Date(sub.nextRenewalDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold text-slate-900 text-xs">{sub.companyName}</div>
                        <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-bold">
                          {sub.tenantId}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-800 text-[10px] uppercase">
                          {sub.planName}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          Rate: ₹{sub.ratePerEmployee}/emp
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800 font-mono text-xs">
                          {sub.billableEmployees || sub.currentEmployees} Billable
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {sub.currentEmployees} On Roster
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-black text-slate-900 text-xs font-mono">
                          ₹{sub.calculatedMonthlyFee.toLocaleString('en-IN')}
                        </div>
                        {sub.discountPercent > 0 && (
                          <span className="text-[9px] font-bold text-emerald-600">
                            {sub.discountPercent}% Discount
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 uppercase font-mono text-[11px] text-slate-600">
                        {sub.billingCycle}
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                        {startDate}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-mono text-[11px] text-slate-800 font-bold">{renewalDate}</div>
                        <span className={`inline-block px-1.5 py-0.2 text-[9px] font-bold rounded-sm mt-0.5 ${sub.alert.badgeClass}`}>
                          {sub.alert.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            sub.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.status === 'suspended'
                              ? 'bg-rose-100 text-rose-800'
                              : sub.status === 'trial'
                              ? 'bg-indigo-100 text-indigo-800'
                              : sub.status === 'grace_period'
                              ? 'bg-red-100 text-red-900 animate-pulse'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sub.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenEdit(sub)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1 ml-auto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Manage</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Manage Subscription Terms */}
      {selectedSubForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold">
                  {selectedSubForEdit.tenantId}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Manage Subscription: {selectedSubForEdit.companyName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubForEdit(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assign Plan Tier</label>
                  <select
                    value={editPlanCode}
                    onChange={(e) => setEditPlanCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-blue-600"
                  >
                    {plans.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name} (₹{p.pricePerEmployee}/emp, Floor ₹{p.minMonthlyFee})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subscription Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="grace_period">Grace Period</option>
                    <option value="pending_payment">Pending Payment</option>
                    <option value="payment_failed">Payment Failed</option>
                    <option value="suspended">Suspended</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Extend Renewal Date By</label>
                  <select
                    value={editDaysToAdd}
                    onChange={(e) => setEditDaysToAdd(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-blue-600"
                  >
                    <option value={0}>Keep Existing Date</option>
                    <option value={7}>+7 Days (Grace Period)</option>
                    <option value={14}>+14 Days (Trial Extension)</option>
                    <option value={30}>+30 Days (1 Month)</option>
                    <option value={90}>+90 Days (Quarterly)</option>
                    <option value={365}>+365 Days (1 Year)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Apply Discount (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editDiscount}
                    onChange={(e) => setEditDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Administrative Audit Reason / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Reason for changing plan or extending date..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedSubForEdit(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSubChanges}
                disabled={isUpdating}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
              >
                {isUpdating ? 'Updating...' : 'Save Subscription Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
