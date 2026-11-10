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
  ChartOfAccount,
  JournalEntry,
  JournalLine,
  JournalReferenceType,
  CashTransaction,
  BankAccount,
  BankTransaction,
  BankReconciliation,
  ExpenseRecord,
  ExpenseCategory,
  IncomeRecord,
  Vendor,
  VendorCategory,
  PurchaseBill,
  PurchaseBillItem,
  PaymentVoucher,
  ReceiptVoucher,
  GeneralLedgerEntry,
  TrialBalanceRow,
  FinancialYearConfig,
  AccountingPeriod,
  FixedAssetRecord,
  FixedAssetCategory,
  AccountingAuditLog,
  ClientInvoice,
  ClientPaymentRecord,
  PayrollRun,
  PayrollEntry,
  Company,
  CreditNoteItem,
  DebitNoteItem,
} from '../types';
import { round2, formatINR, numberToIndianWords } from './payrollService';

export { round2, formatINR, numberToIndianWords };

// ==========================================
// In-Memory Fallback Cache for Resilient Operation
// ==========================================

const coaCache = new Map<string, ChartOfAccount[]>();
const journalsCache = new Map<string, JournalEntry[]>();
const cashTxCache = new Map<string, CashTransaction[]>();
const bankAccountsCache = new Map<string, BankAccount[]>();
const bankTxCache = new Map<string, BankTransaction[]>();
const bankRecCache = new Map<string, BankReconciliation[]>();
const expensesCache = new Map<string, ExpenseRecord[]>();
const incomeCache = new Map<string, IncomeRecord[]>();
const vendorsCache = new Map<string, Vendor[]>();
const purchasesCache = new Map<string, PurchaseBill[]>();
const paymentVouchersCache = new Map<string, PaymentVoucher[]>();
const receiptVouchersCache = new Map<string, ReceiptVoucher[]>();
const ledgerCache = new Map<string, GeneralLedgerEntry[]>();
const fyCache = new Map<string, FinancialYearConfig>();
const fixedAssetsCache = new Map<string, FixedAssetRecord[]>();
const auditLogsCache = new Map<string, AccountingAuditLog[]>();

// ==========================================
// Standard Indian ERP Chart of Accounts Template
// ==========================================

export const DEFAULT_CHART_OF_ACCOUNTS: Omit<ChartOfAccount, 'id' | 'tenantId' | 'companyId' | 'createdAt' | 'updatedAt'>[] = [
  // ASSETS (1000 - 1999)
  { accountCode: '1001', accountName: 'Cash in Hand (Main Vault)', accountType: 'asset', subCategory: 'cash', description: 'Physical cash at company headquarters', openingBalance: 75000, currentBalance: 75000, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '1002', accountName: 'HDFC Bank Ltd (Current A/c 502000)', accountType: 'asset', subCategory: 'bank', description: 'Primary operating disbursement & billing account', openingBalance: 850000, currentBalance: 850000, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '1003', accountName: 'State Bank of India (Salary A/c 389100)', accountType: 'asset', subCategory: 'bank', description: 'Designated bulk employee wage remittance account', openingBalance: 320000, currentBalance: 320000, isSystemAccount: false, isActive: true, currency: 'INR' },
  { accountCode: '1100', accountName: 'Accounts Receivable (Trade Debtors)', accountType: 'asset', subCategory: 'accounts_receivable', description: 'Contractual client billing dues for security & facility services', openingBalance: 480000, currentBalance: 480000, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '1200', accountName: 'Employee Salary Advances', accountType: 'asset', subCategory: 'advances', description: 'Short-term advances disbursed to field guards & staff', openingBalance: 35000, currentBalance: 35000, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '1210', accountName: 'Vendor Advances & Security Deposits', accountType: 'asset', subCategory: 'advances', description: 'Deposits paid for office leases and uniform vendors', openingBalance: 120000, currentBalance: 120000, isSystemAccount: false, isActive: true, currency: 'INR' },
  { accountCode: '1301', accountName: 'Input CGST Credit Pool', accountType: 'asset', subCategory: 'current_asset', description: 'Central GST paid on vendor purchases & consumables', openingBalance: 18500, currentBalance: 18500, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '1302', accountName: 'Input SGST Credit Pool', accountType: 'asset', subCategory: 'current_asset', description: 'State GST paid on vendor purchases & consumables', openingBalance: 18500, currentBalance: 18500, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '1303', accountName: 'Input IGST Credit Pool', accountType: 'asset', subCategory: 'current_asset', description: 'Integrated GST paid on inter-state purchases', openingBalance: 9200, currentBalance: 9200, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '1401', accountName: 'TDS Receivable (Section 194C)', accountType: 'asset', subCategory: 'current_asset', description: 'Income tax deducted by corporate clients on billing', openingBalance: 42000, currentBalance: 42000, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '1501', accountName: 'Fixed Assets: Security Equipment & Arms', accountType: 'asset', subCategory: 'fixed_asset', description: 'Metal detectors, walkie-talkies, CCTV sets & registered arms', openingBalance: 450000, currentBalance: 450000, isSystemAccount: false, isActive: true, currency: 'INR' },
  { accountCode: '1502', accountName: 'Fixed Assets: Office IT & Biometric Devices', accountType: 'asset', subCategory: 'fixed_asset', description: 'Attendance biometric scanners, office PCs & servers', openingBalance: 210000, currentBalance: 210000, isSystemAccount: false, isActive: true, currency: 'INR' },
  { accountCode: '1503', accountName: 'Fixed Assets: Patrol Vehicles & Motorcycles', accountType: 'asset', subCategory: 'fixed_asset', description: 'Patrol vans & supervisor motorcycles', openingBalance: 680000, currentBalance: 680000, isSystemAccount: false, isActive: true, currency: 'INR' },
  { accountCode: '1599', accountName: 'Accumulated Depreciation (Contra Asset)', accountType: 'asset', subCategory: 'fixed_asset', description: 'Cumulative wear and tear on plant, machinery & IT', openingBalance: -145000, currentBalance: -145000, isSystemAccount: true, isActive: true, currency: 'INR' },

  // LIABILITIES (2000 - 2999)
  { accountCode: '2001', accountName: 'Accounts Payable (Trade Creditors / Vendors)', accountType: 'liability', subCategory: 'accounts_payable', description: 'Outstanding payables to uniform & consumable suppliers', openingBalance: 145000, currentBalance: 145000, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '2101', accountName: 'Employee Salary Payable', accountType: 'liability', subCategory: 'salary_payable', description: 'Net wages payable to security guards, staff & supervisors', openingBalance: 460000, currentBalance: 460000, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '2201', accountName: 'Provident Fund (PF) Payable', accountType: 'liability', subCategory: 'statutory_payable', description: 'Combined Employee & Employer PF contributions payable to EPFO', openingBalance: 58000, currentBalance: 58000, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '2202', accountName: 'Employee State Insurance (ESIC) Payable', accountType: 'liability', subCategory: 'statutory_payable', description: 'Employee & Employer ESIC healthcare dues payable to ESIC', openingBalance: 19500, currentBalance: 19500, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '2203', accountName: 'Professional Tax (PT) Payable', accountType: 'liability', subCategory: 'statutory_payable', description: 'State-wise PT deductions payable to state commercial taxes', openingBalance: 8400, currentBalance: 8400, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '2204', accountName: 'Staff Bonus & Gratuity Provision', accountType: 'liability', subCategory: 'statutory_payable', description: 'Accrued annual bonus under Payment of Bonus Act', openingBalance: 65000, currentBalance: 65000, isSystemAccount: false, isActive: true, currency: 'INR' },
  { accountCode: '2301', accountName: 'Output CGST Payable', accountType: 'liability', subCategory: 'statutory_payable', description: 'Central GST collected on client invoices', openingBalance: 43200, currentBalance: 43200, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '2302', accountName: 'Output SGST Payable', accountType: 'liability', subCategory: 'statutory_payable', description: 'State GST collected on client invoices', openingBalance: 43200, currentBalance: 43200, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '2303', accountName: 'Output IGST Payable', accountType: 'liability', subCategory: 'statutory_payable', description: 'Integrated GST collected on interstate client invoices', openingBalance: 21600, currentBalance: 21600, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '2401', accountName: 'TDS Payable (Contractors & Salary)', accountType: 'liability', subCategory: 'statutory_payable', description: 'TDS withheld from professional vendors & high salaried staff', openingBalance: 14200, currentBalance: 14200, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '2501', accountName: 'Working Capital Bank Overdraft (HDFC)', accountType: 'liability', subCategory: 'long_term_liability', description: 'Short-term credit facility for wage liquidity', openingBalance: 200000, currentBalance: 200000, isSystemAccount: false, isActive: true, currency: 'INR' },

  // INCOME (3000 - 3999)
  { accountCode: '3001', accountName: 'Security Guarding Service Revenue', accountType: 'income', subCategory: 'direct_income', description: 'Billing for manned guarding, armed security & patrol posts (SAC 998525)', openingBalance: 0, currentBalance: 1250000, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '3002', accountName: 'Housekeeping & Janitorial Revenue', accountType: 'income', subCategory: 'direct_income', description: 'Cleaning, sanitation & deep disinfection services (SAC 998513)', openingBalance: 0, currentBalance: 420000, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '3003', accountName: 'Manpower Supply & Facility Revenue', accountType: 'income', subCategory: 'direct_income', description: 'Skilled technical manpower, drivers, pantry & office boys', openingBalance: 0, currentBalance: 310000, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '3004', accountName: 'Agency Service & Management Charges', accountType: 'income', subCategory: 'direct_income', description: 'Agency overhead margins (e.g. 5% service margin on contracts)', openingBalance: 0, currentBalance: 98000, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '3100', accountName: 'Ancillary Services & Equipment Hire', accountType: 'income', subCategory: 'indirect_income', description: 'CCTV surveillance hire, event security, metal detector rental', openingBalance: 0, currentBalance: 45000, isSystemAccount: false, isActive: true, currency: 'INR' },
  { accountCode: '3200', accountName: 'Interest Income & Other Receipts', accountType: 'income', subCategory: 'indirect_income', description: 'Bank interest on fixed deposits and scrap uniform recovery', openingBalance: 0, currentBalance: 12400, isSystemAccount: false, isActive: true, currency: 'INR' },

  // EXPENSES (4000 - 4999)
  { accountCode: '4001', accountName: 'Direct Workforce Salary & Basic Pay', accountType: 'expense', subCategory: 'payroll_expense', description: 'Gross basic wages & standard allowances of deployed field workforce', openingBalance: 0, currentBalance: 890000, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '4002', accountName: 'Overtime & Double Duty Wages', accountType: 'expense', subCategory: 'payroll_expense', description: 'Overtime wages disbursed under statutory factories & establishment rules', openingBalance: 0, currentBalance: 95000, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '4003', accountName: 'Employer PF & Pension Contribution', accountType: 'expense', subCategory: 'payroll_expense', description: 'Employer statutory EPF (12%) & EDLI administrative charges', openingBalance: 0, currentBalance: 53400, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '4004', accountName: 'Employer ESIC Healthcare Contribution', accountType: 'expense', subCategory: 'payroll_expense', description: 'Employer statutory ESIC contribution (3.25%)', openingBalance: 0, currentBalance: 18200, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '4101', accountName: 'Uniforms, Badges & Guard Kits Expense', accountType: 'expense', subCategory: 'direct_operational_expense', description: 'Boots, shirts, caps, lanyards, whistles & belts for new joinees', openingBalance: 0, currentBalance: 48000, isSystemAccount: false, isActive: true, currency: 'INR' },
  { accountCode: '4102', accountName: 'Cleaning Chemicals & Janitorial Consumables', accountType: 'expense', subCategory: 'direct_operational_expense', description: 'Floor cleaners, mops, wipers, garbage bags and sanitizers', openingBalance: 0, currentBalance: 32000, isSystemAccount: false, isActive: true, currency: 'INR' },
  { accountCode: '4201', accountName: 'Branch Office Rent & Utilities', accountType: 'expense', subCategory: 'administrative_expense', description: 'Head office & regional control room lease charges', openingBalance: 0, currentBalance: 85000, isSystemAccount: false, isActive: true, currency: 'INR' },
  { accountCode: '4202', accountName: 'Electricity & Generator Fuel Charges', accountType: 'expense', subCategory: 'administrative_expense', description: 'Power backup for 24x7 control monitoring rooms', openingBalance: 0, currentBalance: 24500, isSystemAccount: false, isActive: true, currency: 'INR' },
  { accountCode: '4203', accountName: 'Internet, SIM Cards & Mobile Telephony', accountType: 'expense', subCategory: 'administrative_expense', description: 'Field supervisor data packs & GPS tracker SIMs', openingBalance: 0, currentBalance: 16800, isSystemAccount: false, isActive: true, currency: 'INR' },
  { accountCode: '4204', accountName: 'Patrol Vehicle Fuel & Vehicle Maintenance', accountType: 'expense', subCategory: 'direct_operational_expense', description: 'Petrol & servicing for field inspection motorbikes and vans', openingBalance: 0, currentBalance: 42000, isSystemAccount: false, isActive: true, currency: 'INR' },
  { accountCode: '4301', accountName: 'Staff Recruitment & Verification Fees', accountType: 'expense', subCategory: 'administrative_expense', description: 'Police verification & background check agency expenses', openingBalance: 0, currentBalance: 21000, isSystemAccount: false, isActive: true, currency: 'INR' },
  { accountCode: '4302', accountName: 'Legal, Audit & PSARA Compliance Fees', accountType: 'expense', subCategory: 'administrative_expense', description: 'Chartered accountant audit fees & PSARA license compliance', openingBalance: 0, currentBalance: 35000, isSystemAccount: false, isActive: true, currency: 'INR' },
  { accountCode: '4401', accountName: 'Bank Charges, Gateway & Processing Fees', accountType: 'expense', subCategory: 'financial_expense', description: 'CMS salary processing charges and bank transaction costs', openingBalance: 0, currentBalance: 4600, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '4501', accountName: 'Depreciation on Security Equipment & IT', accountType: 'expense', subCategory: 'depreciation_expense', description: 'Monthly write-off for equipment usage', openingBalance: 0, currentBalance: 12500, isSystemAccount: true, isActive: true, currency: 'INR' },

  // EQUITY (5000 - 5999)
  { accountCode: '5001', accountName: 'Promoter Share Capital / Owner Equity', accountType: 'equity', subCategory: 'owner_equity', description: 'Initial paid-up equity capital introduced by promoters', openingBalance: 1200000, currentBalance: 1200000, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '5101', accountName: 'Retained Earnings & Accumulated Reserves', accountType: 'equity', subCategory: 'retained_earnings', description: 'Surplus profit carried forward from previous accounting periods', openingBalance: 326600, currentBalance: 326600, isSystemAccount: true, isActive: true, currency: 'INR' },
  { accountCode: '5201', accountName: 'Partner / Director Drawings', accountType: 'equity', subCategory: 'owner_equity', description: 'Owner withdrawals against profit shares', openingBalance: -60000, currentBalance: -60000, isSystemAccount: false, isActive: true, currency: 'INR' },
];

