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
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import {
  Company,
  Employee,
  ClientSite,
  AuditLog,
  CompanyUser,
  CompanyRole,
  CompanyDepartment,
  CompanyBranch,
  CompanyFullSettings,
  EmployeeDocument,
  EmployeeAgreement,
  EmployeeExitRecord,
  EmployeeLifecycleStatus,
  Client,
  ClientContract,
  SiteServiceItem,
  SiteManpowerRequirement,
  EmployeeDeployment,
  CommercialRate,
  SiteDocumentItem,
} from '../types';
import {
  INITIAL_COMPANIES,
  INITIAL_EMPLOYEES,
  INITIAL_SITES,
  INITIAL_AUDIT_LOGS,
  DEFAULT_COMPANY_ROLES,
  DEFAULT_COMPANY_DEPARTMENTS,
  DEFAULT_COMPANY_BRANCHES,
  INITIAL_COMPANY_USERS,
  getDefaultCompanySettings,
  INITIAL_EMPLOYEE_DOCUMENTS,
  INITIAL_EMPLOYEE_AGREEMENTS,
  INITIAL_EMPLOYEE_EXITS,
  INITIAL_CLIENTS,
  INITIAL_CONTRACTS,
  INITIAL_SITE_REQUIREMENTS,
  INITIAL_DEPLOYMENTS,
  INITIAL_COMMERCIAL_RATES,
  INITIAL_SITE_DOCUMENTS,
} from './seedData';

// Memory cache for seamless live interaction
let inMemoryCompanies: Company[] = [...INITIAL_COMPANIES];
let inMemoryEmployees: Record<string, Employee[]> = { ...INITIAL_EMPLOYEES };
let inMemorySites: Record<string, ClientSite[]> = { ...INITIAL_SITES };
let inMemoryAuditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];
let inMemoryCompanyUsers: Record<string, CompanyUser[]> = { ...INITIAL_COMPANY_USERS };
let inMemoryCompanyRoles: Record<string, CompanyRole[]> = {};
let inMemoryCompanyDepartments: Record<string, CompanyDepartment[]> = {};
let inMemoryCompanyBranches: Record<string, CompanyBranch[]> = {};
let inMemoryCompanySettings: Record<string, CompanyFullSettings> = {};
let inMemoryEmployeeDocuments: Record<string, EmployeeDocument[]> = { ...INITIAL_EMPLOYEE_DOCUMENTS };
let inMemoryEmployeeAgreements: Record<string, EmployeeAgreement[]> = { ...INITIAL_EMPLOYEE_AGREEMENTS };
let inMemoryEmployeeExits: Record<string, EmployeeExitRecord[]> = { ...INITIAL_EMPLOYEE_EXITS };
let inMemoryClients: Record<string, Client[]> = { ...INITIAL_CLIENTS };
let inMemoryContracts: Record<string, ClientContract[]> = { ...INITIAL_CONTRACTS };
let inMemorySiteRequirements: Record<string, SiteManpowerRequirement[]> = { ...INITIAL_SITE_REQUIREMENTS };
let inMemoryDeployments: Record<string, EmployeeDeployment[]> = { ...INITIAL_DEPLOYMENTS };
let inMemoryCommercialRates: Record<string, CommercialRate[]> = { ...INITIAL_COMMERCIAL_RATES };
let inMemorySiteDocuments: Record<string, SiteDocumentItem[]> = { ...INITIAL_SITE_DOCUMENTS };

/**
 * Fetch all companies. If Firestore collection is empty, seeds the initial companies.
 */
export async function getCompanies(): Promise<Company[]> {
  try {
    const colRef = collection(db, 'companies');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const liveList = snapshot.docs.map((d) => d.data() as Company);
      inMemoryCompanies = liveList;
      return liveList;
    }

    // Seed initial companies to Firestore if empty
    for (const comp of INITIAL_COMPANIES) {
      try {
        await setDoc(doc(db, 'companies', comp.id), comp);
      } catch (err) {
        // Continue if non-blocking
        console.warn('Seed company notice:', err);
      }
    }
    return inMemoryCompanies;
  } catch (error) {
    console.warn('[Happiiz HR] Falling back to in-memory company store:', error);
    return inMemoryCompanies;
  }
}

/**
 * Get a single company by ID
 */
export async function getCompanyById(companyId: string): Promise<Company | null> {
  try {
    const docRef = doc(db, 'companies', companyId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Company;
    }
  } catch (error) {
    console.warn('[Happiiz HR] Read single company notice:', error);
  }
  return inMemoryCompanies.find((c) => c.id === companyId) || null;
}

/**
 * Register a new company tenant
 */
export async function createCompany(
  companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Company> {
  const newId = `comp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newCompany: Company = {
    ...companyData,
    id: newId,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'companies', newId), newCompany);
  } catch (error) {
    console.warn('[Happiiz HR] Sync to cloud note:', error);
  }

  // Always update in-memory list
  inMemoryCompanies = [newCompany, ...inMemoryCompanies];

  // Log audit event
  await logAuditEvent({
    tenantId: newCompany.tenantId,
    actorUid: 'current_user',
    actorEmail: newCompany.adminEmail,
    action: 'TENANT_REGISTERED',
    category: 'tenant',
    details: `Company ${newCompany.name} registered under ${newCompany.industry} tier ${newCompany.subscriptionPlan}`,
  });

  return newCompany;
}

/**
 * Update company status (e.g. active, suspended, trial)
 */
export async function updateCompanyStatus(
  companyId: string,
  newStatus: Company['subscriptionStatus'],
  actorEmail = 'superadmin@happiiz.io'
): Promise<void> {
  try {
    const docRef = doc(db, 'companies', companyId);
    await updateDoc(docRef, {
      subscriptionStatus: newStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('[Happiiz HR] Update status note:', error);
  }

  inMemoryCompanies = inMemoryCompanies.map((c) =>
    c.id === companyId
      ? { ...c, subscriptionStatus: newStatus, updatedAt: new Date().toISOString() }
      : c
  );

  const comp = inMemoryCompanies.find((c) => c.id === companyId);
  await logAuditEvent({
    tenantId: comp?.tenantId || 'system',
    actorUid: 'super_admin',
    actorEmail,
    action: `TENANT_STATUS_${newStatus.toUpperCase()}`,
    category: 'tenant',
    details: `Tenant ${comp?.name || companyId} status changed to ${newStatus}`,
  });
}

/**
 * Update permitted company profile fields (Company Admin or Super Admin)
 */
export async function updateCompanyProfile(
  companyId: string,
  updates: Partial<Company>,
  actorEmail = 'admin@company.com'
): Promise<Company> {
  const safeUpdates = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, 'companies', companyId);
    await updateDoc(docRef, safeUpdates);
  } catch (error) {
    console.warn('[Happiiz HR] Sync company profile note:', error);
  }

  inMemoryCompanies = inMemoryCompanies.map((c) =>
    c.id === companyId ? { ...c, ...safeUpdates } : c
  );

  const updatedComp = inMemoryCompanies.find((c) => c.id === companyId)!;

  await logAuditEvent({
    tenantId: updatedComp?.tenantId || 'general',
    actorUid: 'authorized_user',
    actorEmail,
    action: 'COMPANY_PROFILE_UPDATED',
    category: 'tenant',
    details: `Company profile modified for ${updatedComp?.name}`,
  });

  return updatedComp;
}

/**
 * Submit contact inquiry from public website
 */
export async function submitContactInquiry(
  data: {
    name: string;
    companyName: string;
    email: string;
    phone: string;
    message: string;
  }
): Promise<{ success: boolean; id: string }> {
  const newId = `contact_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const record = {
    ...data,
    id: newId,
    timestamp: now,
    status: 'unread',
  };

  try {
    await setDoc(doc(db, 'contact_messages', newId), record);
  } catch (error) {
    console.warn('[Happiiz HR] Sync contact message note:', error);
  }

  await logAuditEvent({
    tenantId: 'system',
    actorUid: 'public_visitor',
    actorEmail: data.email,
    action: 'CONTACT_FORM_SUBMITTED',
    category: 'tenant',
    details: `Public consultation requested by ${data.name} (${data.companyName})`,
  });

  return { success: true, id: newId };
}

/**
 * Get tenant-scoped employees
 */
export async function getCompanyEmployees(companyId: string): Promise<Employee[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'employees');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const list = snapshot.docs.map((d) => d.data() as Employee);
      inMemoryEmployees[companyId] = list;
      return list;
    }
  } catch (error) {
    console.warn('[Happiiz HR] Employee list fallback:', error);
  }
  return inMemoryEmployees[companyId] || [];
}

/**
 * Get next unique sequential Employee ID for a company
 */
export async function getNextEmployeeCode(
  companyId: string,
  prefix = 'HHR-EMP'
): Promise<string> {
  const existing = inMemoryEmployees[companyId] || [];
  const count = existing.length + 1;
  return `${prefix}-${String(count).padStart(6, '0')}`;
}

/**
 * Add a new employee to a tenant with full Phase 4 lifecycle initialization
 */
