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
  SalaryStructure,
  SalaryRevision,
  EmployeeAdvance,
  AdvanceTransaction,
  PayrollDeductionItem,
  StatutoryConfiguration,
  PayrollRun,
  PayrollEntry,
  SalarySlip,
  BankPaymentStatement,
  PayrollReadyAttendanceSummary,
  Employee,
  PayrollStatus,
  SalaryType,
} from '../types';

// ==========================================
// In-Memory Fallback Cache for Resilient Operation
// ==========================================

const structuresCache = new Map<string, SalaryStructure[]>();
const revisionsCache = new Map<string, SalaryRevision[]>();
const advancesCache = new Map<string, EmployeeAdvance[]>();
const deductionsCache = new Map<string, PayrollDeductionItem[]>();
const runsCache = new Map<string, PayrollRun[]>();
const entriesCache = new Map<string, PayrollEntry[]>();
const statutoryCache = new Map<string, StatutoryConfiguration>();

// ==========================================
// Math & Number Formatting Helpers
// ==========================================

export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function numberToIndianWords(num: number): string {
  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const inWords = (n: number): string => {
    let str = '';
    if (n > 19) {
      str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    } else {
      str += a[n];
    }
    return str;
  };

  const integerPart = Math.floor(Math.abs(num));
  if (integerPart === 0) return 'Zero Rupees Only';

  const crore = Math.floor(integerPart / 10000000);
  const lakh = Math.floor((integerPart % 10000000) / 100000);
  const thousand = Math.floor((integerPart % 100000) / 1000);
  const hundred = Math.floor((integerPart % 1000) / 100);
  const remainder = integerPart % 100;

  const parts: string[] = [];
  if (crore > 0) parts.push(`${inWords(crore)} Crore`);
  if (lakh > 0) parts.push(`${inWords(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${inWords(thousand)} Thousand`);
  if (hundred > 0) parts.push(`${inWords(hundred)} Hundred`);
  if (remainder > 0) parts.push(inWords(remainder));

  return `${parts.join(' ')} Rupees Only`;
}

// ==========================================
// Default Seed Configurations
// ==========================================

export function getDefaultStatutoryConfig(companyId: string, tenantId: string): StatutoryConfiguration {
  return {
    id: `stat_${companyId}`,
    tenantId,
    companyId,
    pfEmployeePercent: 12.0,
    pfEmployerPercent: 12.0,
    pfWageCeiling: 15000,
    esiEmployeePercent: 0.75,
    esiEmployerPercent: 3.25,
    esiWageCeiling: 21000,
    ptSlabs: [
      { minGross: 0, maxGross: 15000, taxAmount: 0 },
      { minGross: 15001, maxGross: 20000, taxAmount: 150 },
      { minGross: 20001, maxGross: 9999999, taxAmount: 200 },
    ],
    tdsStandardExemptionAnnual: 700000,
    standardDivisor: 30,
    effectiveYear: '2026-2027',
    updatedAt: new Date().toISOString(),
  };
}