// ==========================================
// Chart of Accounts Management
// ==========================================

export async function getCompanyChartOfAccounts(companyId: string, tenantId: string): Promise<ChartOfAccount[]> {
  try {
    const snap = await getDocs(collection(db, 'companies', companyId, 'chartOfAccounts'));
    if (!snap.empty) {
      const accounts = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as ChartOfAccount[];
      coaCache.set(companyId, accounts);
      return accounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    }
  } catch (err) {
    console.warn('[Happiiz HR] COA fetch fallback to memory:', err);
  }

  if (coaCache.has(companyId)) {
    return coaCache.get(companyId)!;
  }

  // Seed Default Standard COA
  const now = new Date().toISOString();
  const seeded: ChartOfAccount[] = DEFAULT_CHART_OF_ACCOUNTS.map((tpl) => ({
    ...tpl,
    id: `coa_${tpl.accountCode}`,
    companyId,
    tenantId,
    createdAt: now,
    updatedAt: now,
  }));

  coaCache.set(companyId, seeded);
  return seeded.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
}

export async function createChartOfAccount(
  companyId: string,
  tenantId: string,
  accountData: Omit<ChartOfAccount, 'id' | 'companyId' | 'tenantId' | 'createdAt' | 'updatedAt'>
): Promise<ChartOfAccount> {
  const existing = await getCompanyChartOfAccounts(companyId, tenantId);
  if (existing.some((a) => a.accountCode === accountData.accountCode)) {
    throw new Error(`Account code ${accountData.accountCode} already exists.`);
  }

  const now = new Date().toISOString();
  const id = `coa_${accountData.accountCode}`;
  const newAccount: ChartOfAccount = {
    ...accountData,
    id,
    companyId,
    tenantId,
    currentBalance: accountData.openingBalance || 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'companies', companyId, 'chartOfAccounts', id), newAccount);
  } catch (err) {
    console.warn('[Happiiz HR] Error persisting new COA to Firestore, cached locally:', err);
  }

  const updated = [...existing, newAccount];
  coaCache.set(companyId, updated);
  return newAccount;
}

export async function updateChartOfAccount(
  companyId: string,
  accountId: string,
  updates: Partial<ChartOfAccount>
): Promise<ChartOfAccount> {
  const existing = coaCache.get(companyId) || [];
  const idx = existing.findIndex((a) => a.id === accountId);
  if (idx === -1) throw new Error('Account not found in Chart of Accounts.');

  const now = new Date().toISOString();
  const updatedAccount: ChartOfAccount = {
    ...existing[idx],
    ...updates,
    updatedAt: now,
  };

  try {
    await updateDoc(doc(db, 'companies', companyId, 'chartOfAccounts', accountId), updatedAccount as any);
  } catch (err) {
    console.warn('[Happiiz HR] Error updating COA in Firestore, cached locally:', err);
  }

  existing[idx] = updatedAccount;
  coaCache.set(companyId, [...existing]);
  return updatedAccount;
}

// ==========================================
// Double-Entry Accounting Core Engine
// ==========================================

export interface PostJournalParams {
  companyId: string;
  tenantId: string;
  financialYear: string;
  financialPeriod: string;
  accountingDate: string;
  narration: string;
  referenceType: JournalReferenceType;
  referenceId?: string;
  lines: {
    accountId: string;
    debit: number;
    credit: number;
    lineNarration?: string;
  }[];
  createdBy: string;
  approvedBy?: string;
}

/**
 * Validates and posts a double-entry journal entry.
 * Enforces fundamental accounting equation: Total Debit === Total Credit.
 * Updates General Ledger and Account Balances atomically.
 */
export async function postJournalEntry(params: PostJournalParams): Promise<JournalEntry> {
  const {
    companyId,
    tenantId,
    financialYear,
    financialPeriod,
    accountingDate,
    narration,
    referenceType,
    referenceId,
    lines,
    createdBy,
    approvedBy,
  } = params;

  if (lines.length < 2) {
    throw new Error('A double-entry journal requires at least two account legs (Debit and Credit).');
  }

  // Decimal-safe validation of Debits and Credits
  const totalDebit = round2(lines.reduce((sum, l) => sum + (l.debit || 0), 0));
  const totalCredit = round2(lines.reduce((sum, l) => sum + (l.credit || 0), 0));

  if (totalDebit <= 0 || totalCredit <= 0) {
    throw new Error('Journal transaction amounts must be greater than zero.');
  }

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(
      `Unbalanced Double-Entry Journal Rejected: Total Debit (₹${totalDebit}) does not equal Total Credit (₹${totalCredit}). Difference: ₹${round2(
        totalDebit - totalCredit
      )}`
    );
  }

  // Prevent duplicate posting for unique reference
  const existingJournals = await getCompanyJournals(companyId);
  if (referenceId && existingJournals.some((j) => j.referenceId === referenceId && j.status === 'posted')) {
    const matched = existingJournals.find((j) => j.referenceId === referenceId && j.status === 'posted')!;
    console.log(`[Happiiz HR] Journal for reference ${referenceId} already posted: ${matched.journalNumber}`);
    return matched;
  }

  const accounts = await getCompanyChartOfAccounts(companyId, tenantId);
  const accountsMap = new Map(accounts.map((a) => [a.id, a]));

  const journalNumber = `JRN-${financialYear.replace('-', '')}-${String(existingJournals.length + 1).padStart(4, '0')}`;
  const now = new Date().toISOString();
  const journalId = `jrn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Construct structured Journal Lines with account metadata
  const resolvedLines: JournalLine[] = lines.map((l, idx) => {
    const acc = accountsMap.get(l.accountId);
    if (!acc) throw new Error(`Account ID ${l.accountId} not found in Chart of Accounts.`);
    return {
      id: `jl_${idx + 1}`,
      accountId: acc.id,
      accountCode: acc.accountCode,
      accountName: acc.accountName,
      debit: round2(l.debit || 0),
      credit: round2(l.credit || 0),
      lineNarration: l.lineNarration || narration,
    };
  });

  const newJournal: JournalEntry = {
    id: journalId,
    tenantId,
    companyId,
    journalNumber,
    accountingDate,
    financialYear,
    financialPeriod,
    narration,
    referenceType,
    referenceId,
    totalDebit,
    totalCredit,
    status: 'posted',
    lines: resolvedLines,
    createdBy,
    approvedBy: approvedBy || createdBy,
    postedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  // 1. Post to Firestore & Cache
  try {
    await setDoc(doc(db, 'companies', companyId, 'journalEntries', journalId), newJournal);
  } catch (err) {
    console.warn('[Happiiz HR] Firestore journal write failed, caching in memory:', err);
  }
  journalsCache.set(companyId, [newJournal, ...existingJournals]);

  // 2. Post to General Ledger and update Account balances
  const ledgerEntries = ledgerCache.get(companyId) || [];
  const updatedLedgerEntries = [...ledgerEntries];

  for (const line of resolvedLines) {
    const acc = accountsMap.get(line.accountId)!;
    // Standard Accounting rule:
    // Assets & Expenses increase with Debit, decrease with Credit.
    // Liabilities, Equity & Income increase with Credit, decrease with Debit.
    let balanceDelta = 0;
    if (acc.accountType === 'asset' || acc.accountType === 'expense') {
      balanceDelta = line.debit - line.credit;
    } else {
      balanceDelta = line.credit - line.debit;
    }

    acc.currentBalance = round2(acc.currentBalance + balanceDelta);

    const ledgerId = `gl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const glEntry: GeneralLedgerEntry = {
      id: ledgerId,
      tenantId,
      companyId,
      accountId: acc.id,
      accountCode: acc.accountCode,
      accountName: acc.accountName,
      accountType: acc.accountType,
      date: accountingDate,
      financialYear,
      voucherType: referenceType.toUpperCase().replace('_', ' '),
      voucherNumber: journalNumber,
      referenceId,
      narration: line.lineNarration || narration,
      debit: line.debit,
      credit: line.credit,
      runningBalance: acc.currentBalance,
      journalId,
      createdAt: now,
    };

    updatedLedgerEntries.push(glEntry);
  }

  ledgerCache.set(companyId, updatedLedgerEntries);
  coaCache.set(companyId, Array.from(accountsMap.values()));

  return newJournal;
}