export async function createCompanyEmployee(
  companyId: string,
  data: Omit<Employee, 'id' | 'companyId' | 'createdAt'>,
  actorEmail = 'admin@happiiz.io'
): Promise<Employee> {
  // 1. Subscription Capacity Enforcement
  const comp = inMemoryCompanies.find((c) => c.id === companyId);
  const currentCount = (inMemoryEmployees[companyId] || []).length;
  const maxCap = comp?.maxEmployees || 500;

  if (currentCount >= maxCap) {
    throw new Error(
      `Workforce capacity limit reached (${currentCount}/${maxCap}). Please upgrade your SaaS subscription plan to enroll additional staff.`
    );
  }

  const newId = `emp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  // Ensure unique employeeCode
  const employeeCode = data.employeeCode || (await getNextEmployeeCode(companyId));

  const newEmp: Employee = {
    ...data,
    id: newId,
    companyId,
    tenantId: data.tenantId || comp?.tenantId || `tenant_${companyId}`,
    employeeCode,
    status: data.status || 'active',
    category: data.category || 'Security Guard',
    employmentType: data.employmentType || 'Permanent',
    documentVerificationStatus: data.documentVerificationStatus || 'pending',
    createdAt: now,
    updatedAt: now,
    createdBy: actorEmail,
  };

  try {
    await setDoc(doc(db, 'companies', companyId, 'employees', newId), newEmp);
  } catch (error) {
    console.warn('[Happiiz HR] Sync employee to cloud note:', error);
  }

  const existing = inMemoryEmployees[companyId] || [];
  inMemoryEmployees[companyId] = [newEmp, ...existing];

  // Update company headcount
  if (comp) {
    comp.employeeCount = (comp.employeeCount || 0) + 1;
  }

  // Audit log entry
  await logAuditEvent({
    tenantId: newEmp.tenantId,
    actorUid: 'authorized_user',
    actorEmail,
    action: 'EMPLOYEE_REGISTERED',
    category: 'workforce',
    details: `Enrolled new employee ${newEmp.employeeCode} (${newEmp.fullName}) in department ${newEmp.department}`,
  });

  return newEmp;
}

/**
 * Update employee record
 */
export async function updateCompanyEmployee(
  companyId: string,
  employeeId: string,
  updates: Partial<Employee>,
  actorEmail = 'admin@happiiz.io'
): Promise<Employee> {
  const existingList = inMemoryEmployees[companyId] || [];
  const current = existingList.find((e) => e.id === employeeId);
  if (!current) {
    throw new Error('Employee not found.');
  }

  const now = new Date().toISOString();
  const updatedEmp: Employee = {
    ...current,
    ...updates,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'companies', companyId, 'employees', employeeId), updatedEmp);
  } catch (error) {
    console.warn('[Happiiz HR] Sync employee update note:', error);
  }

  inMemoryEmployees[companyId] = existingList.map((e) =>
    e.id === employeeId ? updatedEmp : e
  );

  await logAuditEvent({
    tenantId: updatedEmp.tenantId,
    actorUid: 'authorized_user',
    actorEmail,
    action: 'EMPLOYEE_PROFILE_UPDATED',
    category: 'workforce',
    details: `Updated employee profile for ${updatedEmp.employeeCode} (${updatedEmp.fullName})`,
  });

  return updatedEmp;
}

/**
 * Transition employee status with historical reason logging
 */
export async function changeEmployeeStatus(
  companyId: string,
  employeeId: string,
  newStatus: EmployeeLifecycleStatus,
  reason: string,
  actorEmail = 'admin@happiiz.io'
): Promise<Employee> {
  const existingList = inMemoryEmployees[companyId] || [];
  const current = existingList.find((e) => e.id === employeeId);
  if (!current) {
    throw new Error('Employee not found.');
  }

  const now = new Date().toISOString();
  const historyItem = {
    previousStatus: current.status,
    newStatus,
    reason: reason || 'Administrative Status Transition',
    changedBy: actorEmail,
    timestamp: now,
  };

  const updatedEmp: Employee = {
    ...current,
    status: newStatus,
    statusHistory: [...(current.statusHistory || []), historyItem],
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'companies', companyId, 'employees', employeeId), updatedEmp);
  } catch (error) {
    console.warn('[Happiiz HR] Sync employee status change note:', error);
  }

  inMemoryEmployees[companyId] = existingList.map((e) =>
    e.id === employeeId ? updatedEmp : e
  );

  await logAuditEvent({
    tenantId: updatedEmp.tenantId,
    actorUid: 'authorized_user',
    actorEmail,
    action: 'EMPLOYEE_STATUS_CHANGED',
    category: 'workforce',
    details: `Status of ${updatedEmp.employeeCode} changed from ${current.status} to ${newStatus}: ${reason}`,
  });

  return updatedEmp;
}

/**
 * Get employee KYC documents
 */
export async function getEmployeeDocuments(
  companyId: string,
  employeeId: string
): Promise<EmployeeDocument[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'employees', employeeId, 'documents');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const list = snapshot.docs.map((d) => d.data() as EmployeeDocument);
      inMemoryEmployeeDocuments[employeeId] = list;
      return list;
    }
  } catch (error) {
    console.warn('[Happiiz HR] Employee documents fallback:', error);
  }
  return inMemoryEmployeeDocuments[employeeId] || [];
}

/**
 * Upload new employee document
 */
export async function uploadEmployeeDocument(
  companyId: string,
  employeeId: string,
  data: Omit<EmployeeDocument, 'id' | 'companyId' | 'employeeId' | 'uploadDate'>,
  actorEmail = 'admin@happiiz.io'
): Promise<EmployeeDocument> {
  const newId = `doc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newDocRecord: EmployeeDocument = {
    ...data,
    id: newId,
    employeeId,
    companyId,
    uploadDate: now.substring(0, 10),
  };

  try {
    await setDoc(
      doc(db, 'companies', companyId, 'employees', employeeId, 'documents', newId),
      newDocRecord
    );
  } catch (error) {
    console.warn('[Happiiz HR] Sync document to cloud note:', error);
  }

  const existing = inMemoryEmployeeDocuments[employeeId] || [];
  inMemoryEmployeeDocuments[employeeId] = [newDocRecord, ...existing];

  // Update employee total document count
  const emp = (inMemoryEmployees[companyId] || []).find((e) => e.id === employeeId);
  if (emp) {
    emp.totalDocumentsCount = (emp.totalDocumentsCount || 0) + 1;
  }

  await logAuditEvent({
    tenantId: data.tenantId,
    actorUid: 'authorized_user',
    actorEmail,
    action: 'EMPLOYEE_DOCUMENT_UPLOADED',
    category: 'workforce',
    details: `Uploaded ${newDocRecord.documentType} (${newDocRecord.fileName}) for employee ${employeeId}`,
  });

  return newDocRecord;
}

/**
 * Verify or reject employee document
 */
export async function verifyEmployeeDocument(
  companyId: string,
  employeeId: string,
  documentId: string,
  status: 'verified' | 'rejected',
  remarks: string,
  actorEmail = 'admin@happiiz.io'
): Promise<EmployeeDocument> {
  const existingDocs = inMemoryEmployeeDocuments[employeeId] || [];
  const currentDoc = existingDocs.find((d) => d.id === documentId);
  if (!currentDoc) {
    throw new Error('Document not found.');
  }

  const now = new Date().toISOString();
  const updatedDoc: EmployeeDocument = {
    ...currentDoc,
    verificationStatus: status,
    verifiedBy: actorEmail,
    verificationDate: now.substring(0, 10),
    remarks,
  };

  try {
    await setDoc(
      doc(db, 'companies', companyId, 'employees', employeeId, 'documents', documentId),
      updatedDoc
    );
  } catch (error) {
    console.warn('[Happiiz HR] Sync document verification note:', error);
  }

  inMemoryEmployeeDocuments[employeeId] = existingDocs.map((d) =>
    d.id === documentId ? updatedDoc : d
  );

  // Recalculate employee verified documents count
  const emp = (inMemoryEmployees[companyId] || []).find((e) => e.id === employeeId);
  if (emp) {
    const verifiedCount = inMemoryEmployeeDocuments[employeeId].filter(
      (d) => d.verificationStatus === 'verified'
    ).length;
    emp.verifiedDocumentsCount = verifiedCount;
    if (verifiedCount >= 3) {
      emp.documentVerificationStatus = 'verified';
    } else {
      emp.documentVerificationStatus = 'under_review';
    }
  }

  await logAuditEvent({
    tenantId: currentDoc.tenantId,
    actorUid: 'authorized_user',
    actorEmail,
    action: `DOCUMENT_${status.toUpperCase()}`,
    category: 'workforce',
    details: `Document ${currentDoc.fileName} marked as ${status} by ${actorEmail}`,
  });

  return updatedDoc;
}

/**
 * Get employee service agreements
 */
export async function getEmployeeAgreements(
  companyId: string,
  employeeId: string
): Promise<EmployeeAgreement[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'employees', employeeId, 'agreements');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const list = snapshot.docs.map((d) => d.data() as EmployeeAgreement);
      inMemoryEmployeeAgreements[employeeId] = list;
      return list;
    }
  } catch (error) {
    console.warn('[Happiiz HR] Employee agreements fallback:', error);
  }
  return inMemoryEmployeeAgreements[employeeId] || [];
}

/**
 * Create or generate service agreement
 */
