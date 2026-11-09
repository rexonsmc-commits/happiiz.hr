/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  SubscriptionPlanItem,
  TenantSubscription,
  SubscriptionInvoice,
  PaymentRecord,
  PlatformSettings,
  PlatformAdminUser,
  SupportTicket,
  Company,
  CompanyUsage,
  EmployeeCountSnapshot,
} from '../types';
import { logAuditEvent, getCompanies, updateCompanyStatus } from './tenantService';
import { calculateSubscriptionFee } from './billingEngine';

// ==========================================
// 1. Initial Default Seed Data for Phase 2
// ==========================================

export const INITIAL_SUBSCRIPTION_PLANS: SubscriptionPlanItem[] = [
  {
    id: 'plan_micro',
    name: 'MICRO',
    code: 'micro',
    minEmployees: 1,
    maxEmployees: 25,
    pricePerEmployee: 0, // Flat minimum monthly fee
    minMonthlyFee: 499,
    billingCycle: 'monthly',
    annualDiscountPercent: 15,
    trialDays: 14,
    gracePeriodDays: 7,
    features: [
      'Up to 25 Guards / Cleaners',
      'Daily Attendance Logging',
      'Basic Duty Roster',
      'Mobile Guard Check-ins',
      'Email Support',
    ],
    storageLimitMb: 2000,
    apiCallsLimit: 10000,
    status: 'active',
    description: 'Designed for small security agencies and boutique cleaning contractors.',
  },
  {
    id: 'plan_starter',
    name: 'STARTER',
    code: 'starter',
    minEmployees: 26,
    maxEmployees: 100,
    pricePerEmployee: 20, // ₹20 per employee
    minMonthlyFee: 520, // 26 * 20 = 520 min floor
    billingCycle: 'monthly',
    annualDiscountPercent: 15,
    trialDays: 14,
    gracePeriodDays: 7,
    features: [
      'Up to 100 Field Workforce',
      'Site Geofencing & QR Patrol',
      'Shift & Roster Automation',
      'Standard Payroll & Advances',
      'Standard GST Invoicing',
      'Priority Email Support',
    ],
    storageLimitMb: 5000,
    apiCallsLimit: 50000,
    status: 'active',
    isPopular: true,
    description: 'Ideal for growing manpower supply and private security agencies.',
  },
  {
    id: 'plan_growth',
    name: 'GROWTH',
    code: 'growth',
    minEmployees: 101,
    maxEmployees: 500,
    pricePerEmployee: 15, // ₹15 per employee
    minMonthlyFee: 1515,
    billingCycle: 'monthly',
    annualDiscountPercent: 20,
    trialDays: 14,
    gracePeriodDays: 10,
    features: [
      'Up to 500 Workforce Deployment',
      'Multi-site Roster & Overtime Tracker',
      'EPF & ESIC Payroll Compliance',
      'Client Billing & Debit/Credit Notes',
      'Biometric / QR Device Sync',
      'Audit Trail & Role-based Permissions',
      'Dedicated Account Manager',
    ],
    storageLimitMb: 20000,
    apiCallsLimit: 200000,
    status: 'active',
    description: 'Built for established facility management & multi-city manpower firms.',
  },
  {
    id: 'plan_enterprise',
    name: 'ENTERPRISE',
    code: 'enterprise',
    minEmployees: 501,
    maxEmployees: 2000,
    pricePerEmployee: 12, // ₹12 per employee
    minMonthlyFee: 6012,
    billingCycle: 'monthly',
    annualDiscountPercent: 25,
    trialDays: 30,
    gracePeriodDays: 15,
    features: [
      'Up to 2,000 Workforce Headcount',
      'Full Multi-Branch SaaS Management',
      'Automated Bulk Salary Disbursal',
      'Custom ERP API & Webhooks',
      'Unlimited Document Storage',
      'SLA 99.9% Uptime Guarantee',
      'Dedicated 24/7 Telephone Support',
    ],
    storageLimitMb: 100000,
    apiCallsLimit: 1000000,
    status: 'active',
    description: 'Complete operational suite for top-tier security & facility conglomerates.',
  },
  {
    id: 'plan_custom',
    name: 'CUSTOM ENTERPRISE',
    code: 'custom',
    minEmployees: 2001,
    maxEmployees: 10000,
    pricePerEmployee: 10,
    minMonthlyFee: 20000,
    billingCycle: 'annual',
    annualDiscountPercent: 30,
    trialDays: 30,
    gracePeriodDays: 20,
    features: [
      'Unlimited Workforce Capacity',
      'Dedicated Private Cloud Instance',
      'Custom Module Development',
      'Direct Banking API Integration',
      'Customized Security Rule Policies',
    ],
    storageLimitMb: 500000,
    apiCallsLimit: 5000000,
    status: 'active',
    description: 'Custom negotiated pricing and dedicated infrastructure for national operators.',
  },
];

export const INITIAL_PLATFORM_SETTINGS: PlatformSettings = {
  platformName: 'Happiiz HR',
  platformLogo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=128&auto=format&fit=crop&q=80',
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
  companyTermsUrl: 'https://happiiz.io/terms',
  privacyPolicyUrl: 'https://happiiz.io/privacy',
  updatedAt: new Date().toISOString(),
};