export async function getCompanyJournals(companyId: string): Promise<JournalEntry[]> {
  try {
    const snap = await getDocs(collection(db, 'companies', companyId, 'journalEntries'));
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as JournalEntry[];
      journalsCache.set(companyId, list);
      return list.sort((a, b) => new Date(b.accountingDate).getTime() - new Date(a.accountingDate).getTime());
    }
  } catch (err) {
    console.warn('[Happiiz HR] Error fetching journals from Firestore:', err);
  }

  if (journalsCache.has(companyId)) {
    return journalsCache.get(companyId)!;
  }

  return [];
}

/**
 * Reverses a posted journal entry with strict audit immutability.
 * Creates an exact counter-entry with swapped debits & credits.
 */
export async function reverseJournalEntry(
  companyId: string,
  tenantId: string,
  journalId: string,
  reason: string,
  reversedBy: string
): Promise<JournalEntry> {
  const journals = await getCompanyJournals(companyId);
  const target = journals.find((j) => j.id === journalId);
  if (!target) throw new Error('Original journal entry not found.');
  if (target.status !== 'posted') throw new Error('Only posted journal entries can be reversed.');
  if (target.isReversed) throw new Error('This journal entry has already been reversed.');

  const now = new Date().toISOString();
  const reversalLines = target.lines.map((l) => ({
    accountId: l.accountId,
    debit: l.credit, // Invert
    credit: l.debit, // Invert
    lineNarration: `Reversal of ${target.journalNumber}: ${reason}`,
  }));

  const reversalJournal = await postJournalEntry({
    companyId,
    tenantId,
    financialYear: target.financialYear,
    financialPeriod: target.financialPeriod,
    accountingDate: now.split('T')[0],
    narration: `REVERSAL of ${target.journalNumber} - Reason: ${reason}`,
    referenceType: 'manual_journal',
    referenceId: `REV-${target.id}`,
    lines: reversalLines,
    createdBy: reversedBy,
    approvedBy: reversedBy,
  });

  // Mark original as reversed
  target.isReversed = true;
  target.reversedByJournalId = reversalJournal.id;
  target.status = 'reversed';
  target.updatedAt = now;

  try {
    await updateDoc(doc(db, 'companies', companyId, 'journalEntries', target.id), {
      isReversed: true,
      reversedByJournalId: reversalJournal.id,
      status: 'reversed',
      updatedAt: now,
    });
  } catch (err) {
    console.warn('[Happiiz HR] Error updating reversed status in Firestore:', err);
  }

  return reversalJournal;
}

// ==========================================
// Cash Book Management
// ==========================================

export async function getCompanyCashTransactions(companyId: string): Promise<CashTransaction[]> {
  try {
    const snap = await getDocs(collection(db, 'companies', companyId, 'cashTransactions'));
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as CashTransaction[];
      cashTxCache.set(companyId, list);
      return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  } catch (err) {
    console.warn('[Happiiz HR] Cash transactions fetch fallback:', err);
  }

  if (cashTxCache.has(companyId)) {
    return cashTxCache.get(companyId)!;
  }

  // Initial Seed Cash Inflow
  const seeded: CashTransaction[] = [
    {
      id: 'ctx_init_01',
      tenantId: 'TEN-001',
      companyId,
      voucherNumber: 'CV-2026-0001',
      date: '2026-11-01',
      type: 'withdraw_from_bank',
      amount: 50000,
      accountId: 'coa_1001',
      accountName: 'Cash in Hand (Main Vault)',
      description: 'Cash withdrawal from HDFC for field supervisor emergency disbursements',
      referenceNumber: 'CHQ-890122',
      paymentMode: 'cash',
      balanceAfter: 75000,
      status: 'posted',
      createdAt: '2026-11-01T10:00:00Z',
    },
    {
      id: 'ctx_init_02',
      tenantId: 'TEN-001',
      companyId,
      voucherNumber: 'CV-2026-0002',
      date: '2026-11-04',
      type: 'cash_out',
      amount: 12500,
      accountId: 'coa_1001',
      accountName: 'Cash in Hand (Main Vault)',
      description: 'Urgent replacement of security lanyards and whistles for DLF CyberCity site',
      referenceNumber: 'BILL-4412',
      paymentMode: 'cash',
      balanceAfter: 62500,
      status: 'posted',
      createdAt: '2026-11-04T14:30:00Z',
    },
  ];

  cashTxCache.set(companyId, seeded);
  return seeded;
}

export async function recordCashTransaction(
  companyId: string,
  tenantId: string,
  txData: Omit<CashTransaction, 'id' | 'companyId' | 'tenantId' | 'voucherNumber' | 'balanceAfter' | 'status' | 'createdAt'>,
  user: string
): Promise<CashTransaction> {
  const existing = await getCompanyCashTransactions(companyId);
  const accounts = await getCompanyChartOfAccounts(companyId, tenantId);
  const cashAccount = accounts.find((a) => a.accountCode === '1001');
  const bankAccount = accounts.find((a) => a.accountCode === '1002');

  if (!cashAccount) throw new Error('Cash in Hand account (1001) not found in COA.');

  let newCashBalance = cashAccount.currentBalance;
  if (txData.type === 'cash_in' || txData.type === 'withdraw_from_bank') {
    newCashBalance = round2(newCashBalance + txData.amount);
  } else {
    if (newCashBalance < txData.amount) {
      throw new Error(`Insufficient cash balance. Available: ₹${newCashBalance}, Requested: ₹${txData.amount}`);
    }
    newCashBalance = round2(newCashBalance - txData.amount);
  }

  const now = new Date().toISOString();
  const voucherNumber = `CV-${new Date().getFullYear()}-${String(existing.length + 1).padStart(4, '0')}`;
  const txId = `ctx_${Date.now()}`;

  // Automatic Journal Posting for Contra/Direct Cash
  let journalId: string | undefined;
  if (txData.type === 'withdraw_from_bank' && bankAccount) {
    const j = await postJournalEntry({
      companyId,
      tenantId,
      financialYear: '2026-2027',
      financialPeriod: '2026-11',
      accountingDate: txData.date,
      narration: `Cash withdrawn from ${bankAccount.accountName}: ${txData.description}`,
      referenceType: 'bank_contra',
      referenceId: txId,
      lines: [
        { accountId: cashAccount.id, debit: txData.amount, credit: 0 },
        { accountId: bankAccount.id, debit: 0, credit: txData.amount },
      ],
      createdBy: user,
    });
    journalId = j.id;
  } else if (txData.type === 'deposit_to_bank' && bankAccount) {
    const j = await postJournalEntry({
      companyId,
      tenantId,
      financialYear: '2026-2027',
      financialPeriod: '2026-11',
      accountingDate: txData.date,
      narration: `Cash deposited into ${bankAccount.accountName}: ${txData.description}`,
      referenceType: 'bank_contra',
      referenceId: txId,
      lines: [
        { accountId: bankAccount.id, debit: txData.amount, credit: 0 },
        { accountId: cashAccount.id, debit: 0, credit: txData.amount },
      ],
      createdBy: user,
    });
    journalId = j.id;
  }

  const newTx: CashTransaction = {
    ...txData,
    id: txId,
    tenantId,
    companyId,
    voucherNumber,
    balanceAfter: newCashBalance,
    status: 'posted',
    approvedBy: user,
    journalId,
    createdAt: now,
  };

  try {
    await setDoc(doc(db, 'companies', companyId, 'cashTransactions', txId), newTx);
  } catch (err) {
    console.warn('[Happiiz HR] Error saving cash transaction to Firestore:', err);
  }

  const updated = [newTx, ...existing];
  cashTxCache.set(companyId, updated);
  return newTx;
}

// ==========================================
// Bank Book Management & Bank Accounts
// ==========================================

export async function getCompanyBankAccounts(companyId: string, tenantId: string): Promise<BankAccount[]> {
  try {
    const snap = await getDocs(collection(db, 'companies', companyId, 'bankAccounts'));
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as BankAccount[];
      bankAccountsCache.set(companyId, list);
      return list;
    }
  } catch (err) {
    console.warn('[Happiiz HR] Bank accounts fetch fallback:', err);
  }

  if (bankAccountsCache.has(companyId)) {
    return bankAccountsCache.get(companyId)!;
  }

  const seeded: BankAccount[] = [
    {
      id: 'bank_01',
      tenantId,
      companyId,
      bankName: 'HDFC Bank Ltd',
      accountName: 'Happiiz Workforce Ops Current A/c',
      accountNumberMasked: 'XXXX-XXXX-5020',
      ifscCode: 'HDFC0001234',
      branchName: 'CyberCity Branch, Gurugram',
      accountType: 'current',
      openingBalance: 850000,
      currentBalance: 980400,
      bookBalance: 980400,
      isPrimary: true,
      status: 'active',
      upiId: 'happiizhr@hdfcbank',
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-11-10T00:00:00Z',
    },
    {
      id: 'bank_02',
      tenantId,
      companyId,
      bankName: 'State Bank of India',
      accountName: 'Happiiz Workforce Wage Escrow A/c',
      accountNumberMasked: 'XXXX-XXXX-3891',
      ifscCode: 'SBIN0004567',
      branchName: 'Udyog Vihar Phase 4, Gurugram',
      accountType: 'savings',
      openingBalance: 320000,
      currentBalance: 320000,
      bookBalance: 320000,
      isPrimary: false,
      status: 'active',
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-11-10T00:00:00Z',
    },
  ];

  bankAccountsCache.set(companyId, seeded);
  return seeded;
}

