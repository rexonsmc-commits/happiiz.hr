/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import {
  ClientInvoice,
  InvoiceLineItem,
  RateCardItem,
  AdditionalServiceItem,
  ServiceChargeConfig,
  DebitNoteItem,
  CreditNoteItem,
  ClientPaymentRecord,
  ClientLedgerEntry,
  GstConfiguration,
  ClientProfitabilityReport,
  Client,
  ClientSite,
  ClientContract,
  PayrollReadyAttendanceSummary,
  PayrollEntry,
  Company,
  InvoiceStatus,
  BillingRateType,
} from '../types';
import { round2, formatINR, numberToIndianWords } from './payrollService';

// ==========================================
// In-Memory Fallback Cache for Resilient Operation
// ==========================================

const rateCardsCache = new Map<string, RateCardItem[]>();
const invoicesCache = new Map<string, ClientInvoice[]>();
const additionalServicesCache = new Map<string, AdditionalServiceItem[]>();
const serviceChargesCache = new Map<string, ServiceChargeConfig[]>();
const debitNotesCache = new Map<string, DebitNoteItem[]>();
const creditNotesCache = new Map<string, CreditNoteItem[]>();
const paymentsCache = new Map<string, ClientPaymentRecord[]>();
const ledgerCache = new Map<string, ClientLedgerEntry[]>();
const gstConfigCache = new Map<string, GstConfiguration>();
const contractsCache = new Map<string, ClientContract[]>();

export { round2, formatINR, numberToIndianWords };

// ==========================================
// State & GST Helper Utilities
// ==========================================

export const INDIAN_STATES: { code: string; name: string }[] = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '19', name: 'West Bengal' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '36', name: 'Telangana' },
];

export function getStateNameByCode(code: string): string {
  const found = INDIAN_STATES.find((s) => s.code === code);
  return found ? found.name : 'Haryana';
}

export function isInterStateSupply(supplierCode: string, clientCode: string): boolean {
  if (!supplierCode || !clientCode) return false;
  return supplierCode.trim() !== clientCode.trim();
}

// ==========================================
// Default Seed Configurations
// ==========================================

export function getDefaultGstConfig(
  companyId: string,
  tenantId: string,
  company: Company | null
): GstConfiguration {
  return {
    id: `gst_cfg_${companyId}`,
    tenantId,
    companyId,
    supplierLegalName: company?.name || 'Happiiz Workforce Services Pvt Ltd',
    supplierTradeName: company?.displayName || company?.name || 'Happiiz HR',
    supplierGstin: company?.gstNumber || '06AAACH7281Q1Z8',
    supplierPan: company?.taxId || 'AAACH7281Q',
    stateName: company?.state || 'Haryana',
    stateCode: '06', // Default Haryana
    registeredAddress:
      company?.address || 'Tower B, Cyber City, DLF Phase 2, Gurugram, Haryana - 122002',
    defaultSecuritySacCode: '998525', // Security services
    defaultHousekeepingSacCode: '998513', // Cleaning & housekeeping services
    defaultManpowerSacCode: '998519', // Other manpower supply services
    standardGstRate: 18.0,
    reverseChargeApplicable: false,
    invoiceNumberPrefix: 'HHR',
    financialYear: '2026-27',
    nextInvoiceSequence: 104,
    updatedAt: new Date().toISOString(),
  };
}

export function getInitialRateCards(
  companyId: string,
  tenantId: string,
  clients: Client[] = [],
  sites: ClientSite[] = []
): RateCardItem[] {
  const c1 = clients[0]?.id || 'client_rexon_01';
  const c1Name = clients[0]?.clientName || 'DLF CyberCity Developers Ltd';
  const s1 = sites[0]?.id || 'site_rexon_01';
  const s1Name = sites[0]?.siteName || 'Cyber City Tower B';

  return [
    {
      id: `rc_${companyId}_01`,
      tenantId,
      companyId,
      clientId: c1,
      clientName: c1Name,
      siteId: s1,
      siteName: s1Name,
      serviceCategory: 'security',
      designation: 'Security Guard (Unarmed)',
      rateType: 'per_month',
      clientBillingRate: 24500, // Client billing rate (different from employee wage!)
      overtimeHourlyRate: 185,
      doubleDutyShiftRate: 950,
      hsnSacCode: '998525',
      taxRatePercent: 18.0,
      effectiveFrom: '2026-04-01',
      status: 'active',
      notes: 'Standard 8-hour guard shift billing rate',
      createdAt: '2026-04-01T00:00:00Z',
    },
    {
      id: `rc_${companyId}_02`,
      tenantId,
      companyId,
      clientId: c1,
      clientName: c1Name,
      siteId: s1,
      siteName: s1Name,
      serviceCategory: 'security',
      designation: 'Security Supervisor',
      rateType: 'per_month',
      clientBillingRate: 31000,
      overtimeHourlyRate: 230,
      doubleDutyShiftRate: 1200,
      hsnSacCode: '998525',
      taxRatePercent: 18.0,
      effectiveFrom: '2026-04-01',
      status: 'active',
      notes: 'Site supervisor deployment rate',
      createdAt: '2026-04-01T00:00:00Z',
    },
    {
      id: `rc_${companyId}_03`,
      tenantId,
      companyId,
      clientId: c1,
      clientName: c1Name,
      siteId: s1,
      siteName: s1Name,
      serviceCategory: 'housekeeping',
      designation: 'Housekeeper / Janitor',
      rateType: 'per_month',
      clientBillingRate: 21500,
      overtimeHourlyRate: 160,
      doubleDutyShiftRate: 850,
      hsnSacCode: '998513',
      taxRatePercent: 18.0,
      effectiveFrom: '2026-04-01',
      status: 'active',
      notes: 'Corporate housekeeping standard staff',
      createdAt: '2026-04-01T00:00:00Z',
    },
    {
      id: `rc_${companyId}_04`,
      tenantId,
      companyId,
      clientId: c1,
      clientName: c1Name,
      siteId: s1,
      siteName: s1Name,
      serviceCategory: 'manpower',
      designation: 'Facility Helper / Loader',
      rateType: 'per_day',
      clientBillingRate: 850,
      overtimeHourlyRate: 140,
      doubleDutyShiftRate: 850,
      hsnSacCode: '998519',
      taxRatePercent: 18.0,
      effectiveFrom: '2026-04-01',
      status: 'active',
      notes: 'Daily wage helper on actual attendance basis',
      createdAt: '2026-04-01T00:00:00Z',
    },
  ];
}

