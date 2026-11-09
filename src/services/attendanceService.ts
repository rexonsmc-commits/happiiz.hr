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
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import {
  ShiftDefinition,
  DutyRoster,
  AttendanceRecord,
  AttendanceEvent,
  OvertimeRequest,
  DoubleDutyRecord,
  WeeklyOffPolicy,
  CompanyHoliday,
  MissingPunchCorrection,
  AttendancePeriodFinalization,
  PayrollReadyAttendanceSummary,
  Employee,
  ClientSite,
} from '../types';

// ==========================================
// Haversine GPS & Geofencing Calculation
// ==========================================

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function evaluateGeofence(
  employeeLat: number,
  employeeLng: number,
  siteLat: number,
  siteLng: number,
  permittedRadiusMeters: number = 100
): { withinGeofence: boolean; distanceMeters: number } {
  const distance = calculateDistanceMeters(employeeLat, employeeLng, siteLat, siteLng);
  return {
    withinGeofence: distance <= permittedRadiusMeters,
    distanceMeters: distance,
  };
}

// ==========================================
// Mock / Cache Fallback Storage for Demo & Preview
// ==========================================

const shiftsCache = new Map<string, ShiftDefinition[]>();
const rostersCache = new Map<string, DutyRoster[]>();
const attendanceCache = new Map<string, AttendanceRecord[]>();
const eventsCache = new Map<string, AttendanceEvent[]>();
const overtimeCache = new Map<string, OvertimeRequest[]>();
const doubleDutyCache = new Map<string, DoubleDutyRecord[]>();
const holidaysCache = new Map<string, CompanyHoliday[]>();
const weeklyOffCache = new Map<string, WeeklyOffPolicy[]>();
const correctionsCache = new Map<string, MissingPunchCorrection[]>();
const periodsCache = new Map<string, AttendancePeriodFinalization[]>();

// ==========================================
// Initial Phase 6 Seed Data Helpers
// ==========================================