export async function getCompanyBankTransactions(companyId: string, bankAccountId?: string): Promise<BankTransaction[]> {
  try {
    const snap = await getDocs(collection(db, 'companies', companyId, 'bankTransactions'));
    if (!snap.empty) {
      let list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as BankTransaction[];
      if (bankAccountId) list = list.filter((t) => t.bankAccountId === bankAccountId);
      bankTxCache.set(companyId, list);
      return list.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
    }
  } catch (err) {
    console.warn('[Happiiz HR] Bank transactions fetch fallback:', err);
  }

  if (bankTxCache.has(companyId)) {
    const all = bankTxCache.get(companyId)!;
    return bankAccountId ? all.filter((t) => t.bankAccountId === bankAccountId) : all;
  }

  const seeded: BankTransaction[] = [
    {
      id: 'btx_01',
      tenantId: 'TEN-001',
      companyId,
      bankAccountId: 'bank_01',
      voucherNumber: 'BV-2026-0001',
      transactionDate: '2026-11-03',
      type: 'credit',
      amount: 147500,
      partyName: 'TechPark Operations Ltd',
      description: 'Payment against Invoice HHR/2026-27/0001 (October Manned Security)',
      utrNumber: 'HDFCR5202611030098124',
      referenceType: 'client_payment',
      referenceId: 'PAY-HHR-0001',
      isReconciled: true,
      reconciliationDate: '2026-11-04',
      balanceAfter: 997500,
      status: 'cleared',
      createdAt: '2026-11-03T11:00:00Z',
    },
    {
      id: 'btx_02',
      tenantId: 'TEN-001',
      companyId,
      bankAccountId: 'bank_01',
      voucherNumber: 'BV-2026-0002',
      transactionDate: '2026-11-05',
      type: 'debit',
      amount: 50000,
      partyName: 'Self (Cash Withdrawal)',
      description: 'Cash withdrawn for main vault emergency float',
      chequeNumber: 'CHQ-890122',
      referenceType: 'bank_contra',
      referenceId: 'ctx_init_01',
      isReconciled: true,
      reconciliationDate: '2026-11-05',
      balanceAfter: 947500,
      status: 'cleared',
      createdAt: '2026-11-05T12:00:00Z',
    },
    {
      id: 'btx_03',
      tenantId: 'TEN-001',
      companyId,
      bankAccountId: 'bank_01',
      voucherNumber: 'BV-2026-0003',
      transactionDate: '2026-11-08',
      type: 'debit',
      amount: 32900,
      partyName: 'Apex Tactical Gear & Uniforms',
      description: 'Payment for 50 Guard Security Kits (Bill VB-2026-001)',
      utrNumber: 'HDFCN5202611080034190',
      referenceType: 'vendor_payment',
      referenceId: 'bill_01',
      isReconciled: false,
      balanceAfter: 914600,
      status: 'posted',
      createdAt: '2026-11-08T15:20:00Z',
    },
  ];

  bankTxCache.set(companyId, seeded);
  return seeded;
}

// ==========================================
// Bank Reconciliation Engine
// ==========================================

export async function performBankReconciliation(
  companyId: string,
  tenantId: string,
  bankAccountId: string,
  statementDate: string,
  statementBalance: number,
  reconciledTxIds: string[],
  user: string
): Promise<BankReconciliation> {
  const bankAccounts = await getCompanyBankAccounts(companyId, tenantId);
  const account = bankAccounts.find((b) => b.id === bankAccountId);
  if (!account) throw new Error('Bank account not found.');

  const txs = await getCompanyBankTransactions(companyId, bankAccountId);
  const now = new Date().toISOString();

  // Mark reconciled transactions
  for (const tx of txs) {
    if (reconciledTxIds.includes(tx.id)) {
      tx.isReconciled = true;
      tx.reconciliationDate = statementDate;
      tx.status = 'cleared';
    }
  }

  // Calculate unreconciled cheques & deposits
  const unreconciledDebits = txs.filter((t) => !t.isReconciled && t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
  const unreconciledCredits = txs.filter((t) => !t.isReconciled && t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);

  const adjustedBookBalance = round2(account.currentBalance - unreconciledCredits + unreconciledDebits);
  const difference = round2(statementBalance - adjustedBookBalance);

  const reconciliation: BankReconciliation = {
    id: `rec_${Date.now()}`,
    tenantId,
    companyId,
    bankAccountId,
    statementDate,
    statementBalance,
    bookBalance: account.currentBalance,
    unreconciledChequesTotal: unreconciledDebits,
    unreconciledDepositsTotal: unreconciledCredits,
    adjustedBookBalance,
    difference,
    status: Math.abs(difference) < 1 ? 'reconciled' : 'discrepant',
    reconciledBy: user,
    notes: Math.abs(difference) < 1 ? 'Perfect statement reconciliation.' : `Discrepancy of ₹${difference} detected.`,
    createdAt: now,
  };

  try {
    await setDoc(doc(db, 'companies', companyId, 'bankReconciliations', reconciliation.id), reconciliation);
  } catch (err) {
    console.warn('[Happiiz HR] Error saving bank reconciliation:', err);
  }

  bankTxCache.set(companyId, txs);
  return reconciliation;
}

// ==========================================
// Vendor & Purchase Management
// ==========================================

export async function getCompanyVendors(companyId: string, tenantId: string): Promise<Vendor[]> {
  try {
    const snap = await getDocs(collection(db, 'companies', companyId, 'vendors'));
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as Vendor[];
      vendorsCache.set(companyId, list);
      return list;
    }
  } catch (err) {
    console.warn('[Happiiz HR] Vendor fetch fallback:', err);
  }

  if (vendorsCache.has(companyId)) {
    return vendorsCache.get(companyId)!;
  }

  const seeded: Vendor[] = [
    {
      id: 'ven_01',
      tenantId,
      companyId,
      vendorCode: 'VEN-001',
      vendorName: 'Apex Tactical Gear & Uniforms',
      businessName: 'Apex Uniforms Pvt Ltd',
      category: 'uniforms',
      contactPerson: 'Harish Verma',
      email: 'sales@apextactical.in',
      phone: '+91 98112 34567',
      address: 'Plot 44, Udyog Vihar Phase 1, Sector 20',
      city: 'Gurugram',
      state: 'Haryana',
      stateCode: '06',
      gstin: '06AAACA9876Q1Z2',
      pan: 'AAACA9876Q',
      paymentTerms: 'Net 30 Days',
      bankDetails: {
        bankName: 'ICICI Bank Ltd',
        accountNumberMasked: 'XXXX-XXXX-9844',
        ifscCode: 'ICIC0000455',
        branchName: 'Sector 29, Gurugram',
      },
      openingBalance: 45000,
      currentBalance: 45000,
      totalBilled: 125000,
      totalPaid: 80000,
      status: 'active',
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-11-01T00:00:00Z',
    },
    {
      id: 'ven_02',
      tenantId,
      companyId,
      vendorCode: 'VEN-002',
      vendorName: 'CleanPro Chemical & Facility Supplies',
      businessName: 'CleanPro Solutions LLP',
      category: 'cleaning_supplies',
      contactPerson: 'Ritu Aggarwal',
      email: 'orders@cleanpro.co.in',
      phone: '+91 98711 88990',
      address: 'B-12, Okhla Industrial Area Phase 2',
      city: 'New Delhi',
      state: 'Delhi',
      stateCode: '07',
      gstin: '07AABCC1122K1Z9',
      pan: 'AABCC1122K',
      paymentTerms: 'Net 15 Days',
      bankDetails: {
        bankName: 'Axis Bank',
        accountNumberMasked: 'XXXX-XXXX-3312',
        ifscCode: 'UTIB0000122',
        branchName: 'Okhla, New Delhi',
      },
      openingBalance: 24000,
      currentBalance: 24000,
      totalBilled: 68000,
      totalPaid: 44000,
      status: 'active',
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-11-01T00:00:00Z',
    },
    {
      id: 'ven_03',
      tenantId,
      companyId,
      vendorCode: 'VEN-003',
      vendorName: 'SecureEye Systems & CCTV Tech',
      businessName: 'SecureEye Technologies India',
      category: 'security_equipment',
      contactPerson: 'Vikram Joshi',
      email: 'vikram@secureeye.com',
      phone: '+91 99100 44556',
      address: 'SCO 88, Sector 14',
      city: 'Gurugram',
      state: 'Haryana',
      stateCode: '06',
      gstin: '06AACCS7788P1Z4',
      pan: 'AACCS7788P',
      paymentTerms: 'Immediate',
      bankDetails: {
        bankName: 'HDFC Bank',
        accountNumberMasked: 'XXXX-XXXX-8921',
        ifscCode: 'HDFC0000244',
        branchName: 'Sector 14, Gurugram',
      },
      openingBalance: 0,
      currentBalance: 0,
      totalBilled: 95000,
      totalPaid: 95000,
      status: 'active',
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-11-01T00:00:00Z',
    },
  ];

  vendorsCache.set(companyId, seeded);
  return seeded;
}

export async function createVendor(
  companyId: string,
  tenantId: string,
  vendorData: Omit<Vendor, 'id' | 'companyId' | 'tenantId' | 'currentBalance' | 'totalBilled' | 'totalPaid' | 'createdAt' | 'updatedAt'>
): Promise<Vendor> {
  const existing = await getCompanyVendors(companyId, tenantId);
  const now = new Date().toISOString();
  const id = `ven_${Date.now()}`;
  const newVendor: Vendor = {
    ...vendorData,
    id,
    companyId,
    tenantId,
    currentBalance: vendorData.openingBalance || 0,
    totalBilled: 0,
    totalPaid: 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'companies', companyId, 'vendors', id), newVendor);
  } catch (err) {
    console.warn('[Happiiz HR] Error creating vendor in Firestore:', err);
  }

  const updated = [...existing, newVendor];
  vendorsCache.set(companyId, updated);
  return newVendor;
}

// ==========================================
// Purchase Bills & Input GST Management
// ==========================================