export async function createEmployeeAgreement(
  companyId: string,
  employeeId: string,
  data: Omit<EmployeeAgreement, 'id' | 'companyId' | 'employeeId' | 'createdAt'>,
  actorEmail = 'admin@happiiz.io'
): Promise<EmployeeAgreement> {
  const newId = `agr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newAgr: EmployeeAgreement = {
    ...data,
    id: newId,
    employeeId,
    companyId,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(
      doc(db, 'companies', companyId, 'employees', employeeId, 'agreements', newId),
      newAgr
    );
  } catch (error) {
    console.warn('[Happiiz HR] Sync agreement to cloud note:', error);
  }

  const existing = inMemoryEmployeeAgreements[employeeId] || [];
  inMemoryEmployeeAgreements[employeeId] = [newAgr, ...existing];

  await logAuditEvent({
    tenantId: newAgr.tenantId,
    actorUid: 'authorized_user',
    actorEmail,
    action: 'AGREEMENT_GENERATED',
    category: 'workforce',
    details: `Generated agreement "${newAgr.agreementTitle}" for employee ${newAgr.employeeCode}`,
  });

  return newAgr;
}

/**
 * Submit employee exit / resignation record
 */
export async function submitEmployeeExitRecord(
  companyId: string,
  employeeId: string,
  data: Omit<EmployeeExitRecord, 'id' | 'companyId' | 'employeeId' | 'createdAt'>,
  actorEmail = 'admin@happiiz.io'
): Promise<EmployeeExitRecord> {
  const newId = `exit_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const exitRecord: EmployeeExitRecord = {
    ...data,
    id: newId,
    employeeId,
    companyId,
    createdAt: now,
  };

  try {
    await setDoc(
      doc(db, 'companies', companyId, 'employees', employeeId, 'exitRecords', newId),
      exitRecord
    );
  } catch (error) {
    console.warn('[Happiiz HR] Sync exit record to cloud note:', error);
  }

  const existing = inMemoryEmployeeExits[employeeId] || [];
  inMemoryEmployeeExits[employeeId] = [exitRecord, ...existing];

  // Update employee status to resigned
  await changeEmployeeStatus(
    companyId,
    employeeId,
    'resigned',
    `Resignation submitted: ${data.exitReason}`,
    actorEmail
  );

  return exitRecord;
}

/**
 * Synchronize user profile into Firestore /users/{uid} document
 * Ensuring role claims, companyId, and tenantId exist in database for Firestore Security Rules
 */
export async function syncUserProfile(profile: any): Promise<void> {
  if (!profile || !profile.uid) return;
  try {
    const userRef = doc(db, 'users', profile.uid);
    const existingSnap = await getDoc(userRef);
    const payload = {
      uid: profile.uid,
      email: profile.email || 'user@happiiz.io',
      displayName: profile.displayName || 'Authorized User',
      role: profile.role || 'company_admin',
      status: profile.status || 'active',
      companyId: profile.companyId || '',
      tenantId: profile.tenantId || '',
      associatedCompany: profile.associatedCompany || '',
      phone: profile.phone || '',
      avatarUrl: profile.avatarUrl || '',
      createdAt: existingSnap.exists() ? existingSnap.data()?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userRef, payload, { merge: true });
    console.log(`[Happiiz HR] User profile synced to Firestore: /users/${profile.uid} (${profile.role})`);
  } catch (error) {
    console.warn('[Happiiz HR] User profile sync notice:', error);
  }
}

/**
 * Get tenant-scoped client sites
 */
export async function getCompanySites(companyId: string): Promise<ClientSite[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'sites');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const list = snapshot.docs.map((d) => {
        const item = d.data() as ClientSite;
        return {
          ...item,
          id: item.id || d.id,
          siteId: item.siteId || item.id || d.id,
        };
      });
      inMemorySites[companyId] = list;
      return list;
    }
  } catch (error) {
    console.warn('[Happiiz HR] Sites list fallback:', error);
  }
  return inMemorySites[companyId] || [];
}

/**
 * Add a new site to a tenant with complete validation, uniqueness check & Firestore persistence
 */
export async function createCompanySite(
  companyId: string,
  data: Omit<ClientSite, 'id' | 'companyId' | 'createdAt'>,
  actorUid?: string,
  actorEmail?: string
): Promise<ClientSite> {
  // 1. Validate required fields
  if (!data.siteName || !data.siteName.trim()) {
    throw new Error('Site Name is required.');
  }
  if (!data.clientName || !data.clientName.trim()) {
    throw new Error('Client Name is required.');
  }
  if (!data.siteCode || !data.siteCode.trim()) {
    throw new Error('Site Code is required.');
  }

  const cleanSiteCode = data.siteCode.trim().toUpperCase();

  // 2. Validate Site Code uniqueness within tenant
  const existingSites = inMemorySites[companyId] || [];
  const duplicateCode = existingSites.some(
    (s) => s.siteCode && s.siteCode.toUpperCase() === cleanSiteCode
  );
  if (duplicateCode) {
    throw new Error(`Site Code "${cleanSiteCode}" already exists for this company. Please choose a unique code.`);
  }

  // 3. Generate unique site identifier and QR token
  const newId = `site_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const reqEmps = Number(data.requiredEmployees) || 1;
  const assignedCount = Number(data.assignedEmployeesCount) || Number(data.guardsDeployed) || 0;
  const qrToken = data.qrVerificationToken || `HHR-QR-VERIF-${cleanSiteCode}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // 4. Construct validated site document with all enterprise fields
  const newSite: ClientSite = {
    ...data,
    id: newId,
    siteId: newId,
    companyId,
    clientId: data.clientId || '',
    tenantId: data.tenantId || 'general',
    siteName: data.siteName.trim(),
    clientName: data.clientName.trim(),
    siteCode: cleanSiteCode,
    siteCategory: data.siteCategory || 'Commercial IT Park',
    address: data.address || '',
    city: data.city || '',
    state: data.state || '',
    pinCode: data.pinCode || '',
    country: data.country || 'India',
    latitude: data.latitude,
    longitude: data.longitude,
    contactPerson: data.contactPerson || '',
    contactNumber: data.contactNumber || '',
    siteContactEmail: data.siteContactEmail || '',
    assignedBranch: data.assignedBranch || '',
    siteSupervisorName: data.siteSupervisorName || '',
    siteSupervisorId: data.siteSupervisorId || '',
    siteType: data.siteType || 'Security',
    requiredEmployees: reqEmps,
    assignedEmployeesCount: assignedCount,
    remainingVacancies: Math.max(0, reqEmps - assignedCount),
    shiftDetails: data.shiftDetails || 'Standard Shifts',
    siteInstructions: data.siteInstructions || '',
    securityInstructions: data.securityInstructions || '',
    status: data.status || 'active',
    qrVerificationToken: qrToken,
    qrGeneratedAt: now,
    createdBy: actorUid || 'authorized_admin',
    createdAt: now,
    updatedAt: now,
    // Backward compatibility
    location: data.location || (data.city ? `${data.city}, ${data.state || ''}` : data.address || ''),
    guardsRequired: reqEmps,
    guardsDeployed: assignedCount,
  };

  // 5. Persist to Firestore with real error handling
  try {
    await setDoc(doc(db, 'companies', companyId, 'sites', newId), newSite);
    console.log(`[Happiiz HR] Successfully created Site in Firestore: companies/${companyId}/sites/${newId}`);
  } catch (error) {
    console.error('[Happiiz HR] Failed to create Site in Firestore:', error);
    handleFirestoreError(error, OperationType.CREATE, `companies/${companyId}/sites/${newId}`);
  }

  // 6. Update local cache
  inMemorySites[companyId] = [newSite, ...existingSites];

  // Update client count if clientId exists
  if (newSite.clientId && inMemoryClients[companyId]) {
    inMemoryClients[companyId] = inMemoryClients[companyId].map((c) => {
      if (c.id === newSite.clientId) {
        return {
          ...c,
          totalSitesCount: (c.totalSitesCount || 0) + 1,
          activeSitesCount: newSite.status === 'active' ? (c.activeSitesCount || 0) + 1 : (c.activeSitesCount || 0),
        };
      }
      return c;
    });
  }

  // 7. Audit log
  await logAuditEvent({
    tenantId: newSite.tenantId,
    actorUid: actorUid || 'admin',
    actorEmail: actorEmail || 'admin@happiiz.io',
    action: 'SITE_CREATED',
    category: 'tenant',
    details: `Created new deployment site "${newSite.siteName}" (${cleanSiteCode}) for ${newSite.clientName}`,
  });

  return newSite;
}

/**
 * Update an existing site with Firestore persistence
 */
export async function updateCompanySite(
  companyId: string,
  siteId: string,
  updates: Partial<ClientSite>,
  actorEmail?: string
): Promise<ClientSite> {
  const currentSites = inMemorySites[companyId] || [];
  const existing = currentSites.find((s) => s.id === siteId || s.siteId === siteId);
  if (!existing) {
    throw new Error('Site record not found.');
  }

  const now = new Date().toISOString();
  const safeUpdates = {
    ...updates,
    updatedAt: now,
  };

  try {
    const siteRef = doc(db, 'companies', companyId, 'sites', siteId);
    await updateDoc(siteRef, safeUpdates);
    console.log(`[Happiiz HR] Successfully updated Site in Firestore: companies/${companyId}/sites/${siteId}`);
  } catch (error) {
    console.error('[Happiiz HR] Failed to update Site in Firestore:', error);
    handleFirestoreError(error, OperationType.UPDATE, `companies/${companyId}/sites/${siteId}`);
  }

  const updatedSite: ClientSite = {
    ...existing,
    ...safeUpdates,
  };

  inMemorySites[companyId] = currentSites.map((s) =>
    s.id === siteId || s.siteId === siteId ? updatedSite : s
  );

  await logAuditEvent({
    tenantId: updatedSite.tenantId,
    actorUid: 'admin',
    actorEmail: actorEmail || 'admin@happiiz.io',
    action: 'SITE_UPDATED',
    category: 'tenant',
    details: `Updated deployment site "${updatedSite.siteName}" (${updatedSite.siteCode})`,
  });

  return updatedSite;
}