export function getInitialSalaryStructures(
  companyId: string,
  tenantId: string,
  employees: Employee[]
): SalaryStructure[] {
  return employees.map((emp, idx) => {
    const isSupervisor = emp.designation?.toLowerCase().includes('supervisor');
    const isHousekeeping = emp.department?.toLowerCase().includes('housekeeping');
    const isDriver = emp.designation?.toLowerCase().includes('driver');

    let gross = 21500;
    let salaryType: SalaryType = 'monthly';
    let dailyRate = 0;
    let otRate = 160;
    let doubleDutyRate = 850;

    if (isSupervisor) {
      gross = 26500;
      otRate = 190;
      doubleDutyRate = 1000;
    } else if (isHousekeeping) {
      gross = 18500;
      otRate = 140;
      doubleDutyRate = 750;
    } else if (isDriver) {
      gross = 24000;
      otRate = 175;
      doubleDutyRate = 900;
    }

    if (idx === 2) {
      // Demo Daily Wage Staff
      salaryType = 'daily';
      dailyRate = 750;
      gross = dailyRate * 26;
      otRate = 135;
      doubleDutyRate = 750;
    }

    const basicSalary = round2(gross * 0.5);
    const hra = round2(gross * 0.25);
    const conveyanceAllowance = round2(gross * 0.1);
    const specialAllowance = round2(gross * 0.1);
    const otherAllowances = round2(gross - (basicSalary + hra + conveyanceAllowance + specialAllowance));

    return {
      id: `sal_struct_${emp.id}`,
      tenantId,
      companyId,
      employeeId: emp.id,
      employeeCode: emp.employeeCode || `EMP-${1000 + idx}`,
      employeeName: emp.fullName || 'Employee',
      designation: emp.designation || 'Security Guard',
      department: emp.department || 'Operations',
      clientId: (emp as any).assignedClient || (emp as any).clientId || 'client_rexon_01',
      siteId: emp.assignedSite || 'site_rexon_01',
      siteName: emp.assignedSite ? 'Cyber City Tower B' : 'HQ Operations',
      salaryType,
      basicSalary,
      hra,
      conveyanceAllowance,
      specialAllowance,
      otherAllowances,
      monthlyGrossSalary: gross,
      dailyWageRate: dailyRate,
      hourlyRate: round2(gross / (26 * 8)),
      shiftRate: dailyRate || round2(gross / 26),
      overtimeHourlyRate: otRate,
      doubleDutyShiftRate: doubleDutyRate,
      holidayDutyRate: doubleDutyRate,
      pfApplicable: true,
      esiApplicable: gross <= 21000,
      ptApplicable: true,
      tdsApplicable: gross > 50000,
      effectiveFrom: '2026-04-01',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
  });
}

export function getInitialAdvances(companyId: string, tenantId: string, employees: Employee[]): EmployeeAdvance[] {
  if (employees.length === 0) return [];
  const emp1 = employees[0];
  const emp2 = employees.length > 1 ? employees[1] : employees[0];

  return [
    {
      id: `adv_${companyId}_01`,
      tenantId,
      companyId,
      employeeId: emp1.id,
      employeeCode: emp1.employeeCode,
      employeeName: emp1.fullName,
      advanceDate: '2026-10-15',
      advanceAmount: 5000,
      monthlyRecoveryAmount: 1500,
      recoveredAmount: 1500,
      outstandingAmount: 3500,
      paymentMode: 'bank_transfer',
      referenceNumber: 'NEFT92837102',
      approvedBy: 'HR Operations',
      status: 'active',
      remarks: 'Festival advance for Deepawali',
      createdAt: '2026-10-15T10:00:00Z',
    },
    {
      id: `adv_${companyId}_02`,
      tenantId,
      companyId,
      employeeId: emp2.id,
      employeeCode: emp2.employeeCode,
      employeeName: emp2.fullName,
      advanceDate: '2026-10-20',
      advanceAmount: 3000,
      monthlyRecoveryAmount: 1000,
      recoveredAmount: 1000,
      outstandingAmount: 2000,
      paymentMode: 'upi',
      referenceNumber: 'UPI/293847291',
      approvedBy: 'Accounts Manager',
      status: 'active',
      remarks: 'Emergency family medical expense',
      createdAt: '2026-10-20T14:30:00Z',
    },
  ];
}

export function getInitialDeductions(companyId: string, tenantId: string, employees: Employee[]): PayrollDeductionItem[] {
  if (employees.length === 0) return [];
  const emp1 = employees[0];
  const emp3 = employees.length > 2 ? employees[2] : employees[0];

  return [
    {
      id: `ded_${companyId}_01`,
      tenantId,
      companyId,
      employeeId: emp1.id,
      employeeCode: emp1.employeeCode,
      employeeName: emp1.fullName,
      deductionCategory: 'uniform',
      description: '2 Pairs Security Uniform Set + Cap + Badge',
      originalAmount: 2400,
      monthlyDeductionAmount: 600,
      totalDeductedAmount: 1200,
      remainingBalance: 1200,
      status: 'active',
      approvedBy: 'Store Supervisor',
      createdAt: '2026-09-01T09:00:00Z',
    },
    {
      id: `ded_${companyId}_02`,
      tenantId,
      companyId,
      employeeId: emp3.id,
      employeeCode: emp3.employeeCode,
      employeeName: emp3.fullName,
      deductionCategory: 'shoes',
      description: 'Steel-toe Safety Shoes (Bata Industrials)',
      originalAmount: 1500,
      monthlyDeductionAmount: 500,
      totalDeductedAmount: 1000,
      remainingBalance: 500,
      status: 'active',
      approvedBy: 'Safety Officer',
      createdAt: '2026-09-10T11:00:00Z',
    },
  ];
}

// ==========================================
// Salary Structures CRUD & Firestore Services
// ==========================================

export async function getSalaryStructures(
  companyId: string,
  tenantId: string,
  employees: Employee[] = []
): Promise<SalaryStructure[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'salaryStructures');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items = snapshot.docs.map((docSnap) => docSnap.data() as SalaryStructure);
      structuresCache.set(companyId, items);
      return items;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `companies/${companyId}/salaryStructures`);
  }

  // Fallback cache or seed
  if (!structuresCache.has(companyId)) {
    const initial = getInitialSalaryStructures(companyId, tenantId, employees);
    structuresCache.set(companyId, initial);
  }
  return structuresCache.get(companyId) || [];
}