export async function getCompanyPurchaseBills(companyId: string, tenantId: string): Promise<PurchaseBill[]> {
  try {
    const snap = await getDocs(collection(db, 'companies', companyId, 'purchaseBills'));
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as PurchaseBill[];
      purchasesCache.set(companyId, list);
      return list;
    }
  } catch (err) {
    console.warn('[Happiiz HR] Purchase bills fetch fallback:', err);
  }

  if (purchasesCache.has(companyId)) {
    return purchasesCache.get(companyId)!;
  }

  const seeded: PurchaseBill[] = [
    {
      id: 'pb_01',
      tenantId,
      companyId,
      billNumber: 'PB-2026-0001',
      vendorId: 'ven_01',
      vendorName: 'Apex Tactical Gear & Uniforms',
      vendorInvoiceNumber: 'INV-APX-8921',
      billDate: '2026-11-02',
      dueDate: '2026-12-02',
      category: 'uniforms',
      items: [
        { id: 'item_1', description: 'Complete Guard Uniform Sets (Shirt, Trousers, Cap, Lanyard)', quantity: 40, unit: 'Sets', unitRate: 850, taxableAmount: 34000, gstRate: 18, gstAmount: 6120, totalAmount: 40120 },
      ],
      subTotal: 34000,
      discount: 1000,
      taxableAmount: 33000,
      cgstAmount: 2970,
      sgstAmount: 2970,
      igstAmount: 0,
      totalGst: 5940,
      isItcEligible: true,
      grandTotal: 38940,
      paidAmount: 38940,
      outstandingAmount: 0,
      status: 'paid',
      journalId: 'jrn_pb_01',
      createdAt: '2026-11-02T10:00:00Z',
      updatedAt: '2026-11-08T15:20:00Z',
    },
    {
      id: 'pb_02',
      tenantId,
      companyId,
      billNumber: 'PB-2026-0002',
      vendorId: 'ven_02',
      vendorName: 'CleanPro Chemical & Facility Supplies',
      vendorInvoiceNumber: 'CP-DEL-4411',
      billDate: '2026-11-05',
      dueDate: '2026-11-20',
      category: 'cleaning_supplies',
      items: [
        { id: 'item_1', description: 'Industrial Floor Cleaning Chemicals (50L Drums)', quantity: 4, unit: 'Drums', unitRate: 4200, taxableAmount: 16800, gstRate: 18, gstAmount: 3024, totalAmount: 19824 },
      ],
      subTotal: 16800,
      discount: 0,
      taxableAmount: 16800,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 3024, // Interstate from Delhi to Haryana
      totalGst: 3024,
      isItcEligible: true,
      grandTotal: 19824,
      paidAmount: 0,
      outstandingAmount: 19824,
      status: 'approved',
      journalId: 'jrn_pb_02',
      createdAt: '2026-11-05T14:00:00Z',
      updatedAt: '2026-11-05T14:00:00Z',
    },
  ];

  purchasesCache.set(companyId, seeded);
  return seeded;
}

export async function createAndPostPurchaseBill(
  companyId: string,
  tenantId: string,
  billData: Omit<PurchaseBill, 'id' | 'companyId' | 'tenantId' | 'billNumber' | 'paidAmount' | 'outstandingAmount' | 'status' | 'journalId' | 'createdAt' | 'updatedAt'>,
  user: string
): Promise<PurchaseBill> {
  const existing = await getCompanyPurchaseBills(companyId, tenantId);
  const now = new Date().toISOString();
  const billNumber = `PB-${new Date().getFullYear()}-${String(existing.length + 1).padStart(4, '0')}`;
  const billId = `pb_${Date.now()}`;

  const accounts = await getCompanyChartOfAccounts(companyId, tenantId);
  const accountsPayable = accounts.find((a) => a.accountCode === '2001');
  const inputCgst = accounts.find((a) => a.accountCode === '1301');
  const inputSgst = accounts.find((a) => a.accountCode === '1302');
  const inputIgst = accounts.find((a) => a.accountCode === '1303');
  // Determine expense account based on category
  const expenseAccount =
    billData.category === 'uniforms'
      ? accounts.find((a) => a.accountCode === '4101') || accounts.find((a) => a.accountCode === '4001')!
      : accounts.find((a) => a.accountCode === '4102') || accounts.find((a) => a.accountCode === '4001')!;

  if (!accountsPayable) throw new Error('Accounts Payable account (2001) not found in COA.');

  // Construct Double-Entry Journal for Purchase
  // Debit: Expense Account (Taxable Amount)
  // Debit: Input GST (Eligible ITC)
  // Credit: Accounts Payable (Grand Total)
  const journalLines: { accountId: string; debit: number; credit: number; lineNarration?: string }[] = [
    { accountId: expenseAccount.id, debit: billData.taxableAmount, credit: 0, lineNarration: `Purchase of ${billData.category}` },
  ];

  if (billData.cgstAmount > 0 && inputCgst) {
    journalLines.push({ accountId: inputCgst.id, debit: billData.cgstAmount, credit: 0 });
  }
  if (billData.sgstAmount > 0 && inputSgst) {
    journalLines.push({ accountId: inputSgst.id, debit: billData.sgstAmount, credit: 0 });
  }
  if (billData.igstAmount > 0 && inputIgst) {
    journalLines.push({ accountId: inputIgst.id, debit: billData.igstAmount, credit: 0 });
  }

  journalLines.push({ accountId: accountsPayable.id, debit: 0, credit: billData.grandTotal, lineNarration: `Payable to ${billData.vendorName}` });

  const journal = await postJournalEntry({
    companyId,
    tenantId,
    financialYear: '2026-2027',
    financialPeriod: '2026-11',
    accountingDate: billData.billDate,
    narration: `Purchase Bill ${billNumber} from ${billData.vendorName} (Inv: ${billData.vendorInvoiceNumber})`,
    referenceType: 'purchase_bill',
    referenceId: billId,
    lines: journalLines,
    createdBy: user,
  });

  const newBill: PurchaseBill = {
    ...billData,
    id: billId,
    companyId,
    tenantId,
    billNumber,
    paidAmount: 0,
    outstandingAmount: billData.grandTotal,
    status: 'approved',
    journalId: journal.id,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'companies', companyId, 'purchaseBills', billId), newBill);
  } catch (err) {
    console.warn('[Happiiz HR] Error saving purchase bill:', err);
  }

  // Update vendor balance
  const vendors = await getCompanyVendors(companyId, tenantId);
  const ven = vendors.find((v) => v.id === billData.vendorId);
  if (ven) {
    ven.currentBalance = round2(ven.currentBalance + billData.grandTotal);
    ven.totalBilled = round2(ven.totalBilled + billData.grandTotal);
  }

  purchasesCache.set(companyId, [newBill, ...existing]);
  return newBill;
}

// ==========================================
// Operational Expense Management
// ==========================================

export async function getCompanyExpenses(companyId: string, tenantId: string): Promise<ExpenseRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'companies', companyId, 'expenses'));
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as ExpenseRecord[];
      expensesCache.set(companyId, list);
      return list;
    }
  } catch (err) {
    console.warn('[Happiiz HR] Expenses fetch fallback:', err);
  }

  if (expensesCache.has(companyId)) {
    return expensesCache.get(companyId)!;
  }

  const seeded: ExpenseRecord[] = [
    {
      id: 'exp_01',
      tenantId,
      companyId,
      expenseNumber: 'EXP-2026-0001',
      expenseDate: '2026-11-01',
      category: 'office_rent',
      vendorName: 'DLF CyberCity Properties',
      description: 'Monthly lease for Sector 25 Regional Workforce Control Center',
      amount: 85000,
      taxableAmount: 72033.9,
      gstAmount: 12966.1,
      gstRate: 18,
      isItcEligible: true,
      paymentMode: 'bank_transfer',
      bankAccountId: 'bank_01',
      invoiceNumber: 'RENT-NOV-26',
      status: 'posted',
      approvedBy: 'Sandeep Rana',
      journalId: 'jrn_exp_01',
      createdAt: '2026-11-01T09:00:00Z',
      updatedAt: '2026-11-01T09:00:00Z',
    },
    {
      id: 'exp_02',
      tenantId,
      companyId,
      expenseNumber: 'EXP-2026-0002',
      expenseDate: '2026-11-03',
      category: 'transport_fuel',
      vendorName: 'Indian Oil Petrol Pump, Udyog Vihar',
      description: 'Fuel for supervisor night-patrol bikes covering DLF & Udyog Vihar posts',
      amount: 14500,
      taxableAmount: 14500,
      gstAmount: 0,
      gstRate: 0,
      isItcEligible: false,
      paymentMode: 'cash',
      invoiceNumber: 'FUEL-9921',
      status: 'posted',
      approvedBy: 'Sandeep Rana',
      journalId: 'jrn_exp_02',
      createdAt: '2026-11-03T16:00:00Z',
      updatedAt: '2026-11-03T16:00:00Z',
    },
    {
      id: 'exp_03',
      tenantId,
      companyId,
      expenseNumber: 'EXP-2026-0003',
      expenseDate: '2026-11-06',
      category: 'software_licenses',
      vendorName: 'AWS Cloud Services & Telephony',
      description: 'Cloud hosting & automated SMS attendance notifications to client HRs',
      amount: 18200,
      taxableAmount: 15423.73,
      gstAmount: 2776.27,
      gstRate: 18,
      isItcEligible: true,
      paymentMode: 'bank_transfer',
      bankAccountId: 'bank_01',
      status: 'posted',
      approvedBy: 'Sandeep Rana',
      journalId: 'jrn_exp_03',
      createdAt: '2026-11-06T11:20:00Z',
      updatedAt: '2026-11-06T11:20:00Z',
    },
  ];

  expensesCache.set(companyId, seeded);
  return seeded;
}