export const INITIAL_ADMIN_USERS: PlatformAdminUser[] = [
  {
    id: 'myHfxnY2nnVBsbwrg3vgu6PhNSR2',
    email: 'superadmin@happiizhr.com',
    name: 'Sandeep Rana (Master Super Admin)',
    adminRole: 'platform_owner',
    permissions: ['all', 'billing', 'tenants', 'security', 'settings', 'approvals', 'master_control'],
    status: 'active',
    assignedAt: '2026-01-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'admin_owner',
    email: 'rexon.smc@gmail.com',
    name: 'Rexon SMC (Platform Co-Owner)',
    adminRole: 'platform_owner',
    permissions: ['all', 'billing', 'tenants', 'security', 'settings', 'approvals'],
    status: 'active',
    assignedAt: '2026-01-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'admin_finance',
    email: 'finance.lead@happiiz.io',
    name: 'Arjun Mehta',
    adminRole: 'finance_admin',
    permissions: ['billing', 'invoices', 'payments', 'reports'],
    status: 'active',
    assignedAt: '2026-02-15T00:00:00Z',
    lastLogin: '2026-11-05T10:30:00Z',
  },
  {
    id: 'admin_verify',
    email: 'verifications@happiiz.io',
    name: 'Pooja Verma',
    adminRole: 'verification_admin',
    permissions: ['company_review', 'kyc_approval', 'tenants'],
    status: 'active',
    assignedAt: '2026-03-01T00:00:00Z',
    lastLogin: '2026-11-06T15:20:00Z',
  },
  {
    id: 'admin_support',
    email: 'support.lead@happiiz.io',
    name: 'Vikram Joshi',
    adminRole: 'support_admin',
    permissions: ['tickets', 'troubleshooting'],
    status: 'active',
    assignedAt: '2026-03-10T00:00:00Z',
    lastLogin: '2026-11-06T09:15:00Z',
  },
  {
    id: 'admin_auditor',
    email: 'compliance.auditor@happiiz.io',
    name: 'Sunita Rao',
    adminRole: 'auditor',
    permissions: ['read_only_audit', 'read_only_finance'],
    status: 'active',
    assignedAt: '2026-04-01T00:00:00Z',
    lastLogin: '2026-11-04T12:00:00Z',
  },
];

export const INITIAL_SUBSCRIPTIONS: TenantSubscription[] = [
  {
    id: 'sub_comp_sec_01',
    companyId: 'comp_sec_01',
    tenantId: 'TEN-SEC-001',
    companyName: 'Apex Shield Security Services Pvt Ltd',
    planId: 'plan_growth',
    planCode: 'growth',
    planName: 'GROWTH',
    billingCycle: 'monthly',
    status: 'active',
    currentEmployees: 240,
    billableEmployees: 240,
    ratePerEmployee: 15,
    minMonthlyFee: 1515,
    calculatedMonthlyFee: 3600, // 240 * 15 = 3600
    discountPercent: 0,
    startDate: '2026-01-15T00:00:00Z',
    currentPeriodStart: '2026-11-01T00:00:00Z',
    currentPeriodEnd: '2026-11-30T23:59:59Z',
    nextRenewalDate: '2026-11-30T23:59:59Z',
    lastPaymentId: 'pay_001',
    lastInvoiceId: 'inv_001',
    notes: 'Premier security contractor with 240 armed guards across 12 tech parks.',
    updatedAt: '2026-11-01T00:00:00Z',
  },
  {
    id: 'sub_comp_hk_02',
    companyId: 'comp_hk_02',
    tenantId: 'TEN-HK-002',
    companyName: 'CleanPro Facility & Hygiene Solutions',
    planId: 'plan_starter',
    planCode: 'starter',
    planName: 'STARTER',
    billingCycle: 'monthly',
    status: 'active',
    currentEmployees: 75,
    billableEmployees: 75,
    ratePerEmployee: 20,
    minMonthlyFee: 520,
    calculatedMonthlyFee: 1500, // 75 * 20 = 1500
    discountPercent: 0,
    startDate: '2026-03-10T00:00:00Z',
    currentPeriodStart: '2026-11-05T00:00:00Z',
    currentPeriodEnd: '2026-12-04T23:59:59Z',
    nextRenewalDate: '2026-12-04T23:59:59Z',
    lastPaymentId: 'pay_002',
    lastInvoiceId: 'inv_002',
    notes: 'Commercial cleaning staff serving corporate headquarters and hospitals.',
    updatedAt: '2026-11-05T00:00:00Z',
  },
  {
    id: 'sub_comp_mp_03',
    companyId: 'comp_mp_03',
    tenantId: 'TEN-MP-003',
    companyName: 'Paramount Manpower Logistics & Staffing',
    planId: 'plan_enterprise',
    planCode: 'enterprise',
    planName: 'ENTERPRISE',
    billingCycle: 'annual',
    status: 'active',
    currentEmployees: 620,
    billableEmployees: 620,
    ratePerEmployee: 12,
    minMonthlyFee: 6012,
    calculatedMonthlyFee: 7440, // 620 * 12 = 7440
    discountPercent: 25,
    startDate: '2026-02-01T00:00:00Z',
    currentPeriodStart: '2026-02-01T00:00:00Z',
    currentPeriodEnd: '2027-01-31T23:59:59Z',
    nextRenewalDate: '2027-01-31T23:59:59Z',
    lastPaymentId: 'pay_003',
    lastInvoiceId: 'inv_003',
    notes: 'Annual subscription with 25% discount. Industrial staffing deployment.',
    updatedAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'sub_comp_fm_04',
    companyId: 'comp_fm_04',
    tenantId: 'TEN-FM-004',
    companyName: 'Vanguard Integrated Facilities LLP',
    planId: 'plan_starter',
    planCode: 'starter',
    planName: 'STARTER',
    billingCycle: 'monthly',
    status: 'trial',
    currentEmployees: 18,
    billableEmployees: 18,
    ratePerEmployee: 20,
    minMonthlyFee: 520,
    calculatedMonthlyFee: 520, // min floor applied
    discountPercent: 0,
    startDate: '2026-11-01T00:00:00Z',
    currentPeriodStart: '2026-11-01T00:00:00Z',
    currentPeriodEnd: '2026-11-15T23:59:59Z',
    nextRenewalDate: '2026-11-15T23:59:59Z', // Renews soon! (in 9 days)
    trialEndDate: '2026-11-15T23:59:59Z',
    notes: 'Currently exploring 14-day free trial on Starter plan.',
    updatedAt: '2026-11-01T00:00:00Z',
  },
  {
    id: 'sub_comp_sec_05',
    companyId: 'comp_sec_05',
    tenantId: 'TEN-SEC-005',
    companyName: 'Garuda Guarding Forces',
    planId: 'plan_micro',
    planCode: 'micro',
    planName: 'MICRO',
    billingCycle: 'monthly',
    status: 'grace_period',
    currentEmployees: 22,
    billableEmployees: 22,
    ratePerEmployee: 0,
    minMonthlyFee: 499,
    calculatedMonthlyFee: 499,
    discountPercent: 0,
    startDate: '2026-08-01T00:00:00Z',
    currentPeriodStart: '2026-10-01T00:00:00Z',
    currentPeriodEnd: '2026-10-31T23:59:59Z',
    nextRenewalDate: '2026-10-31T23:59:59Z', // expired, now in 7-day grace period!
    gracePeriodEndDate: '2026-11-08T23:59:59Z',
    notes: 'Payment overdue. Currently in 7-day grace period ending Nov 8.',
    updatedAt: '2026-11-01T00:00:00Z',
  },
];