export function getInitialShifts(companyId: string, tenantId: string): ShiftDefinition[] {
  return [
    {
      id: `shift_${companyId}_mrn`,
      tenantId,
      companyId,
      shiftName: 'Morning Guard Shift',
      shiftCode: 'SH-MRN-01',
      startTime: '06:00',
      endTime: '14:00',
      breakDurationMinutes: 45,
      gracePeriodMinutes: 15,
      lateThresholdMinutes: 30,
      earlyLeavingThresholdMinutes: 15,
      overtimeEligible: true,
      isOvernight: false,
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: `shift_${companyId}_evn`,
      tenantId,
      companyId,
      shiftName: 'Evening Patrol Shift',
      shiftCode: 'SH-EVN-02',
      startTime: '14:00',
      endTime: '22:00',
      breakDurationMinutes: 45,
      gracePeriodMinutes: 15,
      lateThresholdMinutes: 30,
      earlyLeavingThresholdMinutes: 15,
      overtimeEligible: true,
      isOvernight: false,
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: `shift_${companyId}_ngt`,
      tenantId,
      companyId,
      shiftName: 'Night Guard & Vigilance (Overnight)',
      shiftCode: 'SH-NGT-03',
      startTime: '22:00',
      endTime: '06:00',
      breakDurationMinutes: 60,
      gracePeriodMinutes: 15,
      lateThresholdMinutes: 30,
      earlyLeavingThresholdMinutes: 15,
      overtimeEligible: true,
      isOvernight: true,
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: `shift_${companyId}_gen`,
      tenantId,
      companyId,
      shiftName: 'General Facility Duty',
      shiftCode: 'SH-GEN-04',
      startTime: '09:00',
      endTime: '18:00',
      breakDurationMinutes: 60,
      gracePeriodMinutes: 15,
      lateThresholdMinutes: 30,
      earlyLeavingThresholdMinutes: 15,
      overtimeEligible: true,
      isOvernight: false,
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];
}

export function getInitialHolidays(companyId: string, tenantId: string): CompanyHoliday[] {
  return [
    {
      id: `hol_${companyId}_republic`,
      tenantId,
      companyId,
      holidayName: 'Republic Day',
      holidayDate: '2026-01-26',
      holidayType: 'national',
      isMandatory: true,
      status: 'active',
      description: 'National Gazetted Holiday (Double duty policy applies if worked)',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: `hol_${companyId}_independence`,
      tenantId,
      companyId,
      holidayName: 'Independence Day',
      holidayDate: '2026-08-15',
      holidayType: 'national',
      isMandatory: true,
      status: 'active',
      description: 'National Gazetted Holiday',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: `hol_${companyId}_diwali`,
      tenantId,
      companyId,
      holidayName: 'Diwali Festival',
      holidayDate: '2026-11-08',
      holidayType: 'company',
      isMandatory: true,
      status: 'active',
      description: 'Major National & Festive Holiday',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: `hol_${companyId}_newyear`,
      tenantId,
      companyId,
      holidayName: 'New Year Day',
      holidayDate: '2026-01-01',
      holidayType: 'company',
      isMandatory: false,
      status: 'active',
      description: 'Annual Corporate Holiday',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];
}

export function getInitialWeeklyOffPolicies(companyId: string, tenantId: string): WeeklyOffPolicy[] {
  return [
    {
      id: `wo_${companyId}_standard`,
      tenantId,
      companyId,
      policyName: 'Standard Sunday Weekly Off',
      policyType: 'site_specific',
      daysOfWeek: [0], // Sunday
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: `wo_${companyId}_rotational`,
      tenantId,
      companyId,
      policyName: '24x7 Rotational Off (Security Personnel)',
      policyType: 'rotational',
      daysOfWeek: [1, 2, 3, 4], // Staggered weekdays
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];
}

export function getInitialDutyRosters(companyId: string, tenantId: string): DutyRoster[] {
  const todayStr = new Date().toISOString().split('T')[0];
  return [
    {
      id: `rst_seed_01`,
      tenantId,
      companyId,
      employeeId: 'emp_apex_01',
      employeeCode: 'HHR-EMP-000001',
      employeeName: 'Surender Pal Singh',
      clientId: 'client_apex_01',
      clientName: 'Infosys Horizon Tech Park',
      siteId: 'site_apex_01',
      siteCode: 'REX-SITE-0001',
      siteName: 'Horizon Tech Park - Campus Gate 1 & 2',
      designation: 'Senior Armed Security Officer',
      shiftId: `shift_${companyId}_mrn`,
      shiftName: 'Morning Guard Shift',
      dutyDate: todayStr,
      dutyStartTime: '06:00',
      dutyEndTime: '14:00',
      reportingSupervisorName: 'Surender Pal Singh',
      status: 'completed',
      createdAt: `${todayStr}T00:00:00.000Z`,
    },
    {
      id: `rst_seed_02`,
      tenantId,
      companyId,
      employeeId: 'emp_apex_02',
      employeeCode: 'HHR-EMP-000002',
      employeeName: 'Dharamveer Khatri',
      clientId: 'client_apex_02',
      clientName: 'DLF CyberCity Developers',
      siteId: 'site_apex_02',
      siteCode: 'REX-SITE-0002',
      siteName: 'CyberCity Tower 9 Security Post',
      designation: 'Patrol Officer',
      shiftId: `shift_${companyId}_mrn`,
      shiftName: 'Morning Guard Shift',
      dutyDate: todayStr,
      dutyStartTime: '06:00',
      dutyEndTime: '14:00',
      reportingSupervisorName: 'Dharamveer Khatri',
      status: 'completed',
      createdAt: `${todayStr}T00:00:00.000Z`,
    },
    {
      id: `rst_seed_03`,
      tenantId,
      companyId,
      employeeId: 'emp_apex_04',
      employeeCode: 'HHR-EMP-000004',
      employeeName: 'Jaswinder Gill',
      clientId: 'client_apex_02',
      clientName: 'DLF CyberCity Developers',
      siteId: 'site_apex_02',
      siteCode: 'REX-SITE-0002',
      siteName: 'CyberCity Tower 9 Security Post',
      designation: 'Gate Controller',
      shiftId: `shift_${companyId}_evn`,
      shiftName: 'Evening Patrol Shift',
      dutyDate: todayStr,
      dutyStartTime: '14:00',
      dutyEndTime: '22:00',
      reportingSupervisorName: 'Dharamveer Khatri',
      status: 'scheduled',
      createdAt: `${todayStr}T00:00:00.000Z`,
    },
  ];
}

export function getInitialAttendanceRecords(companyId: string, tenantId: string): AttendanceRecord[] {
  const todayStr = new Date().toISOString().split('T')[0];
  return [
    {
      id: `att_seed_01`,
      tenantId,
      companyId,
      employeeId: 'emp_apex_01',
      employeeCode: 'HHR-EMP-000001',
      employeeName: 'Surender Pal Singh',
      clientId: 'client_apex_01',
      clientName: 'Infosys Horizon Tech Park',
      siteId: 'site_apex_01',
      siteCode: 'REX-SITE-0001',
      siteName: 'Horizon Tech Park - Campus Gate 1 & 2',
      shiftId: `shift_${companyId}_mrn`,
      shiftName: 'Morning Guard Shift',
      attendanceDate: todayStr,
      checkInAt: `${todayStr}T06:05:00.000Z`,
      checkInGps: {
        lat: 12.8453,
        lng: 77.6603,
        accuracy: 6,
        distanceMeters: 18,
        withinGeofence: true,
      },
      checkInVerificationMethod: 'GPS_QR',
      checkInQrToken: 'HHR-QR-VERIF-INF001-A92B',
      attendanceStatus: 'present',
      locationStatus: 'verified',
      lateMinutes: 0,
      earlyLeavingMinutes: 0,
      scheduledDurationHours: 8,
      actualDurationHours: 0,
      breakDurationMinutes: 45,
      netDurationHours: 0,
      overtimeHours: 0,
      isOvertime: false,
      isDoubleDuty: false,
      approvalStatus: 'auto_approved',
      exceptions: [],
      createdAt: `${todayStr}T06:05:00.000Z`,
    },
    {
      id: `att_seed_02`,
      tenantId,
      companyId,
      employeeId: 'emp_apex_02',
      employeeCode: 'HHR-EMP-000002',
      employeeName: 'Dharamveer Khatri',
      clientId: 'client_apex_02',
      clientName: 'DLF CyberCity Developers',
      siteId: 'site_apex_02',
      siteCode: 'REX-SITE-0002',
      siteName: 'CyberCity Tower 9 Security Post',
      shiftId: `shift_${companyId}_mrn`,
      shiftName: 'Morning Guard Shift',
      attendanceDate: todayStr,
      checkInAt: `${todayStr}T06:35:00.000Z`,
      checkInGps: {
        lat: 28.4988,
        lng: 77.0879,
        accuracy: 9,
        distanceMeters: 24,
        withinGeofence: true,
      },
      checkInVerificationMethod: 'GPS',
      attendanceStatus: 'late',
      locationStatus: 'verified',
      lateMinutes: 20,
      earlyLeavingMinutes: 0,
      scheduledDurationHours: 8,
      actualDurationHours: 0,
      breakDurationMinutes: 45,
      netDurationHours: 0,
      overtimeHours: 0,
      isOvertime: false,
      isDoubleDuty: false,
      approvalStatus: 'auto_approved',
      exceptions: ['Late arrival by 20 minutes'],
      createdAt: `${todayStr}T06:35:00.000Z`,
    },
    {
      id: `att_seed_03`,
      tenantId,
      companyId,
      employeeId: 'emp_apex_03',
      employeeCode: 'HHR-EMP-000003',
      employeeName: 'Balwant Singh Rawat',
      clientId: 'client_apex_01',
      clientName: 'Infosys Horizon Tech Park',
      siteId: 'site_apex_01',
      siteCode: 'REX-SITE-0001',
      siteName: 'Horizon Tech Park - Campus Gate 1 & 2',
      shiftId: `shift_${companyId}_mrn`,
      shiftName: 'Morning Guard Shift',
      attendanceDate: todayStr,
      checkInAt: `${todayStr}T05:55:00.000Z`,
      checkOutAt: `${todayStr}T14:15:00.000Z`,
      checkInGps: {
        lat: 12.8452,
        lng: 77.6601,
        accuracy: 7,
        distanceMeters: 12,
        withinGeofence: true,
      },
      checkInVerificationMethod: 'GPS_QR',
      checkOutVerificationMethod: 'GPS',
      attendanceStatus: 'present',
      locationStatus: 'verified',
      lateMinutes: 0,
      earlyLeavingMinutes: 0,
      scheduledDurationHours: 8,
      actualDurationHours: 8.33,
      breakDurationMinutes: 45,
      netDurationHours: 7.58,
      overtimeHours: 0,
      isOvertime: false,
      isDoubleDuty: false,
      approvalStatus: 'auto_approved',
      exceptions: [],
      createdAt: `${todayStr}T05:55:00.000Z`,
    },
    {
      id: `att_seed_04`,
      tenantId,
      companyId,
      employeeId: 'emp_apex_05',
      employeeCode: 'HHR-EMP-000005',
      employeeName: 'Ratan Lal Meena',
      clientId: 'client_apex_01',
      clientName: 'Infosys Horizon Tech Park',
      siteId: 'site_apex_01',
      siteCode: 'REX-SITE-0001',
      siteName: 'Horizon Tech Park - Campus Gate 1 & 2',
      shiftId: `shift_${companyId}_mrn`,
      shiftName: 'Morning Guard Shift',
      attendanceDate: todayStr,
      checkInAt: `${todayStr}T06:12:00.000Z`,
      checkInGps: {
        lat: 12.8475,
        lng: 77.6625,
        accuracy: 14,
        distanceMeters: 310,
        withinGeofence: false,
      },
      checkInVerificationMethod: 'GPS',
      attendanceStatus: 'present',
      locationStatus: 'outside_geofence',
      lateMinutes: 0,
      earlyLeavingMinutes: 0,
      scheduledDurationHours: 8,
      actualDurationHours: 0,
      breakDurationMinutes: 45,
      netDurationHours: 0,
      overtimeHours: 0,
      isOvertime: false,
      isDoubleDuty: false,
      approvalStatus: 'pending',
      exceptions: ['Outside geofence (310m from perimeter)'],
      createdAt: `${todayStr}T06:12:00.000Z`,
    },
  ];
}

export function getInitialOvertimeRequests(companyId: string, tenantId: string): OvertimeRequest[] {
  const todayStr = new Date().toISOString().split('T')[0];
  return [
    {
      id: `ot_seed_01`,
      tenantId,
      companyId,
      employeeId: 'emp_apex_01',
      employeeCode: 'HHR-EMP-000001',
      employeeName: 'Surender Pal Singh',
      siteId: 'site_apex_01',
      siteName: 'Horizon Tech Park - Campus Gate 1 & 2',
      dutyDate: todayStr,
      shiftId: `shift_${companyId}_mrn`,
      shiftName: 'Morning Guard Shift',
      scheduledHours: 8,
      actualHours: 10.5,
      requestedOtHours: 2.5,
      approvedOtHours: 2.5,
      otType: 'regular_ot',
      status: 'pending',
      reason: 'Extended VIP ministerial escort coverage at Main Gate post.',
      createdAt: `${todayStr}T07:00:00.000Z`,
    },
  ];
}

export function getInitialCorrections(companyId: string, tenantId: string): MissingPunchCorrection[] {
  const todayStr = new Date().toISOString().split('T')[0];
  return [
    {
      id: `corr_seed_01`,
      tenantId,
      companyId,
      employeeId: 'emp_apex_04',
      employeeCode: 'HHR-EMP-000004',
      employeeName: 'Jaswinder Gill',
      siteId: 'site_apex_02',
      siteName: 'CyberCity Tower 9 Security Post',
      attendanceDate: todayStr,
      correctionType: 'qr_failure',
      requestedCheckIn: '14:00',
      requestedCheckOut: '22:00',
      reason: 'Tower 9 rear boom gate camera lens cracked; could not scan physical QR code. Guard reported in physical security muster.',
      supervisorStatus: 'pending',
      hrStatus: 'pending',
      createdAt: `${todayStr}T07:15:00.000Z`,
    },
  ];
}

// ==========================================
// 1. Shift Management Service
// ==========================================

export async function getCompanyShifts(companyId: string, tenantId: string = 'TEN-001'): Promise<ShiftDefinition[]> {
  const collectionPath = `companies/${companyId}/shifts`;
  try {
    const snap = await getDocs(collection(db, collectionPath));
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ShiftDefinition));
      shiftsCache.set(companyId, list);
      return list;
    }
  } catch (err) {
    console.warn('[Happiiz HR] Cloud fetch for shifts, falling back to cache:', err);
  }

  if (!shiftsCache.has(companyId)) {
    shiftsCache.set(companyId, getInitialShifts(companyId, tenantId));
  }
  return shiftsCache.get(companyId) || [];
}