export function getInitialAdditionalServices(companyId: string, tenantId: string): AdditionalServiceItem[] {
  return [
    {
      id: `as_${companyId}_01`,
      tenantId,
      companyId,
      clientId: 'client_rexon_01',
      serviceName: 'CCTV Surveillance 24x7 Control Room AMC',
      description: 'Monthly remote monitoring and IP camera telemetry health checks',
      quantity: 1,
      unit: 'Lump Sum',
      unitPrice: 15000,
      discount: 0,
      hsnSacCode: '998525',
      taxRate: 18.0,
      totalAmount: 15000,
      isRecurring: true,
      status: 'active',
      createdAt: '2026-10-01T00:00:00Z',
    },
    {
      id: `as_${companyId}_02`,
      tenantId,
      companyId,
      clientId: 'client_rexon_01',
      serviceName: 'Deep Floor Scrubbing & Chemical Disinfection',
      description: 'Quarterly industrial mechanical scrub with Diversey Taski chemicals',
      quantity: 2,
      unit: 'Floors',
      unitPrice: 8500,
      discount: 1000,
      hsnSacCode: '998513',
      taxRate: 18.0,
      totalAmount: 16000,
      isRecurring: false,
      status: 'active',
      createdAt: '2026-11-01T00:00:00Z',
    },
  ];
}

export function getInitialServiceCharges(companyId: string, tenantId: string): ServiceChargeConfig[] {
  return [
    {
      id: `sc_${companyId}_01`,
      tenantId,
      companyId,
      clientId: 'client_rexon_01',
      chargeType: 'percentage',
      chargeValue: 5.0, // 5% Service Charge
      taxTreatment: 'taxable_under_gst',
      status: 'active',
    },
  ];
}

export function getInitialInvoices(
  companyId: string,
  tenantId: string,
  company: Company | null,
  clients: Client[] = []
): ClientInvoice[] {
  const c1Name = clients[0]?.clientName || 'DLF CyberCity Developers Ltd';
  const c1Gstin = clients[0]?.gstNumber || '06AAACD9182P1Z4';
  const c1Addr = clients[0]?.registeredAddress || 'DLF Gateway Tower, Sector 25, Gurugram, Haryana';

  const inv1: ClientInvoice = {
    id: `inv_${companyId}_2026-11_01`,
    invoiceNumber: 'HHR/2026-27/0101',
    tenantId,
    companyId,
    clientId: 'client_rexon_01',
    clientName: c1Name,
    clientLegalName: c1Name,
    clientAddress: c1Addr,
    clientGstin: c1Gstin,
    clientPan: 'AAACD9182P',
    clientState: 'Haryana',
    clientStateCode: '06',
    placeOfSupply: '06 - Haryana',
    siteId: 'site_rexon_01',
    siteName: 'Cyber City Tower B',
    contractId: 'HHR-CON-2026-001',
    contractNumber: 'HHR-CON-2026-001',
    invoiceType: 'monthly_tax_invoice',
    billingPeriod: '2026-11',
    invoiceDate: '2026-11-01',
    dueDate: '2026-11-30',
    status: 'approved',
    items: [
      {
        id: 'item_01',
        serviceCategory: 'security',
        designation: 'Security Guard (Unarmed)',
        description: 'Provision of trained Security Guards for 24x7 gate & perimeter security (Shift A/B/C)',
        hsnSacCode: '998525',
        siteName: 'Cyber City Tower B',
        deployedCount: 4,
        billableDays: 30,
        rateType: 'per_month',
        unitRate: 24500,
        baseAmount: 98000,
        overtimeHours: 24,
        overtimeRate: 185,
        overtimeAmount: 4440,
        doubleDutyCount: 2,
        doubleDutyRate: 950,
        doubleDutyAmount: 1900,
        discount: 0,
        taxableValue: 104340,
      },
      {
        id: 'item_02',
        serviceCategory: 'security',
        designation: 'Security Supervisor',
        description: 'Shift coordination, visitor management, patrol logging & emergency response',
        hsnSacCode: '998525',
        siteName: 'Cyber City Tower B',
        deployedCount: 1,
        billableDays: 30,
        rateType: 'per_month',
        unitRate: 31000,
        baseAmount: 31000,
        overtimeHours: 10,
        overtimeRate: 230,
        overtimeAmount: 2300,
        doubleDutyCount: 0,
        doubleDutyRate: 1200,
        doubleDutyAmount: 0,
        discount: 0,
        taxableValue: 33300,
      },
      {
        id: 'item_03',
        serviceCategory: 'housekeeping',
        designation: 'Housekeeper / Janitor',
        description: 'Facility hygiene, washroom sanitation, waste handling & floor buffing',
        hsnSacCode: '998513',
        siteName: 'Cyber City Tower B',
        deployedCount: 2,
        billableDays: 30,
        rateType: 'per_month',
        unitRate: 21500,
        baseAmount: 43000,
        overtimeHours: 8,
        overtimeRate: 160,
        overtimeAmount: 1280,
        doubleDutyCount: 1,
        doubleDutyRate: 850,
        doubleDutyAmount: 850,
        discount: 0,
        taxableValue: 45130,
      },
    ],
    additionalServices: [
      {
        id: 'as_01',
        tenantId,
        companyId,
        clientId: 'client_rexon_01',
        serviceName: 'CCTV Surveillance 24x7 Control Room AMC',
        description: 'Monthly control room camera diagnostics & video telemetry backup',
        quantity: 1,
        unit: 'Month',
        unitPrice: 15000,
        discount: 0,
        hsnSacCode: '998525',
        taxRate: 18.0,
        totalAmount: 15000,
        isRecurring: true,
        status: 'billed',
        createdAt: '2026-11-01T00:00:00Z',
      },
    ],
    subTotal: 197770,
    serviceChargePercent: 5.0,
    serviceChargeAmount: 9888.5,
    taxableAmount: 207658.5,
    isInterState: false, // Haryana to Haryana (Intra-State)
    cgstRate: 9.0,
    cgstAmount: 18689.27,
    sgstRate: 9.0,
    sgstAmount: 18689.27,
    igstRate: 0,
    igstAmount: 0,
    totalGst: 37378.54,
    roundOff: -0.04,
    grandTotal: 245037,
    amountInWords: 'Two Lakh Forty-Five Thousand Thirty-Seven Rupees Only',
    paidAmount: 100000,
    outstandingAmount: 145037,
    isFinalized: true,
    finalizedAt: '2026-11-02T10:00:00Z',
    finalizedBy: 'Finance Controller',
    approvedBy: 'Director of Billing',
    approvedAt: '2026-11-02T09:30:00Z',
    paymentTerms: 'Payment due within 30 days of invoice receipt',
    bankDetails: {
      beneficiaryName: company?.name || 'Happiiz Workforce Services Pvt Ltd',
      bankName: 'HDFC Bank Ltd',
      accountNumber: '50200084920194',
      ifscCode: 'HDFC0001829',
      branchName: 'Cyber City Branch, Gurugram',
      upiId: 'happiiz@hdfcbank',
    },
    termsAndConditions:
      '1. Payment is strictly due within 30 days from invoice date.\n2. Interest @ 18% p.a. will be levied on delayed payments beyond credit period.\n3. Discrepancies if any must be notified within 7 days of invoice submission.\n4. Subject to Gurugram / Haryana jurisdiction.',
    supplierGstin: company?.gstNumber || '06AAACH7281Q1Z8',
    supplierAddress:
      company?.address || 'Tower B, Cyber City, DLF Phase 2, Gurugram, Haryana - 122002',
    supplierStateCode: '06',
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: new Date().toISOString(),
  };

  const inv2: ClientInvoice = {
    id: `inv_${companyId}_2026-10_01`,
    invoiceNumber: 'HHR/2026-27/0100',
    tenantId,
    companyId,
    clientId: 'client_rexon_01',
    clientName: c1Name,
    clientLegalName: c1Name,
    clientAddress: c1Addr,
    clientGstin: c1Gstin,
    clientPan: 'AAACD9182P',
    clientState: 'Haryana',
    clientStateCode: '06',
    placeOfSupply: '06 - Haryana',
    siteId: 'site_rexon_01',
    siteName: 'Cyber City Tower B',
    contractId: 'HHR-CON-2026-001',
    contractNumber: 'HHR-CON-2026-001',
    invoiceType: 'monthly_tax_invoice',
    billingPeriod: '2026-10',
    invoiceDate: '2026-10-01',
    dueDate: '2026-10-31',
    status: 'paid',
    items: [
      {
        id: 'item_10_01',
        serviceCategory: 'security',
        designation: 'Security Guard (Unarmed)',
        description: 'Security Deployment 24x7 gate security',
        hsnSacCode: '998525',
        siteName: 'Cyber City Tower B',
        deployedCount: 4,
        billableDays: 30,
        rateType: 'per_month',
        unitRate: 24500,
        baseAmount: 98000,
        overtimeHours: 16,
        overtimeRate: 185,
        overtimeAmount: 2960,
        doubleDutyCount: 0,
        doubleDutyRate: 950,
        doubleDutyAmount: 0,
        discount: 0,
        taxableValue: 100960,
      },
    ],
    additionalServices: [],
    subTotal: 100960,
    serviceChargePercent: 5.0,
    serviceChargeAmount: 5048,
    taxableAmount: 106008,
    isInterState: false,
    cgstRate: 9.0,
    cgstAmount: 9540.72,
    sgstRate: 9.0,
    sgstAmount: 9540.72,
    igstRate: 0,
    igstAmount: 0,
    totalGst: 19081.44,
    roundOff: 0.56,
    grandTotal: 125090,
    amountInWords: 'One Lakh Twenty-Five Thousand Ninety Rupees Only',
    paidAmount: 125090,
    outstandingAmount: 0,
    isFinalized: true,
    finalizedAt: '2026-10-02T10:00:00Z',
    finalizedBy: 'Finance Controller',
    approvedBy: 'Director of Billing',
    approvedAt: '2026-10-02T09:30:00Z',
    paymentTerms: 'Net 30 Days',
    bankDetails: {
      beneficiaryName: company?.name || 'Happiiz Workforce Services Pvt Ltd',
      bankName: 'HDFC Bank Ltd',
      accountNumber: '50200084920194',
      ifscCode: 'HDFC0001829',
      branchName: 'Cyber City Branch, Gurugram',
    },
    termsAndConditions: 'Standard billing terms apply.',
    supplierGstin: company?.gstNumber || '06AAACH7281Q1Z8',
    supplierAddress: company?.address || 'Tower B, Cyber City, Gurugram',
    supplierStateCode: '06',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-25T15:00:00Z',
  };

  return [inv1, inv2];
}