export const INITIAL_INVOICES: SubscriptionInvoice[] = [
  {
    id: 'inv_001',
    invoiceNumber: 'HAP-INV-2026-00101',
    companyId: 'comp_sec_01',
    tenantId: 'TEN-SEC-001',
    companyName: 'Apex Shield Security Services Pvt Ltd',
    customerGst: '29AABCA1234F1Z8',
    customerAddress: 'Tower B, Cyber City, Bangalore, Karnataka - 560100',
    customerEmail: 'finance@apexshield.in',
    planCode: 'growth',
    planName: 'GROWTH (240 Guards @ ₹15/emp)',
    billingPeriod: 'Nov 2026',
    billingCycle: 'monthly',
    activeEmployees: 232,
    onLeaveEmployees: 8,
    billableEmployees: 240,
    ratePerEmployee: 15,
    minimumMonthlyFee: 1515,
    subtotal: 3600,
    discountAmount: 0,
    taxableAmount: 3600,
    cgstRate: 9,
    cgstAmount: 324,
    sgstRate: 9,
    sgstAmount: 324,
    igstRate: 0,
    igstAmount: 0,
    totalAmount: 4248,
    currency: 'INR',
    status: 'paid',
    dueDate: '2026-11-05T00:00:00Z',
    issueDate: '2026-11-01T00:00:00Z',
    paidAt: '2026-11-02T11:20:00Z',
    paymentMethod: 'razorpay',
    paymentReference: 'pay_rzp_nov26_apex',
    createdAdminEmail: 'finance.lead@happiiz.io',
    createdAt: '2026-11-01T00:00:00Z',
  },
  {
    id: 'inv_002',
    invoiceNumber: 'HAP-INV-2026-00102',
    companyId: 'comp_hk_02',
    tenantId: 'TEN-HK-002',
    companyName: 'CleanPro Facility & Hygiene Solutions',
    customerGst: '27AAACR5678K1ZQ',
    customerAddress: 'Plot 45, MIDC Industrial Area, Pune, Maharashtra - 411018',
    customerEmail: 'billing@cleanpro.co.in',
    planCode: 'starter',
    planName: 'STARTER (75 Staff @ ₹20/emp)',
    billingPeriod: 'Nov 2026',
    billingCycle: 'monthly',
    activeEmployees: 72,
    onLeaveEmployees: 3,
    billableEmployees: 75,
    ratePerEmployee: 20,
    minimumMonthlyFee: 520,
    subtotal: 1500,
    discountAmount: 0,
    taxableAmount: 1500,
    cgstRate: 9,
    cgstAmount: 135,
    sgstRate: 9,
    sgstAmount: 135,
    igstRate: 0,
    igstAmount: 0,
    totalAmount: 1770,
    currency: 'INR',
    status: 'paid',
    dueDate: '2026-11-08T00:00:00Z',
    issueDate: '2026-11-05T00:00:00Z',
    paidAt: '2026-11-05T16:45:00Z',
    paymentMethod: 'upi',
    paymentReference: 'upi_ref_cleanpro_11',
    createdAdminEmail: 'finance.lead@happiiz.io',
    createdAt: '2026-11-05T00:00:00Z',
  },
  {
    id: 'inv_003',
    invoiceNumber: 'HAP-INV-2026-00103',
    companyId: 'comp_sec_05',
    tenantId: 'TEN-SEC-005',
    companyName: 'Garuda Guarding Forces',
    customerGst: '36AAAFG9999P1ZT',
    customerAddress: 'Road 12, Banjara Hills, Hyderabad, Telangana - 500034',
    customerEmail: 'admin@garudaguards.in',
    planCode: 'micro',
    planName: 'MICRO (Base Monthly Fee ₹499)',
    billingPeriod: 'Nov 2026',
    billingCycle: 'monthly',
    activeEmployees: 22,
    onLeaveEmployees: 0,
    billableEmployees: 22,
    ratePerEmployee: 0,
    minimumMonthlyFee: 499,
    subtotal: 499,
    discountAmount: 0,
    taxableAmount: 499,
    cgstRate: 9,
    cgstAmount: 45,
    sgstRate: 9,
    sgstAmount: 45,
    igstRate: 0,
    igstAmount: 0,
    totalAmount: 589,
    currency: 'INR',
    status: 'pending',
    dueDate: '2026-11-05T00:00:00Z',
    issueDate: '2026-10-31T00:00:00Z',
    createdAdminEmail: 'finance.lead@happiiz.io',
    notes: 'Grace period alert issued. Payment overdue.',
    createdAt: '2026-10-31T00:00:00Z',
  },
];

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay_001',
    companyId: 'comp_sec_01',
    tenantId: 'TEN-SEC-001',
    companyName: 'Apex Shield Security Services Pvt Ltd',
    invoiceId: 'inv_001',
    invoiceNumber: 'HAP-INV-2026-00101',
    amount: 3600,
    taxAmount: 648,
    totalAmount: 4248,
    currency: 'INR',
    paymentMethod: 'razorpay',
    paymentDate: '2026-11-02T11:20:00Z',
    status: 'successful',
    transactionReference: 'pay_rzp_nov26_apex',
    recordedBy: 'system_webhook',
    notes: 'Verified via Razorpay API Webhook',
    createdAt: '2026-11-02T11:20:00Z',
  },
  {
    id: 'pay_002',
    companyId: 'comp_hk_02',
    tenantId: 'TEN-HK-002',
    companyName: 'CleanPro Facility & Hygiene Solutions',
    invoiceId: 'inv_002',
    invoiceNumber: 'HAP-INV-2026-00102',
    amount: 1500,
    taxAmount: 270,
    totalAmount: 1770,
    currency: 'INR',
    paymentMethod: 'upi',
    paymentDate: '2026-11-05T16:45:00Z',
    status: 'successful',
    transactionReference: 'UPI/26110599812/cleanpro',
    recordedBy: 'finance.lead@happiiz.io',
    notes: 'Manual entry with verified bank utr transaction confirmation',
    createdAt: '2026-11-05T16:45:00Z',
  },
  {
    id: 'pay_003',
    companyId: 'comp_mp_03',
    tenantId: 'TEN-MP-003',
    companyName: 'Paramount Manpower Logistics & Staffing',
    invoiceId: 'inv_annual_03',
    invoiceNumber: 'HAP-INV-2026-00042',
    amount: 66960, // 7440 * 12 - 25% discount = 66,960
    taxAmount: 12053,
    totalAmount: 79013,
    currency: 'INR',
    paymentMethod: 'bank_transfer',
    paymentDate: '2026-02-01T14:10:00Z',
    status: 'successful',
    transactionReference: 'NEFT-HDFC0001-26020199',
    recordedBy: 'rexon.smc@gmail.com',
    notes: 'Annual corporate subscription NEFT transfer verified',
    createdAt: '2026-02-01T14:10:00Z',
  },
];

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tck_001',
    ticketCode: 'TCK-1041',
    companyId: 'comp_sec_01',
    tenantId: 'TEN-SEC-001',
    companyName: 'Apex Shield Security Services Pvt Ltd',
    subject: 'Request for biometric integration on Guard Patrol site 4',
    description: 'We are expanding to 40 additional guards at Embassy Tech Village and need API webhook credentials for our eSSL biometric scanner.',
    priority: 'high',
    status: 'in_progress',
    assignedAdminName: 'Vikram Joshi',
    assignedAdminEmail: 'support.lead@happiiz.io',
    createdByEmail: 'ops@apexshield.in',
    createdByName: 'Rajesh Sharma',
    createdAt: '2026-11-06T08:30:00Z',
    updatedAt: '2026-11-06T10:00:00Z',
  },
  {
    id: 'tck_002',
    ticketCode: 'TCK-1042',
    companyId: 'comp_hk_02',
    tenantId: 'TEN-HK-002',
    companyName: 'CleanPro Facility & Hygiene Solutions',
    subject: 'Need GST invoice copy with updated Head Office address',
    description: 'Our registered office shifted from MIDC Bhosari to Hinjewadi Phase 1. Please update our corporate address on Invoice HAP-INV-2026-00102.',
    priority: 'medium',
    status: 'resolved',
    assignedAdminName: 'Arjun Mehta',
    assignedAdminEmail: 'finance.lead@happiiz.io',
    createdByEmail: 'accounts@cleanpro.co.in',
    createdByName: 'Sunil Rao',
    createdAt: '2026-11-05T14:20:00Z',
    updatedAt: '2026-11-06T09:00:00Z',
    resolvedAt: '2026-11-06T09:00:00Z',
    resolutionNotes: 'Address updated in company record and corrected invoice PDF re-issued.',
  },
  {
    id: 'tck_003',
    ticketCode: 'TCK-1043',
    companyId: 'comp_sec_05',
    tenantId: 'TEN-SEC-005',
    companyName: 'Garuda Guarding Forces',
    subject: 'Assistance required with UPI gateway payment processing',
    description: 'Encountering timeout when initiating renewal payment from our HDFC corporate UPI handle.',
    priority: 'urgent',
    status: 'open',
    assignedAdminName: 'Vikram Joshi',
    assignedAdminEmail: 'support.lead@happiiz.io',
    createdByEmail: 'admin@garudaguards.in',
    createdByName: 'K. Venkat',
    createdAt: '2026-11-06T19:40:00Z',
    updatedAt: '2026-11-06T19:40:00Z',
  },
];