export async function saveCompanyShift(companyId: string, shift: ShiftDefinition): Promise<void> {
  const docPath = `companies/${companyId}/shifts/${shift.id}`;
  try {
    await setDoc(doc(db, `companies/${companyId}/shifts`, shift.id), shift);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }

  const list = shiftsCache.get(companyId) || [];
  const idx = list.findIndex((s) => s.id === shift.id);
  if (idx >= 0) {
    list[idx] = shift;
  } else {
    list.push(shift);
  }
  shiftsCache.set(companyId, [...list]);
}

export async function deleteCompanyShift(companyId: string, shiftId: string): Promise<void> {
  const docPath = `companies/${companyId}/shifts/${shiftId}`;
  try {
    await deleteDoc(doc(db, `companies/${companyId}/shifts`, shiftId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
  const list = shiftsCache.get(companyId) || [];
  shiftsCache.set(companyId, list.filter((s) => s.id !== shiftId));
}

// ==========================================
// 2. Duty Roster Management Service
// ==========================================

export async function getCompanyDutyRosters(
  companyId: string,
  filters?: { date?: string; siteId?: string; employeeId?: string; status?: string }
): Promise<DutyRoster[]> {
  const collectionPath = `companies/${companyId}/rosters`;
  let result: DutyRoster[] = [];

  try {
    const snap = await getDocs(collection(db, collectionPath));
    if (!snap.empty) {
      result = snap.docs.map((d) => ({ ...d.data(), id: d.id } as DutyRoster));
      rostersCache.set(companyId, result);
    }
  } catch (err) {
    console.warn('[Happiiz HR] Cloud fetch for rosters, falling back to cache:', err);
  }

  if (result.length === 0 && rostersCache.has(companyId)) {
    result = rostersCache.get(companyId) || [];
  }

  if (result.length === 0) {
    result = getInitialDutyRosters(companyId, 'TEN-SEC-8921');
    rostersCache.set(companyId, result);
  }

  // Filter application
  if (filters?.date) {
    result = result.filter((r) => r.dutyDate === filters.date);
  }
  if (filters?.siteId && filters.siteId !== 'all') {
    result = result.filter((r) => r.siteId === filters.siteId);
  }
  if (filters?.employeeId) {
    result = result.filter((r) => r.employeeId === filters.employeeId);
  }
  if (filters?.status && filters.status !== 'all') {
    result = result.filter((r) => r.status === filters.status);
  }

  return result;
}

export async function saveDutyRoster(companyId: string, roster: DutyRoster): Promise<void> {
  const docPath = `companies/${companyId}/rosters/${roster.id}`;
  try {
    await setDoc(doc(db, `companies/${companyId}/rosters`, roster.id), roster);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }

  const list = rostersCache.get(companyId) || [];
  const idx = list.findIndex((r) => r.id === roster.id);
  if (idx >= 0) {
    list[idx] = roster;
  } else {
    list.push(roster);
  }
  rostersCache.set(companyId, [...list]);
}

export async function bulkCreateDutyRosters(companyId: string, rosters: DutyRoster[]): Promise<void> {
  for (const r of rosters) {
    await saveDutyRoster(companyId, r);
  }
}

export async function deleteDutyRoster(companyId: string, rosterId: string): Promise<void> {
  const docPath = `companies/${companyId}/rosters/${rosterId}`;
  try {
    await deleteDoc(doc(db, `companies/${companyId}/rosters`, rosterId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
  const list = rostersCache.get(companyId) || [];
  rostersCache.set(companyId, list.filter((r) => r.id !== rosterId));
}

// ==========================================
// 3. Attendance Recording, GPS & QR Verification
// ==========================================

export async function getCompanyAttendanceRecords(
  companyId: string,
  filters?: {
    date?: string;
    siteId?: string;
    employeeId?: string;
    status?: string;
    verificationStatus?: string;
  }
): Promise<AttendanceRecord[]> {
  const collectionPath = `companies/${companyId}/attendance`;
  let result: AttendanceRecord[] = [];

  try {
    const snap = await getDocs(collection(db, collectionPath));
    if (!snap.empty) {
      result = snap.docs.map((d) => ({ ...d.data(), id: d.id } as AttendanceRecord));
      attendanceCache.set(companyId, result);
    }
  } catch (err) {
    console.warn('[Happiiz HR] Cloud fetch for attendance, falling back to cache:', err);
  }

  if (result.length === 0 && attendanceCache.has(companyId)) {
    result = attendanceCache.get(companyId) || [];
  }

  if (result.length === 0) {
    result = getInitialAttendanceRecords(companyId, 'TEN-SEC-8921');
    attendanceCache.set(companyId, result);
  }

  if (filters?.date) {
    result = result.filter((a) => a.attendanceDate === filters.date);
  }
  if (filters?.siteId && filters.siteId !== 'all') {
    result = result.filter((a) => a.siteId === filters.siteId);
  }
  if (filters?.employeeId) {
    result = result.filter((a) => a.employeeId === filters.employeeId);
  }
  if (filters?.status && filters.status !== 'all') {
    result = result.filter((a) => a.attendanceStatus === filters.status);
  }
  if (filters?.verificationStatus && filters.verificationStatus !== 'all') {
    result = result.filter((a) => a.approvalStatus === filters.verificationStatus);
  }

  return result.sort((a, b) => (b.checkInAt || '').localeCompare(a.checkInAt || ''));
}

export interface CheckInPayload {
  employee: Employee;
  site: ClientSite;
  shift: ShiftDefinition;
  gpsCoords?: { lat: number; lng: number; accuracy: number };
  qrToken?: string;
  verificationMethod: 'GPS' | 'QR' | 'GPS_QR' | 'SUPERVISOR' | 'MANUAL';
  deviceInfo?: string;
}

export async function recordEmployeeCheckIn(
  companyId: string,
  payload: CheckInPayload
): Promise<{ success: boolean; record: AttendanceRecord; message: string }> {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const isoTime = now.toISOString();

  // 1. Prevent duplicate check-in for the same employee, site and shift today
  const existing = await getCompanyAttendanceRecords(companyId, {
    date: dateStr,
    employeeId: payload.employee.id,
  });

  const duplicate = existing.find(
    (e) => e.shiftId === payload.shift.id && (e.checkInAt || e.attendanceStatus === 'present')
  );
  if (duplicate) {
    throw new Error(
      `Check-in already recorded for ${payload.employee.fullName} on ${payload.shift.shiftName} today.`
    );
  }

  // 2. Geofence verification
  let locationStatus: AttendanceRecord['locationStatus'] = 'gps_unavailable';
  let distanceMeters = 0;
  let withinGeofence = false;

  if (payload.gpsCoords && payload.site.latitude && payload.site.longitude) {
    const geo = evaluateGeofence(
      payload.gpsCoords.lat,
      payload.gpsCoords.lng,
      payload.site.latitude,
      payload.site.longitude,
      150 // Permitted 150m boundary
    );
    withinGeofence = geo.withinGeofence;
    distanceMeters = geo.distanceMeters;
    locationStatus = withinGeofence ? 'verified' : 'outside_geofence';
  } else if (!payload.gpsCoords) {
    locationStatus = 'permission_denied';
  }

  // 3. QR Verification
  if (payload.qrToken) {
    const expectedToken = payload.site.qrVerificationToken || `HAPPIIZ-SITE-QR-${payload.site.siteCode}`;
    if (payload.qrToken !== expectedToken && !payload.qrToken.includes(payload.site.siteCode)) {
      throw new Error('Invalid site QR code scanned. Please scan the official QR placed at this site.');
    }
  }

  // 4. Late Arrival calculation
  // Parse shift start time (e.g. "06:00")
  const [shiftHours, shiftMins] = payload.shift.startTime.split(':').map(Number);
  const shiftStartDate = new Date(now);
  shiftStartDate.setHours(shiftHours, shiftMins, 0, 0);

  const graceEndDate = new Date(shiftStartDate.getTime() + payload.shift.gracePeriodMinutes * 60000);
  let lateMinutes = 0;
  const exceptions: string[] = [];

  if (now > graceEndDate) {
    lateMinutes = Math.round((now.getTime() - shiftStartDate.getTime()) / 60000);
    exceptions.push(`Late arrival by ${lateMinutes} minutes`);
  }

  if (locationStatus === 'outside_geofence') {
    exceptions.push(`Outside geofence (${distanceMeters}m from site perimeter)`);
  }

  const recordId = `att_${payload.employee.id}_${dateStr}_${Date.now()}`;
  const record: AttendanceRecord = {
    id: recordId,
    tenantId: payload.employee.tenantId,
    companyId,
    employeeId: payload.employee.id,
    employeeCode: payload.employee.employeeCode,
    employeeName: payload.employee.fullName,
    clientId: payload.site.clientId,
    clientName: payload.site.clientName,
    siteId: payload.site.id,
    siteCode: payload.site.siteCode,
    siteName: payload.site.siteName,
    shiftId: payload.shift.id,
    shiftName: payload.shift.shiftName,
    attendanceDate: dateStr,
    checkInAt: isoTime,
    checkInGps: payload.gpsCoords
      ? {
          lat: payload.gpsCoords.lat,
          lng: payload.gpsCoords.lng,
          accuracy: payload.gpsCoords.accuracy,
          distanceMeters,
          withinGeofence,
        }
      : undefined,
    checkInVerificationMethod: payload.verificationMethod,
    checkInQrToken: payload.qrToken,
    attendanceStatus: lateMinutes > 0 ? 'late' : 'present',
    locationStatus,
    lateMinutes,
    earlyLeavingMinutes: 0,
    scheduledDurationHours: 8,
    actualDurationHours: 0,
    breakDurationMinutes: payload.shift.breakDurationMinutes,
    netDurationHours: 0,
    overtimeHours: 0,
    isOvertime: false,
    isDoubleDuty: false,
    approvalStatus: locationStatus === 'outside_geofence' ? 'pending' : 'auto_approved',
    exceptions,
    createdAt: isoTime,
  };

  // Write record
  const docPath = `companies/${companyId}/attendance/${record.id}`;
  try {
    await setDoc(doc(db, `companies/${companyId}/attendance`, record.id), record);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }

  // Update local cache
  const list = attendanceCache.get(companyId) || [];
  attendanceCache.set(companyId, [record, ...list]);

  // Log audit event
  const eventId = `evt_${Date.now()}`;
  const attEvent: AttendanceEvent = {
    id: eventId,
    tenantId: payload.employee.tenantId,
    companyId,
    attendanceId: record.id,
    employeeId: payload.employee.id,
    eventType: 'check_in',
    timestamp: isoTime,
    gps: payload.gpsCoords,
    deviceInfo: payload.deviceInfo || 'Standard Mobile Browser',
    recordedBy: payload.employee.fullName,
  };
  const eventDocPath = `companies/${companyId}/attendanceEvents/${eventId}`;
  try {
    await setDoc(doc(db, `companies/${companyId}/attendanceEvents`, eventId), attEvent);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, eventDocPath);
  }

  return {
    success: true,
    record,
    message:
      lateMinutes > 0
        ? `Check-in recorded (Late by ${lateMinutes} mins). Verified via ${payload.verificationMethod}.`
        : `Check-in successful at ${payload.site.siteName}!`,
  };
}

export async function recordEmployeeCheckOut(
  companyId: string,
  attendanceId: string,
  gpsCoords?: { lat: number; lng: number; accuracy: number },
  verificationMethod: 'GPS' | 'QR' | 'GPS_QR' | 'SUPERVISOR' | 'MANUAL' = 'GPS'
): Promise<{ success: boolean; record: AttendanceRecord; message: string }> {
  const list = attendanceCache.get(companyId) || [];
  let record = list.find((a) => a.id === attendanceId);

  if (!record) {
    try {
      const snap = await getDoc(doc(db, `companies/${companyId}/attendance`, attendanceId));
      if (snap.exists()) {
        record = { ...snap.data(), id: snap.id } as AttendanceRecord;
      }
    } catch (err) {
      console.warn('Failed to fetch attendance for checkout:', err);
    }
  }

  if (!record) {
    throw new Error('Attendance check-in record not found.');
  }

  if (record.checkOutAt) {
    throw new Error('Check-out already completed for this shift.');
  }

  const now = new Date();
  const checkOutIso = now.toISOString();
  const checkInTime = new Date(record.checkInAt || record.createdAt).getTime();
  const actualDurationMs = now.getTime() - checkInTime;
  const actualDurationHours = Number((actualDurationMs / 3600000).toFixed(2));
  const breakHours = (record.breakDurationMinutes || 0) / 60;
  const netDurationHours = Math.max(0, Number((actualDurationHours - breakHours).toFixed(2)));

  // Calculate overtime
  const scheduledHours = record.scheduledDurationHours || 8;
  let overtimeHours = 0;
  let isOvertime = false;
  if (netDurationHours > scheduledHours) {
    overtimeHours = Number((netDurationHours - scheduledHours).toFixed(2));
    isOvertime = overtimeHours >= 0.5; // At least 30 mins for OT consideration
  }

  const updatedRecord: AttendanceRecord = {
    ...record,
    checkOutAt: checkOutIso,
    checkOutVerificationMethod: verificationMethod,
    actualDurationHours,
    netDurationHours,
    overtimeHours,
    isOvertime,
    checkOutGps: gpsCoords
      ? {
          lat: gpsCoords.lat,
          lng: gpsCoords.lng,
          accuracy: gpsCoords.accuracy,
          distanceMeters: 0,
          withinGeofence: true,
        }
      : undefined,
    updatedAt: checkOutIso,
  };

  const docPath = `companies/${companyId}/attendance/${attendanceId}`;
  try {
    await updateDoc(doc(db, `companies/${companyId}/attendance`, attendanceId), {
      checkOutAt: checkOutIso,
      checkOutVerificationMethod: verificationMethod,
      actualDurationHours,
      netDurationHours,
      overtimeHours,
      isOvertime,
      updatedAt: checkOutIso,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, docPath);
  }

  const idx = list.findIndex((a) => a.id === attendanceId);
  if (idx >= 0) {
    list[idx] = updatedRecord;
    attendanceCache.set(companyId, [...list]);
  }

  return {
    success: true,
    record: updatedRecord,
    message: `Check-out successful. Total Net Duty: ${netDurationHours} hrs ${
      isOvertime ? `(Includes ${overtimeHours} hrs OT)` : ''
    }.`,
  };
}

export async function recordManualAttendance(
  companyId: string,
  record: AttendanceRecord
): Promise<void> {
  const docPath = `companies/${companyId}/attendance/${record.id}`;
  try {
    await setDoc(doc(db, `companies/${companyId}/attendance`, record.id), record);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }

  const list = attendanceCache.get(companyId) || [];
  const idx = list.findIndex((a) => a.id === record.id);
  if (idx >= 0) {
    list[idx] = record;
  } else {
    list.unshift(record);
  }
  attendanceCache.set(companyId, [...list]);
}

export async function approveAttendanceRecord(
  companyId: string,
  attendanceId: string,
  approverName: string,
  remarks?: string
): Promise<void> {
  const docPath = `companies/${companyId}/attendance/${attendanceId}`;
  const now = new Date().toISOString();
  try {
    await updateDoc(doc(db, `companies/${companyId}/attendance`, attendanceId), {
      approvalStatus: 'approved',
      verifiedByName: approverName,
      verifiedAt: now,
      remarks: remarks || 'Verified by Site Supervisor',
      updatedAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, docPath);
  }

  const list = attendanceCache.get(companyId) || [];
  const idx = list.findIndex((a) => a.id === attendanceId);
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      approvalStatus: 'approved',
      verifiedByName: approverName,
      verifiedAt: now,
      remarks: remarks || 'Verified by Site Supervisor',
      updatedAt: now,
    };
    attendanceCache.set(companyId, [...list]);
  }
}

// ==========================================
// 4. Overtime Management
// ==========================================

export async function getOvertimeRequests(companyId: string): Promise<OvertimeRequest[]> {
  const collectionPath = `companies/${companyId}/overtimeRequests`;
  try {
    const snap = await getDocs(collection(db, collectionPath));
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as OvertimeRequest));
      overtimeCache.set(companyId, list);
      return list;
    }
  } catch (err) {
    console.warn('Cloud fetch for overtime requests:', err);
  }
  if (!overtimeCache.has(companyId) || (overtimeCache.get(companyId) || []).length === 0) {
    overtimeCache.set(companyId, getInitialOvertimeRequests(companyId, 'TEN-SEC-8921'));
  }
  return overtimeCache.get(companyId) || [];
}

export async function submitOvertimeRequest(
  companyId: string,
  req: OvertimeRequest
): Promise<void> {
  const docPath = `companies/${companyId}/overtimeRequests/${req.id}`;
  try {
    await setDoc(doc(db, `companies/${companyId}/overtimeRequests`, req.id), req);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }

  const list = overtimeCache.get(companyId) || [];
  list.unshift(req);
  overtimeCache.set(companyId, [...list]);
}

export async function updateOvertimeStatus(
  companyId: string,
  requestId: string,
  status: 'verified_by_supervisor' | 'approved_by_hr' | 'rejected',
  approvedHours: number,
  reviewerName: string,
  remarks?: string
): Promise<void> {
  const docPath = `companies/${companyId}/overtimeRequests/${requestId}`;
  const now = new Date().toISOString();
  try {
    await updateDoc(doc(db, `companies/${companyId}/overtimeRequests`, requestId), {
      status,
      approvedOtHours: approvedHours,
      supervisorRemarks: remarks,
      updatedAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, docPath);
  }

  const list = overtimeCache.get(companyId) || [];
  const idx = list.findIndex((o) => o.id === requestId);
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      status,
      approvedOtHours: approvedHours,
      supervisorRemarks: remarks,
      updatedAt: now,
    };
    overtimeCache.set(companyId, [...list]);
  }
}

// ==========================================
// 5. Double Duty Management
// ==========================================

export async function getDoubleDutyRecords(companyId: string): Promise<DoubleDutyRecord[]> {
  const collectionPath = `companies/${companyId}/doubleDutyRecords`;
  try {
    const snap = await getDocs(collection(db, collectionPath));
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as DoubleDutyRecord));
      doubleDutyCache.set(companyId, list);
      return list;
    }
  } catch (err) {
    console.warn('Cloud fetch for double duty records:', err);
  }
  return doubleDutyCache.get(companyId) || [];
}