export function getInitialDebitCreditNotes(companyId: string, tenantId: string): {
  debitNotes: DebitNoteItem[];
  creditNotes: CreditNoteItem[];
} {
  return {
    debitNotes: [
      {
        id: `dn_${companyId}_01`,
        documentNumber: 'DN/2026-27/001',
        tenantId,
        companyId,
        clientId: 'client_rexon_01',
        clientName: 'DLF CyberCity Developers Ltd',
        originalInvoiceId: `inv_${companyId}_2026-11_01`,
        originalInvoiceNumber: 'HHR/2026-27/0101',
        documentDate: '2026-11-05',
        reason: 'Unbilled Emergency VIP Escort Duty on Diwali Eve (4 Guards x 8h)',
        taxableAmount: 8000,
        gstAmount: 1440,
        totalAmount: 9440,
        status: 'approved',
        approvedBy: 'Accounts Manager',
        createdAt: '2026-11-05T11:00:00Z',
      },
    ],
    creditNotes: [
      {
        id: `cn_${companyId}_01`,
        documentNumber: 'CN/2026-27/001',
        tenantId,
        companyId,
        clientId: 'client_rexon_01',
        clientName: 'DLF CyberCity Developers Ltd',
        originalInvoiceId: `inv_${companyId}_2026-11_01`,
        originalInvoiceNumber: 'HHR/2026-27/0101',
        documentDate: '2026-11-06',
        reason: 'Client contractual loyalty rebate (2% discount agreement)',
        taxableAmount: 4000,
        gstAmount: 720,
        totalAmount: 4720,
        status: 'approved',
        approvedBy: 'General Manager Billing',
        createdAt: '2026-11-06T14:30:00Z',
      },
    ],
  };
}

export function getInitialPayments(companyId: string, tenantId: string): ClientPaymentRecord[] {
  return [
    {
      id: `pmt_${companyId}_01`,
      receiptNumber: 'RCP/2026-27/001',
      tenantId,
      companyId,
      clientId: 'client_rexon_01',
      clientName: 'DLF CyberCity Developers Ltd',
      invoiceId: `inv_${companyId}_2026-10_01`,
      invoiceNumber: 'HHR/2026-27/0100',
      paymentDate: '2026-10-25',
      amountReceived: 125090,
      paymentMode: 'bank_transfer',
      bankName: 'HDFC Corporate Banking',
      referenceNumber: 'NEFT-DLF-98237190',
      utrNumber: 'HDFCN0098237190',
      status: 'reconciled',
      recordedBy: 'Finance Accounts',
      reconciledBy: 'Head of Accounts',
      reconciledAt: '2026-10-25T16:00:00Z',
      notes: 'Full payment for October 2026 monthly billing',
      createdAt: '2026-10-25T15:30:00Z',
    },
    {
      id: `pmt_${companyId}_02`,
      receiptNumber: 'RCP/2026-27/002',
      tenantId,
      companyId,
      clientId: 'client_rexon_01',
      clientName: 'DLF CyberCity Developers Ltd',
      invoiceId: `inv_${companyId}_2026-11_01`,
      invoiceNumber: 'HHR/2026-27/0101',
      paymentDate: '2026-11-04',
      amountReceived: 100000,
      paymentMode: 'bank_transfer',
      bankName: 'HDFC Corporate Banking',
      referenceNumber: 'RTGS-DLF-10293847',
      utrNumber: 'HDFCR0010293847',
      status: 'reconciled',
      recordedBy: 'Senior Accountant',
      notes: 'Part advance payment against November invoice',
      createdAt: '2026-11-04T12:00:00Z',
    },
  ];
}