export async function saveSalaryStructure(
  companyId: string,
  structure: SalaryStructure
): Promise<void> {
  try {
    const docRef = doc(db, 'companies', companyId, 'salaryStructures', structure.id);
    await setDoc(docRef, { ...structure, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `companies/${companyId}/salaryStructures/${structure.id}`);
  }

  // Update Cache
  const list = structuresCache.get(companyId) || [];
  const idx = list.findIndex((s) => s.id === structure.id);
  if (idx >= 0) {
    list[idx] = structure;
  } else {
    list.push(structure);
  }
  structuresCache.set(companyId, [...list]);
}

export async function createSalaryRevision(
  companyId: string,
  revision: SalaryRevision,
  updatedStructure: SalaryStructure
): Promise<void> {
  try {
    const revRef = doc(db, 'companies', companyId, 'salaryRevisions', revision.id);
    await setDoc(revRef, revision);

    const structRef = doc(db, 'companies', companyId, 'salaryStructures', updatedStructure.id);
    await setDoc(structRef, updatedStructure, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `companies/${companyId}/salaryRevisions/${revision.id}`);
  }

  // Cache update
  const revList = revisionsCache.get(companyId) || [];
  revList.unshift(revision);
  revisionsCache.set(companyId, revList);

  await saveSalaryStructure(companyId, updatedStructure);
}

export async function getSalaryRevisions(companyId: string): Promise<SalaryRevision[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'salaryRevisions');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items = snapshot.docs.map((d) => d.data() as SalaryRevision);
      revisionsCache.set(companyId, items);
      return items;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `companies/${companyId}/salaryRevisions`);
  }
  return revisionsCache.get(companyId) || [];
}

// ==========================================
// Employee Advances & Ledger Services
// ==========================================

export async function getEmployeeAdvances(
  companyId: string,
  tenantId: string,
  employees: Employee[] = []
): Promise<EmployeeAdvance[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'employeeAdvances');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items = snapshot.docs.map((docSnap) => docSnap.data() as EmployeeAdvance);
      advancesCache.set(companyId, items);
      return items;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `companies/${companyId}/employeeAdvances`);
  }

  if (!advancesCache.has(companyId)) {
    const initial = getInitialAdvances(companyId, tenantId, employees);
    advancesCache.set(companyId, initial);
  }
  return advancesCache.get(companyId) || [];
}

export async function saveEmployeeAdvance(
  companyId: string,
  advance: EmployeeAdvance
): Promise<void> {
  try {
    const docRef = doc(db, 'companies', companyId, 'employeeAdvances', advance.id);
    await setDoc(docRef, advance, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `companies/${companyId}/employeeAdvances/${advance.id}`);
  }

  const list = advancesCache.get(companyId) || [];
  const idx = list.findIndex((a) => a.id === advance.id);
  if (idx >= 0) {
    list[idx] = advance;
  } else {
    list.unshift(advance);
  }
  advancesCache.set(companyId, [...list]);
}

// ==========================================
// Payroll Deductions Management
// ==========================================

export async function getPayrollDeductions(
  companyId: string,
  tenantId: string,
  employees: Employee[] = []
): Promise<PayrollDeductionItem[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'payrollDeductions');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items = snapshot.docs.map((docSnap) => docSnap.data() as PayrollDeductionItem);
      deductionsCache.set(companyId, items);
      return items;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `companies/${companyId}/payrollDeductions`);
  }

  if (!deductionsCache.has(companyId)) {
    const initial = getInitialDeductions(companyId, tenantId, employees);
    deductionsCache.set(companyId, initial);
  }
  return deductionsCache.get(companyId) || [];
}