export async function saveDoubleDutyRecord(
  companyId: string,
  record: DoubleDutyRecord
): Promise<void> {
  const docPath = `companies/${companyId}/doubleDutyRecords/${record.id}`;
  try {
    await setDoc(doc(db, `companies/${companyId}/doubleDutyRecords`, record.id), record);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }

  const list = doubleDutyCache.get(companyId) || [];
  list.unshift(record);
  doubleDutyCache.set(companyId, [...list]);
}

// ==========================================
// 6. Holidays & Weekly Off
// ==========================================

export async function getCompanyHolidays(companyId: string, tenantId: string = 'TEN-001'): Promise<CompanyHoliday[]> {
  const collectionPath = `companies/${companyId}/holidays`;
  try {
    const snap = await getDocs(collection(db, collectionPath));
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as CompanyHoliday));
      holidaysCache.set(companyId, list);
      return list;
    }
  } catch (err) {
    console.warn('Cloud fetch for holidays:', err);
  }

  if (!holidaysCache.has(companyId)) {
    holidaysCache.set(companyId, getInitialHolidays(companyId, tenantId));
  }
  return holidaysCache.get(companyId) || [];
}

export async function saveCompanyHoliday(companyId: string, holiday: CompanyHoliday): Promise<void> {
  const docPath = `companies/${companyId}/holidays/${holiday.id}`;
  try {
    await setDoc(doc(db, `companies/${companyId}/holidays`, holiday.id), holiday);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }

  const list = holidaysCache.get(companyId) || [];
  const idx = list.findIndex((h) => h.id === holiday.id);
  if (idx >= 0) {
    list[idx] = holiday;
  } else {
    list.push(holiday);
  }
  holidaysCache.set(companyId, [...list]);
}