export function getInitialLedger(companyId: string, tenantId: string): ClientLedgerEntry[] {
  return [
    {
      id: `led_${companyId}_01`,
      tenantId,
      companyId,
      clientId: 'client_rexon_01',
      clientName: 'DLF CyberCity Developers Ltd',
      transactionDate: '2026-10-01',
      entryType: 'INVOICE',
      referenceNumber: 'HHR/2026-27/0100',
      description: 'Monthly Security & Facility Billing - October 2026',
      debitAmount: 125090,
      creditAmount: 0,
      runningBalance: 125090,
      createdAt: '2026-10-01T08:00:00Z',
    },
    {
      id: `led_${companyId}_02`,
      tenantId,
      companyId,
      clientId: 'client_rexon_01',
      clientName: 'DLF CyberCity Developers Ltd',
      transactionDate: '2026-10-25',
      entryType: 'PAYMENT',
      referenceNumber: 'RCP/2026-27/001',
      description: 'Payment Received via RTGS (UTR: HDFCN0098237190)',
      debitAmount: 0,
      creditAmount: 125090,
      runningBalance: 0,
      createdAt: '2026-10-25T15:30:00Z',
    },
    {
      id: `led_${companyId}_03`,
      tenantId,
      companyId,
      clientId: 'client_rexon_01',
      clientName: 'DLF CyberCity Developers Ltd',
      transactionDate: '2026-11-01',
      entryType: 'INVOICE',
      referenceNumber: 'HHR/2026-27/0101',
      description: 'Monthly Security & Facility Billing - November 2026',
      debitAmount: 245037,
      creditAmount: 0,
      runningBalance: 245037,
      createdAt: '2026-11-01T08:00:00Z',
    },
    {
      id: `led_${companyId}_04`,
      tenantId,
      companyId,
      clientId: 'client_rexon_01',
      clientName: 'DLF CyberCity Developers Ltd',
      transactionDate: '2026-11-04',
      entryType: 'PAYMENT',
      referenceNumber: 'RCP/2026-27/002',
      description: 'Part Payment via RTGS (UTR: HDFCR0010293847)',
      debitAmount: 0,
      creditAmount: 100000,
      runningBalance: 145037,
      createdAt: '2026-11-04T12:00:00Z',
    },
    {
      id: `led_${companyId}_05`,
      tenantId,
      companyId,
      clientId: 'client_rexon_01',
      clientName: 'DLF CyberCity Developers Ltd',
      transactionDate: '2026-11-05',
      entryType: 'DEBIT_NOTE',
      referenceNumber: 'DN/2026-27/001',
      description: 'Unbilled Emergency VIP Escort Duty',
      debitAmount: 9440,
      creditAmount: 0,
      runningBalance: 154477,
      createdAt: '2026-11-05T11:00:00Z',
    },
    {
      id: `led_${companyId}_06`,
      tenantId,
      companyId,
      clientId: 'client_rexon_01',
      clientName: 'DLF CyberCity Developers Ltd',
      transactionDate: '2026-11-06',
      entryType: 'CREDIT_NOTE',
      referenceNumber: 'CN/2026-27/001',
      description: 'Client contractual loyalty rebate',
      debitAmount: 0,
      creditAmount: 4720,
      runningBalance: 149757,
      createdAt: '2026-11-06T14:30:00Z',
    },
  ];
}

// ==========================================
// Firestore CRUD & Service Operations
// ==========================================

export async function getGstConfiguration(
  companyId: string,
  tenantId: string,
  company: Company | null
): Promise<GstConfiguration> {
  try {
    const docRef = doc(db, 'companies', companyId, 'gstConfigurations', `gst_cfg_${companyId}`);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as GstConfiguration;
      gstConfigCache.set(companyId, data);
      return data;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `companies/${companyId}/gstConfigurations`);
  }

  if (!gstConfigCache.has(companyId)) {
    const initial = getDefaultGstConfig(companyId, tenantId, company);
    gstConfigCache.set(companyId, initial);
  }
  return gstConfigCache.get(companyId)!;
}

export async function saveGstConfiguration(
  companyId: string,
  config: GstConfiguration
): Promise<void> {
  try {
    const docRef = doc(db, 'companies', companyId, 'gstConfigurations', config.id);
    await setDoc(docRef, { ...config, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `companies/${companyId}/gstConfigurations/${config.id}`);
  }
  gstConfigCache.set(companyId, config);
}

export async function getRateCards(
  companyId: string,
  tenantId: string,
  clients: Client[] = [],
  sites: ClientSite[] = []
): Promise<RateCardItem[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'rateCards');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items = snapshot.docs.map((d) => d.data() as RateCardItem);
      rateCardsCache.set(companyId, items);
      return items;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `companies/${companyId}/rateCards`);
  }

  if (!rateCardsCache.has(companyId)) {
    const initial = getInitialRateCards(companyId, tenantId, clients, sites);
    rateCardsCache.set(companyId, initial);
  }
  return rateCardsCache.get(companyId) || [];
}

export async function saveRateCard(companyId: string, card: RateCardItem): Promise<void> {
  try {
    const docRef = doc(db, 'companies', companyId, 'rateCards', card.id);
    await setDoc(docRef, { ...card, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `companies/${companyId}/rateCards/${card.id}`);
  }

  const list = rateCardsCache.get(companyId) || [];
  const idx = list.findIndex((c) => c.id === card.id);
  if (idx >= 0) list[idx] = card;
  else list.unshift(card);
  rateCardsCache.set(companyId, [...list]);
}

export async function getClientInvoices(
  companyId: string,
  tenantId: string,
  company: Company | null,
  clients: Client[] = []
): Promise<ClientInvoice[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'clientInvoices');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items = snapshot.docs.map((d) => d.data() as ClientInvoice);
      items.sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));
      invoicesCache.set(companyId, items);
      return items;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `companies/${companyId}/clientInvoices`);
  }

  if (!invoicesCache.has(companyId)) {
    const initial = getInitialInvoices(companyId, tenantId, company, clients);
    invoicesCache.set(companyId, initial);
  }
  return invoicesCache.get(companyId) || [];
}