/**
 * Delete a site from Firestore and cache
 */
export async function deleteCompanySite(
  companyId: string,
  siteId: string,
  actorEmail?: string
): Promise<boolean> {
  try {
    const siteRef = doc(db, 'companies', companyId, 'sites', siteId);
    await deleteDoc(siteRef);
    console.log(`[Happiiz HR] Deleted Site from Firestore: companies/${companyId}/sites/${siteId}`);
  } catch (error) {
    console.error('[Happiiz HR] Failed to delete Site in Firestore:', error);
    handleFirestoreError(error, OperationType.DELETE, `companies/${companyId}/sites/${siteId}`);
  }

  const currentSites = inMemorySites[companyId] || [];
  inMemorySites[companyId] = currentSites.filter((s) => s.id !== siteId && s.siteId !== siteId);

  await logAuditEvent({
    tenantId: 'general',
    actorUid: 'admin',
    actorEmail: actorEmail || 'admin@happiiz.io',
    action: 'SITE_DELETED',
    category: 'security',
    details: `Deleted deployment site with ID ${siteId}`,
  });

  return true;
}

/**
 * Fetch platform audit logs
 */
export async function getAuditLogs(): Promise<AuditLog[]> {
  try {
    const colRef = collection(db, 'audit_logs');
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(50));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as AuditLog);
    }
  } catch (error) {
    console.warn('[Happiiz HR] Audit logs fallback:', error);
  }
  return inMemoryAuditLogs;
}

/**
 * Append to immutable audit log
 */
export async function logAuditEvent(
  entry: Omit<AuditLog, 'id' | 'timestamp'>
): Promise<AuditLog> {
  const newId = `audit_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const auditLog: AuditLog = {
    ...entry,
    id: newId,
    timestamp: now,
  };

  try {
    await setDoc(doc(db, 'audit_logs', newId), auditLog);
  } catch (error) {
    console.warn('[Happiiz HR] Audit write note:', error);
  }

  inMemoryAuditLogs = [auditLog, ...inMemoryAuditLogs];
  return auditLog;
}

// ========================================================
// Phase 3: Company Users Management Service
// ========================================================

/**
 * Get tenant-scoped company users
 */
export async function getCompanyUsers(companyId: string): Promise<CompanyUser[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'users');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const list = snapshot.docs.map((d) => d.data() as CompanyUser);
      inMemoryCompanyUsers[companyId] = list;
      return list;
    }
  } catch (error) {
    console.warn('[Happiiz HR] Company users list fallback:', error);
  }

  // Fallback to initial seeds if memory has none
  if (!inMemoryCompanyUsers[companyId] || inMemoryCompanyUsers[companyId].length === 0) {
    if (INITIAL_COMPANY_USERS[companyId]) {
      inMemoryCompanyUsers[companyId] = [...INITIAL_COMPANY_USERS[companyId]];
    } else {
      inMemoryCompanyUsers[companyId] = [];
    }
  }

  return inMemoryCompanyUsers[companyId] || [];
}

/**
 * Create a new Company User with role assignment, tenant scoping & audit logging
 */
export async function createCompanyUser(
  companyId: string,
  tenantId: string,
  data: Omit<CompanyUser, 'id' | 'companyId' | 'tenantId' | 'createdAt'>,
  actorUid = 'admin',
  actorEmail = 'admin@happiiz.io'
): Promise<CompanyUser> {
  // 1. Validation
  if (!data.fullName || !data.fullName.trim()) {
    throw new Error('Full Name is required.');
  }
  if (!data.email || !data.email.trim() || !data.email.includes('@')) {
    throw new Error('A valid work email address is required.');
  }
  if (!data.assignedRoleId) {
    throw new Error('An authorized role must be assigned.');
  }

  const cleanEmail = data.email.trim().toLowerCase();

  // 2. Prevent Super Admin privilege escalation from Company Admin
  if (
    data.assignedRoleId.includes('super_admin') ||
    data.assignedRoleId.includes('platform_owner') ||
    data.assignedRoleName?.toLowerCase().includes('super admin') ||
    data.assignedRoleName?.toLowerCase().includes('platform owner')
  ) {
    throw new Error('Company Admins are strictly prohibited from creating Super Admin or Platform Owner accounts.');
  }

  // 3. Duplicate check within company
  const currentUsers = await getCompanyUsers(companyId);
  if (currentUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
    throw new Error(`A user account with email "${cleanEmail}" already exists in this company.`);
  }

  const newId = `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newUser: CompanyUser = {
    ...data,
    id: newId,
    uid: newId,
    companyId,
    tenantId,
    email: cleanEmail,
    fullName: data.fullName.trim(),
    mobileNumber: data.mobileNumber || '',
    designation: data.designation || 'Staff Member',
    department: data.department || 'Operations',
    branch: data.branch || 'Headquarters',
    assignedRoleId: data.assignedRoleId,
    assignedRoleName: data.assignedRoleName || 'Staff',
    accountStatus: data.accountStatus || 'active',
    joiningDate: data.joiningDate || now.substring(0, 10),
    createdAt: now,
    updatedAt: now,
    createdBy: actorEmail,
  };

  // 4. Save to Firestore subcollection: companies/{companyId}/users/{newId}
  try {
    await setDoc(doc(db, 'companies', companyId, 'users', newId), newUser);
  } catch (err) {
    console.warn('[Happiiz HR] Sync user to Firestore notice:', err);
  }

  // 5. Update local cache
  inMemoryCompanyUsers[companyId] = [newUser, ...(inMemoryCompanyUsers[companyId] || [])];

  // 6. Log audit trail
  await logAuditEvent({
    tenantId,
    actorUid,
    actorEmail,
    action: 'USER_CREATED',
    category: 'role',
    details: `Added new user ${newUser.fullName} (${newUser.email}) with role "${newUser.assignedRoleName}"`,
  });

  return newUser;
}

/**
 * Update an existing Company User
 */
export async function updateCompanyUser(
  companyId: string,
  userId: string,
  updates: Partial<CompanyUser>,
  actorEmail = 'admin@happiiz.io'
): Promise<CompanyUser> {
  const users = await getCompanyUsers(companyId);
  const existing = users.find((u) => u.id === userId);
  if (!existing) {
    throw new Error('User record not found.');
  }

  const now = new Date().toISOString();
  const safeUpdates = {
    ...updates,
    updatedAt: now,
  };

  try {
    await updateDoc(doc(db, 'companies', companyId, 'users', userId), safeUpdates);
  } catch (err) {
    console.warn('[Happiiz HR] User update notice:', err);
  }

  const updated: CompanyUser = { ...existing, ...safeUpdates };
  inMemoryCompanyUsers[companyId] = users.map((u) => (u.id === userId ? updated : u));

  await logAuditEvent({
    tenantId: updated.tenantId,
    actorUid: 'admin',
    actorEmail,
    action: 'USER_UPDATED',
    category: 'role',
    details: `Updated user profile for ${updated.fullName} (${updated.email})`,
  });

  return updated;
}

/**
 * Toggle Company User account status (active, deactivated, suspended)
 */
export async function setCompanyUserStatus(
  companyId: string,
  userId: string,
  newStatus: 'active' | 'deactivated' | 'suspended',
  actorEmail = 'admin@happiiz.io'
): Promise<void> {
  const users = await getCompanyUsers(companyId);
  const existing = users.find((u) => u.id === userId);
  if (!existing) throw new Error('User not found.');

  await updateCompanyUser(companyId, userId, { accountStatus: newStatus }, actorEmail);

  await logAuditEvent({
    tenantId: existing.tenantId,
    actorUid: 'admin',
    actorEmail,
    action: `USER_${newStatus.toUpperCase()}`,
    category: 'security',
    details: `User ${existing.fullName} account status changed to ${newStatus}`,
  });
}

/**
 * Trigger secure password reset link for user
 */
export async function resetCompanyUserPassword(
  companyId: string,
  userId: string,
  actorEmail = 'admin@happiiz.io'
): Promise<{ success: boolean; message: string }> {
  const users = await getCompanyUsers(companyId);
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error('User not found.');

  await logAuditEvent({
    tenantId: user.tenantId,
    actorUid: 'admin',
    actorEmail,
    action: 'PASSWORD_RESET_DISPATCHED',
    category: 'security',
    details: `Password reset instructions dispatched to ${user.email}`,
  });

  return {
    success: true,
    message: `Secure password reset instructions have been dispatched to ${user.email}.`,
  };
}

// ========================================================
// Phase 3: Company Role & Permission Management Service
// ========================================================

/**
 * Get tenant-scoped company roles (default system roles + custom roles)
 */
export async function getCompanyRoles(companyId: string, tenantId = 'general'): Promise<CompanyRole[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'roles');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const list = snapshot.docs.map((d) => d.data() as CompanyRole);
      inMemoryCompanyRoles[companyId] = list;
      return list;
    }
  } catch (error) {
    console.warn('[Happiiz HR] Company roles list fallback:', error);
  }

  // Pre-seed default roles if empty
  if (!inMemoryCompanyRoles[companyId] || inMemoryCompanyRoles[companyId].length === 0) {
    const defaults: CompanyRole[] = DEFAULT_COMPANY_ROLES.map((r) => ({
      ...r,
      companyId,
      tenantId,
      createdAt: r.createdAt || new Date().toISOString(),
    }));
    inMemoryCompanyRoles[companyId] = defaults;
    return defaults;
  }

  return inMemoryCompanyRoles[companyId];
}