export async function getWeeklyOffPolicies(companyId: string, tenantId: string = 'TEN-001'): Promise<WeeklyOffPolicy[]> {
  const collectionPath = `companies/${companyId}/weeklyOffPolicies`;
  try {
    const snap = await getDocs(collection(db, collectionPath));
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as WeeklyOffPolicy));
      weeklyOffCache.set(companyId, list);
      return list;
    }
  } catch (err) {
    console.warn('Cloud fetch for weekly off:', err);
  }

  if (!weeklyOffCache.has(companyId)) {
    weeklyOffCache.set(companyId, getInitialWeeklyOffPolicies(companyId, tenantId));
  }
  return weeklyOffCache.get(companyId) || [];
}

export async function saveWeeklyOffPolicy(companyId: string, policy: WeeklyOffPolicy): Promise<void> {
  const docPath = `companies/${companyId}/weeklyOffPolicies/${policy.id}`;
  try {
    await setDoc(doc(db, `companies/${companyId}/weeklyOffPolicies`, policy.id), policy);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }

  const list = weeklyOffCache.get(companyId) || [];
  const idx = list.findIndex((w) => w.id === policy.id);
  if (idx >= 0) {
    list[idx] = policy;
  } else {
    list.push(policy);
  }
  weeklyOffCache.set(companyId, [...list]);
}