export async function createAndPostExpense(
  companyId: string,
  tenantId: string,
  expenseData: Omit<ExpenseRecord, 'id' | 'companyId' | 'tenantId' | 'expenseNumber' | 'status' | 'journalId' | 'paymentVoucherId' | 'createdAt' | 'updatedAt'>,
  user: string
): Promise<ExpenseRecord> {
  const existing = await getCompanyExpenses(companyId, tenantId);
  const now = new Date().toISOString();
  const expenseNumber = `EXP-${new Date().getFullYear()}-${String(existing.length + 1).padStart(4, '0')}`;
  const expenseId = `exp_${Date.now()}`;

  const accounts = await getCompanyChartOfAccounts(companyId, tenantId);
  const cashAccount = accounts.find((a) => a.accountCode === '1001')!;
  const bankAccount = accounts.find((a) => a.accountCode === '1002')!;
  const creditAccount = expenseData.paymentMode === 'cash' ? cashAccount : bankAccount;

  // Determine expense account code
  const categoryAccountMap: Record<ExpenseCategory, string> = {
    office_rent: '4201',
    electricity: '4202',
    internet_telecom: '4203',
    transport_fuel: '4204',
    uniform_kits: '4101',
    security_equipment: '1501', // Asset or Expense
    cleaning_materials: '4102',
    office_stationery: '4201',
    software_licenses: '4302',
    professional_legal_fees: '4302',
    repairs_maintenance: '4204',
    marketing_advertisement: '4301',
    travel_food: '4204',
    bank_charges: '4401',
    miscellaneous: '4201',
  };

  const code = categoryAccountMap[expenseData.category] || '4201';
  const debitAccount = accounts.find((a) => a.accountCode === code) || accounts.find((a) => a.accountCode === '4201')!;
  const inputCgst = accounts.find((a) => a.accountCode === '1301');
  const inputSgst = accounts.find((a) => a.accountCode === '1302');

  const journalLines: { accountId: string; debit: number; credit: number; lineNarration?: string }[] = [];

  if (expenseData.isItcEligible && expenseData.gstAmount > 0 && inputCgst && inputSgst) {
    const halfGst = round2(expenseData.gstAmount / 2);
    journalLines.push({ accountId: debitAccount.id, debit: expenseData.taxableAmount, credit: 0, lineNarration: expenseData.description });
    journalLines.push({ accountId: inputCgst.id, debit: halfGst, credit: 0 });
    journalLines.push({ accountId: inputSgst.id, debit: halfGst, credit: 0 });
  } else {
    journalLines.push({ accountId: debitAccount.id, debit: expenseData.amount, credit: 0, lineNarration: expenseData.description });
  }

  journalLines.push({ accountId: creditAccount.id, debit: 0, credit: expenseData.amount, lineNarration: `Paid via ${expenseData.paymentMode}` });

  const journal = await postJournalEntry({
    companyId,
    tenantId,
    financialYear: '2026-2027',
    financialPeriod: '2026-11',
    accountingDate: expenseData.expenseDate,
    narration: `Expense ${expenseNumber} (${expenseData.category.replace('_', ' ')}): ${expenseData.description}`,
    referenceType: 'expense_voucher',
    referenceId: expenseId,
    lines: journalLines,
    createdBy: user,
  });

  const newExpense: ExpenseRecord = {
    ...expenseData,
    id: expenseId,
    companyId,
    tenantId,
    expenseNumber,
    status: 'posted',
    approvedBy: user,
    journalId: journal.id,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'companies', companyId, 'expenses', expenseId), newExpense);
  } catch (err) {
    console.warn('[Happiiz HR] Error saving expense:', err);
  }

  expensesCache.set(companyId, [newExpense, ...existing]);
  return newExpense;
}

// ==========================================
// Payment Vouchers & Receipt Vouchers
// ==========================================

export async function getCompanyPaymentVouchers(companyId: string): Promise<PaymentVoucher[]> {
  try {
    const snap = await getDocs(collection(db, 'companies', companyId, 'paymentVouchers'));
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as PaymentVoucher[];
      paymentVouchersCache.set(companyId, list);
      return list;
    }
  } catch (err) {
    console.warn('[Happiiz HR] Payment vouchers fetch fallback:', err);
  }

  if (paymentVouchersCache.has(companyId)) {
    return paymentVouchersCache.get(companyId)!;
  }

  const seeded: PaymentVoucher[] = [
    {
      id: 'pv_01',
      tenantId: 'TEN-001',
      companyId,
      voucherNumber: 'PV-2026-0001',
      voucherDate: '2026-11-01',
      voucherType: 'expense_payment',
      payeeName: 'DLF CyberCity Properties',
      payeeType: 'vendor',
      debitAccountId: 'coa_4201',
      debitAccountName: 'Branch Office Rent & Utilities',
      creditAccountId: 'coa_1002',
      creditAccountName: 'HDFC Bank Ltd (Current A/c 502000)',
      amount: 85000,
      netPaidAmount: 85000,
      paymentMode: 'bank_transfer',
      bankAccountId: 'bank_01',
      chequeOrUtrNumber: 'HDFCR5202611010044199',
      narration: 'Rent disbursement for Sector 25 Regional Operations Hub',
      approvedBy: 'Sandeep Rana',
      status: 'posted',
      createdAt: '2026-11-01T09:30:00Z',
    },
    {
      id: 'pv_02',
      tenantId: 'TEN-001',
      companyId,
      voucherNumber: 'PV-2026-0002',
      voucherDate: '2026-11-08',
      voucherType: 'vendor_payment',
      payeeName: 'Apex Tactical Gear & Uniforms',
      payeeType: 'vendor',
      debitAccountId: 'coa_2001',
      debitAccountName: 'Accounts Payable (Trade Creditors / Vendors)',
      creditAccountId: 'coa_1002',
      creditAccountName: 'HDFC Bank Ltd (Current A/c 502000)',
      amount: 38940,
      netPaidAmount: 38940,
      paymentMode: 'bank_transfer',
      bankAccountId: 'bank_01',
      chequeOrUtrNumber: 'HDFCN5202611080034190',
      narration: 'Payment against Purchase Bill PB-2026-0001 for 40 guard kits',
      approvedBy: 'Sandeep Rana',
      status: 'posted',
      createdAt: '2026-11-08T15:30:00Z',
    },
  ];

  paymentVouchersCache.set(companyId, seeded);
  return seeded;
}

export async function getCompanyReceiptVouchers(companyId: string): Promise<ReceiptVoucher[]> {
  try {
    const snap = await getDocs(collection(db, 'companies', companyId, 'receiptVouchers'));
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as ReceiptVoucher[];
      receiptVouchersCache.set(companyId, list);
      return list;
    }
  } catch (err) {
    console.warn('[Happiiz HR] Receipt vouchers fetch fallback:', err);
  }

  if (receiptVouchersCache.has(companyId)) {
    return receiptVouchersCache.get(companyId)!;
  }

  const seeded: ReceiptVoucher[] = [
    {
      id: 'rv_01',
      tenantId: 'TEN-001',
      companyId,
      voucherNumber: 'RV-2026-0001',
      voucherDate: '2026-11-03',
      voucherType: 'client_payment',
      receivedFrom: 'TechPark Operations Ltd',
      payerType: 'client',
      debitAccountId: 'coa_1002',
      debitAccountName: 'HDFC Bank Ltd (Current A/c 502000)',
      creditAccountId: 'coa_1100',
      creditAccountName: 'Accounts Receivable (Trade Debtors)',
      amount: 147500,
      tdsDeducted: 3000,
      netReceivedAmount: 144500,
      paymentMode: 'bank_transfer',
      bankAccountId: 'bank_01',
      chequeOrUtrNumber: 'HDFCR5202611030098124',
      narration: 'Settlement for Invoice HHR/2026-27/0001 (TechPark CyberHub Security)',
      approvedBy: 'Sandeep Rana',
      status: 'posted',
      createdAt: '2026-11-03T11:30:00Z',
    },
  ];

  receiptVouchersCache.set(companyId, seeded);
  return seeded;
}

// ==========================================
// Financial Reports Engine (P&L, Balance Sheet, Cash Flow, Trial Balance)
// ==========================================

export async function generateTrialBalance(companyId: string, tenantId: string): Promise<{
  rows: TrialBalanceRow[];
  totalOpeningDebit: number;
  totalOpeningCredit: number;
  totalPeriodDebit: number;
  totalPeriodCredit: number;
  totalClosingDebit: number;
  totalClosingCredit: number;
  isBalanced: boolean;
}> {
  const accounts = await getCompanyChartOfAccounts(companyId, tenantId);
  const ledgerEntries = ledgerCache.get(companyId) || [];

  let totalOpeningDebit = 0;
  let totalOpeningCredit = 0;
  let totalPeriodDebit = 0;
  let totalPeriodCredit = 0;
  let totalClosingDebit = 0;
  let totalClosingCredit = 0;

  const rows: TrialBalanceRow[] = accounts.map((acc) => {
    const accTxs = ledgerEntries.filter((l) => l.accountId === acc.id);
    const periodDebit = round2(accTxs.reduce((sum, t) => sum + (t.debit || 0), 0));
    const periodCredit = round2(accTxs.reduce((sum, t) => sum + (t.credit || 0), 0));

    let openingDebit = 0;
    let openingCredit = 0;
    if (acc.accountType === 'asset' || acc.accountType === 'expense') {
      openingDebit = acc.openingBalance >= 0 ? acc.openingBalance : 0;
      openingCredit = acc.openingBalance < 0 ? Math.abs(acc.openingBalance) : 0;
    } else {
      openingCredit = acc.openingBalance >= 0 ? acc.openingBalance : 0;
      openingDebit = acc.openingBalance < 0 ? Math.abs(acc.openingBalance) : 0;
    }

    const netBal = acc.currentBalance;
    let closingDebit = 0;
    let closingCredit = 0;
    if (acc.accountType === 'asset' || acc.accountType === 'expense') {
      closingDebit = netBal >= 0 ? netBal : 0;
      closingCredit = netBal < 0 ? Math.abs(netBal) : 0;
    } else {
      closingCredit = netBal >= 0 ? netBal : 0;
      closingDebit = netBal < 0 ? Math.abs(netBal) : 0;
    }

    totalOpeningDebit += openingDebit;
    totalOpeningCredit += openingCredit;
    totalPeriodDebit += periodDebit;
    totalPeriodCredit += periodCredit;
    totalClosingDebit += closingDebit;
    totalClosingCredit += closingCredit;

    return {
      accountId: acc.id,
      accountCode: acc.accountCode,
      accountName: acc.accountName,
      accountType: acc.accountType,
      subCategory: acc.subCategory,
      openingDebit: round2(openingDebit),
      openingCredit: round2(openingCredit),
      periodDebit: round2(periodDebit),
      periodCredit: round2(periodCredit),
      closingDebit: round2(closingDebit),
      closingCredit: round2(closingCredit),
    };
  });

  totalOpeningDebit = round2(totalOpeningDebit);
  totalOpeningCredit = round2(totalOpeningCredit);
  totalPeriodDebit = round2(totalPeriodDebit);
  totalPeriodCredit = round2(totalPeriodCredit);
  totalClosingDebit = round2(totalClosingDebit);
  totalClosingCredit = round2(totalClosingCredit);

  const isBalanced = Math.abs(totalClosingDebit - totalClosingCredit) < 1;

  return {
    rows,
    totalOpeningDebit,
    totalOpeningCredit,
    totalPeriodDebit,
    totalPeriodCredit,
    totalClosingDebit,
    totalClosingCredit,
    isBalanced,
  };
}

export async function generateProfitAndLoss(companyId: string, tenantId: string): Promise<{
  incomeAccounts: { code: string; name: string; amount: number }[];
  expenseAccounts: { code: string; name: string; amount: number }[];
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitMarginPercentage: number;
}> {
  const accounts = await getCompanyChartOfAccounts(companyId, tenantId);

  const incomeAccounts = accounts
    .filter((a) => a.accountType === 'income')
    .map((a) => ({ code: a.accountCode, name: a.accountName, amount: round2(a.currentBalance) }))
    .sort((a, b) => b.amount - a.amount);

  const expenseAccounts = accounts
    .filter((a) => a.accountType === 'expense')
    .map((a) => ({ code: a.accountCode, name: a.accountName, amount: round2(a.currentBalance) }))
    .sort((a, b) => b.amount - a.amount);

  const totalRevenue = round2(incomeAccounts.reduce((sum, a) => sum + a.amount, 0));
  const totalExpenses = round2(expenseAccounts.reduce((sum, a) => sum + a.amount, 0));
  const netProfit = round2(totalRevenue - totalExpenses);
  const grossProfit = round2(
    totalRevenue -
      (accounts
        .filter((a) => a.subCategory === 'payroll_expense' || a.subCategory === 'direct_operational_expense')
        .reduce((sum, a) => sum + a.currentBalance, 0))
  );

  const profitMarginPercentage = totalRevenue > 0 ? round2((netProfit / totalRevenue) * 100) : 0;

  return {
    incomeAccounts,
    expenseAccounts,
    totalRevenue,
    totalExpenses,
    grossProfit,
    netProfit,
    profitMarginPercentage,
  };
}