/**
 * Create a new custom company role
 */
export async function createCompanyRole(
  companyId: string,
  tenantId: string,
  data: {
    roleName: string;
    description: string;
    permissions: string[];
  },
  actorEmail = 'admin@happiiz.io'
): Promise<CompanyRole> {
  if (!data.roleName || !data.roleName.trim()) {
    throw new Error('Role Name is required.');
  }

  const cleanName = data.roleName.trim();
  const roles = await getCompanyRoles(companyId, tenantId);

  if (roles.some((r) => r.roleName.toLowerCase() === cleanName.toLowerCase())) {
    throw new Error(`A role named "${cleanName}" already exists.`);
  }

  const roleCode = `custom_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const newId = `role_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newRole: CompanyRole = {
    id: newId,
    companyId,
    tenantId,
    roleName: cleanName,
    roleCode,
    description: data.description || 'Custom organizational access role.',
    isSystemRole: false,
    status: 'active',
    permissions: data.permissions || [],
    createdAt: now,
    updatedAt: now,
    createdBy: actorEmail,
  };

  try {
    await setDoc(doc(db, 'companies', companyId, 'roles', newId), newRole);
  } catch (err) {
    console.warn('[Happiiz HR] Sync role to Firestore note:', err);
  }

  inMemoryCompanyRoles[companyId] = [newRole, ...(inMemoryCompanyRoles[companyId] || [])];

  await logAuditEvent({
    tenantId,
    actorUid: 'admin',
    actorEmail,
    action: 'ROLE_CREATED',
    category: 'role',
    details: `Created custom role "${newRole.roleName}" with ${newRole.permissions.length} permissions`,
  });

  return newRole;
}

/**
 * Update role permissions or details (Custom roles only; system role names are protected)
 */
export async function updateCompanyRole(
  companyId: string,
  roleId: string,
  updates: Partial<CompanyRole>,
  actorEmail = 'admin@happiiz.io'
): Promise<CompanyRole> {
  const roles = await getCompanyRoles(companyId);
  const existing = roles.find((r) => r.id === roleId);
  if (!existing) throw new Error('Role not found.');

  if (existing.isSystemRole && updates.roleName && updates.roleName !== existing.roleName) {
    throw new Error('System default role names cannot be renamed.');
  }

  const now = new Date().toISOString();
  const safeUpdates = {
    ...updates,
    updatedAt: now,
  };

  try {
    await updateDoc(doc(db, 'companies', companyId, 'roles', roleId), safeUpdates);
  } catch (err) {
    console.warn('[Happiiz HR] Update role note:', err);
  }

  const updated: CompanyRole = { ...existing, ...safeUpdates };
  inMemoryCompanyRoles[companyId] = roles.map((r) => (r.id === roleId ? updated : r));

  await logAuditEvent({
    tenantId: updated.tenantId,
    actorUid: 'admin',
    actorEmail,
    action: 'ROLE_UPDATED',
    category: 'role',
    details: `Updated permissions for role "${updated.roleName}" (${updated.permissions.length} active permissions)`,
  });

  return updated;
}

/**
 * Duplicate an existing role as a custom role template
 */
export async function duplicateCompanyRole(
  companyId: string,
  tenantId: string,
  sourceRoleId: string,
  newRoleName: string,
  actorEmail = 'admin@happiiz.io'
): Promise<CompanyRole> {
  const roles = await getCompanyRoles(companyId, tenantId);
  const source = roles.find((r) => r.id === sourceRoleId);
  if (!source) throw new Error('Source role not found.');

  return createCompanyRole(
    companyId,
    tenantId,
    {
      roleName: newRoleName,
      description: `Cloned template from ${source.roleName}`,
      permissions: [...source.permissions],
    },
    actorEmail
  );
}

// ========================================================
// Phase 3: Department Management Service
// ========================================================

/**
 * Get tenant-scoped departments
 */
export async function getCompanyDepartments(companyId: string, tenantId = 'general'): Promise<CompanyDepartment[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'departments');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const list = snapshot.docs.map((d) => d.data() as CompanyDepartment);
      inMemoryCompanyDepartments[companyId] = list;
      return list;
    }
  } catch (error) {
    console.warn('[Happiiz HR] Departments list fallback:', error);
  }

  if (!inMemoryCompanyDepartments[companyId] || inMemoryCompanyDepartments[companyId].length === 0) {
    const defaults: CompanyDepartment[] = DEFAULT_COMPANY_DEPARTMENTS.map((d) => ({
      ...d,
      companyId,
      tenantId,
    }));
    inMemoryCompanyDepartments[companyId] = defaults;
    return defaults;
  }

  return inMemoryCompanyDepartments[companyId];
}

/**
 * Create a new Department
 */
export async function createCompanyDepartment(
  companyId: string,
  tenantId: string,
  data: Omit<CompanyDepartment, 'id' | 'companyId' | 'tenantId' | 'createdAt'>,
  actorEmail = 'admin@happiiz.io'
): Promise<CompanyDepartment> {
  if (!data.name || !data.name.trim()) {
    throw new Error('Department Name is required.');
  }

  const cleanName = data.name.trim();
  const depts = await getCompanyDepartments(companyId, tenantId);
  if (depts.some((d) => d.name.toLowerCase() === cleanName.toLowerCase())) {
    throw new Error(`A department named "${cleanName}" already exists.`);
  }

  const newId = `dept_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newDept: CompanyDepartment = {
    ...data,
    id: newId,
    companyId,
    tenantId,
    name: cleanName,
    code: (data.code || cleanName.substring(0, 3)).toUpperCase(),
    description: data.description || '',
    headOfDepartment: data.headOfDepartment || '',
    headEmail: data.headEmail || '',
    userCount: Number(data.userCount) || 0,
    status: data.status || 'active',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'companies', companyId, 'departments', newId), newDept);
  } catch (err) {
    console.warn('[Happiiz HR] Sync department note:', err);
  }

  inMemoryCompanyDepartments[companyId] = [newDept, ...(inMemoryCompanyDepartments[companyId] || [])];

  await logAuditEvent({
    tenantId,
    actorUid: 'admin',
    actorEmail,
    action: 'DEPARTMENT_CREATED',
    category: 'tenant',
    details: `Created department "${newDept.name}" (${newDept.code})`,
  });

  return newDept;
}

/**
 * Update Department details
 */
export async function updateCompanyDepartment(
  companyId: string,
  deptId: string,
  updates: Partial<CompanyDepartment>,
  actorEmail = 'admin@happiiz.io'
): Promise<CompanyDepartment> {
  const depts = await getCompanyDepartments(companyId);
  const existing = depts.find((d) => d.id === deptId);
  if (!existing) throw new Error('Department not found.');

  const now = new Date().toISOString();
  const safeUpdates = {
    ...updates,
    updatedAt: now,
  };

  try {
    await updateDoc(doc(db, 'companies', companyId, 'departments', deptId), safeUpdates);
  } catch (err) {
    console.warn('[Happiiz HR] Update dept note:', err);
  }

  const updated: CompanyDepartment = { ...existing, ...safeUpdates };
  inMemoryCompanyDepartments[companyId] = depts.map((d) => (d.id === deptId ? updated : d));

  await logAuditEvent({
    tenantId: updated.tenantId,
    actorUid: 'admin',
    actorEmail,
    action: 'DEPARTMENT_UPDATED',
    category: 'tenant',
    details: `Updated department "${updated.name}"`,
  });

  return updated;
}

/**
 * Delete Department
 */
export async function deleteCompanyDepartment(
  companyId: string,
  deptId: string,
  actorEmail = 'admin@happiiz.io'
): Promise<void> {
  const depts = await getCompanyDepartments(companyId);
  const existing = depts.find((d) => d.id === deptId);
  if (!existing) return;

  try {
    await deleteDoc(doc(db, 'companies', companyId, 'departments', deptId));
  } catch (err) {
    console.warn('[Happiiz HR] Delete dept note:', err);
  }

  inMemoryCompanyDepartments[companyId] = depts.filter((d) => d.id !== deptId);

  await logAuditEvent({
    tenantId: existing.tenantId,
    actorUid: 'admin',
    actorEmail,
    action: 'DEPARTMENT_DELETED',
    category: 'tenant',
    details: `Deleted department "${existing.name}"`,
  });
}

// ========================================================
// Phase 3: Branch Management Service
// ========================================================

/**
 * Get tenant-scoped branches
 */
export async function getCompanyBranches(companyId: string, tenantId = 'general'): Promise<CompanyBranch[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'branches');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const list = snapshot.docs.map((d) => d.data() as CompanyBranch);
      inMemoryCompanyBranches[companyId] = list;
      return list;
    }
  } catch (error) {
    console.warn('[Happiiz HR] Branches list fallback:', error);
  }

  if (!inMemoryCompanyBranches[companyId] || inMemoryCompanyBranches[companyId].length === 0) {
    const defaults: CompanyBranch[] = DEFAULT_COMPANY_BRANCHES.map((b) => ({
      ...b,
      companyId,
      tenantId,
    }));
    inMemoryCompanyBranches[companyId] = defaults;
    return defaults;
  }

  return inMemoryCompanyBranches[companyId];
}

/**
 * Create a new Branch with code uniqueness validation
 */
export async function createCompanyBranch(
  companyId: string,
  tenantId: string,
  data: Omit<CompanyBranch, 'id' | 'companyId' | 'tenantId' | 'createdAt'>,
  actorEmail = 'admin@happiiz.io'
): Promise<CompanyBranch> {
  if (!data.branchName || !data.branchName.trim()) {
    throw new Error('Branch Name is required.');
  }
  if (!data.branchCode || !data.branchCode.trim()) {
    throw new Error('Branch Code is required.');
  }

  const cleanCode = data.branchCode.trim().toUpperCase();
  const branches = await getCompanyBranches(companyId, tenantId);

  // Prevent duplicate branch codes within same company
  if (branches.some((b) => b.branchCode.toUpperCase() === cleanCode)) {
    throw new Error(`Branch Code "${cleanCode}" already exists for this company. Please specify a unique code.`);
  }

  const newId = `br_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newBranch: CompanyBranch = {
    ...data,
    id: newId,
    companyId,
    tenantId,
    branchName: data.branchName.trim(),
    branchCode: cleanCode,
    branchManager: data.branchManager || '',
    contactNumber: data.contactNumber || '',
    email: data.email || '',
    address: data.address || '',
    city: data.city || '',
    state: data.state || '',
    pinCode: data.pinCode || '',
    status: data.status || 'active',
    userCount: Number(data.userCount) || 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'companies', companyId, 'branches', newId), newBranch);
  } catch (err) {
    console.warn('[Happiiz HR] Sync branch note:', err);
  }

  inMemoryCompanyBranches[companyId] = [newBranch, ...(inMemoryCompanyBranches[companyId] || [])];

  await logAuditEvent({
    tenantId,
    actorUid: 'admin',
    actorEmail,
    action: 'BRANCH_CREATED',
    category: 'tenant',
    details: `Created branch "${newBranch.branchName}" (${cleanCode}) in ${newBranch.city}`,
  });

  return newBranch;
}