// ==========================================
// 7. Missing Punch & Regularization
// ==========================================

export async function getMissingPunchCorrections(companyId: string): Promise<MissingPunchCorrection[]> {
  const collectionPath = `companies/${companyId}/attendanceCorrections`;
  try {
    const snap = await getDocs(collection(db, collectionPath));
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as MissingPunchCorrection));
      correctionsCache.set(companyId, list);
      return list;
    }
  } catch (err) {
    console.warn('Cloud fetch for corrections:', err);
  }
  if (!correctionsCache.has(companyId) || (correctionsCache.get(companyId) || []).length === 0) {
    correctionsCache.set(companyId, getInitialCorrections(companyId, 'TEN-SEC-8921'));
  }
  return correctionsCache.get(companyId) || [];
}

export async function submitMissingPunchCorrection(
  companyId: string,
  correction: MissingPunchCorrection
): Promise<void> {
  const docPath = `companies/${companyId}/attendanceCorrections/${correction.id}`;
  try {
    await setDoc(doc(db, `companies/${companyId}/attendanceCorrections`, correction.id), correction);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }

  const list = correctionsCache.get(companyId) || [];
  list.unshift(correction);
  correctionsCache.set(companyId, [...list]);
}

export async function updateCorrectionStatus(
  companyId: string,
  correctionId: string,
  level: 'supervisor' | 'hr',
  status: 'verified' | 'approved' | 'rejected',
  actorName: string,
  remarks?: string
): Promise<void> {
  const docPath = `companies/${companyId}/attendanceCorrections/${correctionId}`;
  const now = new Date().toISOString();
  const updatePayload: Record<string, any> = { resolvedAt: now };

  if (level === 'supervisor') {
    updatePayload.supervisorStatus = status;
    updatePayload.supervisorRemarks = remarks;
    updatePayload.verifiedBySupervisor = actorName;
  } else {
    updatePayload.hrStatus = status;
    updatePayload.hrRemarks = remarks;
    updatePayload.approvedByHr = actorName;
  }

  try {
    await updateDoc(doc(db, `companies/${companyId}/attendanceCorrections`, correctionId), updatePayload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, docPath);
  }

  const list = correctionsCache.get(companyId) || [];
  const idx = list.findIndex((c) => c.id === correctionId);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...updatePayload };
    correctionsCache.set(companyId, [...list]);
  }
}