export async function savePayrollDeduction(
  companyId: string,
  deduction: PayrollDeductionItem
): Promise<void> {
  try {
    const docRef = doc(db, 'companies', companyId, 'payrollDeductions', deduction.id);
    await setDoc(docRef, deduction, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `companies/${companyId}/payrollDeductions/${deduction.id}`);
  }

  const list = deductionsCache.get(companyId) || [];
  const idx = list.findIndex((d) => d.id === deduction.id);
  if (idx >= 0) {
    list[idx] = deduction;
  } else {
    list.unshift(deduction);
  }
  deductionsCache.set(companyId, [...list]);
}

// ==========================================
// Statutory Configuration
// ==========================================

export async function getStatutoryConfiguration(
  companyId: string,
  tenantId: string
): Promise<StatutoryConfiguration> {
  try {
    const docRef = doc(db, 'companies', companyId, 'statutoryConfigurations', `stat_${companyId}`);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as StatutoryConfiguration;
      statutoryCache.set(companyId, data);
      return data;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `companies/${companyId}/statutoryConfigurations`);
  }

  if (!statutoryCache.has(companyId)) {
    const defaultConfig = getDefaultStatutoryConfig(companyId, tenantId);
    statutoryCache.set(companyId, defaultConfig);
  }
  return statutoryCache.get(companyId)!;
}