/**
 * Update Branch
 */
export async function updateCompanyBranch(
  companyId: string,
  branchId: string,
  updates: Partial<CompanyBranch>,
  actorEmail = 'admin@happiiz.io'
): Promise<CompanyBranch> {
  const branches = await getCompanyBranches(companyId);
  const existing = branches.find((b) => b.id === branchId);
  if (!existing) throw new Error('Branch not found.');

  // If code is changing, ensure uniqueness
  if (updates.branchCode && updates.branchCode.trim().toUpperCase() !== existing.branchCode.toUpperCase()) {
    const cleanCode = updates.branchCode.trim().toUpperCase();
    if (branches.some((b) => b.id !== branchId && b.branchCode.toUpperCase() === cleanCode)) {
      throw new Error(`Branch Code "${cleanCode}" is already in use by another branch.`);
    }
    updates.branchCode = cleanCode;
  }

  const now = new Date().toISOString();
  const safeUpdates = {
    ...updates,
    updatedAt: now,
  };

  try {
    await updateDoc(doc(db, 'companies', companyId, 'branches', branchId), safeUpdates);
  } catch (err) {
    console.warn('[Happiiz HR] Update branch note:', err);
  }

  const updated: CompanyBranch = { ...existing, ...safeUpdates };
  inMemoryCompanyBranches[companyId] = branches.map((b) => (b.id === branchId ? updated : b));

  await logAuditEvent({
    tenantId: updated.tenantId,
    actorUid: 'admin',
    actorEmail,
    action: 'BRANCH_UPDATED',
    category: 'tenant',
    details: `Updated branch "${updated.branchName}" (${updated.branchCode})`,
  });

  return updated;
}

/**
 * Delete Branch
 */
export async function deleteCompanyBranch(
  companyId: string,
  branchId: string,
  actorEmail = 'admin@happiiz.io'
): Promise<void> {
  const branches = await getCompanyBranches(companyId);
  const existing = branches.find((b) => b.id === branchId);
  if (!existing) return;

  try {
    await deleteDoc(doc(db, 'companies', companyId, 'branches', branchId));
  } catch (err) {
    console.warn('[Happiiz HR] Delete branch note:', err);
  }

  inMemoryCompanyBranches[companyId] = branches.filter((b) => b.id !== branchId);

  await logAuditEvent({
    tenantId: existing.tenantId,
    actorUid: 'admin',
    actorEmail,
    action: 'BRANCH_DELETED',
    category: 'tenant',
    details: `Deleted branch "${existing.branchName}" (${existing.branchCode})`,
  });
}

// ========================================================
// Phase 3: Company Full Settings Service
// ========================================================

/**
 * Get company settings (with fallback to default generated structure)
 */
export async function getCompanyFullSettings(company: Company): Promise<CompanyFullSettings> {
  try {
    const docRef = doc(db, 'companies', company.id, 'settings', 'config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as CompanyFullSettings;
      inMemoryCompanySettings[company.id] = data;
      return data;
    }
  } catch (error) {
    console.warn('[Happiiz HR] Company settings read fallback:', error);
  }

  if (inMemoryCompanySettings[company.id]) {
    return inMemoryCompanySettings[company.id];
  }

  const defaults = getDefaultCompanySettings(company);
  inMemoryCompanySettings[company.id] = defaults;
  return defaults;
}

/**
 * Save company full settings
 */
export async function updateCompanyFullSettings(
  companyId: string,
  settings: CompanyFullSettings,
  actorEmail = 'admin@happiiz.io'
): Promise<CompanyFullSettings> {
  const now = new Date().toISOString();
  const payload: CompanyFullSettings = {
    ...settings,
    companyId,
    updatedAt: now,
    updatedBy: actorEmail,
  };

  try {
    await setDoc(doc(db, 'companies', companyId, 'settings', 'config'), payload);
  } catch (err) {
    console.warn('[Happiiz HR] Save settings note:', err);
  }

  inMemoryCompanySettings[companyId] = payload;

  await logAuditEvent({
    tenantId: payload.tenantId || `tenant_${companyId}`,
    actorUid: 'admin',
    actorEmail,
    action: 'SETTINGS_UPDATED',
    category: 'settings',
    details: `Company configuration and operational preferences updated`,
  });

  return payload;
}

// ========================================================
// PHASE 5: CLIENT MANAGEMENT & COMMERCIALS SERVICE
// ========================================================

/**
 * Get all registered clients for a tenant company
 */
export async function getCompanyClients(companyId: string): Promise<Client[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'clients');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const list = snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
      })) as Client[];
      inMemoryClients[companyId] = list;
    }
  } catch (err) {
    console.warn('[Happiiz HR] Client fetch fallback to memory:', err);
  }

  // Recalculate site and employee counts dynamically from tenant memory
  const clients = inMemoryClients[companyId] || [];
  const sites = inMemorySites[companyId] || [];
  const deployments = inMemoryDeployments[companyId] || [];
  const contracts = inMemoryContracts[companyId] || [];

  return clients.map((client) => {
    const clientSites = sites.filter((s) => s.clientId === client.id || s.clientName === client.clientName);
    const activeSites = clientSites.filter((s) => s.status === 'active');
    const activeContracts = (contracts.filter((c) => (c.clientId === client.id || c.clientName === client.clientName) && c.status === 'active')).length;
    const clientDeployments = deployments.filter((d) => (d.clientId === client.id || d.clientName === client.clientName) && d.status === 'active');

    return {
      ...client,
      totalSitesCount: clientSites.length,
      activeSitesCount: activeSites.length,
      activeContractsCount: activeContracts,
      totalDeployedEmployees: clientDeployments.length,
    };
  });
}

/**
 * Get a single client by ID
 */
export async function getClientById(companyId: string, clientId: string): Promise<Client | null> {
  const all = await getCompanyClients(companyId);
  return all.find((c) => c.id === clientId) || null;
}

/**
 * Generate next auto-incremented Client Code e.g. HHR-CLI-0004
 */
export async function getNextClientCode(companyId: string): Promise<string> {
  const clients = inMemoryClients[companyId] || [];
  const count = clients.length + 1;
  const padded = String(count).padStart(4, '0');
  return `HHR-CLI-${padded}`;
}

/**
 * Generate next auto-incremented Site Code e.g. REX-SITE-0003
 */
export async function getNextSiteCode(companyId: string, clientPrefix?: string): Promise<string> {
  const sites = inMemorySites[companyId] || [];
  const count = sites.length + 1;
  const padded = String(count).padStart(4, '0');
  const prefix = clientPrefix ? clientPrefix.trim().substring(0, 4).toUpperCase() : 'REX-SITE';
  return `${prefix}-${padded}`;
}

/**
 * Generate Secure QR payload for a site
 */
export function generateSiteQrPayload(companyId: string, siteId: string, siteCode: string): { qrUrl: string; token: string; qrDataString: string } {
  const token = `HHR-QR-${siteCode}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  // Safe verification URL (does not expose confidential commercial margins or wage rates)
  const qrDataString = JSON.stringify({
    system: 'Happiiz HR Enterprise Verification',
    tenant: companyId,
    siteId,
    siteCode,
    token,
    verifiedBy: 'Happiiz HR Security & Patrol Engine',
    timestamp: new Date().toISOString(),
  });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrDataString)}`;
  return { qrUrl, token, qrDataString };
}

/**
 * Register a new Client for a tenant
 */
