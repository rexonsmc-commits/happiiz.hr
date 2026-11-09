/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calculator,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Receipt,
  Users,
  Building2,
  Calendar,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { SubscriptionPlanItem, EmployeeCountSnapshot } from '../../../types';
import { calculateSubscriptionFee } from '../../../services/billingEngine';

interface BillingEngineModuleProps {
  plans: SubscriptionPlanItem[];
}

export const BillingEngineModule: React.FC<BillingEngineModuleProps> = ({ plans }) => {
  // Live Simulator State
  const [activeEmployees, setActiveEmployees] = useState<number>(200);
  const [onLeaveEmployees, setOnLeaveEmployees] = useState<number>(10);
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>('growth');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isInterState, setIsInterState] = useState<boolean>(false);

  const selectedPlan = plans.find((p) => p.code === selectedPlanCode) || plans[2] || plans[0];

  // Calculate live results via the trusted billing engine
  const calcResult = calculateSubscriptionFee({
    activeEmployees,
    onLeaveEmployees,
    plan: selectedPlan,
    billingCycle,
    discountPercent,
    isInterState,
  });

  // Sample historical snapshots
  const snapshots: EmployeeCountSnapshot[] = [
    {
      id: 'snap_01',
      tenantId: 'TEN-SEC-001',
      companyId: 'comp_sec_01',
      period: 'Nov 2026',
      activeEmployees: 232,
      onLeaveEmployees: 8,
      terminatedEmployees: 14,
      billableCount: 240,
      recordedAt: '2026-11-01T00:00:00Z',
    },
    {
      id: 'snap_02',
      tenantId: 'TEN-HK-002',
      companyId: 'comp_hk_02',
      period: 'Nov 2026',
      activeEmployees: 72,
      onLeaveEmployees: 3,
      terminatedEmployees: 5,
      billableCount: 75,
      recordedAt: '2026-11-01T00:00:00Z',
    },
    {
      id: 'snap_03',
      tenantId: 'TEN-MP-003',
      companyId: 'comp_mp_03',
      period: 'Nov 2026',
      activeEmployees: 610,
      onLeaveEmployees: 10,
      terminatedEmployees: 42,
      billableCount: 620,
      recordedAt: '2026-11-01T00:00:00Z',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Per-Employee Billing Engine</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
              Server Authoritative
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Strict algorithm enforcement: Monthly Subscription = Max(Minimum Monthly Fee, Billable Employees × Plan Rate). Approved leave remains billable; archived staff are non-billable.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono">
          <span>Base Currency: <strong>INR (₹)</strong></span>
        </div>
      </div>

      {/* Interactive Billing Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <span>Interactive Billing Simulator</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate any tenant workforce scale to test fee determination and tax breakdowns.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Plan Selector */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Select Subscription Plan</label>
              <select
                value={selectedPlanCode}
                onChange={(e) => setSelectedPlanCode(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-blue-600"
              >
                {plans.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name} — {p.pricePerEmployee > 0 ? `₹${p.pricePerEmployee}/emp` : 'Flat ₹499'} (Floor: ₹{p.minMonthlyFee})
                  </option>
                ))}
              </select>
            </div>

            {/* Active Employees Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-700">Active Deployed Employees</span>
                <span className="font-mono font-black text-blue-700 text-sm">{activeEmployees}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1500}
                step={5}
                value={activeEmployees}
                onChange={(e) => setActiveEmployees(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Field guards / cleaners currently on duty</span>
            </div>

            {/* On-Leave Employees */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <span>Approved Leave Employees</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                    Billable
                  </span>
                </span>
                <span className="font-mono font-black text-slate-700 text-sm">{onLeaveEmployees}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={onLeaveEmployees}
                onChange={(e) => setOnLeaveEmployees(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">
                Staff on approved leave maintain active employment and are counted as billable.
              </span>
            </div>

            {/* Billing Cycle */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Billing Cycle</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      billingCycle === 'monthly'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('annual')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      billingCycle === 'annual'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Annual
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tax Scheme</label>
                <button
                  type="button"
                  onClick={() => setIsInterState(!isInterState)}
                  className={`w-full py-2 rounded-xl text-xs font-bold border transition-colors ${
                    isInterState
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {isInterState ? 'Inter-State (18% IGST)' : 'Intra-State (9+9% CGST/SGST)'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Output Invoice Breakdown Column (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Calculated Invoice Preview</h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  Engine Output for {selectedPlan.name} Plan
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-mono text-xs font-bold">
                {calcResult.billableEmployees} Billable Staff
              </span>
            </div>

            {/* Formula Transparency Box */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-900 text-white space-y-1.5 font-mono text-xs">
              <div className="text-[11px] text-sky-400 font-bold uppercase tracking-wider">
                Formula Evaluation:
              </div>
              <div className="text-slate-300">
                Max( Floor: ₹{calcResult.minimumMonthlyFee.toLocaleString('en-IN')}, Headcount: {calcResult.billableEmployees} × ₹{calcResult.ratePerEmployee} = ₹{calcResult.computedEmployeeFee.toLocaleString('en-IN')} )
              </div>
              <div className="text-emerald-400 font-bold">
                = Base Monthly Fee: ₹{calcResult.effectiveMonthlyBase.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Detailed Calculations List */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-700">
                <span>Active Deployed Workforce:</span>
                <span className="font-mono font-bold">{activeEmployees} Guards/Cleaners</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-700">
                <span>Approved Leave (Eligible):</span>
                <span className="font-mono font-bold text-emerald-600">+{onLeaveEmployees} Guards</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-700">
                <span>Total Billable Workforce:</span>
                <span className="font-mono font-bold text-blue-700">{calcResult.billableEmployees} Staff</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-700">
                <span>Billing Multiplier ({calcResult.monthsCount} month{calcResult.monthsCount > 1 ? 's' : ''}):</span>
                <span className="font-mono font-bold">₹{calcResult.rawCycleTotal.toLocaleString('en-IN')}</span>
              </div>
              {calcResult.discountAmount > 0 && (
                <div className="flex justify-between py-1.5 border-b border-slate-100 text-emerald-600">
                  <span>Commitment Discount ({calcResult.discountPercent}%):</span>
                  <span className="font-mono font-bold">-₹{calcResult.discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-700 font-bold">
                <span>Taxable Amount:</span>
                <span className="font-mono">₹{calcResult.taxableAmount.toLocaleString('en-IN')}</span>
              </div>

              {/* GST breakdown */}
              {isInterState ? (
                <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-600">
                  <span>IGST (18%):</span>
                  <span className="font-mono font-bold">₹{calcResult.igstAmount.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>CGST (9%):</span>
                    <span className="font-mono">₹{calcResult.cgstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                    <span>SGST (9%):</span>
                    <span className="font-mono">₹{calcResult.sgstAmount.toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Grand Total Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Grand Total Payable:</span>
              <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                ₹{calcResult.totalAmount.toLocaleString('en-IN')}
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              100% Deterministic Engine
            </span>
          </div>
        </div>
      </div>

      {/* Historical Employee Count Snapshots */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="pb-4 border-b border-slate-200">
          <h3 className="text-base font-extrabold text-slate-900">Historical Workforce Billing Snapshots</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable snapshots of tenant workforce headcounts recorded at the close of every billing period to prevent dispute and retroactive changes.
          </p>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Tenant ID</th>
                <th className="px-4 py-3">Billing Period</th>
                <th className="px-4 py-3">Active On-Duty</th>
                <th className="px-4 py-3">Approved Leave</th>
                <th className="px-4 py-3">Terminated / Inactive</th>
                <th className="px-4 py-3">Billable Count</th>
                <th className="px-4 py-3">Snapshot Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {snapshots.map((snap) => (
                <tr key={snap.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 text-blue-700 font-bold">{snap.tenantId}</td>
                  <td className="px-4 py-3 text-slate-900 font-bold">{snap.period}</td>
                  <td className="px-4 py-3 text-slate-700">{snap.activeEmployees}</td>
                  <td className="px-4 py-3 text-emerald-600">+{snap.onLeaveEmployees}</td>
                  <td className="px-4 py-3 text-rose-500">{snap.terminatedEmployees} (Ignored)</td>
                  <td className="px-4 py-3 text-slate-900 font-black text-sm">{snap.billableCount}</td>
                  <td className="px-4 py-3 text-slate-400 text-[11px] font-sans">
                    {new Date(snap.recordedAt).toLocaleString()}
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