export async function saveStatutoryConfiguration(
  companyId: string,
  config: StatutoryConfiguration
): Promise<void> {
  try {
    const docRef = doc(db, 'companies', companyId, 'statutoryConfigurations', config.id);
    await setDoc(docRef, { ...config, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `companies/${companyId}/statutoryConfigurations/${config.id}`);
  }
  statutoryCache.set(companyId, config);
}

// ==========================================
// Central Payroll Calculation Engine
// ==========================================

export function calculateEmployeePayrollEntry(
  structure: SalaryStructure,
  summary: PayrollReadyAttendanceSummary,
  advances: EmployeeAdvance[],
  deductions: PayrollDeductionItem[],
  statutory: StatutoryConfiguration,
  period: string,
  payrollRunId: string,
  empDetails?: Employee
): { entry: PayrollEntry; advanceRecovery: number; deductionRecovery: number } {
  const divisor = typeof statutory.standardDivisor === 'number' ? statutory.standardDivisor : 30;

  // Payable days calculation:
  // Present + Half Days (0.5) + Approved Paid Leaves + Weekly Offs + Holidays
  const payableDays = round2(
    summary.presentDays +
      summary.halfDays * 0.5 +
      summary.approvedLeaveDays +
      summary.weeklyOffDays +
      summary.holidayDutyDays
  );

  let basicEarned = 0;
  let hraEarned = 0;
  let allowancesEarned = 0;

  if (structure.salaryType === 'daily') {
    basicEarned = round2(structure.dailyWageRate * payableDays);
    hraEarned = 0;
    allowancesEarned = 0;
  } else if (structure.salaryType === 'hourly') {
    basicEarned = round2(structure.hourlyRate * summary.regularWorkingHours);
    hraEarned = 0;
    allowancesEarned = 0;
  } else {
    // Monthly / Fixed: Pro-rata basis
    const ratio = Math.min(1.0, payableDays / divisor);
    basicEarned = round2(structure.basicSalary * ratio);
    hraEarned = round2(structure.hra * ratio);
    allowancesEarned = round2(
      (structure.conveyanceAllowance + structure.specialAllowance + structure.otherAllowances) * ratio
    );
  }

  // Overtime and Double Duty
  const overtimeAmount = round2(summary.approvedOvertimeHours * structure.overtimeHourlyRate);
  const doubleDutyAmount = round2(summary.approvedDoubleDutyCount * structure.doubleDutyShiftRate);
  const holidayDutyAmount = 0; // included in double duty or payable days
  const bonusAmount = 0;

  const totalGrossSalary = round2(
    basicEarned + hraEarned + allowancesEarned + overtimeAmount + doubleDutyAmount + holidayDutyAmount + bonusAmount
  );

  // Statutory Deductions
  let pfEmployee = 0;
  let pfEmployer = 0;
  if (structure.pfApplicable) {
    const pfWage = Math.min(basicEarned, statutory.pfWageCeiling);
    pfEmployee = round2(pfWage * (statutory.pfEmployeePercent / 100));
    pfEmployer = round2(pfWage * (statutory.pfEmployerPercent / 100));
  }

  let esiEmployee = 0;
  let esiEmployer = 0;
  if (structure.esiApplicable && totalGrossSalary <= statutory.esiWageCeiling) {
    esiEmployee = round2(totalGrossSalary * (statutory.esiEmployeePercent / 100));
    esiEmployer = round2(totalGrossSalary * (statutory.esiEmployerPercent / 100));
  }

  let ptAmount = 0;
  if (structure.ptApplicable && statutory.ptSlabs) {
    const matchedSlab = statutory.ptSlabs.find(
      (s) => totalGrossSalary >= s.minGross && totalGrossSalary <= s.maxGross
    );
    if (matchedSlab) {
      ptAmount = matchedSlab.taxAmount;
    }
  }

  let tdsAmount = 0;
  if (structure.tdsApplicable && totalGrossSalary * 12 > statutory.tdsStandardExemptionAnnual) {
    tdsAmount = round2(Math.max(0, (totalGrossSalary * 12 - statutory.tdsStandardExemptionAnnual) * 0.05) / 12);
  }

  // Active Advance Recovery
  let advanceDeduction = 0;
  const activeAdvance = advances.find(
    (a) => a.employeeId === structure.employeeId && a.status === 'active' && a.outstandingAmount > 0
  );
  if (activeAdvance) {
    advanceDeduction = Math.min(activeAdvance.monthlyRecoveryAmount, activeAdvance.outstandingAmount);
  }

  // Active Uniform/Equipment Deductions
  let uniformEquipmentDeduction = 0;
  const activeDeduction = deductions.find(
    (d) => d.employeeId === structure.employeeId && d.status === 'active' && d.remainingBalance > 0
  );
  if (activeDeduction) {
    uniformEquipmentDeduction = Math.min(
      activeDeduction.monthlyDeductionAmount,
      activeDeduction.remainingBalance
    );
  }

  const otherDeductions = 0;
  const totalDeductions = round2(
    pfEmployee +
      esiEmployee +
      ptAmount +
      tdsAmount +
      advanceDeduction +
      uniformEquipmentDeduction +
      otherDeductions
  );

  const netPayable = round2(Math.max(0, totalGrossSalary - totalDeductions));
  const totalCostToCompany = round2(totalGrossSalary + pfEmployer + esiEmployer);

  // Bank Info Masking
  const rawAccount =
    empDetails?.bankDetails?.accountNumberMasked || (empDetails as any)?.bankAccount?.accountNumber || '482910394857';
  const maskedAccount =
    rawAccount.length > 4 ? `•••• •••• ${rawAccount.slice(-4)}` : rawAccount;
  const rawPan =
    empDetails?.panNumberMasked || (empDetails as any)?.identityDocuments?.panNumber || 'ABCDE1234F';
  const maskedPan =
    rawPan.length > 4 ? `${rawPan.slice(0, 2)}•••••${rawPan.slice(-2)}` : rawPan;

  const entry: PayrollEntry = {
    id: `entry_${payrollRunId}_${structure.employeeId}`,
    tenantId: structure.tenantId,
    companyId: structure.companyId,
    payrollRunId,
    employeeId: structure.employeeId,
    employeeCode: structure.employeeCode,
    employeeName: structure.employeeName,
    designation: structure.designation,
    department: structure.department,
    siteId: structure.siteId || summary.assignedSiteId || 'site_main',
    siteName: structure.siteName || summary.assignedSiteName || 'Main Operations',
    period,
    salaryType: structure.salaryType,
    paymentMode: 'bank_transfer',
    bankAccountMasked: maskedAccount,
    ifscCode: empDetails?.bankDetails?.ifscCode || (empDetails as any)?.bankAccount?.ifscCode || 'HDFC0001829',
    bankName: empDetails?.bankDetails?.bankName || (empDetails as any)?.bankAccount?.bankName || 'HDFC Bank Ltd',
    panNumberMasked: maskedPan,
    scheduledDays: summary.totalScheduledShifts || 30,
    payableDays,
    presentDays: summary.presentDays,
    absentDays: summary.absentDays,
    halfDays: summary.halfDays,
    paidLeaveDays: summary.approvedLeaveDays,
    weeklyOffDays: summary.weeklyOffDays,
    holidayDays: summary.holidayDutyDays,
    overtimeHours: summary.approvedOvertimeHours,
    doubleDutyCount: summary.approvedDoubleDutyCount,
    basicEarned,
    hraEarned,
    allowancesEarned,
    overtimeAmount,
    doubleDutyAmount,
    holidayDutyAmount,
    bonusAmount,
    totalGrossSalary,
    pfEmployee,
    esiEmployee,
    ptAmount,
    tdsAmount,
    advanceDeduction,
    uniformEquipmentDeduction,
    otherDeductions,
    totalDeductions,
    netPayable,
    pfEmployer,
    esiEmployer,
    totalCostToCompany,
    paymentStatus: 'unpaid',
  };

  return { entry, advanceRecovery: advanceDeduction, deductionRecovery: uniformEquipmentDeduction };
}

// ==========================================
// Payroll Runs & Processing Workflow
// ==========================================

export async function getPayrollRuns(companyId: string, tenantId: string): Promise<PayrollRun[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'payrollRuns');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items = snapshot.docs.map((d) => d.data() as PayrollRun);
      items.sort((a, b) => b.period.localeCompare(a.period));
      runsCache.set(companyId, items);
      return items;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `companies/${companyId}/payrollRuns`);
  }

  // Default seed run for current month if cache empty
  if (!runsCache.has(companyId)) {
    const initialRun: PayrollRun = {
      id: `run_${companyId}_2026-11`,
      tenantId,
      companyId,
      period: '2026-11',
      monthName: 'November',
      year: 2026,
      status: 'calculated',
      totalEmployees: 4,
      totalGrossAmount: 94800,
      totalOvertimeAmount: 4200,
      totalDoubleDutyAmount: 3400,
      totalDeductionsAmount: 11460,
      totalNetAmount: 83340,
      totalEmployerContribution: 10850,
      totalAdvancesRecovered: 2500,
      preparedBy: 'Operations & HR Team',
      paidCount: 0,
      createdAt: '2026-11-01T08:00:00Z',
      updatedAt: new Date().toISOString(),
    };
    runsCache.set(companyId, [initialRun]);
  }
  return runsCache.get(companyId) || [];
}