// ==========================================
// 8. Attendance Period Finalization & Payroll-Ready Aggregator
// ==========================================

export async function getAttendancePeriods(companyId: string): Promise<AttendancePeriodFinalization[]> {
  const collectionPath = `companies/${companyId}/attendancePeriods`;
  try {
    const snap = await getDocs(collection(db, collectionPath));
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as AttendancePeriodFinalization));
      periodsCache.set(companyId, list);
      return list;
    }
  } catch (err) {
    console.warn('Cloud fetch for attendance periods:', err);
  }
  return periodsCache.get(companyId) || [];
}

export async function finalizeAttendancePeriod(
  companyId: string,
  period: AttendancePeriodFinalization
): Promise<void> {
  const docPath = `companies/${companyId}/attendancePeriods/${period.id}`;
  try {
    await setDoc(doc(db, `companies/${companyId}/attendancePeriods`, period.id), period);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }

  const list = periodsCache.get(companyId) || [];
  const idx = list.findIndex((p) => p.id === period.id);
  if (idx >= 0) {
    list[idx] = period;
  } else {
    list.unshift(period);
  }
  periodsCache.set(companyId, [...list]);
}

export async function reopenAttendancePeriod(
  companyId: string,
  periodId: string,
  reopenedBy: string,
  remarks: string
): Promise<void> {
  const docPath = `companies/${companyId}/attendancePeriods/${periodId}`;
  const now = new Date().toISOString();
  try {
    await updateDoc(doc(db, `companies/${companyId}/attendancePeriods`, periodId), {
      status: 'reopened',
      reopenedBy,
      reopenedAt: now,
      remarks,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, docPath);
  }

  const list = periodsCache.get(companyId) || [];
  const idx = list.findIndex((p) => p.id === periodId);
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      status: 'reopened',
      reopenedBy,
      reopenedAt: now,
      remarks,
    };
    periodsCache.set(companyId, [...list]);
  }
}