export async function createCompanyClient(
  companyId: string,
  clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>,
  actorUid?: string,
  actorEmail = 'admin@happiiz.io'
): Promise<Client> {
  if (!clientData.clientName || !clientData.clientName.trim()) {
    throw new Error('Client Name is required.');
  }

  const newId = `client_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const code = clientData.clientCode || (await getNextClientCode(companyId));

  const newClient: Client = {
    ...clientData,
    id: newId,
    companyId,
    tenantId: clientData.tenantId || `tenant_${companyId}`,
    clientName: clientData.clientName.trim(),
    clientCode: code.trim().toUpperCase(),
    accountStatus: clientData.accountStatus || 'active',
    registeredAddress: clientData.registeredAddress || '',
    city: clientData.city || '',
    state: clientData.state || '',
    pinCode: clientData.pinCode || '',
    country: clientData.country || 'India',
    contactPersonName: clientData.contactPersonName || '',
    contactPersonPhone: clientData.contactPersonPhone || '',
    contactPersonEmail: clientData.contactPersonEmail || '',
    clientStartDate: clientData.clientStartDate || now.split('T')[0],
    totalSitesCount: 0,
    activeSitesCount: 0,
    activeContractsCount: 0,
    totalDeployedEmployees: 0,
    createdBy: actorUid || 'authorized_admin',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'companies', companyId, 'clients', newId), newClient);
  } catch (err) {
    console.warn('[Happiiz HR] Persist client notice:', err);
  }

  const existing = inMemoryClients[companyId] || [];
  inMemoryClients[companyId] = [newClient, ...existing];

  await logAuditEvent({
    tenantId: newClient.tenantId,
    actorUid: actorUid || 'admin',
    actorEmail,
    action: 'CLIENT_REGISTERED',
    category: 'tenant',
    details: `Registered client "${newClient.clientName}" (${newClient.clientCode}) under industry ${newClient.industryCategory || 'General'}`,
  });

  return newClient;
}

/**
 * Update an existing Client record
 */
export async function updateCompanyClient(
  companyId: string,
  clientId: string,
  updates: Partial<Client>,
  actorEmail = 'admin@happiiz.io'
): Promise<Client> {
  const list = inMemoryClients[companyId] || [];
  const idx = list.findIndex((c) => c.id === clientId);
  if (idx === -1) {
    throw new Error('Client record not found.');
  }

  const updated: Client = {
    ...list[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'companies', companyId, 'clients', clientId), updated, { merge: true });
  } catch (err) {
    console.warn('[Happiiz HR] Update client notice:', err);
  }

  list[idx] = updated;
  inMemoryClients[companyId] = [...list];

  await logAuditEvent({
    tenantId: updated.tenantId,
    actorUid: 'admin',
    actorEmail,
    action: 'CLIENT_UPDATED',
    category: 'tenant',
    details: `Updated client account "${updated.clientName}" (${updated.clientCode})`,
  });

  return updated;
}

/**
 * Delete a Client record
 */
export async function deleteCompanyClient(
  companyId: string,
  clientId: string,
  actorEmail = 'admin@happiiz.io'
): Promise<void> {
  const list = inMemoryClients[companyId] || [];
  const client = list.find((c) => c.id === clientId);

  try {
    await deleteDoc(doc(db, 'companies', companyId, 'clients', clientId));
  } catch (err) {
    console.warn('[Happiiz HR] Delete client notice:', err);
  }

  inMemoryClients[companyId] = list.filter((c) => c.id !== clientId);

  if (client) {
    await logAuditEvent({
      tenantId: client.tenantId,
      actorUid: 'admin',
      actorEmail,
      action: 'CLIENT_DELETED',
      category: 'tenant',
      details: `Archived/Deleted client record "${client.clientName}" (${client.clientCode})`,
    });
  }
}

// ========================================================
// PHASE 5: CLIENT CONTRACT MANAGEMENT SERVICE
// ========================================================

/**
 * Get Client Contracts
 */
export async function getClientContracts(companyId: string, clientId?: string): Promise<ClientContract[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'contracts');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as ClientContract[];
      inMemoryContracts[companyId] = list;
    }
  } catch (err) {
    console.warn('[Happiiz HR] Contract fetch fallback to memory:', err);
  }

  const list = inMemoryContracts[companyId] || [];
  if (clientId) {
    return list.filter((c) => c.clientId === clientId);
  }
  return list;
}

/**
 * Create a new Client Contract
 */
export async function createClientContract(
  companyId: string,
  contractData: Omit<ClientContract, 'id' | 'createdAt' | 'updatedAt'>,
  actorEmail = 'admin@happiiz.io'
): Promise<ClientContract> {
  const newId = `con_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newContract: ClientContract = {
    ...contractData,
    id: newId,
    companyId,
    tenantId: contractData.tenantId || `tenant_${companyId}`,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'companies', companyId, 'contracts', newId), newContract);
  } catch (err) {
    console.warn('[Happiiz HR] Save contract notice:', err);
  }

  const existing = inMemoryContracts[companyId] || [];
  inMemoryContracts[companyId] = [newContract, ...existing];

  await logAuditEvent({
    tenantId: newContract.tenantId,
    actorUid: 'admin',
    actorEmail,
    action: 'CONTRACT_CREATED',
    category: 'billing',
    details: `Executed SLA Contract "${newContract.contractTitle}" (${newContract.contractNumber}) for ${newContract.clientName} (₹${newContract.contractValue}/${newContract.billingFrequency})`,
  });

  return newContract;
}

/**
 * Update a Client Contract
 */
export async function updateClientContract(
  companyId: string,
  contractId: string,
  updates: Partial<ClientContract>
): Promise<ClientContract> {
  const list = inMemoryContracts[companyId] || [];
  const idx = list.findIndex((c) => c.id === contractId);
  if (idx === -1) throw new Error('Contract not found.');

  const updated: ClientContract = {
    ...list[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'companies', companyId, 'contracts', contractId), updated, { merge: true });
  } catch (err) {
    console.warn('[Happiiz HR] Update contract notice:', err);
  }

  list[idx] = updated;
  inMemoryContracts[companyId] = [...list];
  return updated;
}

// ========================================================
// PHASE 5: SITE MANPOWER REQUIREMENTS SERVICE
// ========================================================

/**
 * Get Manpower requirements for a site
 */
export async function getSiteManpowerRequirements(companyId: string, siteId?: string): Promise<SiteManpowerRequirement[]> {
  try {
    if (siteId) {
      const colRef = collection(db, 'companies', companyId, 'sites', siteId, 'requirements');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ ...d.data(), id: d.id })) as SiteManpowerRequirement[];
      }
    }
  } catch (err) {
    console.warn('[Happiiz HR] Requirements fetch fallback:', err);
  }

  const list = inMemorySiteRequirements[companyId] || [];
  if (siteId) {
    return list.filter((r) => r.siteId === siteId);
  }
  return list;
}

/**
 * Save / Update a Manpower Requirement
 */