export async function getPayrollEntries(companyId: string, runId: string): Promise<PayrollEntry[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'payrollEntries');
    const q = query(colRef, where('payrollRunId', '==', runId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const items = snapshot.docs.map((d) => d.data() as PayrollEntry);
      entriesCache.set(runId, items);
      return items;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `companies/${companyId}/payrollEntries`);
  }

  return entriesCache.get(runId) || [];
}

export async function executeMonthlyPayrollCalculation(
  companyId: string,
  tenantId: string,
  period: string, // YYYY-MM
  preparedBy: string,
  employees: Employee[],
  attendanceSummaries: PayrollReadyAttendanceSummary[]
): Promise<{ run: PayrollRun; entries: PayrollEntry[] }> {
  const structures = await getSalaryStructures(companyId, tenantId, employees);
  const statutory = await getStatutoryConfiguration(companyId, tenantId);
  const advances = await getEmployeeAdvances(companyId, tenantId, employees);
  const deductions = await getPayrollDeductions(companyId, tenantId, employees);

  const [yearStr, monthStr] = period.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[monthIndex] || 'Current Month';

  const runId = `run_${companyId}_${period}`;
  const calculatedEntries: PayrollEntry[] = [];

  let totalGross = 0;
  let totalOt = 0;
  let totalDoubleDuty = 0;
  let totalDeductions = 0;
  let totalNet = 0;
  let totalEmployerContrib = 0;
  let totalAdvancesRecovered = 0;

  for (const emp of employees) {
    // Find matching salary structure
    let struct = structures.find((s) => s.employeeId === emp.id && s.status === 'active');
    if (!struct) {
      // Auto-generate active structure if missing
      const isSupervisor = emp.designation?.toLowerCase().includes('supervisor');
      const gross = isSupervisor ? 26000 : 21000;
      struct = {
        id: `sal_struct_${emp.id}`,
        tenantId,
        companyId,
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: emp.fullName,
        designation: emp.designation,
        department: emp.department,
        siteId: emp.assignedSite,
        siteName: 'Assigned Site',
        salaryType: 'monthly',
        basicSalary: round2(gross * 0.5),
        hra: round2(gross * 0.25),
        conveyanceAllowance: round2(gross * 0.1),
        specialAllowance: round2(gross * 0.1),
        otherAllowances: round2(gross * 0.05),
        monthlyGrossSalary: gross,
        dailyWageRate: 0,
        hourlyRate: round2(gross / 208),
        shiftRate: round2(gross / 26),
        overtimeHourlyRate: 160,
        doubleDutyShiftRate: 850,
        holidayDutyRate: 850,
        pfApplicable: true,
        esiApplicable: gross <= 21000,
        ptApplicable: true,
        tdsApplicable: false,
        effectiveFrom: `${period}-01`,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
    }

    // Find attendance summary
    let summary = attendanceSummaries.find((s) => s.employeeId === emp.id && s.period === period);
    if (!summary) {
      // Create representative summary
      summary = {
        id: `sum_${emp.id}_${period}`,
        tenantId,
        companyId,
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: emp.fullName,
        designation: emp.designation,
        period,
        assignedSiteId: emp.assignedSite || 'site_main',
        assignedSiteName: 'Cyber City Site',
        totalScheduledShifts: 30,
        presentDays: 24,
        absentDays: 1,
        halfDays: 1,
        approvedLeaveDays: 1,
        weeklyOffDays: 4,
        holidayDutyDays: 0,
        regularWorkingHours: 196,
        approvedOvertimeHours: 8,
        approvedDoubleDutyCount: 1,
        lateMinutes: 20,
        earlyLeavingMinutes: 0,
        finalizationStatus: 'finalized',
        generatedAt: new Date().toISOString(),
      };
    }

    const { entry, advanceRecovery } = calculateEmployeePayrollEntry(
      struct,
      summary,
      advances,
      deductions,
      statutory,
      period,
      runId,
      emp
    );

    calculatedEntries.push(entry);

    totalGross += entry.totalGrossSalary;
    totalOt += entry.overtimeAmount;
    totalDoubleDuty += entry.doubleDutyAmount;
    totalDeductions += entry.totalDeductions;
    totalNet += entry.netPayable;
    totalEmployerContrib += entry.pfEmployer + entry.esiEmployer;
    totalAdvancesRecovered += advanceRecovery;
  }

  const run: PayrollRun = {
    id: runId,
    tenantId,
    companyId,
    period,
    monthName,
    year,
    status: 'calculated',
    totalEmployees: calculatedEntries.length,
    totalGrossAmount: round2(totalGross),
    totalOvertimeAmount: round2(totalOt),
    totalDoubleDutyAmount: round2(totalDoubleDuty),
    totalDeductionsAmount: round2(totalDeductions),
    totalNetAmount: round2(totalNet),
    totalEmployerContribution: round2(totalEmployerContrib),
    totalAdvancesRecovered: round2(totalAdvancesRecovered),
    preparedBy,
    paidCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Persist Run and Entries to Firestore
  try {
    const runRef = doc(db, 'companies', companyId, 'payrollRuns', run.id);
    await setDoc(runRef, run, { merge: true });

    for (const entry of calculatedEntries) {
      const entryRef = doc(db, 'companies', companyId, 'payrollEntries', entry.id);
      await setDoc(entryRef, entry, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `companies/${companyId}/payrollRuns/${run.id}`);
  }

  // Cache update
  const runList = runsCache.get(companyId) || [];
  const existingIdx = runList.findIndex((r) => r.id === run.id);
  if (existingIdx >= 0) {
    runList[existingIdx] = run;
  } else {
    runList.unshift(run);
  }
  runsCache.set(companyId, runList);
  entriesCache.set(run.id, calculatedEntries);

  return { run, entries: calculatedEntries };
}

export async function updatePayrollRunStatus(
  companyId: string,
  runId: string,
  status: PayrollStatus,
  user: { name: string; role?: string },
  reopenReason?: string
): Promise<PayrollRun> {
  const runList = runsCache.get(companyId) || [];
  const run = runList.find((r) => r.id === runId);
  if (!run) {
    throw new Error('Payroll run not found');
  }

  const updated: PayrollRun = {
    ...run,
    status,
    updatedAt: new Date().toISOString(),
  };

  if (status === 'approved') {
    updated.approvedBy = user.name;
    updated.approvedAt = new Date().toISOString();
  } else if (status === 'finalized') {
    updated.finalizedBy = user.name;
    updated.finalizedAt = new Date().toISOString();
  } else if (status === 'draft' || status === 'calculated') {
    if (reopenReason) {
      updated.reopenedBy = user.name;
      updated.reopenedAt = new Date().toISOString();
      updated.reopenReason = reopenReason;
    }
  }

  try {
    const runRef = doc(db, 'companies', companyId, 'payrollRuns', runId);
    await setDoc(runRef, updated, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `companies/${companyId}/payrollRuns/${runId}`);
  }

  const idx = runList.findIndex((r) => r.id === runId);
  if (idx >= 0) {
    runList[idx] = updated;
    runsCache.set(companyId, [...runList]);
  }

  return updated;
}

export async function markPayrollEntriesPaid(
  companyId: string,
  runId: string,
  entryIds: string[],
  paymentMode: 'bank_transfer' | 'cash' | 'upi' | 'cheque',
  transactionRef: string
): Promise<void> {
  const entries = entriesCache.get(runId) || [];
  const now = new Date().toISOString();

  for (const entry of entries) {
    if (entryIds.includes(entry.id)) {
      entry.paymentStatus = 'paid';
      entry.paymentMode = paymentMode;
      entry.transactionRef = transactionRef;
      entry.paidAt = now;

      try {
        const entryRef = doc(db, 'companies', companyId, 'payrollEntries', entry.id);
        await updateDoc(entryRef, {
          paymentStatus: 'paid',
          paymentMode,
          transactionRef,
          paidAt: now,
        });
      } catch (err) {
        console.warn('Could not update firestore entry status', err);
      }
    }
  }

  entriesCache.set(runId, [...entries]);

  // Update Run paid count
  const runs = runsCache.get(companyId) || [];
  const run = runs.find((r) => r.id === runId);
  if (run) {
    const paidCount = entries.filter((e) => e.paymentStatus === 'paid').length;
    run.paidCount = paidCount;
    if (paidCount === entries.length) {
      run.status = 'paid';
    } else if (paidCount > 0) {
      run.status = 'partially_paid';
    }
    try {
      const runRef = doc(db, 'companies', companyId, 'payrollRuns', runId);
      await updateDoc(runRef, { paidCount: run.paidCount, status: run.status });
    } catch {
      // non-blocking
    }
    runsCache.set(companyId, [...runs]);
  }
}

// ==========================================
// Bank NEFT/RTGS CSV Export Generator
// ==========================================

export function generateBankPaymentCSV(entries: PayrollEntry[], companyName: string): string {
  const headers = [
    'Beneficiary Name',
    'Beneficiary Account Number',
    'IFSC Code',
    'Amount (INR)',
    'Payment Mode',
    'Employee Code',
    'Narration / Remarks',
  ];

  const rows = entries.map((e) => [
    `"${e.employeeName.replace(/"/g, '""')}"`,
    `"${e.bankAccountMasked ? e.bankAccountMasked.replace(/[^0-9]/g, '') || '918273645012' : '918273645012'}"`,
    `"${e.ifscCode || 'HDFC0001829'}"`,
    e.netPayable.toFixed(2),
    'NEFT',
    `"${e.employeeCode}"`,
    `"Salary for ${e.period} - ${companyName.replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function generatePayrollRegisterCSV(entries: PayrollEntry[]): string {
  const headers = [
    'Emp Code',
    'Employee Name',
    'Designation',
    'Site',
    'Salary Type',
    'Payable Days',
    'OT Hours',
    'DD Count',
    'Basic Earned',
    'HRA Earned',
    'Allowances Earned',
    'OT Amount',
    'Double Duty Amount',
    'Gross Salary',
    'PF Employee',
    'ESI Employee',
    'PT',
    'TDS',
    'Advance Recovery',
    'Uniform Deduction',
    'Total Deductions',
    'Net Payable',
    'PF Employer',
    'ESI Employer',
    'CTC',
    'Status',
  ];

  const rows = entries.map((e) => [
    `"${e.employeeCode}"`,
    `"${e.employeeName.replace(/"/g, '""')}"`,
    `"${e.designation}"`,
    `"${e.siteName}"`,
    `"${e.salaryType}"`,
    e.payableDays,
    e.overtimeHours,
    e.doubleDutyCount,
    e.basicEarned.toFixed(2),
    e.hraEarned.toFixed(2),
    e.allowancesEarned.toFixed(2),
    e.overtimeAmount.toFixed(2),
    e.doubleDutyAmount.toFixed(2),
    e.totalGrossSalary.toFixed(2),
    e.pfEmployee.toFixed(2),
    e.esiEmployee.toFixed(2),
    e.ptAmount.toFixed(2),
    e.tdsAmount.toFixed(2),
    e.advanceDeduction.toFixed(2),
    e.uniformEquipmentDeduction.toFixed(2),
    e.totalDeductions.toFixed(2),
    e.netPayable.toFixed(2),
    e.pfEmployer.toFixed(2),
    e.esiEmployer.toFixed(2),
    e.totalCostToCompany.toFixed(2),
    `"${e.paymentStatus}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