export async function saveClientInvoice(companyId: string, invoice: ClientInvoice): Promise<void> {
  try {
    const docRef = doc(db, 'companies', companyId, 'clientInvoices', invoice.id);
    await setDoc(docRef, { ...invoice, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `companies/${companyId}/clientInvoices/${invoice.id}`);
  }

  const list = invoicesCache.get(companyId) || [];
  const idx = list.findIndex((i) => i.id === invoice.id);
  if (idx >= 0) list[idx] = invoice;
  else list.unshift(invoice);
  invoicesCache.set(companyId, [...list]);
}

export async function getAdditionalServices(
  companyId: string,
  tenantId: string
): Promise<AdditionalServiceItem[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'additionalServices');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items = snapshot.docs.map((d) => d.data() as AdditionalServiceItem);
      additionalServicesCache.set(companyId, items);
      return items;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `companies/${companyId}/additionalServices`);
  }

  if (!additionalServicesCache.has(companyId)) {
    const initial = getInitialAdditionalServices(companyId, tenantId);
    additionalServicesCache.set(companyId, initial);
  }
  return additionalServicesCache.get(companyId) || [];
}

export async function saveAdditionalService(
  companyId: string,
  service: AdditionalServiceItem
): Promise<void> {
  try {
    const docRef = doc(db, 'companies', companyId, 'additionalServices', service.id);
    await setDoc(docRef, service, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `companies/${companyId}/additionalServices/${service.id}`);
  }

  const list = additionalServicesCache.get(companyId) || [];
  const idx = list.findIndex((s) => s.id === service.id);
  if (idx >= 0) list[idx] = service;
  else list.unshift(service);
  additionalServicesCache.set(companyId, [...list]);
}

export async function getServiceCharges(
  companyId: string,
  tenantId: string
): Promise<ServiceChargeConfig[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'serviceCharges');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items = snapshot.docs.map((d) => d.data() as ServiceChargeConfig);
      serviceChargesCache.set(companyId, items);
      return items;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `companies/${companyId}/serviceCharges`);
  }

  if (!serviceChargesCache.has(companyId)) {
    const initial = getInitialServiceCharges(companyId, tenantId);
    serviceChargesCache.set(companyId, initial);
  }
  return serviceChargesCache.get(companyId) || [];
}

// ==========================================
// Debit & Credit Notes Management
// ==========================================

export async function getDebitNotes(companyId: string, tenantId: string): Promise<DebitNoteItem[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'debitNotes');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items = snapshot.docs.map((d) => d.data() as DebitNoteItem);
      debitNotesCache.set(companyId, items);
      return items;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `companies/${companyId}/debitNotes`);
  }

  if (!debitNotesCache.has(companyId)) {
    const initial = getInitialDebitCreditNotes(companyId, tenantId).debitNotes;
    debitNotesCache.set(companyId, initial);
  }
  return debitNotesCache.get(companyId) || [];
}

export async function createDebitNote(
  companyId: string,
  tenantId: string,
  note: DebitNoteItem
): Promise<void> {
  try {
    const docRef = doc(db, 'companies', companyId, 'debitNotes', note.id);
    await setDoc(docRef, note);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `companies/${companyId}/debitNotes/${note.id}`);
  }

  const list = debitNotesCache.get(companyId) || [];
  list.unshift(note);
  debitNotesCache.set(companyId, [...list]);

  // Update original invoice outstanding
  const invoices = invoicesCache.get(companyId) || [];
  const inv = invoices.find((i) => i.id === note.originalInvoiceId);
  if (inv) {
    inv.outstandingAmount = round2(inv.outstandingAmount + note.totalAmount);
    await saveClientInvoice(companyId, inv);
  }

  // Create Ledger entry (Debit increases receivable)
  await addClientLedgerEntry(companyId, {
    id: `led_dn_${note.id}`,
    tenantId,
    companyId,
    clientId: note.clientId,
    clientName: note.clientName,
    transactionDate: note.documentDate,
    entryType: 'DEBIT_NOTE',
    referenceNumber: note.documentNumber,
    description: `Debit Note: ${note.reason} (Inv: ${note.originalInvoiceNumber})`,
    debitAmount: note.totalAmount,
    creditAmount: 0,
    runningBalance: 0, // recalculated dynamically
    createdAt: new Date().toISOString(),
  });
}

export async function getCreditNotes(companyId: string, tenantId: string): Promise<CreditNoteItem[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'creditNotes');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items = snapshot.docs.map((d) => d.data() as CreditNoteItem);
      creditNotesCache.set(companyId, items);
      return items;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `companies/${companyId}/creditNotes`);
  }

  if (!creditNotesCache.has(companyId)) {
    const initial = getInitialDebitCreditNotes(companyId, tenantId).creditNotes;
    creditNotesCache.set(companyId, initial);
  }
  return creditNotesCache.get(companyId) || [];
}

export async function createCreditNote(
  companyId: string,
  tenantId: string,
  note: CreditNoteItem
): Promise<void> {
  try {
    const docRef = doc(db, 'companies', companyId, 'creditNotes', note.id);
    await setDoc(docRef, note);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `companies/${companyId}/creditNotes/${note.id}`);
  }

  const list = creditNotesCache.get(companyId) || [];
  list.unshift(note);
  creditNotesCache.set(companyId, [...list]);

  // Reduce original invoice outstanding
  const invoices = invoicesCache.get(companyId) || [];
  const inv = invoices.find((i) => i.id === note.originalInvoiceId);
  if (inv) {
    inv.outstandingAmount = round2(Math.max(0, inv.outstandingAmount - note.totalAmount));
    if (inv.outstandingAmount === 0 && inv.paidAmount > 0) {
      inv.status = 'paid';
    }
    await saveClientInvoice(companyId, inv);
  }

  // Create Ledger entry (Credit decreases receivable)
  await addClientLedgerEntry(companyId, {
    id: `led_cn_${note.id}`,
    tenantId,
    companyId,
    clientId: note.clientId,
    clientName: note.clientName,
    transactionDate: note.documentDate,
    entryType: 'CREDIT_NOTE',
    referenceNumber: note.documentNumber,
    description: `Credit Note: ${note.reason} (Inv: ${note.originalInvoiceNumber})`,
    debitAmount: 0,
    creditAmount: note.totalAmount,
    runningBalance: 0,
    createdAt: new Date().toISOString(),
  });
}

// ==========================================
// Payment Collection & Client Ledger
// ==========================================

export async function getClientPayments(
  companyId: string,
  tenantId: string
): Promise<ClientPaymentRecord[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'clientPayments');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items = snapshot.docs.map((d) => d.data() as ClientPaymentRecord);
      paymentsCache.set(companyId, items);
      return items;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `companies/${companyId}/clientPayments`);
  }

  if (!paymentsCache.has(companyId)) {
    const initial = getInitialPayments(companyId, tenantId);
    paymentsCache.set(companyId, initial);
  }
  return paymentsCache.get(companyId) || [];
}

