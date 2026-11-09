/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  Check,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Archive,
  Layers,
  X,
  Sparkles,
} from 'lucide-react';
import { SubscriptionPlanItem } from '../../../types';
import { saveSubscriptionPlan, togglePlanStatus } from '../../../services/platformService';

interface SubscriptionPlansModuleProps {
  plans: SubscriptionPlanItem[];
  onRefresh: () => void;
  adminEmail: string;
}

export const SubscriptionPlansModule: React.FC<SubscriptionPlansModuleProps> = ({
  plans,
  onRefresh,
  adminEmail,
}) => {
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<SubscriptionPlanItem>>({});
  const [featureInput, setFeatureInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenCreate = () => {
    setIsCreating(true);
    setEditingPlan(null);
    setFormData({
      name: '',
      code: '',
      minEmployees: 1,
      maxEmployees: 100,
      pricePerEmployee: 15,
      minMonthlyFee: 500,
      billingCycle: 'monthly',
      annualDiscountPercent: 15,
      trialDays: 14,
      gracePeriodDays: 7,
      features: ['Attendance Tracking', 'Shift Scheduling', 'Standard Invoicing'],
      storageLimitMb: 5000,
      apiCallsLimit: 50000,
      status: 'active',
      description: '',
    });
  };

  const handleOpenEdit = (plan: SubscriptionPlanItem) => {
    setIsCreating(false);
    setEditingPlan(plan);
    setFormData({ ...plan });
  };

  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    const current = formData.features || [];
    setFormData({ ...formData, features: [...current, featureInput.trim()] });
    setFeatureInput('');
  };

  const handleRemoveFeature = (idx: number) => {
    const current = [...(formData.features || [])];
    current.splice(idx, 1);
    setFormData({ ...formData, features: current });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) return;
    setIsSaving(true);
    try {
      await saveSubscriptionPlan(formData as SubscriptionPlanItem, adminEmail);
      setIsCreating(false);
      setEditingPlan(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (planId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await togglePlanStatus(planId, nextStatus as any, adminEmail);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Dynamic Subscription Plans</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
              Configurable Pricing
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure rates per employee, monthly minimum floors, feature bundles, trial days, and grace periods. Prices are dynamically resolved by the backend billing engine.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Plan</span>
        </button>
      </div>

      {/* Plans Card Deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {plans.map((plan) => {
          const isActive = plan.status === 'active';
          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                plan.isPopular ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200'
              } ${!isActive ? 'opacity-70 bg-slate-50' : ''}`}
            >
              <div>
                {/* Popular Chip */}
                {plan.isPopular && (
                  <div className="mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 w-max">
                      <Sparkles className="w-3 h-3" /> Most Popular
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900">{plan.name}</h3>
                    <span className="font-mono text-[10px] text-slate-400 uppercase">Code: {plan.code}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {plan.status}
                  </span>
                </div>

                {/* Price Display */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">
                      ₹{plan.pricePerEmployee > 0 ? plan.pricePerEmployee : plan.minMonthlyFee}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {plan.pricePerEmployee > 0 ? '/ emp / mo' : 'flat min/mo'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Floor: <strong>₹{plan.minMonthlyFee}/mo</strong>
                  </div>
                </div>

                {/* Range & Limits */}
                <div className="mt-3 py-2 px-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Headcount:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {plan.minEmployees}–{plan.maxEmployees.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Trial / Grace:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {plan.trialDays}d / {plan.gracePeriodDays}d
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Annual Discount:</span>
                    <span className="font-bold text-emerald-600 font-mono">
                      {plan.annualDiscountPercent}% OFF
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div className="mt-4 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Features Included</span>
                  {plan.features?.slice(0, 4).map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-700">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-snug text-[11px]">{feat}</span>
                    </div>
                  ))}
                  {(plan.features?.length || 0) > 4 && (
                    <div className="text-[10px] text-blue-600 font-bold pl-5">
                      +{(plan.features?.length || 0) - 4} more capabilities
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleStatus(plan.id, plan.status)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                    isActive ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {isActive ? 'Deactivate' : 'Activate'}
                </button>

                <button
                  onClick={() => handleOpenEdit(plan)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1 text-xs font-bold"
                  title="Edit Plan Parameters"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT MODAL */}
      {(isCreating || editingPlan) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {isCreating ? 'Create New Subscription Plan' : `Edit Plan: ${editingPlan?.name}`}
                </h3>
                <p className="text-xs text-slate-500">
                  Define per-employee rates, floor fees, and operational quotas.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingPlan(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Plan Display Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. GROWTH TIER"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Plan Code (Key) *</label>
                  <input
                    type="text"
                    placeholder="e.g. growth"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().trim() })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Price Per Employee (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.pricePerEmployee ?? 15}
                    onChange={(e) => setFormData({ ...formData, pricePerEmployee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="text-[10px] text-slate-400">Set 0 for flat fee plan</span>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Minimum Monthly Fee Floor (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.minMonthlyFee ?? 500}
                    onChange={(e) => setFormData({ ...formData, minMonthlyFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="text-[10px] text-slate-400">Base fee regardless of count</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Employees</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.minEmployees ?? 1}
                    onChange={(e) => setFormData({ ...formData, minEmployees: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Employees</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxEmployees ?? 500}
                    onChange={(e) => setFormData({ ...formData, maxEmployees: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trial Period (Days)</label>
                  <input
                    type="number"
                    value={formData.trialDays ?? 14}
                    onChange={(e) => setFormData({ ...formData, trialDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Grace Period (Days)</label>
                  <input
                    type="number"
                    value={formData.gracePeriodDays ?? 7}
                    onChange={(e) => setFormData({ ...formData, gracePeriodDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Annual Discount (%)</label>
                  <input
                    type="number"
                    value={formData.annualDiscountPercent ?? 15}
                    onChange={(e) => setFormData({ ...formData, annualDiscountPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Feature Checklist Editor */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Features & Entitlements</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Type feature name..."
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-bold"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
                  {formData.features?.map((feat, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-medium text-slate-800 flex items-center gap-1"
                    >
                      <span>{feat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingPlan(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.name || !formData.code}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
              >
                {isSaving ? 'Saving Plan...' : 'Save Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