// In-Memory state for responsive, zero-lag enterprise operation
let inMemoryPlans: SubscriptionPlanItem[] = [...INITIAL_SUBSCRIPTION_PLANS];
let inMemorySubscriptions: TenantSubscription[] = [...INITIAL_SUBSCRIPTIONS];
let inMemoryInvoices: SubscriptionInvoice[] = [...INITIAL_INVOICES];
let inMemoryPayments: PaymentRecord[] = [...INITIAL_PAYMENTS];
let inMemorySettings: PlatformSettings = { ...INITIAL_PLATFORM_SETTINGS };
let inMemoryAdmins: PlatformAdminUser[] = [...INITIAL_ADMIN_USERS];
let inMemoryTickets: SupportTicket[] = [...INITIAL_SUPPORT_TICKETS];

// ==========================================
// 2. Subscription Plans Operations
// ==========================================

export async function getSubscriptionPlans(): Promise<SubscriptionPlanItem[]> {
  try {
    const snap = await getDocs(collection(db, 'platform_plans'));
    if (!snap.empty) {
      inMemoryPlans = snap.docs.map((d) => d.data() as SubscriptionPlanItem);
      return inMemoryPlans;
    }
    // Seed initial plans to firestore
    for (const p of INITIAL_SUBSCRIPTION_PLANS) {
      try {
        await setDoc(doc(db, 'platform_plans', p.id), p);
      } catch (e) {
        // non-blocking
      }
    }
  } catch (err) {
    console.warn('[Happiiz HR] Plans fallback:', err);
  }
  return inMemoryPlans;
}

