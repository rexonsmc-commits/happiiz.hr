/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SubscriptionPlanItem,
  TenantSubscription,
  SubscriptionInvoice,
  Employee,
  Company,
} from '../types';

export interface BillingCalculationInput {
  activeEmployees: number;
  onLeaveEmployees: number;
  plan: SubscriptionPlanItem;
  billingCycle: 'monthly' | 'annual';
  discountPercent?: number; // e.g. 10 for 10%
  isInterState?: boolean; // IGST vs CGST/SGST
}

export interface BillingCalculationResult {
  billableEmployees: number;
  ratePerEmployee: number;
  minimumMonthlyFee: number;
  computedEmployeeFee: number;
  effectiveMonthlyBase: number;
  monthsCount: number;
  rawCycleTotal: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalGst: number;
  totalAmount: number;
  currency: string;
}

/**
 * Standard Per-Employee SaaS Billing Engine for Happiiz HR
 * Enforces:
 *   Monthly Subscription = Max(Minimum Monthly Fee, Billable Employees × Plan Rate)
 * Rule: Employees on approved leave ('on_leave') remain employed and billable.
 * Terminated / archived staff are non-billable.
 */
export function calculateSubscriptionFee(input: BillingCalculationInput): BillingCalculationResult {
  const {
    activeEmployees,
    onLeaveEmployees,
    plan,
    billingCycle,
    discountPercent = 0,
    isInterState = false,
  } = input;

  // 1. Determine Billable Employee count
  const billableEmployees = Math.max(0, activeEmployees + onLeaveEmployees);

  // 2. Compute fee based on per-employee rate vs minimum monthly fee floor
  const ratePerEmployee = plan.pricePerEmployee || 0;
  const computedEmployeeFee = billableEmployees * ratePerEmployee;
  const minimumMonthlyFee = plan.minMonthlyFee || 0;

  // Monthly base is whichever is greater
  const effectiveMonthlyBase = Math.max(minimumMonthlyFee, computedEmployeeFee);

  // 3. Billing cycle multipliers (monthly = 1 month, annual = 12 months with annual discount)
  const monthsCount = billingCycle === 'annual' ? 12 : 1;
  const rawCycleTotal = effectiveMonthlyBase * monthsCount;

  // 4. Discounts (annual plan default discount or manual custom promo discount)
  let totalDiscountPercent = discountPercent;
  if (billingCycle === 'annual' && plan.annualDiscountPercent && !discountPercent) {
    totalDiscountPercent = plan.annualDiscountPercent;
  }
  const discountAmount = Math.round((rawCycleTotal * totalDiscountPercent) / 100);
  const taxableAmount = Math.max(0, rawCycleTotal - discountAmount);

  // 5. GST calculations (Standard 18% in India: 9% CGST + 9% SGST or 18% IGST)
  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (isInterState) {
    igstRate = 18;
    igstAmount = Math.round((taxableAmount * igstRate) / 100);
  } else {
    cgstRate = 9;
    cgstAmount = Math.round((taxableAmount * cgstRate) / 100);
    sgstRate = 9;
    sgstAmount = Math.round((taxableAmount * sgstRate) / 100);
  }

  const totalGst = igstAmount + (cgstAmount + sgstAmount);
  const totalAmount = taxableAmount + totalGst;

  return {
    billableEmployees,
    ratePerEmployee,
    minimumMonthlyFee,
    computedEmployeeFee,
    effectiveMonthlyBase,
    monthsCount,
    rawCycleTotal,
    discountPercent: totalDiscountPercent,
    discountAmount,
    taxableAmount,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    totalGst,
    totalAmount,
    currency: 'INR',
  };
}

/**
 * Renewal Alert Categorization Engine
 */
export type RenewalUrgency =
  | 'expired'
  | 'in_grace_period'
  | 'today'
  | '3_days'
  | '7_days'
  | '15_days'
  | 'active_normal';

export interface RenewalAlertInfo {
  urgency: RenewalUrgency;
  daysRemaining: number;
  label: string;
  badgeClass: string;
  isGraceActive: boolean;
}

export function evaluateRenewalUrgency(
  nextRenewalDateStr: string,
  gracePeriodEndDateStr?: string
): RenewalAlertInfo {
  const now = new Date();
  const renewalDate = new Date(nextRenewalDateStr);
  const diffMs = renewalDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const graceEndDate = gracePeriodEndDateStr ? new Date(gracePeriodEndDateStr) : null;
  const isGraceActive = !!(graceEndDate && now > renewalDate && now <= graceEndDate);

  if (graceEndDate && now > graceEndDate) {
    return {
      urgency: 'expired',
      daysRemaining: diffDays,
      label: 'Expired',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      isGraceActive: false,
    };
  }

  if (isGraceActive) {
    const graceRemaining = Math.ceil((graceEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      urgency: 'in_grace_period',
      daysRemaining: graceRemaining,
      label: `Grace Period (${graceRemaining}d left)`,
      badgeClass: 'bg-red-100 text-red-900 border-red-300 animate-pulse',
      isGraceActive: true,
    };
  }

  if (diffDays <= 0) {
    return {
      urgency: 'today',
      daysRemaining: 0,
      label: 'Renewal Due Today',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-black',
      isGraceActive: false,
    };
  }

  if (diffDays <= 3) {
    return {
      urgency: '3_days',
      daysRemaining: diffDays,
      label: `Due in ${diffDays} Days`,
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      isGraceActive: false,
    };
  }

  if (diffDays <= 7) {
    return {
      urgency: '7_days',
      daysRemaining: diffDays,
      label: `Due in ${diffDays} Days`,
      badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      isGraceActive: false,
    };
  }

  if (diffDays <= 15) {
    return {
      urgency: '15_days',
      daysRemaining: diffDays,
      label: `Due in ${diffDays} Days`,
      badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
      isGraceActive: false,
    };
  }

  return {
    urgency: 'active_normal',
    daysRemaining: diffDays,
    label: `Renews in ${diffDays}d`,
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    isGraceActive: false,
  };
}