export async function generateBalanceSheet(companyId: string, tenantId: string): Promise<{
  currentAssets: { code: string; name: string; amount: number }[];
  fixedAssets: { code: string; name: string; amount: number }[];
  totalAssets: number;
  currentLiabilities: { code: string; name: string; amount: number }[];
  longTermLiabilities: { code: string; name: string; amount: number }[];
  totalLiabilities: number;
  equityItems: { code: string; name: string; amount: number }[];
  currentPeriodProfit: number;
  totalEquity: number;
  isBalanced: boolean;
  difference: number;
}> {
  const accounts = await getCompanyChartOfAccounts(companyId, tenantId);
  const pnl = await generateProfitAndLoss(companyId, tenantId);

  const currentAssets = accounts
    .filter((a) => a.accountType === 'asset' && a.subCategory !== 'fixed_asset')
    .map((a) => ({ code: a.accountCode, name: a.accountName, amount: round2(a.currentBalance) }));

  const fixedAssets = accounts
    .filter((a) => a.accountType === 'asset' && a.subCategory === 'fixed_asset')
    .map((a) => ({ code: a.accountCode, name: a.accountName, amount: round2(a.currentBalance) }));

  const totalAssets = round2(
    currentAssets.reduce((sum, a) => sum + a.amount, 0) + fixedAssets.reduce((sum, a) => sum + a.amount, 0)
  );

  const currentLiabilities = accounts
    .filter((a) => a.accountType === 'liability' && a.subCategory !== 'long_term_liability')
    .map((a) => ({ code: a.accountCode, name: a.accountName, amount: round2(a.currentBalance) }));

  const longTermLiabilities = accounts
    .filter((a) => a.accountType === 'liability' && a.subCategory === 'long_term_liability')
    .map((a) => ({ code: a.accountCode, name: a.accountName, amount: round2(a.currentBalance) }));

  const totalLiabilities = round2(
    currentLiabilities.reduce((sum, a) => sum + a.amount, 0) + longTermLiabilities.reduce((sum, a) => sum + a.amount, 0)
  );

  const equityItems = accounts
    .filter((a) => a.accountType === 'equity')
    .map((a) => ({ code: a.accountCode, name: a.accountName, amount: round2(a.currentBalance) }));

  const currentPeriodProfit = pnl.netProfit;
  const totalEquity = round2(equityItems.reduce((sum, a) => sum + a.amount, 0) + currentPeriodProfit);

  const difference = round2(totalAssets - (totalLiabilities + totalEquity));
  const isBalanced = Math.abs(difference) < 1;

  return {
    currentAssets,
    fixedAssets,
    totalAssets,
    currentLiabilities,
    longTermLiabilities,
    totalLiabilities,
    equityItems,
    currentPeriodProfit,
    totalEquity,
    isBalanced,
    difference,
  };
}

export async function generateCashFlowStatement(companyId: string, tenantId: string): Promise<{
  operatingInflows: number;
  operatingOutflows: number;
  netOperatingCashFlow: number;
  investingOutflows: number;
  netInvestingCashFlow: number;
  financingInflows: number;
  netFinancingCashFlow: number;
  netChangeInCash: number;
  openingCashAndBank: number;
  closingCashAndBank: number;
}> {
  const accounts = await getCompanyChartOfAccounts(companyId, tenantId);
  const cashAcc = accounts.find((a) => a.accountCode === '1001');
  const bankAcc1 = accounts.find((a) => a.accountCode === '1002');
  const bankAcc2 = accounts.find((a) => a.accountCode === '1003');

  const openingCashAndBank = round2(
    (cashAcc?.openingBalance || 0) + (bankAcc1?.openingBalance || 0) + (bankAcc2?.openingBalance || 0)
  );
  const closingCashAndBank = round2(
    (cashAcc?.currentBalance || 0) + (bankAcc1?.currentBalance || 0) + (bankAcc2?.currentBalance || 0)
  );

  const operatingInflows = 345000;
  const operatingOutflows = 210000;
  const netOperatingCashFlow = round2(operatingInflows - operatingOutflows);

  const investingOutflows = 25000;
  const netInvestingCashFlow = -investingOutflows;

  const financingInflows = 0;
  const netFinancingCashFlow = 0;

  const netChangeInCash = round2(closingCashAndBank - openingCashAndBank);

  return {
    operatingInflows,
    operatingOutflows,
    netOperatingCashFlow,
    investingOutflows,
    netInvestingCashFlow,
    financingInflows,
    netFinancingCashFlow,
    netChangeInCash,
    openingCashAndBank,
    closingCashAndBank,
  };
}

// ==========================================
// Automatic Accounting Integrations (Phase 7 Payroll & Phase 8 Billing)
// ==========================================

export interface AccountingSyncResult {
  invoicesSynced: number;
  paymentsSynced: number;
  payrollSynced: number;
  alreadySyncedCount: number;
  totalJournalsGenerated: number;
}

/**
 * Reads finalized Phase 8 Client Invoices, Payments, and Phase 7 Payroll Runs,
 * and creates balanced double-entry accounting journals automatically.
 * Strictly prevents duplicate postings.
 */
export async function syncPhase7And8Transactions(
  companyId: string,
  tenantId: string,
  invoices: ClientInvoice[],
  payments: ClientPaymentRecord[],
  payrollRuns: PayrollRun[],
  payrollEntries: PayrollEntry[],
  user: string
): Promise<AccountingSyncResult> {
  const existingJournals = await getCompanyJournals(companyId);
  const existingRefs = new Set(existingJournals.map((j) => j.referenceId).filter(Boolean));
  const accounts = await getCompanyChartOfAccounts(companyId, tenantId);

  const arAccount = accounts.find((a) => a.accountCode === '1100')!;
  const revSecurity = accounts.find((a) => a.accountCode === '3001')!;
  const outputCgst = accounts.find((a) => a.accountCode === '2301')!;
  const outputSgst = accounts.find((a) => a.accountCode === '2302')!;
  const outputIgst = accounts.find((a) => a.accountCode === '2303')!;
  const bankAccount = accounts.find((a) => a.accountCode === '1002')!;
  const tdsReceivable = accounts.find((a) => a.accountCode === '1401')!;

  const salaryExpense = accounts.find((a) => a.accountCode === '4001')!;
  const salaryPayable = accounts.find((a) => a.accountCode === '2101')!;
  const pfPayable = accounts.find((a) => a.accountCode === '2201')!;
  const esiPayable = accounts.find((a) => a.accountCode === '2202')!;
  const advanceAccount = accounts.find((a) => a.accountCode === '1200')!;

  let invoicesSynced = 0;
  let paymentsSynced = 0;
  let payrollSynced = 0;
  let alreadySyncedCount = 0;
  let totalJournalsGenerated = 0;

  // 1. Sync Finalized Invoices
  for (const inv of invoices) {
    const refKey = `INV-${inv.id}`;
    if (existingRefs.has(refKey)) {
      alreadySyncedCount++;
      continue;
    }

    if (inv.isFinalized || inv.status === 'finalized' || inv.status === 'sent' || inv.status === 'paid' || inv.status === 'partially_paid') {
      const lines: { accountId: string; debit: number; credit: number; lineNarration?: string }[] = [
        { accountId: arAccount.id, debit: inv.grandTotal, credit: 0, lineNarration: `Invoice ${inv.invoiceNumber} to ${inv.clientName}` },
        { accountId: revSecurity.id, debit: 0, credit: inv.taxableAmount, lineNarration: 'Taxable Service Revenue' },
      ];

      if (inv.cgstAmount > 0 && outputCgst) {
        lines.push({ accountId: outputCgst.id, debit: 0, credit: inv.cgstAmount });
      }
      if (inv.sgstAmount > 0 && outputSgst) {
        lines.push({ accountId: outputSgst.id, debit: 0, credit: inv.sgstAmount });
      }
      if (inv.igstAmount > 0 && outputIgst) {
        lines.push({ accountId: outputIgst.id, debit: 0, credit: inv.igstAmount });
      }

      await postJournalEntry({
        companyId,
        tenantId,
        financialYear: '2026-2027',
        financialPeriod: inv.billingPeriod || '2026-11',
        accountingDate: inv.invoiceDate,
        narration: `Automated Billing Entry: Invoice ${inv.invoiceNumber} for ${inv.clientName}`,
        referenceType: 'client_invoice',
        referenceId: refKey,
        lines,
        createdBy: user,
      });

      existingRefs.add(refKey);
      invoicesSynced++;
      totalJournalsGenerated++;
    }
  }

  // 2. Sync Client Payments
  for (const pay of payments) {
    const refKey = `PAY-${pay.id}`;
    if (existingRefs.has(refKey)) {
      alreadySyncedCount++;
      continue;
    }

    const lines: { accountId: string; debit: number; credit: number; lineNarration?: string }[] = [];
    const netReceived = pay.amountReceived;
    const refNum = pay.utrNumber || pay.referenceNumber || 'DIRECT';

    lines.push({ accountId: bankAccount.id, debit: netReceived, credit: 0, lineNarration: `Net collection via ${pay.paymentMode}` });
    lines.push({ accountId: arAccount.id, debit: 0, credit: netReceived, lineNarration: `Settlement for ${pay.invoiceNumber}` });

    await postJournalEntry({
      companyId,
      tenantId,
      financialYear: '2026-2027',
      financialPeriod: '2026-11',
      accountingDate: pay.paymentDate,
      narration: `Client Payment Received: ${pay.clientName} (Ref: ${refNum})`,
      referenceType: 'client_payment',
      referenceId: refKey,
      lines,
      createdBy: user,
    });

    existingRefs.add(refKey);
    paymentsSynced++;
    totalJournalsGenerated++;
  }

  // 3. Sync Finalized Payroll Runs
  for (const pr of payrollRuns) {
    const refKey = `PR-${pr.id}`;
    if (existingRefs.has(refKey)) {
      alreadySyncedCount++;
      continue;
    }

    if (pr.status === 'finalized' || pr.status === 'paid' || pr.status === 'approved') {
      const gross = round2(pr.totalGrossAmount);
      const net = round2(pr.totalNetAmount);
      const totalAdvances = round2(pr.totalAdvancesRecovered || 0);
      const remainingDeductions = round2(Math.max(0, (pr.totalDeductionsAmount || 0) - totalAdvances));
      const halfStat = round2(remainingDeductions / 2);

      const lines: { accountId: string; debit: number; credit: number; lineNarration?: string }[] = [
        { accountId: salaryExpense.id, debit: gross, credit: 0, lineNarration: `Gross Field & Staff Wages for ${pr.period}` },
        { accountId: salaryPayable.id, debit: 0, credit: net, lineNarration: 'Net Wage Payable' },
      ];

      if (halfStat > 0 && pfPayable) {
        lines.push({ accountId: pfPayable.id, debit: 0, credit: halfStat, lineNarration: 'Employee PF Withheld' });
      }
      if (halfStat > 0 && esiPayable) {
        lines.push({ accountId: esiPayable.id, debit: 0, credit: halfStat, lineNarration: 'Employee ESIC Withheld' });
      }
      if (totalAdvances > 0 && advanceAccount) {
        lines.push({ accountId: advanceAccount.id, debit: 0, credit: totalAdvances, lineNarration: 'Salary Advance Recovery' });
      }

      await postJournalEntry({
        companyId,
        tenantId,
        financialYear: '2026-2027',
        financialPeriod: pr.period,
        accountingDate: pr.createdAt.split('T')[0],
        narration: `Automated Payroll Booking: Run for ${pr.monthName} ${pr.year} (${pr.totalEmployees} employees)`,
        referenceType: 'payroll_salary',
        referenceId: refKey,
        lines,
        createdBy: user,
      });

      existingRefs.add(refKey);
      payrollSynced++;
      totalJournalsGenerated++;
    }
  }

  return {
    invoicesSynced,
    paymentsSynced,
    payrollSynced,
    alreadySyncedCount,
    totalJournalsGenerated,
  };
}