export async function saveSubscriptionPlan(
  plan: SubscriptionPlanItem,
  actorEmail: string
): Promise<SubscriptionPlanItem> {
  const isNew = !plan.id || !inMemoryPlans.some((p) => p.id === plan.id);
  const targetId = isNew ? `plan_${Date.now().toString(36)}` : plan.id;
  const now = new Date().toISOString();

  const finalPlan: SubscriptionPlanItem = {
    ...plan,
    id: targetId,
    updatedAt: now,
    createdAt: isNew ? now : plan.createdAt || now,
  };

  try {
    await setDoc(doc(db, 'platform_plans', targetId), finalPlan);
  } catch (err) {
    console.warn('[Happiiz HR] Plan save cloud note:', err);
  }

  if (isNew) {
    inMemoryPlans = [...inMemoryPlans, finalPlan];
  } else {
    inMemoryPlans = inMemoryPlans.map((p) => (p.id === targetId ? finalPlan : p));
  }

  await logAuditEvent({
    tenantId: 'platform',
    actorUid: 'authorized_admin',
    actorEmail,
    action: isNew ? 'SUBSCRIPTION_PLAN_CREATED' : 'SUBSCRIPTION_PLAN_UPDATED',
    category: 'billing',
    details: `${isNew ? 'Created' : 'Updated'} plan ${finalPlan.name} (Code: ${finalPlan.code}) Rate: ₹${finalPlan.pricePerEmployee}/emp`,
    targetRecord: targetId,
    newValue: JSON.stringify({ rate: finalPlan.pricePerEmployee, minFee: finalPlan.minMonthlyFee }),
  });

  return finalPlan;
}

export async function togglePlanStatus(
  planId: string,
  newStatus: 'active' | 'inactive' | 'archived',
  actorEmail: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'platform_plans', planId), {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    // non-blocking
  }

  inMemoryPlans = inMemoryPlans.map((p) => (p.id === planId ? { ...p, status: newStatus } : p));

  await logAuditEvent({
    tenantId: 'platform',
    actorUid: 'authorized_admin',
    actorEmail,
    action: 'SUBSCRIPTION_PLAN_STATUS_CHANGED',
    category: 'billing',
    details: `Plan ${planId} status transitioned to ${newStatus}`,
    targetRecord: planId,
    newValue: newStatus,
  });
}

// ==========================================
// 3. Subscriptions Management
// ==========================================

export async function getAllSubscriptions(): Promise<TenantSubscription[]> {
  try {
    const snap = await getDocs(collection(db, 'platform_subscriptions'));
    if (!snap.empty) {
      inMemorySubscriptions = snap.docs.map((d) => d.data() as TenantSubscription);
      return inMemorySubscriptions;
    }
    for (const s of INITIAL_SUBSCRIPTIONS) {
      try {
        await setDoc(doc(db, 'platform_subscriptions', s.id), s);
      } catch (e) {
        // non-blocking
      }
    }
  } catch (err) {
    console.warn('[Happiiz HR] Subscriptions fallback:', err);
  }
  return inMemorySubscriptions;
}

export async function updateSubscription(
  subId: string,
  updates: Partial<TenantSubscription>,
  actorEmail: string,
  reason?: string
): Promise<TenantSubscription> {
  const existing = inMemorySubscriptions.find((s) => s.id === subId);
  const now = new Date().toISOString();

  const updated: TenantSubscription = {
    ...(existing || ({} as TenantSubscription)),
    ...updates,
    id: subId,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'platform_subscriptions', subId), updated);
  } catch (e) {
    console.warn('[Happiiz HR] Cloud subscription sync note:', e);
  }

  inMemorySubscriptions = inMemorySubscriptions.map((s) => (s.id === subId ? updated : s));

  await logAuditEvent({
    tenantId: updated.tenantId || 'platform',
    actorUid: 'super_admin',
    actorEmail,
    action: 'SUBSCRIPTION_MODIFIED',
    category: 'billing',
    details: `Updated subscription for ${updated.companyName}. Status: ${updated.status}, Plan: ${updated.planName}`,
    targetRecord: subId,
    previousValue: existing ? JSON.stringify({ status: existing.status, plan: existing.planName }) : '',
    newValue: JSON.stringify({ status: updated.status, plan: updated.planName }),
    reason: reason || 'Administrative plan maintenance',
  });

  return updated;
}