export async function generatePayrollReadySummary(
  companyId: string,
  tenantId: string,
  period: string, // e.g. "2026-11"
  employees: Employee[],
  records: AttendanceRecord[],
  otRequests: OvertimeRequest[],
  doubleDuties: DoubleDutyRecord[]
): Promise<PayrollReadyAttendanceSummary[]> {
  const summary: PayrollReadyAttendanceSummary[] = [];

  for (const emp of employees) {
    const empRecords = records.filter(
      (r) => r.employeeId === emp.id && r.attendanceDate.startsWith(period)
    );
    const empOts = otRequests.filter(
      (o) =>
        o.employeeId === emp.id &&
        o.dutyDate.startsWith(period) &&
        o.status === 'approved_by_hr'
    );
    const empDoubleDuties = doubleDuties.filter(
      (d) =>
        d.employeeId === emp.id &&
        d.dutyDate.startsWith(period) &&
        d.status === 'approved'
    );

    const presentDays = empRecords.filter((r) => r.attendanceStatus === 'present' || r.attendanceStatus === 'late').length;
    const halfDays = empRecords.filter((r) => r.attendanceStatus === 'half_day').length;
    const absentDays = empRecords.filter((r) => r.attendanceStatus === 'absent').length;
    const leaveDays = empRecords.filter((r) => r.attendanceStatus === 'on_leave').length;
    const weeklyOffDays = empRecords.filter((r) => r.attendanceStatus === 'weekly_off').length;
    const holidayDutyDays = empRecords.filter((r) => r.attendanceStatus === 'holiday').length;

    const regularHours = empRecords.reduce((acc, curr) => acc + (curr.netDurationHours || 0), 0);
    const approvedOtHours = empOts.reduce((acc, curr) => acc + (curr.approvedOtHours || 0), 0);
    const lateMinutes = empRecords.reduce((acc, curr) => acc + (curr.lateMinutes || 0), 0);
    const earlyLeavingMinutes = empRecords.reduce((acc, curr) => acc + (curr.earlyLeavingMinutes || 0), 0);

    summary.push({
      id: `sum_${emp.id}_${period}`,
      tenantId,
      companyId,
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: emp.fullName,
      designation: emp.designation,
      period,
      assignedSiteId: emp.assignedSite || 'site_main',
      assignedSiteName: emp.assignedSite || 'Primary Assignment',
      totalScheduledShifts: presentDays + halfDays + absentDays + leaveDays,
      presentDays,
      absentDays,
      halfDays,
      approvedLeaveDays: leaveDays,
      weeklyOffDays,
      holidayDutyDays,
      regularWorkingHours: Number(regularHours.toFixed(1)),
      approvedOvertimeHours: Number(approvedOtHours.toFixed(1)),
      approvedDoubleDutyCount: empDoubleDuties.length,
      lateMinutes,
      earlyLeavingMinutes,
      finalizationStatus: 'open',
      generatedAt: new Date().toISOString(),
    });
  }

  return summary;
}

// ==========================================
// 9. Auto Absent Detection Engine
// ==========================================

export async function runAutoAbsentDetection(
  companyId: string,
  targetDate: string
): Promise<{ absentCreated: number; candidates: AttendanceRecord[] }> {
  const rosters = await getCompanyDutyRosters(companyId, { date: targetDate });
  const attendance = await getCompanyAttendanceRecords(companyId, { date: targetDate });
  const holidays = await getCompanyHolidays(companyId);

  const isHoliday = holidays.some((h) => h.holidayDate === targetDate && h.status === 'active');
  const targetDayOfWeek = new Date(targetDate).getDay();

  const generatedAbsentRecords: AttendanceRecord[] = [];

  for (const roster of rosters) {
    if (roster.status === 'completed' || roster.status === 'cancelled') continue;

    // Check if employee has a record for this shift
    const record = attendance.find(
      (a) => a.employeeId === roster.employeeId && a.shiftId === roster.shiftId
    );

    if (!record) {
      // Determine if weekly off or holiday
      const status = isHoliday ? 'holiday' : targetDayOfWeek === 0 ? 'weekly_off' : 'absent';
      const newRecord: AttendanceRecord = {
        id: `att_absent_${roster.employeeId}_${targetDate}_${Date.now()}`,
        tenantId: roster.tenantId,
        companyId,
        employeeId: roster.employeeId,
        employeeCode: roster.employeeCode,
        employeeName: roster.employeeName,
        clientId: roster.clientId,
        clientName: roster.clientName,
        siteId: roster.siteId,
        siteCode: roster.siteCode,
        siteName: roster.siteName,
        shiftId: roster.shiftId,
        shiftName: roster.shiftName,
        rosterId: roster.id,
        attendanceDate: targetDate,
        checkInVerificationMethod: 'MANUAL',
        attendanceStatus: status,
        locationStatus: 'manual_required',
        lateMinutes: 0,
        earlyLeavingMinutes: 0,
        scheduledDurationHours: 8,
        actualDurationHours: 0,
        breakDurationMinutes: 0,
        netDurationHours: 0,
        overtimeHours: 0,
        isOvertime: false,
        isDoubleDuty: false,
        approvalStatus: 'pending',
        remarks: `Auto-generated by System Scheduler (No punch recorded by shift end).`,
        exceptions: [status === 'absent' ? 'missing_attendance' : 'scheduled_off'],
        createdAt: new Date().toISOString(),
      };

      await recordManualAttendance(companyId, newRecord);
      generatedAbsentRecords.push(newRecord);
    }
  }

  return {
    absentCreated: generatedAbsentRecords.length,
    candidates: generatedAbsentRecords,
  };
}