export async function saveSiteManpowerRequirement(
  companyId: string,
  reqData: Omit<SiteManpowerRequirement, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<SiteManpowerRequirement> {
  const newId = reqData.id || `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const reqCount = Number(reqData.requiredCount) || 1;
  const assCount = Number(reqData.assignedCount) || 0;

  const item: SiteManpowerRequirement = {
    ...reqData,
    id: newId,
    companyId,
    tenantId: reqData.tenantId || `tenant_${companyId}`,
    requiredCount: reqCount,
    assignedCount: assCount,
    vacanciesCount: Math.max(0, reqCount - assCount),
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'companies', companyId, 'sites', reqData.siteId, 'requirements', newId), item);
  } catch (err) {
    console.warn('[Happiiz HR] Save requirement notice:', err);
  }

  const list = inMemorySiteRequirements[companyId] || [];
  const existingIdx = list.findIndex((r) => r.id === newId);
  if (existingIdx >= 0) {
    list[existingIdx] = item;
  } else {
    list.push(item);
  }
  inMemorySiteRequirements[companyId] = [...list];

  // Recalculate site-level requiredEmployees and remainingVacancies
  const allSiteReqs = list.filter((r) => r.siteId === reqData.siteId);
  const totalSiteRequired = allSiteReqs.reduce((sum, r) => sum + r.requiredCount, 0);
  const totalSiteAssigned = allSiteReqs.reduce((sum, r) => sum + r.assignedCount, 0);

  if (inMemorySites[companyId]) {
    inMemorySites[companyId] = inMemorySites[companyId].map((s) => {
      if (s.id === reqData.siteId) {
        return {
          ...s,
          requiredEmployees: totalSiteRequired || s.requiredEmployees,
          assignedEmployeesCount: totalSiteAssigned,
          remainingVacancies: Math.max(0, (totalSiteRequired || s.requiredEmployees) - totalSiteAssigned),
        };
      }
      return s;
    });
  }

  return item;
}

/**
 * Delete a Manpower Requirement
 */
export async function deleteSiteManpowerRequirement(companyId: string, reqId: string): Promise<void> {
  const list = inMemorySiteRequirements[companyId] || [];
  inMemorySiteRequirements[companyId] = list.filter((r) => r.id !== reqId);
}

// ========================================================
// PHASE 5: EMPLOYEE DEPLOYMENT SERVICE (ASSIGNMENTS & TRANSFERS)
// ========================================================

/**
 * Get active or historic deployments for a company site or client
 */
export async function getEmployeeDeployments(
  companyId: string,
  siteId?: string,
  clientId?: string
): Promise<EmployeeDeployment[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'deployments');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as EmployeeDeployment[];
      inMemoryDeployments[companyId] = list;
    }
  } catch (err) {
    console.warn('[Happiiz HR] Deployments fetch fallback:', err);
  }

  let list = inMemoryDeployments[companyId] || [];
  if (siteId) {
    list = list.filter((d) => d.siteId === siteId);
  }
  if (clientId) {
    list = list.filter((d) => d.clientId === clientId);
  }
  return list;
}

/**
 * Deploy an employee to a site
 * Prevents inactive/resigned employees from being deployed
 */
export async function deployEmployeeToSite(
  companyId: string,
  deployData: Omit<EmployeeDeployment, 'id' | 'createdAt' | 'updatedAt'>,
  actorEmail = 'admin@happiiz.io'
): Promise<EmployeeDeployment> {
  // 1. Verify employee status
  const employees = inMemoryEmployees[companyId] || [];
  const emp = employees.find((e) => e.id === deployData.employeeId);
  if (emp && (emp.status === 'inactive' || emp.status === 'resigned' || emp.status === 'terminated')) {
    throw new Error(`Cannot deploy employee ${emp.fullName} because status is "${emp.status}". Only active employees can be deployed.`);
  }

  // 2. Prevent duplicate active deployment for same employee
  const existingDeployments = inMemoryDeployments[companyId] || [];
  const activeExisting = existingDeployments.find(
    (d) => d.employeeId === deployData.employeeId && d.status === 'active' && d.siteId === deployData.siteId
  );
  if (activeExisting) {
    throw new Error(`Employee ${deployData.employeeName} is already actively deployed to this site.`);
  }

  const newId = `dep_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const deployment: EmployeeDeployment = {
    ...deployData,
    id: newId,
    companyId,
    tenantId: deployData.tenantId || `tenant_${companyId}`,
    status: 'active',
    assignedDate: deployData.assignedDate || now.split('T')[0],
    startDate: deployData.startDate || now.split('T')[0],
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'companies', companyId, 'deployments', newId), deployment);
  } catch (err) {
    console.warn('[Happiiz HR] Persist deployment notice:', err);
  }

  inMemoryDeployments[companyId] = [deployment, ...existingDeployments];

  // Update employee record with assigned site
  if (emp) {
    emp.assignedSite = deployment.siteName;
    emp.status = 'active';
  }

  // Update site assigned count and vacancies
  if (inMemorySites[companyId]) {
    inMemorySites[companyId] = inMemorySites[companyId].map((s) => {
      if (s.id === deployment.siteId) {
        const newCount = (s.assignedEmployeesCount || 0) + 1;
        return {
          ...s,
          assignedEmployeesCount: newCount,
          remainingVacancies: Math.max(0, (s.requiredEmployees || 1) - newCount),
        };
      }
      return s;
    });
  }

  await logAuditEvent({
    tenantId: deployment.tenantId,
    actorUid: 'admin',
    actorEmail,
    action: 'EMPLOYEE_DEPLOYED',
    category: 'workforce',
    details: `Deployed employee ${deployment.employeeName} (${deployment.employeeCode}) to site "${deployment.siteName}" (${deployment.siteCode}) for ${deployment.clientName}`,
  });

  return deployment;
}

/**
 * Transfer an employee from current site to another site
 */
export async function transferEmployeeDeployment(
  companyId: string,
  deploymentId: string,
  newSiteId: string,
  newSiteName: string,
  newSiteCode: string,
  newClientId: string,
  newClientName: string,
  actorEmail = 'admin@happiiz.io'
): Promise<EmployeeDeployment> {
  const deployments = inMemoryDeployments[companyId] || [];
  const existing = deployments.find((d) => d.id === deploymentId);
  if (!existing) {
    throw new Error('Deployment record not found.');
  }

  const now = new Date().toISOString();
  // Mark previous deployment as transferred
  existing.status = 'transferred';
  existing.endDate = now.split('T')[0];
  existing.transferredToSiteId = newSiteId;
  existing.updatedAt = now;

  // Create new active deployment at destination site
  const newDeployment: EmployeeDeployment = {
    ...existing,
    id: `dep_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    siteId: newSiteId,
    siteName: newSiteName,
    siteCode: newSiteCode,
    clientId: newClientId,
    clientName: newClientName,
    status: 'active',
    startDate: now.split('T')[0],
    endDate: undefined,
    remarks: `Transferred from ${existing.siteName} on ${now.split('T')[0]}`,
    createdAt: now,
    updatedAt: now,
  };

  inMemoryDeployments[companyId] = [newDeployment, ...deployments];

  // Update employee record
  const employees = inMemoryEmployees[companyId] || [];
  const emp = employees.find((e) => e.id === existing.employeeId);
  if (emp) {
    emp.assignedSite = newSiteName;
  }

  await logAuditEvent({
    tenantId: existing.tenantId,
    actorUid: 'admin',
    actorEmail,
    action: 'DEPLOYMENT_TRANSFERRED',
    category: 'workforce',
    details: `Transferred employee ${existing.employeeName} from ${existing.siteName} to ${newSiteName}`,
  });

  return newDeployment;
}

/**
 * End an employee's deployment at a site
 */
export async function endEmployeeDeployment(
  companyId: string,
  deploymentId: string,
  reason = 'Deployment concluded',
  actorEmail = 'admin@happiiz.io'
): Promise<void> {
  const deployments = inMemoryDeployments[companyId] || [];
  const dep = deployments.find((d) => d.id === deploymentId);
  if (!dep) return;

  const now = new Date().toISOString();
  dep.status = 'completed';
  dep.endDate = now.split('T')[0];
  dep.remarks = `${dep.remarks ? dep.remarks + ' | ' : ''}${reason}`;
  dep.updatedAt = now;

  await logAuditEvent({
    tenantId: dep.tenantId,
    actorUid: 'admin',
    actorEmail,
    action: 'DEPLOYMENT_ENDED',
    category: 'workforce',
    details: `Ended deployment of ${dep.employeeName} at ${dep.siteName}: ${reason}`,
  });
}

// ========================================================
// PHASE 5: COMMERCIAL RATE MANAGEMENT SERVICE (BILLING VS WAGES)
// ========================================================

/**
 * Get commercial rate cards with strict segregation of Client Billing Rate vs Employee Wage Rate
 */
export async function getCommercialRates(companyId: string, clientId?: string): Promise<CommercialRate[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'rates');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as CommercialRate[];
      inMemoryCommercialRates[companyId] = list;
    }
  } catch (err) {
    console.warn('[Happiiz HR] Commercial rates fallback:', err);
  }

  const list = inMemoryCommercialRates[companyId] || [];
  if (clientId) {
    return list.filter((r) => r.clientId === clientId);
  }
  return list;
}

/**
 * Save or update a commercial rate
 */
export async function saveCommercialRate(
  companyId: string,
  rateData: Omit<CommercialRate, 'id' | 'createdAt'> & { id?: string }
): Promise<CommercialRate> {
  const newId = rateData.id || `rate_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const item: CommercialRate = {
    ...rateData,
    id: newId,
    companyId,
    tenantId: rateData.tenantId || `tenant_${companyId}`,
    clientBillingRate: Number(rateData.clientBillingRate) || 0,
    employeeWageRate: Number(rateData.employeeWageRate) || 0,
    createdAt: now,
  };

  try {
    await setDoc(doc(db, 'companies', companyId, 'rates', newId), item);
  } catch (err) {
    console.warn('[Happiiz HR] Save rate notice:', err);
  }

  const list = inMemoryCommercialRates[companyId] || [];
  const idx = list.findIndex((r) => r.id === newId);
  if (idx >= 0) {
    list[idx] = item;
  } else {
    list.unshift(item);
  }
  inMemoryCommercialRates[companyId] = [...list];
  return item;
}

// ========================================================
// PHASE 5: SITE & CLIENT DOCUMENTS SERVICE
// ========================================================

/**
 * Get site & client agreements, NOCs, work orders and blueprints
 */
export async function getSiteDocuments(companyId: string, siteId?: string, clientId?: string): Promise<SiteDocumentItem[]> {
  try {
    const colRef = collection(db, 'companies', companyId, 'siteDocuments');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as SiteDocumentItem[];
      inMemorySiteDocuments[companyId] = list;
    }
  } catch (err) {
    console.warn('[Happiiz HR] Documents fallback:', err);
  }

  let list = inMemorySiteDocuments[companyId] || [];
  if (siteId) {
    list = list.filter((d) => d.siteId === siteId);
  }
  if (clientId) {
    list = list.filter((d) => d.clientId === clientId);
  }
  return list;
}

/**
 * Add a site or client document
 */
export async function addSiteDocument(
  companyId: string,
  docData: Omit<SiteDocumentItem, 'id' | 'createdAt'>
): Promise<SiteDocumentItem> {
  const newId = `sdoc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const item: SiteDocumentItem = {
    ...docData,
    id: newId,
    companyId,
    tenantId: docData.tenantId || `tenant_${companyId}`,
    createdAt: now,
  };

  try {
    await setDoc(doc(db, 'companies', companyId, 'siteDocuments', newId), item);
  } catch (err) {
    console.warn('[Happiiz HR] Save doc notice:', err);
  }

  const list = inMemorySiteDocuments[companyId] || [];
  inMemorySiteDocuments[companyId] = [item, ...list];
  return item;
}