// ==========================================
// 4. Invoices Management & Generation
// ==========================================

export async function getAllInvoices(): Promise<SubscriptionInvoice[]> {
  try {
    const snap = await getDocs(collection(db, 'platform_invoices'));
    if (!snap.empty) {
      inMemoryInvoices = snap.docs.map((d) => d.data() as SubscriptionInvoice);
      return inMemoryInvoices;
    }
    for (const inv of INITIAL_INVOICES) {
      try {
        await setDoc(doc(db, 'platform_invoices', inv.id), inv);
      } catch (e) {
        // non-blocking
      }
    }
  } catch (err) {
    console.warn('[Happiiz HR] Invoices fallback:', err);
  }
  return inMemoryInvoices;
}

export async function createSubscriptionInvoice(
  invoiceData: Omit<SubscriptionInvoice, 'id' | 'createdAt'>,
  actorEmail: string
): Promise<SubscriptionInvoice> {
  const newId = `inv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newInvoice: SubscriptionInvoice = {
    ...invoiceData,
    id: newId,
    createdAt: now,
  };

  try {
    await setDoc(doc(db, 'platform_invoices', newId), newInvoice);
  } catch (e) {
    console.warn('[Happiiz HR] Sync invoice note:', e);
  }

  inMemoryInvoices = [newInvoice, ...inMemoryInvoices];

  // Increment sequence in settings
  inMemorySettings.nextInvoiceSeq = (inMemorySettings.nextInvoiceSeq || 1045) + 1;

  await logAuditEvent({
    tenantId: newInvoice.tenantId,
    actorUid: 'finance_admin',
    actorEmail,
    action: 'SUBSCRIPTION_INVOICE_GENERATED',
    category: 'billing',
    details: `Generated Invoice #${newInvoice.invoiceNumber} for ${newInvoice.companyName} (Amount: ₹${newInvoice.totalAmount})`,
    targetRecord: newId,
    newValue: JSON.stringify({ invoiceNumber: newInvoice.invoiceNumber, totalAmount: newInvoice.totalAmount }),
  });

  return newInvoice;
}

export async function markInvoiceAsPaid(
  invoiceId: string,
  paymentDetails: {
    paymentMethod: PaymentRecord['paymentMethod'];
    transactionReference: string;
    notes?: string;
  },
  actorEmail: string
): Promise<SubscriptionInvoice> {
  const inv = inMemoryInvoices.find((i) => i.id === invoiceId);
  if (!inv) throw new Error('Invoice not found');

  const now = new Date().toISOString();
  const updatedInv: SubscriptionInvoice = {
    ...inv,
    status: 'paid',
    paidAt: now,
    paymentMethod: paymentDetails.paymentMethod,
    paymentReference: paymentDetails.transactionReference,
    notes: paymentDetails.notes || inv.notes,
  };

  try {
    await updateDoc(doc(db, 'platform_invoices', invoiceId), {
      status: 'paid',
      paidAt: now,
      paymentMethod: paymentDetails.paymentMethod,
      paymentReference: paymentDetails.transactionReference,
    });
  } catch (e) {
    // non-blocking
  }

  inMemoryInvoices = inMemoryInvoices.map((i) => (i.id === invoiceId ? updatedInv : i));

  // Also record payment record automatically
  await recordPayment(
    {
      companyId: inv.companyId,
      tenantId: inv.tenantId,
      companyName: inv.companyName,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amount: inv.taxableAmount,
      taxAmount: inv.cgstAmount + inv.sgstAmount + inv.igstAmount,
      totalAmount: inv.totalAmount,
      currency: inv.currency,
      paymentMethod: paymentDetails.paymentMethod,
      paymentDate: now,
      status: 'successful',
      transactionReference: paymentDetails.transactionReference,
      notes: paymentDetails.notes || 'Marked as paid by authorized administrator',
      recordedBy: actorEmail,
    },
    actorEmail
  );

  return updatedInv;
}

// ==========================================
// 5. Payment Records Operations
// ==========================================

export async function getAllPayments(): Promise<PaymentRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'platform_payments'));
    if (!snap.empty) {
      inMemoryPayments = snap.docs.map((d) => d.data() as PaymentRecord);
      return inMemoryPayments;
    }
    for (const p of INITIAL_PAYMENTS) {
      try {
        await setDoc(doc(db, 'platform_payments', p.id), p);
      } catch (e) {
        // non-blocking
      }
    }
  } catch (err) {
    console.warn('[Happiiz HR] Payments fallback:', err);
  }
  return inMemoryPayments;
}