export async function recordClientPayment(
  companyId: string,
  tenantId: string,
  payment: ClientPaymentRecord
): Promise<void> {
  try {
    const docRef = doc(db, 'companies', companyId, 'clientPayments', payment.id);
    await setDoc(docRef, payment);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `companies/${companyId}/clientPayments/${payment.id}`);
  }

  const pmtList = paymentsCache.get(companyId) || [];
  pmtList.unshift(payment);
  paymentsCache.set(companyId, [...pmtList]);

  // Update invoice outstanding
  const invoices = invoicesCache.get(companyId) || [];
  const inv = invoices.find((i) => i.id === payment.invoiceId);
  if (inv) {
    const newPaid = round2(inv.paidAmount + payment.amountReceived);
    const newOutstanding = round2(Math.max(0, inv.grandTotal - newPaid));
    inv.paidAmount = newPaid;
    inv.outstandingAmount = newOutstanding;
    if (newOutstanding === 0) {
      inv.status = 'paid';
    } else if (newPaid > 0) {
      inv.status = 'partially_paid';
    }
    await saveClientInvoice(companyId, inv);
  }

  // Record ledger entry
  await addClientLedgerEntry(companyId, {
    id: `led_pmt_${payment.id}`,
    tenantId,
    companyId,
    clientId: payment.clientId,
    clientName: payment.clientName,
    transactionDate: payment.paymentDate,
    entryType: 'PAYMENT',
    referenceNumber: payment.receiptNumber,
    description: `Payment Received via ${payment.paymentMode.toUpperCase()} (Ref: ${payment.referenceNumber || payment.utrNumber})`,
    debitAmount: 0,
    creditAmount: payment.amountReceived,
    runningBalance: 0,
    createdAt: new Date().toISOString(),
  });
}

export async function getClientLedger(
  companyId: string,
  tenantId: string,
  clientId?: string
): Promise<ClientLedgerEntry[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'clientLedger');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      let items = snapshot.docs.map((d) => d.data() as ClientLedgerEntry);
      items.sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));
      ledgerCache.set(companyId, items);
      if (clientId) items = items.filter((x) => x.clientId === clientId);
      return items;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `companies/${companyId}/clientLedger`);
  }

  if (!ledgerCache.has(companyId)) {
    const initial = getInitialLedger(companyId, tenantId);
    ledgerCache.set(companyId, initial);
  }

  let list = ledgerCache.get(companyId) || [];
  if (clientId) list = list.filter((x) => x.clientId === clientId);
  return list;
}

export async function addClientLedgerEntry(
  companyId: string,
  entry: ClientLedgerEntry
): Promise<void> {
  try {
    const docRef = doc(db, 'companies', companyId, 'clientLedger', entry.id);
    await setDoc(docRef, entry);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `companies/${companyId}/clientLedger/${entry.id}`);
  }

  const list = ledgerCache.get(companyId) || [];
  list.push(entry);
  list.sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));

  // Recalculate running balance
  let running = 0;
  for (const item of list) {
    running = round2(running + item.debitAmount - item.creditAmount);
    item.runningBalance = running;
  }
  ledgerCache.set(companyId, [...list]);
}

// ==========================================
// Central GST Invoice Calculation Engine
// ==========================================

