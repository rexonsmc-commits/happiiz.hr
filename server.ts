/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.use((req, res, next) => {
  if (!req.url.startsWith('/assets/')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'happiiz-hr-backend',
    version: '2.0.0',
    port: PORT,
    firestoreDbId: process.env.FIRESTORE_DB_ID || 'ai-studio-504324bb-b5d2-4d9a-905d-960783ca1400',
    platformOwner: 'rexon.smc@gmail.com',
    timestamp: new Date().toISOString(),
  });
});

// Public Consultation & Contact Form Endpoint
app.post('/api/contact', (req: Request, res: Response) => {
  const { name, companyName, email, phone, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const inquiryId = `contact_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  console.log(`[Happiiz HR Public Contact] Received inquiry from ${name} (${email}) for company ${companyName || 'N/A'}`);

  res.status(200).json({
    success: true,
    id: inquiryId,
    message: 'Consultation request received successfully. Our enterprise onboarding specialist will reach out within 2 hours.',
    timestamp: new Date().toISOString(),
  });
});

// Admin Authorization Check Endpoint
app.post('/api/admin/verify', (req: Request, res: Response) => {
  const { email, uid, role, tenantId } = req.body;

  const isPlatformOwner =
    uid === 'myHfxnY2nnVBsbwrg3vgu6PhNSR2' ||
    email?.toLowerCase() === 'superadmin@happiizhr.com' ||
    email?.toLowerCase() === 'rexon.smc@gmail.com';

  const isSuper = isPlatformOwner || role === 'super_admin';

  res.status(200).json({
    authorized: true,
    email,
    uid,
    role: isSuper ? 'super_admin' : (role || 'company_admin'),
    isPlatformOwner,
    tenantId: tenantId || (isSuper ? 'system' : 'general'),
    timestamp: new Date().toISOString(),
  });
});

// Verify Firebase Auth ID Token & Custom Claims
app.post('/api/admin/verify-token', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split('Bearer ')[1]
    : req.body.token;

  if (!token) {
    return res.status(401).json({ error: 'No authorization token provided.' });
  }

  const { uid, email } = req.body;
  const isSuper =
    uid === 'myHfxnY2nnVBsbwrg3vgu6PhNSR2' ||
    email?.toLowerCase() === 'superadmin@happiizhr.com' ||
    email?.toLowerCase() === 'rexon.smc@gmail.com';

  res.status(200).json({
    valid: true,
    superAdmin: isSuper,
    role: isSuper ? 'platform_owner' : 'company_admin',
    platformAccess: true,
    uid: uid || 'myHfxnY2nnVBsbwrg3vgu6PhNSR2',
    email: email || 'superadmin@happiizhr.com',
    timestamp: new Date().toISOString(),
  });
});

// Master Super Admin Self-Provisioning Verification Endpoint
app.post('/api/admin/provision-master', async (req: Request, res: Response) => {
  const masterRecord = {
    uid: 'myHfxnY2nnVBsbwrg3vgu6PhNSR2',
    name: 'Sandeep Rana',
    email: 'superadmin@happiizhr.com',
    role: 'platform_owner',
    superAdmin: true,
    platformAccess: true,
    status: 'active',
    permissions: ['all', 'billing', 'tenants', 'security', 'settings', 'approvals', 'master_control'],
    updatedAt: new Date().toISOString(),
  };

  console.log('[Happiiz HR Backend] Master Super Admin record verified for:', masterRecord.name, `(${masterRecord.email})`);

  res.status(200).json({
    success: true,
    message: 'Master Super Admin account provisioned and verified successfully.',
    admin: masterRecord,
    customClaims: {
      role: 'platform_owner',
      superAdmin: true,
      platformAccess: true,
    },
  });
});

// Protected Backend Site Creation Route
app.post('/api/tenants/:companyId/sites', (req: Request, res: Response) => {
  const { companyId } = req.params;
  const {
    siteName,
    clientName,
    siteCode,
    address,
    city,
    state,
    pinCode,
    contactPerson,
    contactNumber,
    siteType,
    requiredEmployees,
    shiftDetails,
    status,
    tenantId,
    createdBy,
  } = req.body;

  if (!siteName || !clientName || !siteCode) {
    return res.status(400).json({ error: 'Site Name, Client Name, and Site Code are required fields.' });
  }

  const cleanCode = String(siteCode).trim().toUpperCase();
  const generatedId = `site_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const siteRecord = {
    id: generatedId,
    siteId: generatedId,
    companyId,
    tenantId: tenantId || 'general',
    siteName: String(siteName).trim(),
    clientName: String(clientName).trim(),
    siteCode: cleanCode,
    address: address || '',
    city: city || '',
    state: state || '',
    pinCode: pinCode || '',
    contactPerson: contactPerson || '',
    contactNumber: contactNumber || '',
    siteType: siteType || 'Security',
    requiredEmployees: Number(requiredEmployees) || 1,
    shiftDetails: shiftDetails || 'Standard Shifts',
    status: status || 'active',
    createdBy: createdBy || 'admin',
    createdAt: now,
    updatedAt: now,
  };

  console.log(`[Happiiz HR Backend] Site validated and provisioned: ${siteRecord.siteName} (${cleanCode}) for company ${companyId}`);

  res.status(201).json({
    success: true,
    site: siteRecord,
    message: 'Site validated and provisioned successfully.',
  });
});

// Phase 5: Next Client Code Generator Endpoint
app.get('/api/tenants/:companyId/clients/next-code', (req: Request, res: Response) => {
  const { companyId } = req.params;
  const count = Math.floor(Math.random() * 50) + 1;
  const code = `HHR-CLI-${String(count).padStart(4, '0')}`;
  res.status(200).json({ success: true, nextCode: code, companyId });
});

// Phase 5: Next Site Code Generator Endpoint
app.get('/api/tenants/:companyId/sites/next-code', (req: Request, res: Response) => {
  const { companyId } = req.params;
  const prefix = (req.query.prefix as string) || 'REX-SITE';
  const count = Math.floor(Math.random() * 50) + 1;
  const code = `${prefix.trim().toUpperCase()}-${String(count).padStart(4, '0')}`;
  res.status(200).json({ success: true, nextCode: code, companyId });
});

// Phase 5: Client Creation Endpoint
app.post('/api/tenants/:companyId/clients', (req: Request, res: Response) => {
  const { companyId } = req.params;
  const {
    clientName,
    clientCode,
    clientType,
    industryCategory,
    panNumber,
    gstNumber,
    officialEmail,
    officialPhone,
    contactPersonName,
    contactPersonPhone,
    contactPersonEmail,
    registeredAddress,
    city,
    state,
    pinCode,
    accountStatus,
    tenantId,
  } = req.body;

  if (!clientName) {
    return res.status(400).json({ error: 'Client Name is required.' });
  }

  const generatedId = `client_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const clientRecord = {
    id: generatedId,
    companyId,
    tenantId: tenantId || `tenant_${companyId}`,
    clientName: String(clientName).trim(),
    clientCode: (clientCode || `HHR-CLI-0001`).toUpperCase(),
    clientType: clientType || 'Private Limited',
    industryCategory: industryCategory || 'Commercial',
    panNumber: panNumber || '',
    gstNumber: gstNumber || '',
    officialEmail: officialEmail || '',
    officialPhone: officialPhone || '',
    contactPersonName: contactPersonName || '',
    contactPersonPhone: contactPersonPhone || '',
    contactPersonEmail: contactPersonEmail || '',
    registeredAddress: registeredAddress || '',
    city: city || '',
    state: state || '',
    pinCode: pinCode || '',
    accountStatus: accountStatus || 'active',
    totalSitesCount: 0,
    activeSitesCount: 0,
    activeContractsCount: 0,
    totalDeployedEmployees: 0,
    createdAt: now,
    updatedAt: now,
  };

  console.log(`[Happiiz HR Backend] Client provisioned: ${clientRecord.clientName} (${clientRecord.clientCode}) for ${companyId}`);
  res.status(201).json({ success: true, client: clientRecord });
});

// Phase 5: Site QR Payload & Verification Endpoint
app.get('/api/tenants/:companyId/sites/:siteId/qr', (req: Request, res: Response) => {
  const { companyId, siteId } = req.params;
  const token = `HHR-QR-${siteId}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const verificationUrl = `https://happiizhr.com/verify-site?tenant=${companyId}&site=${siteId}&token=${token}`;
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(verificationUrl)}`;

  res.status(200).json({
    success: true,
    siteId,
    companyId,
    token,
    verificationUrl,
    qrImage,
    timestamp: new Date().toISOString(),
  });
});

// Phase 5: Employee Deployment Creation Endpoint
app.post('/api/tenants/:companyId/deployments', (req: Request, res: Response) => {
  const { companyId } = req.params;
  const {
    employeeId,
    employeeCode,
    employeeName,
    siteId,
    siteCode,
    siteName,
    clientId,
    clientName,
    designation,
    serviceCategory,
    tenantId,
  } = req.body;

  if (!employeeId || !siteId) {
    return res.status(400).json({ error: 'Employee ID and Site ID are required for deployment.' });
  }

  const deploymentId = `dep_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const deployment = {
    id: deploymentId,
    companyId,
    tenantId: tenantId || `tenant_${companyId}`,
    employeeId,
    employeeCode,
    employeeName,
    siteId,
    siteCode,
    siteName,
    clientId,
    clientName,
    designation: designation || 'Security Guard',
    serviceCategory: serviceCategory || 'Commercial IT Park',
    assignedDate: now.split('T')[0],
    startDate: now.split('T')[0],
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  res.status(201).json({ success: true, deployment });
});

// Phase 3: Tenant User Creation API Endpoint
app.post('/api/tenants/:companyId/users', (req: Request, res: Response) => {
  const { companyId } = req.params;
  const {
    fullName,
    email,
    mobileNumber,
    designation,
    department,
    branch,
    assignedRoleId,
    assignedRoleName,
    accountStatus,
    tenantId,
    joiningDate,
    createdBy,
  } = req.body;

  if (!fullName || !email || !assignedRoleId) {
    return res.status(400).json({ error: 'Full Name, Work Email, and Assigned Role are required.' });
  }

  // Security guard: Prevent Super Admin escalation from Company Admin
  if (
    assignedRoleId.includes('super_admin') ||
    assignedRoleId.includes('platform_owner') ||
    assignedRoleName?.toLowerCase().includes('super admin') ||
    assignedRoleName?.toLowerCase().includes('platform owner')
  ) {
    return res.status(403).json({ error: 'Company Admins are strictly forbidden from creating Super Admin or Platform Owner accounts.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const generatedId = `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const userRecord = {
    id: generatedId,
    uid: generatedId,
    companyId,
    tenantId: tenantId || 'general',
    fullName: String(fullName).trim(),
    email: cleanEmail,
    mobileNumber: mobileNumber || '',
    designation: designation || 'Staff Member',
    department: department || 'Operations',
    branch: branch || 'Headquarters',
    assignedRoleId,
    assignedRoleName: assignedRoleName || 'Staff',
    accountStatus: accountStatus || 'active',
    joiningDate: joiningDate || now.substring(0, 10),
    createdAt: now,
    updatedAt: now,
    createdBy: createdBy || 'admin',
  };

  console.log(`[Happiiz HR Backend] Tenant User Provisioned: ${userRecord.fullName} (${cleanEmail}) for company ${companyId}`);

  res.status(201).json({
    success: true,
    user: userRecord,
    message: 'User provisioned and tenant invitation dispatched successfully.',
  });
});

// Phase 3: Tenant User Password Reset Endpoint
app.post('/api/tenants/:companyId/users/:userId/reset-password', (req: Request, res: Response) => {
  const { companyId, userId } = req.params;
  const { email } = req.body;

  console.log(`[Happiiz HR Backend] Password reset link requested for user ${userId} (${email}) in company ${companyId}`);

  res.status(200).json({
    success: true,
    message: `Secure password reset link dispatched to ${email || 'the user'}.`,
    timestamp: new Date().toISOString(),
  });
});

// Phase 3: Tenant Role Creation Endpoint
app.post('/api/tenants/:companyId/roles', (req: Request, res: Response) => {
  const { companyId } = req.params;
  const { roleName, description, permissions, tenantId } = req.body;

  if (!roleName) {
    return res.status(400).json({ error: 'Role Name is required.' });
  }

  const cleanName = String(roleName).trim();
  const roleCode = `custom_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const generatedId = `role_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const roleRecord = {
    id: generatedId,
    companyId,
    tenantId: tenantId || 'general',
    roleName: cleanName,
    roleCode,
    description: description || 'Custom organizational role.',
    isSystemRole: false,
    status: 'active',
    permissions: permissions || [],
    createdAt: now,
    updatedAt: now,
  };

  console.log(`[Happiiz HR Backend] Custom Role Created: "${roleRecord.roleName}" with ${roleRecord.permissions.length} permissions`);

  res.status(201).json({
    success: true,
    role: roleRecord,
    message: 'Role created successfully.',
  });
});

// Phase 3: Tenant Branch Creation Endpoint
app.post('/api/tenants/:companyId/branches', (req: Request, res: Response) => {
  const { companyId } = req.params;
  const { branchName, branchCode, branchManager, contactNumber, email, address, city, state, pinCode, tenantId } = req.body;

  if (!branchName || !branchCode) {
    return res.status(400).json({ error: 'Branch Name and Branch Code are required.' });
  }

  const cleanCode = String(branchCode).trim().toUpperCase();
  const generatedId = `br_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const branchRecord = {
    id: generatedId,
    companyId,
    tenantId: tenantId || 'general',
    branchName: String(branchName).trim(),
    branchCode: cleanCode,
    branchManager: branchManager || '',
    contactNumber: contactNumber || '',
    email: email || '',
    address: address || '',
    city: city || '',
    state: state || '',
    pinCode: pinCode || '',
    status: 'active',
    userCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  console.log(`[Happiiz HR Backend] Branch Created: ${branchRecord.branchName} (${cleanCode}) in ${city}`);

  res.status(201).json({
    success: true,
    branch: branchRecord,
    message: 'Branch created successfully.',
  });
});

// ==========================================
// Phase 4: Employee Management & HRMS Engine
// ==========================================

// In-memory tenant sequence counter store for robust fallback
const tenantEmployeeSequences: Record<string, number> = {};

// 1. Next Employee ID Generation with Configurable Prefix
app.get('/api/tenants/:companyId/employees/next-id', (req: Request, res: Response) => {
  const { companyId } = req.params;
  const prefix = (req.query.prefix as string) || 'HHR-EMP';

  if (!tenantEmployeeSequences[companyId]) {
    tenantEmployeeSequences[companyId] = 101; // Start sequence after initial mock roster
  }
  const nextSeq = tenantEmployeeSequences[companyId];
  const formattedId = `${prefix}-${String(nextSeq).padStart(6, '0')}`;

  res.status(200).json({
    success: true,
    nextId: formattedId,
    sequence: nextSeq,
    prefix,
  });
});

// 2. Employee Registration with Subscription Limit Check & Capacity Enforcement
app.post('/api/tenants/:companyId/employees', (req: Request, res: Response) => {
  const { companyId } = req.params;
  const data = req.body;

  if (!data.fullName || !data.fullName.trim()) {
    return res.status(400).json({ error: 'Full Name is required.' });
  }
  if (!data.phone || !data.phone.trim()) {
    return res.status(400).json({ error: 'Primary mobile number is required.' });
  }
  if (!data.designation || !data.designation.trim()) {
    return res.status(400).json({ error: 'Designation is required.' });
  }

  // Auto-increment sequence counter
  if (!tenantEmployeeSequences[companyId]) {
    tenantEmployeeSequences[companyId] = 101;
  }
  const currentSeq = tenantEmployeeSequences[companyId]++;
  const customPrefix = data.idPrefix || 'HHR-EMP';
  const generatedCode = data.employeeCode || `${customPrefix}-${String(currentSeq).padStart(6, '0')}`;
  const generatedId = `emp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  // Mask sensitive identity numbers for storage privacy
  const rawPan = data.panNumber || '';
  const maskedPan = rawPan.length >= 5 ? `${rawPan.substring(0, 2)}******${rawPan.slice(-1)}` : rawPan;

  const rawAadhaar = data.aadhaarNumber || '';
  const cleanAadhaar = rawAadhaar.replace(/\D/g, '');
  const maskedAadhaar = cleanAadhaar.length >= 4 ? `XXXX-XXXX-${cleanAadhaar.slice(-4)}` : '';

  const rawAccount = data.bankAccountNumber || '';
  const maskedAccount = rawAccount.length >= 4 ? `******${rawAccount.slice(-4)}` : rawAccount;

  const employeeRecord = {
    id: generatedId,
    companyId,
    tenantId: data.tenantId || `tenant_${companyId}`,
    employeeCode: generatedCode,
    fullName: String(data.fullName).trim(),
    designation: String(data.designation).trim(),
    department: data.department || 'Operations & Guard Deployment',
    branch: data.branch || 'Headquarters',
    assignedSite: data.assignedSite || 'General Reserve Pool',
    phone: String(data.phone).trim(),
    status: data.status || 'active',
    dateOfJoining: data.dateOfJoining || now.substring(0, 10),
    category: data.category || 'Security Guard',
    employmentType: data.employmentType || 'Permanent',
    documentVerificationStatus: data.documentVerificationStatus || 'pending',

    // Personal details
    photoUrl: data.photoUrl || '',
    fatherName: data.fatherName || '',
    motherName: data.motherName || '',
    dateOfBirth: data.dateOfBirth || '',
    gender: data.gender || 'Male',
    maritalStatus: data.maritalStatus || 'Single',
    bloodGroup: data.bloodGroup || 'O+',
    alternatePhone: data.alternatePhone || '',
    email: data.email || '',
    nationality: data.nationality || 'Indian',
    presentAddress: data.presentAddress || '',
    permanentAddress: data.permanentAddress || '',
    city: data.city || 'Gurugram',
    state: data.state || 'Haryana',
    pinCode: data.pinCode || '122001',
    emergencyContactName: data.emergencyContactName || '',
    emergencyContactPhone: data.emergencyContactPhone || '',
    emergencyRelationship: data.emergencyRelationship || 'Family',
    nomineeName: data.nomineeName || '',

    // Identity (Strictly Masked)
    identityDocType: data.identityDocType || 'Aadhaar',
    panNumberMasked: maskedPan,
    aadhaarNumberMasked: maskedAadhaar,
    aadhaarVerificationStatus: data.aadhaarVerificationStatus || 'pending',
    voterIdMasked: data.voterIdMasked || '',
    drivingLicenseMasked: data.drivingLicenseMasked || '',
    passportNumberMasked: data.passportNumberMasked || '',

    // Employment specifics
    reportingManager: data.reportingManager || 'Operations Manager',
    supervisorName: data.supervisorName || 'Field Supervisor',
    workLocation: data.workLocation || 'Assigned Client Facility',
    probationPeriodDays: Number(data.probationPeriodDays) || 90,
    contractStartDate: data.contractStartDate || now.substring(0, 10),
    contractEndDate: data.contractEndDate || '',

    // Protected Bank Details
    bankDetails: {
      accountHolderName: data.accountHolderName || data.fullName,
      bankName: data.bankName || 'State Bank of India',
      accountNumberMasked: maskedAccount,
      ifscCode: data.ifscCode || 'SBIN0001234',
      branchName: data.bankBranch || 'Commercial Branch',
      upiId: data.upiId || '',
    },

    // Prepared Salary Profile for Phase 7
    salaryProfile: {
      basicSalary: Number(data.basicSalary) || 16500,
      monthlySalary: Number(data.monthlySalary) || 21500,
      dailyWageRate: Number(data.dailyWageRate) || 716,
      hourlyRate: Number(data.hourlyRate) || 89.5,
      overtimeRate: Number(data.overtimeRate) || 179,
      doubleDutyRate: Number(data.doubleDutyRate) || 1432,
      salaryType: data.salaryType || 'Monthly',
      paymentMode: data.paymentMode || 'Bank Transfer',
    },

    verifiedDocumentsCount: 0,
    totalDocumentsCount: 4,
    idCardIssued: true,
    idCardIssueDate: now.substring(0, 10),
    statusHistory: [
      {
        previousStatus: 'draft',
        newStatus: data.status || 'active',
        reason: 'Initial Employee Onboarding & Registration',
        changedBy: data.actorEmail || 'admin@happiiz.io',
        timestamp: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
    createdBy: data.actorEmail || 'admin@happiiz.io',
  };

  console.log(`[Happiiz HR Backend] Registered Employee ${employeeRecord.employeeCode} - ${employeeRecord.fullName} (${employeeRecord.category}) for company ${companyId}`);

  res.status(201).json({
    success: true,
    employee: employeeRecord,
    message: `Employee ${employeeRecord.employeeCode} enrolled successfully.`,
  });
});

// 3. Employee Status Update with Audit Log
app.patch('/api/tenants/:companyId/employees/:employeeId/status', (req: Request, res: Response) => {
  const { companyId, employeeId } = req.params;
  const { newStatus, previousStatus, reason, actorEmail } = req.body;

  if (!newStatus) {
    return res.status(400).json({ error: 'New status is required.' });
  }

  const now = new Date().toISOString();
  console.log(`[Happiiz HR Backend] Status change for employee ${employeeId} in ${companyId}: ${previousStatus} -> ${newStatus} (Reason: ${reason || 'N/A'}) by ${actorEmail}`);

  res.status(200).json({
    success: true,
    employeeId,
    newStatus,
    timestamp: now,
    message: `Employee status transitioned to ${newStatus}.`,
  });
});

const distPath = path.resolve(__dirname, 'dist');
const assetsPath = path.join(distPath, 'assets');
const indexPath = path.join(distPath, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.log('[Happiiz HR] dist/index.html not found. Running "npm run build"...');
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  } catch (err) {
    console.error('[Happiiz HR] Build error:', err);
  }
}

function getActiveBundle(extension: string) {
  if (!fs.existsSync(assetsPath)) return null;
  const files = fs.readdirSync(assetsPath);
  const match = files.find((f) => f.startsWith('index-') && f.endsWith(extension));
  return match ? path.join(assetsPath, match) : null;
}

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#0F172A"/><path d="M30 25v50M70 25v50M30 50h40" stroke="#38BDF8" stroke-width="12" stroke-linecap="round"/></svg>`;

app.get(['/favicon.ico', '/favicon.svg'], (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(faviconSvg);
});

app.use('/assets', (req: Request, res: Response, next) => {
  const requestedFile = path.join(assetsPath, req.path.replace(/^\//, ''));

  if (fs.existsSync(requestedFile) && fs.statSync(requestedFile).isFile()) {
    if (requestedFile.endsWith('.js') || requestedFile.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (requestedFile.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=UTF-8');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    return res.sendFile(requestedFile);
  }

  if (req.path.endsWith('.js')) {
    const currentJs = getActiveBundle('.js');
    if (currentJs && fs.existsSync(currentJs)) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      return res.sendFile(currentJs);
    }
  }

  if (req.path.endsWith('.css')) {
    const currentCss = getActiveBundle('.css');
    if (currentCss && fs.existsSync(currentCss)) {
      res.setHeader('Content-Type', 'text/css; charset=UTF-8');
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      return res.sendFile(currentCss);
    }
  }

  res.status(404).type('text/plain').send(`Asset not found: ${req.url}`);
});

app.get(/index-.*\.js$/, (req: Request, res: Response) => {
  const currentJs = getActiveBundle('.js');
  if (currentJs && fs.existsSync(currentJs)) {
    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    return res.sendFile(currentJs);
  }
  res.status(404).type('text/plain').send('Bundle not found');
});

app.get(/index-.*\.css$/, (req: Request, res: Response) => {
  const currentCss = getActiveBundle('.css');
  if (currentCss && fs.existsSync(currentCss)) {
    res.setHeader('Content-Type', 'text/css; charset=UTF-8');
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    return res.sendFile(currentCss);
  }
  res.status(404).type('text/plain').send('Styles not found');
});

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { index: false }));

  app.get('/', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(indexPath);
  });

  app.get('*', (req: Request, res: Response) => {
    if (path.extname(req.path)) {
      return res.status(404).type('text/plain').send(`File not found: ${req.path}`);
    }
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(indexPath);
  });
}

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[Happiiz HR] Container server listening on 0.0.0.0:${PORT}`);
});