export async function recordPayment(
  data: Omit<PaymentRecord, 'id' | 'createdAt'>,
  actorEmail: string
): Promise<PaymentRecord> {
  const newId = `pay_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const record: PaymentRecord = {
    ...data,
    id: newId,
    createdAt: now,
  };

  try {
    await setDoc(doc(db, 'platform_payments', newId), record);
  } catch (e) {
    console.warn('[Happiiz HR] Cloud sync payment note:', e);
  }

  inMemoryPayments = [record, ...inMemoryPayments];

  // Update associated subscription to active
  const sub = inMemorySubscriptions.find((s) => s.companyId === data.companyId);
  if (sub && record.status === 'successful') {
    sub.status = 'active';
    sub.lastPaymentId = newId;
    sub.updatedAt = now;
  }

  await logAuditEvent({
    tenantId: data.tenantId,
    actorUid: 'finance_admin',
    actorEmail,
    action: 'SUBSCRIPTION_PAYMENT_RECORDED',
    category: 'billing',
    details: `Recorded payment of ₹${data.totalAmount} for ${data.companyName} via ${data.paymentMethod} (Ref: ${data.transactionReference})`,
    targetRecord: newId,
    newValue: JSON.stringify({ amount: data.totalAmount, ref: data.transactionReference }),
  });

  return record;
}

// ==========================================
// 6. Platform Settings
// ==========================================

export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const snap = await getDoc(doc(db, 'platform_settings', 'global'));
    if (snap.exists()) {
      inMemorySettings = snap.data() as PlatformSettings;
      return inMemorySettings;
    }
    await setDoc(doc(db, 'platform_settings', 'global'), INITIAL_PLATFORM_SETTINGS);
  } catch (e) {
    console.warn('[Happiiz HR] Settings fallback:', e);
  }
  return inMemorySettings;
}

export async function updatePlatformSettings(
  updates: Partial<PlatformSettings>,
  actorEmail: string
): Promise<PlatformSettings> {
  const updated: PlatformSettings = {
    ...inMemorySettings,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'platform_settings', 'global'), updated);
  } catch (e) {
    console.warn('[Happiiz HR] Save settings note:', e);
  }

  inMemorySettings = updated;

  await logAuditEvent({
    tenantId: 'platform',
    actorUid: 'platform_owner',
    actorEmail,
    action: 'PLATFORM_SETTINGS_UPDATED',
    category: 'settings',
    details: `Global platform settings modified by ${actorEmail}`,
    newValue: JSON.stringify(updates),
  });

  return updated;
}

// ==========================================
// 7. Platform Admin Team & RBAC
// ==========================================

export async function getPlatformAdmins(): Promise<PlatformAdminUser[]> {
  try {
    const snap = await getDocs(collection(db, 'platform_administrators'));
    if (!snap.empty) {
      inMemoryAdmins = snap.docs.map((d) => d.data() as PlatformAdminUser);
      return inMemoryAdmins;
    }
    for (const a of INITIAL_ADMIN_USERS) {
      try {
        await setDoc(doc(db, 'platform_administrators', a.id), a);
      } catch (e) {
        // non-blocking
      }
    }
  } catch (e) {
    console.warn('[Happiiz HR] Admins fallback:', e);
  }
  return inMemoryAdmins;
}

export async function syncMasterSuperAdminRecord(
  uid: string = 'myHfxnY2nnVBsbwrg3vgu6PhNSR2',
  email: string = 'superadmin@happiizhr.com',
  name: string = 'Sandeep Rana'
): Promise<void> {
  const now = new Date().toISOString();
  const adminDoc: PlatformAdminUser = {
    id: uid,
    email,
    name,
    adminRole: 'platform_owner',
    permissions: ['all', 'billing', 'tenants', 'security', 'settings', 'approvals', 'master_control'],
    status: 'active',
    assignedAt: now,
    lastLogin: now,
  };

  try {
    await setDoc(doc(db, 'platform_administrators', uid), adminDoc, { merge: true });
  } catch (err) {
    console.warn('[Happiiz HR] Sync master admin to platform_administrators note:', err);
  }

  const idx = inMemoryAdmins.findIndex((a) => a.id === uid || a.email.toLowerCase() === email.toLowerCase());
  if (idx >= 0) {
    inMemoryAdmins[idx] = adminDoc;
  } else {
    inMemoryAdmins.unshift(adminDoc);
  }
}

export async function updateAdminUser(
  admin: PlatformAdminUser,
  actorEmail: string
): Promise<PlatformAdminUser> {
  try {
    await setDoc(doc(db, 'platform_administrators', admin.id), admin);
  } catch (e) {
    // non-blocking
  }

  inMemoryAdmins = inMemoryAdmins.map((a) => (a.id === admin.id ? admin : a));

  await logAuditEvent({
    tenantId: 'platform',
    actorUid: 'platform_owner',
    actorEmail,
    action: 'ADMIN_ROLE_UPDATED',
    category: 'role',
    details: `Administrator ${admin.email} role set to ${admin.adminRole}`,
    targetRecord: admin.id,
    newValue: admin.adminRole,
  });

  return admin;
}

// ==========================================
// 8. Support Tickets
// ==========================================

export async function getSupportTickets(): Promise<SupportTicket[]> {
  try {
    const snap = await getDocs(collection(db, 'platform_tickets'));
    if (!snap.empty) {
      inMemoryTickets = snap.docs.map((d) => d.data() as SupportTicket);
      return inMemoryTickets;
    }
    for (const t of INITIAL_SUPPORT_TICKETS) {
      try {
        await setDoc(doc(db, 'platform_tickets', t.id), t);
      } catch (e) {
        // non-blocking
      }
    }
  } catch (e) {
    console.warn('[Happiiz HR] Tickets fallback:', e);
  }
  return inMemoryTickets;
}

export async function updateSupportTicket(
  ticketId: string,
  updates: Partial<SupportTicket>,
  actorEmail: string
): Promise<SupportTicket> {
  const existing = inMemoryTickets.find((t) => t.id === ticketId);
  const now = new Date().toISOString();

  const updated: SupportTicket = {
    ...(existing || ({} as SupportTicket)),
    ...updates,
    id: ticketId,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'platform_tickets', ticketId), updated);
  } catch (e) {
    // non-blocking
  }

  inMemoryTickets = inMemoryTickets.map((t) => (t.id === ticketId ? updated : t));

  await logAuditEvent({
    tenantId: updated.tenantId || 'platform',
    actorUid: 'support_admin',
    actorEmail,
    action: 'SUPPORT_TICKET_UPDATED',
    category: 'tenant',
    details: `Ticket ${updated.ticketCode} status updated to ${updated.status}`,
    targetRecord: ticketId,
    newValue: updated.status,
  });

  return updated;
}

// ==========================================
// 9. Company Approval & Lifecycle Workflow
// ==========================================

export async function approveCompanyRegistration(
  companyId: string,
  actorEmail: string,
  notes?: string
): Promise<void> {
  await updateCompanyStatus(companyId, 'active', actorEmail);

  try {
    await updateDoc(doc(db, 'companies', companyId), {
      verificationStatus: 'verified',
      approvalNotes: notes || 'Approved by Super Admin verification team.',
      verifiedBy: actorEmail,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    // non-blocking
  }

  // Ensure subscription exists and is active
  let sub = inMemorySubscriptions.find((s) => s.companyId === companyId);
  if (!sub) {
    const comp = (await getCompanies()).find((c) => c.id === companyId);
    if (comp) {
      const now = new Date();
      const renewalDate = new Date();
      renewalDate.setDate(renewalDate.getDate() + 30);

      sub = {
        id: `sub_${companyId}`,
        companyId,
        tenantId: comp.tenantId,
        companyName: comp.name,
        planId: 'plan_starter',
        planCode: comp.subscriptionPlan || 'starter',
        planName: (comp.subscriptionPlan || 'starter').toUpperCase(),
        billingCycle: 'monthly',
        status: 'active',
        currentEmployees: comp.employeeCount || 25,
        billableEmployees: comp.employeeCount || 25,
        ratePerEmployee: 20,
        minMonthlyFee: 520,
        calculatedMonthlyFee: Math.max(520, (comp.employeeCount || 25) * 20),
        discountPercent: 0,
        startDate: now.toISOString(),
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: renewalDate.toISOString(),
        nextRenewalDate: renewalDate.toISOString(),
        notes: 'Initial subscription provisioned on company approval.',
        updatedAt: now.toISOString(),
      };
      inMemorySubscriptions.push(sub);
      try {
        await setDoc(doc(db, 'platform_subscriptions', sub.id), sub);
      } catch (e) {
        // non-blocking
      }
    }
  } else {
    sub.status = 'active';
  }

  await logAuditEvent({
    tenantId: 'platform',
    actorUid: 'verification_admin',
    actorEmail,
    action: 'COMPANY_REGISTRATION_APPROVED',
    category: 'approval',
    details: `Company registration approved. Workspace activated. Notes: ${notes || 'Verified'}`,
    targetRecord: companyId,
    newValue: 'active',
    reason: notes,
  });
}

export async function rejectCompanyRegistration(
  companyId: string,
  actorEmail: string,
  reason: string
): Promise<void> {
  await updateCompanyStatus(companyId, 'suspended', actorEmail);

  try {
    await updateDoc(doc(db, 'companies', companyId), {
      verificationStatus: 'rejected',
      approvalNotes: reason,
      verifiedBy: actorEmail,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    // non-blocking
  }

  await logAuditEvent({
    tenantId: 'platform',
    actorUid: 'verification_admin',
    actorEmail,
    action: 'COMPANY_REGISTRATION_REJECTED',
    category: 'approval',
    details: `Registration rejected for company ID ${companyId}. Reason: ${reason}`,
    targetRecord: companyId,
    newValue: 'rejected',
    reason,
  });
}

export async function archiveCompany(
  companyId: string,
  actorEmail: string,
  reason: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'companies', companyId), {
      isArchived: true,
      subscriptionStatus: 'suspended',
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    // non-blocking
  }

  const compList = await getCompanies();
  const comp = compList.find((c) => c.id === companyId);
  if (comp) {
    comp.isArchived = true;
    comp.subscriptionStatus = 'suspended';
  }

  await logAuditEvent({
    tenantId: comp?.tenantId || 'platform',
    actorUid: 'super_admin',
    actorEmail,
    action: 'COMPANY_ARCHIVED_SAFE_STORAGE',
    category: 'tenant',
    details: `Company ${comp?.name} archived. Statutory legal & financial records preserved immutably.`,
    targetRecord: companyId,
    reason,
  });
}

// ==========================================
// 10. Usage Metrics Monitoring
// ==========================================

export async function getCompanyUsageStats(): Promise<CompanyUsage[]> {
  const companies = await getCompanies();
  const subscriptions = await getAllSubscriptions();

  return companies.map((c) => {
    const sub = subscriptions.find((s) => s.companyId === c.id);
    const maxEmp = c.maxEmployees || 100;
    const activeEmp = c.employeeCount || 20;
    const usagePercent = Math.min(100, Math.round((activeEmp / maxEmp) * 100));

    return {
      companyId: c.id,
      tenantId: c.tenantId,
      companyName: c.name,
      activeEmployees: activeEmp,
      maxEmployees: maxEmp,
      registeredUsers: Math.round(activeEmp * 0.1) + 2,
      storageUsedMb: Math.round(activeEmp * 8.5),
      storageLimitMb: sub?.planCode === 'enterprise' ? 100000 : 5000,
      documentCount: Math.round(activeEmp * 3.2),
      monthlyApiCalls: Math.round(activeEmp * 120),
      apiCallsLimit: 50000,
      siteCount: Math.max(1, Math.round(activeEmp / 20)),
      monthlyAttendanceRecords: activeEmp * 28,
      usagePercent,
    };
  });
}