export async function generateAutomaticInvoiceDraft(
  companyId: string,
  tenantId: string,
  clientId: string,
  billingPeriod: string, // "2026-11"
  clients: Client[],
  sites: ClientSite[],
  company: Company | null,
  siteId?: string
): Promise<ClientInvoice> {
  const gstConfig = await getGstConfiguration(companyId, tenantId, company);
  const rateCards = await getRateCards(companyId, tenantId, clients, sites);
  const additionalServices = await getAdditionalServices(companyId, tenantId);
  const serviceCharges = await getServiceCharges(companyId, tenantId);

  const client = clients.find((c) => c.id === clientId) || clients[0];
  const targetSite = siteId ? sites.find((s) => s.id === siteId) : sites.find((s) => s.clientId === clientId) || sites[0];

  // Match active rate cards for client and site
  const matchedRateCards = rateCards.filter(
    (rc) => rc.clientId === clientId && rc.status === 'active'
  );

  const lineItems: InvoiceLineItem[] = [];
  let subTotal = 0;

  if (matchedRateCards.length > 0) {
    matchedRateCards.forEach((rc, idx) => {
      const deployedCount = rc.designation.includes('Supervisor') ? 1 : 4;
      const billableDays = 30;
      const baseAmount =
        rc.rateType === 'per_day'
          ? round2(rc.clientBillingRate * billableDays * deployedCount)
          : round2(rc.clientBillingRate * deployedCount);

      // Overtime & Double duty simulation from duty roster
      const otHours = rc.designation.includes('Supervisor') ? 10 : 20;
      const otAmount = round2(otHours * rc.overtimeHourlyRate);
      const ddCount = rc.designation.includes('Supervisor') ? 0 : 2;
      const ddAmount = round2(ddCount * rc.doubleDutyShiftRate);

      const totalItemAmount = round2(baseAmount + otAmount + ddAmount);

      lineItems.push({
        id: `line_${idx + 1}`,
        serviceCategory: rc.serviceCategory,
        designation: rc.designation,
        description: `${rc.designation} deployment at ${targetSite?.siteName || 'Client Facility'} (${rc.rateType.replace('_', ' ')})`,
        hsnSacCode: rc.hsnSacCode || gstConfig.defaultSecuritySacCode,
        siteName: targetSite?.siteName || 'Facility Center',
        deployedCount,
        billableDays,
        rateType: rc.rateType,
        unitRate: rc.clientBillingRate,
        baseAmount,
        overtimeHours: otHours,
        overtimeRate: rc.overtimeHourlyRate,
        overtimeAmount: otAmount,
        doubleDutyCount: ddCount,
        doubleDutyRate: rc.doubleDutyShiftRate,
        doubleDutyAmount: ddAmount,
        discount: 0,
        taxableValue: totalItemAmount,
      });

      subTotal += totalItemAmount;
    });
  } else {
    // Default fallback line item if no specific rate card
    const defaultAmount = 98000;
    lineItems.push({
      id: 'line_default_1',
      serviceCategory: 'security',
      designation: 'Security Guard Deployment',
      description: `Security Force deployment at ${targetSite?.siteName || 'Main Post'} (4 Guards)`,
      hsnSacCode: gstConfig.defaultSecuritySacCode,
      siteName: targetSite?.siteName || 'Main Post',
      deployedCount: 4,
      billableDays: 30,
      rateType: 'per_month',
      unitRate: 24500,
      baseAmount: defaultAmount,
      overtimeHours: 0,
      overtimeRate: 185,
      overtimeAmount: 0,
      doubleDutyCount: 0,
      doubleDutyRate: 950,
      doubleDutyAmount: 0,
      discount: 0,
      taxableValue: defaultAmount,
    });
    subTotal += defaultAmount;
  }

  // Active additional services for client
  const matchedServices = additionalServices.filter(
    (as) => as.clientId === clientId && as.status === 'active'
  );
  const additionalTotal = matchedServices.reduce((s, as) => s + as.totalAmount, 0);
  subTotal = round2(subTotal + additionalTotal);

  // Service Charge calculation (e.g. 5%)
  const clientSc = serviceCharges.find((sc) => sc.clientId === clientId && sc.status === 'active');
  const serviceChargePercent = clientSc?.chargeType === 'percentage' ? clientSc.chargeValue : 5.0;
  const serviceChargeAmount = round2(subTotal * (serviceChargePercent / 100));

  const taxableAmount = round2(subTotal + serviceChargeAmount);

  // Determine GST Tax (Inter-State vs Intra-State)
  const clientStateCode = (client?.billingState ? '06' : '06'); // default 06 Haryana
  const isInterState = isInterStateSupply(gstConfig.stateCode, clientStateCode);

  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (isInterState) {
    igstRate = gstConfig.standardGstRate;
    igstAmount = round2(taxableAmount * (igstRate / 100));
  } else {
    cgstRate = gstConfig.standardGstRate / 2; // 9%
    cgstAmount = round2(taxableAmount * (cgstRate / 100));
    sgstRate = gstConfig.standardGstRate / 2; // 9%
    sgstAmount = round2(taxableAmount * (sgstRate / 100));
  }

  const totalGst = round2(cgstAmount + sgstAmount + igstAmount);
  const rawTotal = taxableAmount + totalGst;
  const roundedGrandTotal = Math.round(rawTotal);
  const roundOff = round2(roundedGrandTotal - rawTotal);

  // Transaction sequence numbering
  const seqNum = gstConfig.nextInvoiceSequence || 105;
  const seqStr = seqNum.toString().padStart(4, '0');
  const invoiceNumber = `${gstConfig.invoiceNumberPrefix}/${gstConfig.financialYear}/${seqStr}`;

  // Advance sequence in config
  await saveGstConfiguration(companyId, {
    ...gstConfig,
    nextInvoiceSequence: seqNum + 1,
  });

  const [yearStr, monthStr] = billingPeriod.split('-');
  const invoiceDate = `${yearStr}-${monthStr}-01`;
  const dueDate = `${yearStr}-${monthStr}-28`;

  const newInvoice: ClientInvoice = {
    id: `inv_${companyId}_${billingPeriod}_${Date.now()}`,
    invoiceNumber,
    tenantId,
    companyId,
    clientId: client.id,
    clientName: client.clientName || 'Valued Corporate Client',
    clientLegalName: client.clientLegalName || client.clientName || 'Valued Corporate Client',
    clientAddress: client.registeredAddress || 'Corporate Office Complex',
    clientGstin: client.gstNumber || '06AAACD9182P1Z4',
    clientPan: client.panNumber || 'AAACD9182P',
    clientState: client.state || 'Haryana',
    clientStateCode,
    placeOfSupply: `${clientStateCode} - ${client.state || 'Haryana'}`,
    siteId: targetSite?.id,
    siteName: targetSite?.siteName || 'HQ Site',
    contractNumber: `HHR-CON-${yearStr}-001`,
    invoiceType: 'monthly_tax_invoice',
    billingPeriod,
    invoiceDate,
    dueDate,
    status: 'draft',
    items: lineItems,
    additionalServices: matchedServices,
    subTotal,
    serviceChargePercent,
    serviceChargeAmount,
    taxableAmount,
    isInterState,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    totalGst,
    roundOff,
    grandTotal: roundedGrandTotal,
    amountInWords: numberToIndianWords(roundedGrandTotal),
    paidAmount: 0,
    outstandingAmount: roundedGrandTotal,
    isFinalized: false,
    paymentTerms: 'Payment due within 30 days of invoice receipt',
    bankDetails: {
      beneficiaryName: gstConfig.supplierLegalName,
      bankName: 'HDFC Bank Ltd',
      accountNumber: '50200084920194',
      ifscCode: 'HDFC0001829',
      branchName: 'Cyber City Branch, Gurugram',
      upiId: 'happiiz@hdfcbank',
    },
    termsAndConditions:
      '1. Payment is strictly due within 30 days from invoice date.\n2. Interest @ 18% p.a. will be levied on delayed payments beyond credit period.\n3. Discrepancies if any must be notified within 7 days of invoice submission.\n4. Subject to Gurugram / Haryana jurisdiction.',
    supplierGstin: gstConfig.supplierGstin,
    supplierAddress: gstConfig.registeredAddress,
    supplierStateCode: gstConfig.stateCode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveClientInvoice(companyId, newInvoice);
  return newInvoice;
}

export async function finalizeClientInvoice(
  companyId: string,
  tenantId: string,
  invoiceId: string,
  user: { name: string; role?: string }
): Promise<ClientInvoice> {
  const invoices = invoicesCache.get(companyId) || [];
  const inv = invoices.find((i) => i.id === invoiceId);
  if (!inv) throw new Error('Invoice not found');

  if (inv.isFinalized) return inv;

  const updated: ClientInvoice = {
    ...inv,
    status: 'finalized',
    isFinalized: true,
    finalizedAt: new Date().toISOString(),
    finalizedBy: user.name,
    approvedBy: inv.approvedBy || user.name,
    approvedAt: inv.approvedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveClientInvoice(companyId, updated);

  // Post to Client Account Ledger
  await addClientLedgerEntry(companyId, {
    id: `led_inv_${updated.id}`,
    tenantId,
    companyId,
    clientId: updated.clientId,
    clientName: updated.clientName,
    transactionDate: updated.invoiceDate,
    entryType: 'INVOICE',
    referenceNumber: updated.invoiceNumber,
    description: `Tax Invoice for period ${updated.billingPeriod} (${updated.siteName || 'All Sites'})`,
    debitAmount: updated.grandTotal,
    creditAmount: 0,
    runningBalance: 0,
    createdAt: new Date().toISOString(),
  });

  return updated;
}

// ==========================================
// Profitability Analysis Calculation
// ==========================================

export async function calculateInternalProfitability(
  companyId: string,
  tenantId: string,
  period: string,
  invoices: ClientInvoice[],
  payrollEntries: PayrollEntry[]
): Promise<ClientProfitabilityReport[]> {
  const reports: ClientProfitabilityReport[] = [];

  // Group invoices by client
  const clientInvoiceMap = new Map<string, ClientInvoice[]>();
  invoices.forEach((inv) => {
    if (inv.billingPeriod === period && inv.status !== 'cancelled') {
      const existing = clientInvoiceMap.get(inv.clientId) || [];
      existing.push(inv);
      clientInvoiceMap.set(inv.clientId, existing);
    }
  });

  clientInvoiceMap.forEach((clientInvs, cId) => {
    const clientName = clientInvs[0]?.clientName || 'Corporate Client';
    const siteName = clientInvs[0]?.siteName || 'Main Post';

    const billedRevenue = clientInvs.reduce((s, i) => s + i.subTotal, 0);
    const serviceChargeRevenue = clientInvs.reduce((s, i) => s + i.serviceChargeAmount, 0);
    const overtimeBilledRevenue = clientInvs.reduce(
      (s, i) => s + i.items.reduce((acc, it) => acc + it.overtimeAmount + it.doubleDutyAmount, 0),
      0
    );
    const additionalServiceRevenue = clientInvs.reduce(
      (s, i) => s + i.additionalServices.reduce((acc, as) => acc + as.totalAmount, 0),
      0
    );
    const totalClientRevenue = billedRevenue + serviceChargeRevenue;

    // Filter matching workforce payroll cost
    const matchingEntries = payrollEntries.filter(
      (p) => p.period === period
    );

    const workforceGrossWages = matchingEntries.reduce((s, p) => s + p.totalGrossSalary, 0);
    const workforceOvertimeCost = matchingEntries.reduce((s, p) => s + p.overtimeAmount, 0);
    const workforceDoubleDutyCost = matchingEntries.reduce((s, p) => s + p.doubleDutyAmount, 0);
    const employerStatutoryCost = matchingEntries.reduce((s, p) => s + p.pfEmployer + p.esiEmployer, 0);
    const operationalCosts = round2(workforceGrossWages * 0.04); // est 4% uniforms/supervision travel

    const totalCostOfService = round2(workforceGrossWages + employerStatutoryCost + operationalCosts);
    const estimatedGrossMargin = round2(totalClientRevenue - totalCostOfService);
    const grossMarginPercentage =
      totalClientRevenue > 0 ? round2((estimatedGrossMargin / totalClientRevenue) * 100) : 0;
    const estimatedOperatingProfit = round2(estimatedGrossMargin * 0.85); // after general corporate overhead

    reports.push({
      id: `prof_${cId}_${period}`,
      clientId: cId,
      clientName,
      siteName,
      period,
      billedRevenue,
      serviceChargeRevenue,
      overtimeBilledRevenue,
      additionalServiceRevenue,
      totalClientRevenue,
      workforceGrossWages,
      workforceOvertimeCost,
      workforceDoubleDutyCost,
      employerStatutoryCost,
      operationalCosts,
      totalCostOfService,
      estimatedGrossMargin,
      grossMarginPercentage,
      estimatedOperatingProfit,
    });
  });

  return reports;
}

// ==========================================
// CSV Report Generators
// ==========================================

export function generateInvoiceRegisterCSV(invoices: ClientInvoice[]): string {
  const headers = [
    'Invoice Number',
    'Invoice Date',
    'Due Date',
    'Billing Period',
    'Client Name',
    'Client GSTIN',
    'Place of Supply',
    'Site Name',
    'Sub Total (₹)',
    'Service Charge (₹)',
    'Taxable Amount (₹)',
    'CGST (₹)',
    'SGST (₹)',
    'IGST (₹)',
    'Total GST (₹)',
    'Grand Total (₹)',
    'Paid Amount (₹)',
    'Outstanding (₹)',
    'Status',
    'Is Finalized',
  ];

  const rows = invoices.map((inv) => [
    `"${inv.invoiceNumber}"`,
    inv.invoiceDate,
    inv.dueDate,
    `"${inv.billingPeriod}"`,
    `"${inv.clientName.replace(/"/g, '""')}"`,
    `"${inv.clientGstin}"`,
    `"${inv.placeOfSupply}"`,
    `"${(inv.siteName || '').replace(/"/g, '""')}"`,
    inv.subTotal.toFixed(2),
    inv.serviceChargeAmount.toFixed(2),
    inv.taxableAmount.toFixed(2),
    inv.cgstAmount.toFixed(2),
    inv.sgstAmount.toFixed(2),
    inv.igstAmount.toFixed(2),
    inv.totalGst.toFixed(2),
    inv.grandTotal.toFixed(2),
    inv.paidAmount.toFixed(2),
    inv.outstandingAmount.toFixed(2),
    `"${inv.status}"`,
    inv.isFinalized ? 'Yes' : 'No',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function generateGstReportCSV(invoices: ClientInvoice[]): string {
  const headers = [
    'GSTIN of Recipient',
    'Receiver Name',
    'Invoice Number',
    'Invoice Date',
    'Invoice Value',
    'Place of Supply',
    'Reverse Charge',
    'Applicable % of Tax Rate',
    'Rate',
    'Taxable Value',
    'Cess Amount',
  ];

  const rows = invoices
    .filter((i) => i.status !== 'cancelled')
    .map((inv) => [
      `"${inv.clientGstin}"`,
      `"${inv.clientName.replace(/"/g, '""')}"`,
      `"${inv.invoiceNumber}"`,
      inv.invoiceDate,
      inv.grandTotal.toFixed(2),
      `"${inv.placeOfSupply}"`,
      'N',
      '100',
      '18',
      inv.taxableAmount.toFixed(2),
      '0.00',
    ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function generateClientLedgerCSV(entries: ClientLedgerEntry[], clientName: string): string {
  const headers = [
    'Date',
    'Entry Type',
    'Reference #',
    'Description',
    'Debit (₹) [Receivable]',
    'Credit (₹) [Received/Rebate]',
    'Running Balance (₹)',
  ];

  const rows = entries.map((e) => [
    e.transactionDate,
    `"${e.entryType}"`,
    `"${e.referenceNumber}"`,
    `"${e.description.replace(/"/g, '""')}"`,
    e.debitAmount.toFixed(2),
    e.creditAmount.toFixed(2),
    e.runningBalance.toFixed(2),
  ]);

  return [`Client: ${clientName}`, headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function generateProfitabilityCSV(reports: ClientProfitabilityReport[]): string {
  const headers = [
    'Client Name',
    'Site Name',
    'Period',
    'Billed Revenue (₹)',
    'Service Charge (₹)',
    'Total Client Revenue (₹)',
    'Workforce Wages (₹)',
    'Employer PF/ESI (₹)',
    'Operational Cost (₹)',
    'Total Cost of Service (₹)',
    'Estimated Gross Margin (₹)',
    'Gross Margin (%)',
    'Operating Profit (₹)',
  ];

  const rows = reports.map((r) => [
    `"${r.clientName.replace(/"/g, '""')}"`,
    `"${(r.siteName || '').replace(/"/g, '""')}"`,
    `"${r.period}"`,
    r.billedRevenue.toFixed(2),
    r.serviceChargeRevenue.toFixed(2),
    r.totalClientRevenue.toFixed(2),
    r.workforceGrossWages.toFixed(2),
    r.employerStatutoryCost.toFixed(2),
    r.operationalCosts.toFixed(2),
    r.totalCostOfService.toFixed(2),
    r.estimatedGrossMargin.toFixed(2),
    `${r.grossMarginPercentage.toFixed(1)}%`,
    r.estimatedOperatingProfit.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