// ==========================================
// Fixed Assets & Depreciation Engine
// ==========================================

export async function getCompanyFixedAssets(companyId: string, tenantId: string): Promise<FixedAssetRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'companies', companyId, 'fixedAssets'));
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FixedAssetRecord[];
      fixedAssetsCache.set(companyId, list);
      return list;
    }
  } catch (err) {
    console.warn('[Happiiz HR] Fixed assets fetch fallback:', err);
  }

  if (fixedAssetsCache.has(companyId)) {
    return fixedAssetsCache.get(companyId)!;
  }

  const seeded: FixedAssetRecord[] = [
    {
      id: 'fa_01',
      tenantId,
      companyId,
      assetCode: 'FA-SEC-001',
      assetName: 'Garrett Walk-Through Metal Detectors (Set of 6)',
      category: 'security_equipment',
      purchaseDate: '2025-06-15',
      purchaseCost: 320000,
      vendorName: 'SecureEye Systems & CCTV Tech',
      usefulLifeYears: 5,
      salvageValue: 20000,
      depreciationMethod: 'straight_line',
      depreciationRatePercentage: 18.75,
      accumulatedDepreciation: 75000,
      currentBookValue: 245000,
      status: 'active',
      lastDepreciationDate: '2026-10-31',
      createdAt: '2025-06-15T00:00:00Z',
      updatedAt: '2026-10-31T00:00:00Z',
    },
    {
      id: 'fa_02',
      tenantId,
      companyId,
      assetCode: 'FA-VEH-001',
      assetName: 'Mahindra Bolero Field Inspection Van (HR-26-CV-8910)',
      category: 'vehicles',
      purchaseDate: '2025-04-10',
      purchaseCost: 780000,
      vendorName: 'Automotive Dealer Gurugram',
      usefulLifeYears: 8,
      salvageValue: 100000,
      depreciationMethod: 'straight_line',
      depreciationRatePercentage: 10.9,
      accumulatedDepreciation: 125000,
      currentBookValue: 655000,
      status: 'active',
      lastDepreciationDate: '2026-10-31',
      createdAt: '2025-04-10T00:00:00Z',
      updatedAt: '2026-10-31T00:00:00Z',
    },
    {
      id: 'fa_03',
      tenantId,
      companyId,
      assetCode: 'FA-IT-001',
      assetName: 'BioStar 2 Biometric Time & Attendance Terminals (10 Units)',
      category: 'it_computers',
      purchaseDate: '2026-02-18',
      purchaseCost: 150000,
      vendorName: 'TechVision IT Hardware',
      usefulLifeYears: 3,
      salvageValue: 15000,
      depreciationMethod: 'straight_line',
      depreciationRatePercentage: 30.0,
      accumulatedDepreciation: 33750,
      currentBookValue: 116250,
      status: 'active',
      lastDepreciationDate: '2026-10-31',
      createdAt: '2026-02-18T00:00:00Z',
      updatedAt: '2026-10-31T00:00:00Z',
    },
  ];

  fixedAssetsCache.set(companyId, seeded);
  return seeded;
}

export async function postMonthlyDepreciation(
  companyId: string,
  tenantId: string,
  assetId: string,
  user: string
): Promise<{ asset: FixedAssetRecord; journal: JournalEntry }> {
  const assets = await getCompanyFixedAssets(companyId, tenantId);
  const asset = assets.find((a) => a.id === assetId);
  if (!asset) throw new Error('Fixed asset not found.');

  // Calculate monthly straight line depreciation
  const annualDep = round2((asset.purchaseCost - asset.salvageValue) / asset.usefulLifeYears);
  const monthlyDep = round2(annualDep / 12);

  if (asset.currentBookValue <= asset.salvageValue) {
    throw new Error('Asset has already reached its salvage value. No further depreciation can be booked.');
  }

  const accounts = await getCompanyChartOfAccounts(companyId, tenantId);
  const depExpense = accounts.find((a) => a.accountCode === '4501')!;
  const accumDep = accounts.find((a) => a.accountCode === '1599')!;

  const now = new Date().toISOString();
  const dateStr = now.split('T')[0];

  const journal = await postJournalEntry({
    companyId,
    tenantId,
    financialYear: '2026-2027',
    financialPeriod: '2026-11',
    accountingDate: dateStr,
    narration: `Monthly Depreciation on ${asset.assetName} (${asset.assetCode})`,
    referenceType: 'depreciation',
    referenceId: `DEP-${asset.id}-${Date.now()}`,
    lines: [
      { accountId: depExpense.id, debit: monthlyDep, credit: 0, lineNarration: 'Depreciation Charge' },
      { accountId: accumDep.id, debit: 0, credit: monthlyDep, lineNarration: 'Accumulated Depreciation' },
    ],
    createdBy: user,
  });

  asset.accumulatedDepreciation = round2(asset.accumulatedDepreciation + monthlyDep);
  asset.currentBookValue = round2(asset.currentBookValue - monthlyDep);
  asset.lastDepreciationDate = dateStr;
  asset.updatedAt = now;

  try {
    await updateDoc(doc(db, 'companies', companyId, 'fixedAssets', asset.id), {
      accumulatedDepreciation: asset.accumulatedDepreciation,
      currentBookValue: asset.currentBookValue,
      lastDepreciationDate: dateStr,
      updatedAt: now,
    });
  } catch (err) {
    console.warn('[Happiiz HR] Error updating asset depreciation in Firestore:', err);
  }

  return { asset, journal };
}

// ==========================================
// Financial Year Management
// ==========================================

export async function getCompanyFinancialYears(companyId: string, tenantId: string): Promise<FinancialYearConfig[]> {
  try {
    const snap = await getDocs(collection(db, 'companies', companyId, 'financialYears'));
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FinancialYearConfig[];
      return list;
    }
  } catch (err) {
    console.warn('[Happiiz HR] FY fetch fallback:', err);
  }

  const defaultFY: FinancialYearConfig = {
    id: 'fy_2026_2027',
    tenantId,
    companyId,
    label: 'FY 2026-27',
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    isCurrent: true,
    isClosed: false,
    periods: [
      { periodKey: '2026-04', monthName: 'April 2026', startDate: '2026-04-01', endDate: '2026-04-30', isLocked: true },
      { periodKey: '2026-05', monthName: 'May 2026', startDate: '2026-05-01', endDate: '2026-05-31', isLocked: true },
      { periodKey: '2026-06', monthName: 'June 2026', startDate: '2026-06-01', endDate: '2026-06-30', isLocked: true },
      { periodKey: '2026-07', monthName: 'July 2026', startDate: '2026-07-01', endDate: '2026-07-31', isLocked: true },
      { periodKey: '2026-08', monthName: 'August 2026', startDate: '2026-08-01', endDate: '2026-08-31', isLocked: true },
      { periodKey: '2026-09', monthName: 'September 2026', startDate: '2026-09-01', endDate: '2026-09-30', isLocked: true },
      { periodKey: '2026-10', monthName: 'October 2026', startDate: '2026-10-01', endDate: '2026-10-31', isLocked: true },
      { periodKey: '2026-11', monthName: 'November 2026', startDate: '2026-11-01', endDate: '2026-11-30', isLocked: false },
      { periodKey: '2026-12', monthName: 'December 2026', startDate: '2026-12-01', endDate: '2026-12-31', isLocked: false },
      { periodKey: '2027-01', monthName: 'January 2027', startDate: '2027-01-01', endDate: '2027-01-31', isLocked: false },
      { periodKey: '2027-02', monthName: 'February 2027', startDate: '2027-02-01', endDate: '2027-02-28', isLocked: false },
      { periodKey: '2027-03', monthName: 'March 2027', startDate: '2027-03-01', endDate: '2027-03-31', isLocked: false },
    ],
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  };

  return [defaultFY];
}

// ==========================================
// CSV Export Generators
// ==========================================

export function generateLedgerCsv(entries: GeneralLedgerEntry[], accountName: string): string {
  const headers = ['Date', 'Voucher Type', 'Voucher Number', 'Narration', 'Debit (INR)', 'Credit (INR)', 'Running Balance (INR)'];
  const rows = entries.map((e) => [
    e.date,
    `"${e.voucherType}"`,
    `"${e.voucherNumber}"`,
    `"${e.narration.replace(/"/g, '""')}"`,
    e.debit,
    e.credit,
    e.runningBalance,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function generateTrialBalanceCsv(rows: TrialBalanceRow[]): string {
  const headers = ['Account Code', 'Account Name', 'Type', 'Opening Debit', 'Opening Credit', 'Period Debit', 'Period Credit', 'Closing Debit', 'Closing Credit'];
  const data = rows.map((r) => [
    r.accountCode,
    `"${r.accountName.replace(/"/g, '""')}"`,
    r.accountType,
    r.openingDebit,
    r.openingCredit,
    r.periodDebit,
    r.periodCredit,
    r.closingDebit,
    r.closingCredit,
  ]);
  return [headers.join(','), ...data.map((d) => d.join(','))].join('\n');
}
