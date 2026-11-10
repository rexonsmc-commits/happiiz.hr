/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole =
  | 'platform_owner'
  | 'super_admin'
  | 'company_admin'
  | 'hr_admin'
  | 'site_admin'
  | 'supervisor'
  | 'employee'
  | 'client';

export type IndustryType =
  | 'security'
  | 'housekeeping'
  | 'manpower'
  | 'facility_management'
  | 'other';

export type SubscriptionPlan = 'micro' | 'starter' | 'growth' | 'enterprise' | 'custom';

export type SubscriptionStatus = 'active' | 'trial' | 'suspended' | 'cancelled' | 'pending';
export type CompanyStatus = 'active' | 'trial' | 'pending' | 'suspended' | 'rejected' | 'archived';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  adminSubRole?: AdminRole;
  tenantId?: string;
  companyId?: string;
  associatedCompany?: string;
  phone?: string;
  avatarUrl?: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  updatedAt?: string;
}

export interface Company {
  id: string;
  tenantId: string;
  name: string;
  industry: IndustryType;
  companyType?: string;
  ownerName: string;
  adminEmail: string;
  adminName: string;
  phone: string;
  website?: string;
  address: string;
  city?: string;
  state?: string;
  pinCode?: string;
  country: string;
  currency: string;
  taxId?: string;
  gstNumber?: string;
  description?: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  verificationStatus?: 'verified' | 'pending' | 'rejected';
  approvalNotes?: string;
  verifiedBy?: string;
  subscriptionExpiry?: string;
  isArchived?: boolean;
  employeeCount: number;
  maxEmployees: number;
  monthlyFee: number;
  logoUrl?: string;
  primaryColor?: string;
  displayName?: string;
  directorName?: string;
  alternateNumber?: string;
  panNumber?: string;
  cinNumber?: string;
  registrationDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export type EmployeeCategory =
  | 'Security Guard'
  | 'Security Supervisor'
  | 'Security Officer'
  | 'Housekeeping Staff'
  | 'Housekeeping Supervisor'
  | 'Office Boy'
  | 'Helper'
  | 'Technician'
  | 'Manpower Worker'
  | 'Field Staff'
  | 'Other';

export type EmploymentType =
  | 'Permanent'
  | 'Temporary'
  | 'Contract'
  | 'Daily Wages'
  | 'Part Time'
  | 'Full Time';

export type EmployeeLifecycleStatus =
  | 'draft'
  | 'pending_joining'
  | 'active'
  | 'inactive'
  | 'on_leave'
  | 'suspended'
  | 'resigned'
  | 'terminated'
  | 'archived';

export type DocumentVerificationStatus =
  | 'pending'
  | 'uploaded'
  | 'under_review'
  | 'verified'
  | 'rejected'
  | 'expired';

export interface Employee {
  id: string;
  tenantId: string;
  companyId: string;
  employeeCode: string; // e.g. HHR-EMP-000001
  fullName: string;
  designation: string;
  department: string;
  branch: string;
  assignedSite?: string;
  phone: string;
  status: EmployeeLifecycleStatus;
  dateOfJoining: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;

  // A. Personal Information
  photoUrl?: string;
  fatherName?: string;
  motherName?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  bloodGroup?: string;
  alternatePhone?: string;
  email?: string;
  nationality?: string;
  presentAddress?: string;
  permanentAddress?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyRelationship?: string;
  nomineeName?: string;

  // B. Identity Information (Masked/Encrypted References)
  identityDocType?: 'Aadhaar' | 'PAN' | 'Voter ID' | 'Driving Licence' | 'Passport';
  panNumberMasked?: string; // Masked for non-authorized viewers: e.g. "ABCDE****F"
  aadhaarNumberMasked?: string; // Masked: e.g. "XXXX-XXXX-1234"
  aadhaarVerificationStatus?: 'verified' | 'pending' | 'unverified';
  voterIdMasked?: string;
  drivingLicenseMasked?: string;
  passportNumberMasked?: string;

  // C. Employment Information
  category: EmployeeCategory;
  employmentType: EmploymentType;
  reportingManager?: string;
  supervisorName?: string;
  workLocation?: string;
  probationPeriodDays?: number;
  contractStartDate?: string;
  contractEndDate?: string;

  // D. Bank Information (Restricted to authorized payroll/finance)
  bankDetails?: {
    accountHolderName: string;
    bankName: string;
    accountNumberMasked: string; // e.g. "******7890"
    ifscCode: string;
    branchName: string;
    upiId?: string;
  };

  // E. Salary Profile (Preparation for Phase 7 Payroll)
  salaryProfile?: {
    basicSalary: number;
    monthlySalary: number;
    dailyWageRate: number;
    hourlyRate: number;
    overtimeRate: number;
    doubleDutyRate: number;
    salaryType: 'Monthly' | 'Daily Wage' | 'Hourly' | 'Piece Rate';
    paymentMode: 'Bank Transfer' | 'Cheque' | 'Cash' | 'UPI';
  };

  // F. Lifecycle & Document Readiness Summary
  documentVerificationStatus: DocumentVerificationStatus;
  verifiedDocumentsCount?: number;
  totalDocumentsCount?: number;
  idCardIssued?: boolean;
  idCardIssueDate?: string;

  // G. Exit Management
  resignationDate?: string;
  lastWorkingDate?: string;
  exitReason?: string;
  noticePeriodDays?: number;
  handoverStatus?: 'Pending' | 'Completed';
  propertyReturnStatus?: 'Pending' | 'Returned';
  clearanceStatus?: 'Pending' | 'Approved';
  exitRemarks?: string;

  // H. Audit History
  statusHistory?: {
    previousStatus: EmployeeLifecycleStatus;
    newStatus: EmployeeLifecycleStatus;
    reason: string;
    changedBy: string;
    timestamp: string;
  }[];
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  tenantId: string;
  companyId: string;
  documentType:
    | 'Photo'
    | 'Identity Proof'
    | 'PAN Card'
    | 'Address Proof'
    | 'Educational Certificate'
    | 'Experience Certificate'
    | 'Police Verification'
    | 'Medical Fitness'
    | 'Bank Proof'
    | 'Agreement'
    | 'Joining Letter'
    | 'Other';
  fileName: string;
  fileSizeKb: number;
  fileUrl: string; // Secure Storage Reference
  uploadDate: string;
  expiryDate?: string;
  verificationStatus: DocumentVerificationStatus;
  uploadedBy: string;
  verifiedBy?: string;
  verificationDate?: string;
  remarks?: string;
}

export interface EmployeeAgreement {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  tenantId: string;
  companyId: string;
  agreementTitle: string;
  templateType: 'Standard Security Guard' | 'Supervisor Service' | 'Facility Staff' | 'Custom Contract';
  startDate: string;
  endDate?: string;
  status: 'draft' | 'generated' | 'awaiting_signature' | 'signed' | 'active' | 'expired' | 'terminated';
  termsAndConditions: string[];
  employeeSpecificClauses?: string;
  generatedPdfUrl?: string;
  signedDocumentUrl?: string;
  signedDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EmployeeJoiningRecord {
  id: string;
  employeeId: string;
  tenantId: string;
  companyId: string;
  joiningDate: string;
  designation: string;
  department: string;
  branch: string;
  offerLetterIssued: boolean;
  appointmentLetterIssued: boolean;
  joiningReportSigned: boolean;
  declarationSigned: boolean;
  documentChecklistCompleted: boolean;
  onboardingNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EmployeeExitRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  tenantId: string;
  companyId: string;
  resignationDate: string;
  lastWorkingDate: string;
  noticePeriodDays: number;
  exitReason: string;
  handoverCompleted: boolean;
  uniformsReturned: boolean;
  idCardReturned: boolean;
  equipmentReturned: boolean;
  accountsClearance: boolean;
  status: 'submitted' | 'under_review' | 'approved' | 'settled' | 'archived';
  relievingLetterIssued: boolean;
  experienceCertificateIssued: boolean;
  exitInterviewNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export type ClientType =
  | 'Private Company'
  | 'Public Company'
  | 'Private Limited'
  | 'Public Limited'
  | 'Partnership'
  | 'Proprietorship'
  | 'LLP'
  | 'Factory'
  | 'Hospital'
  | 'Office'
  | 'Residential Society'
  | 'Warehouse'
  | 'School or College'
  | 'Government Organization'
  | 'Other';

export type SiteCategory =
  | 'Security Site'
  | 'Housekeeping Site'
  | 'Manpower Site'
  | 'Facility Management Site'
  | 'Mixed Services Site'
  | 'Commercial IT Park'
  | 'Hospital & Healthcare'
  | 'Residential Gated Community'
  | 'Industrial Plant / Factory'
  | 'Retail Mall / Multiplex'
  | 'Educational Campus'
  | 'Warehouse & Logistics Hub'
  | 'Hotel & Hospitality'
  | 'Government Installation'
  | 'Financial Institution / Bank'
  | 'Construction Site'
  | 'Other';

export type ContractStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Active'
  | 'Expiring Soon'
  | 'Expired'
  | 'Suspended'
  | 'Terminated'
  | 'Renewed'
  | 'active'
  | 'pending'
  | 'expired'
  | 'terminated';

export type DeploymentStatus =
  | 'Pending'
  | 'Active'
  | 'Completed'
  | 'Transferred'
  | 'Cancelled'
  | 'active'
  | 'completed'
  | 'transferred'
  | 'cancelled';

export interface Client {
  id: string;
  clientId?: string;
  clientCode?: string;
  tenantId: string;
  companyId: string;
  clientName?: string;
  clientLegalName?: string;
  clientDisplayName?: string;
  tradeName?: string;
  clientType: ClientType;
  businessCategory?: string;
  industryCategory?: string;
  companyLogo?: string;
  gstNumber?: string;
  panNumber?: string;
  tanNumber?: string;
  cinNumber?: string;
  website?: string;
  websiteUrl?: string;
  clientEmail?: string;
  officialEmail?: string;
  mainContactNumber?: string;
  officialPhone?: string;
  alternateContactNumber?: string;
  clientDescription?: string;
  accountStatus: 'active' | 'inactive' | 'pending' | 'archived';

  // Authorized Contact Person
  contactPersonName: string;
  contactPersonDesignation?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  contactPersonDepartment?: string;

  // Billing Address
  billingName?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingPinCode?: string;
  billingEmail?: string;
  billingPhone?: string;

  // Business Address
  registeredAddress: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;

  // Relationship & Account Management
  clientRelationshipManager?: string;
  accountManager?: string;
  clientStartDate: string;
  internalRemarks?: string;

  // Computed/Aggregated
  totalSitesCount?: number;
  activeSitesCount?: number;
  activeContractsCount?: number;
  totalDeployedEmployees?: number;

  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface ClientSite {
  id: string;
  siteId?: string;
  tenantId: string;
  companyId: string;
  clientId: string; // Foreign key to Client
  clientName: string;
  siteName: string;
  siteCode: string; // e.g. REX-SITE-0001
  siteCategory?: SiteCategory;
  siteType: string; // Factory, Hospital, Corporate Office, etc.
  siteDescription?: string;
  status: 'active' | 'pending' | 'inactive' | 'completed' | 'archived';
  siteOpeningDate?: string;
  siteClosingDate?: string;

  // Site Address & GPS
  address: string;
  buildingName?: string;
  street?: string;
  area?: string;
  city: string;
  state: string;
  pinCode: string;
  country?: string;
  latitude?: number;
  longitude?: number;

  // Site Contacts & Administration
  contactPerson: string;
  contactNumber: string;
  siteContactEmail?: string;
  assignedBranch?: string;
  siteManagerName?: string;
  siteSupervisorName?: string;
  siteSupervisorId?: string;
  operationsManagerName?: string;
  clientRelationshipManagerName?: string;

  // Instructions & Requirements
  shiftDetails?: string;
  siteInstructions?: string;
  securityInstructions?: string;
  housekeepingInstructions?: string;
  emergencyInstructions?: string;

  // Workforce & Deployed Counts
  requiredEmployees: number;
  assignedEmployeesCount?: number;
  remainingVacancies?: number;

  // QR Code & Verification
  qrCodeUrl?: string;
  qrVerificationToken?: string;
  qrGeneratedAt?: string;

  createdBy?: string;
  createdAt: string;
  updatedAt?: string;

  // Compatibility fields
  location?: string;
  guardsRequired?: number;
  guardsDeployed?: number;
}

export interface ClientContract {
  id: string;
  contractNumber: string; // e.g. HHR-CON-2026-001
  tenantId: string;
  companyId: string;
  clientId: string;
  clientName: string;
  siteId?: string;
  siteName?: string;
  contractTitle: string;
  contractType: 'Security Services' | 'Housekeeping & Facility' | 'Manpower Supply' | 'Integrated Facility';
  startDate: string;
  endDate: string;
  renewalDate?: string;
  contractValue: number; // ₹ Total or Monthly Value
  billingFrequency: 'Monthly' | 'Quarterly' | 'Annually' | 'Per Shift';
  paymentTerms: string; // e.g. "Net 30 Days"
  status: ContractStatus;
  gstApplicability: boolean;
  gstRatePercent?: number; // 18%
  serviceDetails?: string;
  specialTerms?: string;
  signedContractUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SiteServiceItem {
  id: string;
  tenantId: string;
  companyId: string;
  siteId: string;
  siteName: string;
  serviceCategory: SiteCategory;
  serviceName: string; // Security Guard, Armed Guard, Housekeeper, etc.
  description?: string;
  status: 'active' | 'inactive';
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export interface SiteManpowerRequirement {
  id: string;
  tenantId: string;
  companyId: string;
  siteId: string;
  siteName: string;
  serviceCategory: SiteCategory;
  designation: string; // Security Guard, Supervisor, Housekeeping Staff
  requiredCount: number;
  assignedCount: number;
  vacanciesCount: number;
  shiftPattern: string; // e.g. "3 Shifts (8h) 24x7" or "Day Shift (12h)"
  skillRequirement?: string;
  experienceYears?: number;
  specialInstructions?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EmployeeDeployment {
  id: string;
  tenantId: string;
  companyId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  employeePhone?: string;
  employeePhotoUrl?: string;
  clientId: string;
  clientName: string;
  siteId: string;
  siteCode: string;
  siteName: string;
  designation: string;
  serviceCategory: SiteCategory;
  reportingSupervisorId?: string;
  reportingSupervisorName?: string;
  assignedDate: string;
  startDate: string;
  endDate?: string;
  status: DeploymentStatus;
  remarks?: string;
  transferredToSiteId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CommercialRate {
  id: string;
  tenantId: string;
  companyId: string;
  clientId: string;
  clientName: string;
  siteId?: string;
  siteName?: string;
  serviceName: string;
  designation: string;
  rateType: 'Per Employee Per Month' | 'Per Employee Per Day' | 'Per Hour' | 'Fixed Monthly Contract';
  clientBillingRate: number; // What the client is charged (₹)
  employeeWageRate: number; // Base wage payable to staff (₹) - Strictly segregated!
  billingUnit: 'Per Head' | 'Per Shift' | 'Lump Sum';
  gstApplicable: boolean;
  serviceChargePercent?: number; // e.g. 10%
  overtimeBillingRate?: number;
  effectiveFrom: string;
  effectiveUntil?: string;
  remarks?: string;
  createdAt: string;
}

export interface SiteDocumentItem {
  id: string;
  tenantId: string;
  companyId: string;
  clientId?: string;
  siteId?: string;
  documentName: string;
  documentType:
    | 'Client Agreement'
    | 'Site Agreement'
    | 'Work Order'
    | 'Purchase Order'
    | 'Site Instructions'
    | 'Site Layout / Blueprint'
    | 'Safety & Fire NOC'
    | 'Compliance Checklist'
    | 'Other';
  fileUrl: string;
  uploadDate: string;
  expiryDate?: string;
  documentStatus: 'valid' | 'expiring_soon' | 'expired';
  uploadedBy: string;
  verifiedBy?: string;
  remarks?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  category: 'auth' | 'security' | 'billing' | 'tenant' | 'workforce' | 'approval' | 'settings' | 'role';
  details: string;
  targetRecord?: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface SystemMetric {
  totalTenants: number;
  activeTenants: number;
  pendingTenants: number;
  suspendedTenants: number;
  totalWorkforce: number;
  totalMrr: number;
  totalUsers: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  message: string;
  timestamp: string;
  status: 'unread' | 'read' | 'replied';
}

// ==========================================
// Phase 2: Super Admin & SaaS Engine Models
// ==========================================

export type AdminRole =
  | 'platform_owner'
  | 'super_admin'
  | 'finance_admin'
  | 'support_admin'
  | 'verification_admin'
  | 'auditor';

export interface SubscriptionPlanItem {
  id: string;
  name: string;
  code: string;
  minEmployees: number;
  maxEmployees: number;
  pricePerEmployee: number; // ₹ per employee
  minMonthlyFee: number; // ₹ minimum monthly floor
  billingCycle: 'monthly' | 'annual';
  annualDiscountPercent: number; // e.g. 15% discount for annual
  trialDays: number;
  gracePeriodDays: number;
  features: string[];
  storageLimitMb: number;
  apiCallsLimit: number;
  status: 'active' | 'inactive' | 'archived';
  isPopular?: boolean;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantSubscription {
  id: string;
  companyId: string;
  tenantId: string;
  companyName: string;
  planId: string;
  planCode: string;
  planName: string;
  billingCycle: 'monthly' | 'annual';
  status:
    | 'trial'
    | 'active'
    | 'pending_payment'
    | 'payment_failed'
    | 'grace_period'
    | 'expired'
    | 'suspended'
    | 'cancelled';
  currentEmployees: number;
  billableEmployees: number;
  ratePerEmployee: number;
  minMonthlyFee: number;
  calculatedMonthlyFee: number;
  discountPercent: number;
  startDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextRenewalDate: string;
  gracePeriodEndDate?: string;
  trialEndDate?: string;
  lastPaymentId?: string;
  lastInvoiceId?: string;
  notes?: string;
  updatedAt: string;
}

export interface SubscriptionInvoice {
  id: string;
  invoiceNumber: string; // e.g. HAP-INV-2026-00101
  companyId: string;
  tenantId: string;
  companyName: string;
  customerGst?: string;
  customerAddress: string;
  customerPhone?: string;
  customerEmail?: string;
  planCode: string;
  planName: string;
  billingPeriod: string;
  billingCycle: 'monthly' | 'annual';
  activeEmployees: number;
  onLeaveEmployees: number;
  billableEmployees: number;
  ratePerEmployee: number;
  minimumMonthlyFee: number;
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstRate: number; // e.g. 9%
  cgstAmount: number;
  sgstRate: number; // e.g. 9%
  sgstAmount: number;
  igstRate: number; // e.g. 18%
  igstAmount: number;
  totalAmount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'void' | 'cancelled';
  dueDate: string;
  issueDate: string;
  paidAt?: string;
  paymentMethod?: string;
  paymentReference?: string;
  createdAdminEmail: string;
  notes?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  companyId: string;
  tenantId: string;
  companyName: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethod: 'razorpay' | 'stripe' | 'upi' | 'bank_transfer' | 'cheque' | 'cash';
  paymentDate: string;
  status: 'successful' | 'pending' | 'failed' | 'refunded' | 'partially_refunded';
  transactionReference: string;
  notes?: string;
  receiptUrl?: string;
  recordedBy: string;
  createdAt: string;
}

export interface PlatformAdminUser {
  id: string;
  email: string;
  name: string;
  adminRole: AdminRole;
  permissions: string[];
  status: 'active' | 'suspended';
  assignedAt: string;
  lastLogin?: string;
}

export interface SupportTicket {
  id: string;
  ticketCode: string;
  companyId: string;
  tenantId: string;
  companyName: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_for_customer' | 'resolved' | 'closed';
  assignedAdminName?: string;
  assignedAdminEmail?: string;
  createdByEmail: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface PlatformSettings {
  id?: string;
  platformName: string;
  platformLogo: string;
  supportEmail: string;
  supportPhone: string;
  defaultCurrency: string;
  defaultTimeZone: string;
  defaultLanguage: string;
  requireApprovalForRegistration: boolean;
  defaultTrialDays: number;
  defaultGracePeriodDays: number;
  defaultGstRate: number; // 18%
  isInterStateIgstDefault: boolean;
  invoicePrefix: string;
  nextInvoiceSeq: number;
  maintenanceMode: boolean;
  companyTermsUrl: string;
  privacyPolicyUrl: string;
  updatedAt?: string;
}

export interface CompanyUsage {
  companyId: string;
  tenantId: string;
  companyName: string;
  activeEmployees: number;
  maxEmployees: number;
  registeredUsers: number;
  storageUsedMb: number;
  storageLimitMb: number;
  documentCount: number;
  monthlyApiCalls: number;
  apiCallsLimit: number;
  siteCount: number;
  monthlyAttendanceRecords: number;
  usagePercent: number;
}

export interface EmployeeCountSnapshot {
  id: string;
  tenantId: string;
  companyId: string;
  period: string; // e.g. "2026-11"
  activeEmployees: number;
  onLeaveEmployees: number;
  terminatedEmployees: number;
  billableCount: number;
  recordedAt: string;
}

// ==========================================
// Phase 3: Company Admin & Tenant Models
// ==========================================

export interface CompanyUser {
  id: string;
  uid?: string;
  tenantId: string;
  companyId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  mobileNumber?: string;
  designation?: string;
  department?: string;
  departmentId?: string;
  departmentName?: string;
  branch?: string;
  branchId?: string;
  branchName?: string;
  roleId?: string;
  roleName?: string;
  assignedRoleId: string;
  assignedRoleName: string;
  accountStatus: 'active' | 'deactivated' | 'suspended';
  status?: 'active' | 'inactive' | 'suspended';
  joiningDate?: string;
  lastLoginAt?: string;
  avatarUrl?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CompanyRole {
  id: string;
  tenantId: string;
  companyId: string;
  name?: string;
  roleName: string;
  roleCode?: string;
  description?: string;
  roleDescription?: string;
  isSystemRole: boolean;
  status?: 'active' | 'inactive';
  permissions: string[];
  userCount?: number;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CompanyDepartment {
  id: string;
  tenantId: string;
  companyId: string;
  name: string;
  code: string;
  description?: string;
  headOfDepartment?: string;
  headEmail?: string;
  headUserId?: string;
  headUserName?: string;
  status: 'active' | 'inactive';
  userCount?: number;
  employeeCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CompanyBranch {
  id: string;
  tenantId: string;
  companyId: string;
  name?: string;
  branchName: string;
  code?: string;
  branchCode: string;
  managerName?: string;
  branchManager?: string;
  contactNumber?: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pinCode?: string;
  isHeadquarters?: boolean;
  userCount?: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface CompanyFullSettings {
  companyId?: string;
  tenantId?: string;
  updatedBy?: string;
  general: {
    companyLegalName: string;
    displayName: string;
    companyType?: string;
    ownerName?: string;
    directorName?: string;
    logoUrl?: string;
    companyEmail: string;
    contactNumber: string;
    alternateNumber?: string;
    gstNumber?: string;
    panNumber?: string;
    cinNumber?: string;
    businessAddress: string;
    city: string;
    state: string;
    pinCode: string;
    website?: string;
    description?: string;
  };
  regional: {
    country: string;
    state?: string;
    timeZone: string;
    dateFormat: string;
    currency: string;
    language: string;
  };
  notifications: {
    emailAlerts: boolean;
    smsAlerts: boolean;
    systemAlerts?: boolean;
    shiftVacancies?: boolean;
    dailyMuster?: boolean;
  };
  security: {
    passwordMinLength: number;
    requireSpecialChar: boolean;
    sessionTimeoutMinutes: number;
    multiFactorAuth?: boolean;
    twoFactorEnabled?: boolean;
  };
  documents: {
    maxFileSizeMb: number;
    allowedExtensions: string[];
    autoWatermark: boolean;
  };
  business: {
    financialYearStart: string;
    workingDays?: string[];
    defaultBusinessType: string;
  };
  updatedAt?: string;
}

// ==========================================
// Phase 6: Attendance & Duty Roster Models
// ==========================================

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'half_day'
  | 'late'
  | 'early_leaving'
  | 'weekly_off'
  | 'holiday'
  | 'on_leave'
  | 'overtime'
  | 'missing_punch'
  | 'pending_approval'
  | 'rejected'
  | 'regularized';

export type AttendanceLocationStatus =
  | 'verified'
  | 'outside_geofence'
  | 'gps_unavailable'
  | 'low_accuracy'
  | 'permission_denied'
  | 'manual_required';

export type VerificationMethod =
  | 'GPS'
  | 'QR'
  | 'GPS_QR'
  | 'SUPERVISOR'
  | 'MANUAL';

export interface ShiftDefinition {
  id: string;
  tenantId: string;
  companyId: string;
  shiftName: string;
  shiftCode: string; // e.g. SH-MRN, SH-EVN, SH-NGT, SH-GEN
  startTime: string; // e.g. "06:00"
  endTime: string; // e.g. "14:00"
  breakDurationMinutes: number; // e.g. 60
  gracePeriodMinutes: number; // e.g. 15
  lateThresholdMinutes: number; // e.g. 30
  earlyLeavingThresholdMinutes: number; // e.g. 15
  overtimeEligible: boolean;
  isOvernight: boolean; // Flag for shifts crossing midnight (e.g. 22:00 to 06:00)
  status: 'active' | 'inactive';
  siteSpecificSiteId?: string;
  designation?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DutyRoster {
  id: string;
  tenantId: string;
  companyId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  clientId: string;
  clientName: string;
  siteId: string;
  siteCode: string;
  siteName: string;
  designation: string;
  shiftId: string;
  shiftName: string;
  dutyDate: string; // YYYY-MM-DD
  dutyStartTime: string;
  dutyEndTime: string;
  reportingSupervisorId?: string;
  reportingSupervisorName?: string;
  status: 'scheduled' | 'completed' | 'absent' | 'cancelled' | 'swapped';
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  tenantId: string;
  companyId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  clientId: string;
  clientName: string;
  siteId: string;
  siteCode: string;
  siteName: string;
  shiftId: string;
  shiftName: string;
  rosterId?: string;
  attendanceDate: string; // YYYY-MM-DD
  checkInAt?: string; // ISO 8601
  checkOutAt?: string; // ISO 8601
  checkInGps?: {
    lat: number;
    lng: number;
    accuracy: number;
    distanceMeters: number;
    withinGeofence: boolean;
  };
  checkOutGps?: {
    lat: number;
    lng: number;
    accuracy: number;
    distanceMeters: number;
    withinGeofence: boolean;
  };
  checkInVerificationMethod: VerificationMethod;
  checkOutVerificationMethod?: VerificationMethod;
  checkInQrToken?: string;
  attendanceStatus: AttendanceStatus;
  locationStatus: AttendanceLocationStatus;
  lateMinutes: number;
  earlyLeavingMinutes: number;
  scheduledDurationHours: number;
  actualDurationHours: number;
  breakDurationMinutes: number;
  netDurationHours: number;
  overtimeHours: number;
  isOvertime: boolean;
  isDoubleDuty: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  remarks?: string;
  exceptions?: string[]; // e.g. ["late_arrival", "outside_geofence"]
  isManual?: boolean;
  manualReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AttendanceEvent {
  id: string;
  tenantId: string;
  companyId: string;
  attendanceId: string;
  employeeId: string;
  eventType: 'check_in' | 'check_out' | 'geofence_breach' | 'qr_scanned' | 'correction_requested' | 'supervisor_verified';
  timestamp: string;
  gps?: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  deviceInfo?: string;
  recordedBy: string;
}

export interface OvertimeRequest {
  id: string;
  tenantId: string;
  companyId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  siteId: string;
  siteName: string;
  dutyDate: string;
  shiftId: string;
  shiftName: string;
  scheduledHours: number;
  actualHours: number;
  requestedOtHours: number;
  approvedOtHours: number;
  otType: 'regular_ot' | 'holiday_duty' | 'weekly_off_duty' | 'double_duty' | 'extra_shift';
  status: 'pending' | 'verified_by_supervisor' | 'approved_by_hr' | 'rejected';
  reason: string;
  supervisorRemarks?: string;
  verifiedBySupervisorId?: string;
  approvedByHrId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DoubleDutyRecord {
  id: string;
  tenantId: string;
  companyId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  siteId: string;
  siteName: string;
  dutyDate: string;
  primaryShiftId: string;
  primaryShiftName: string;
  additionalShiftId: string;
  additionalShiftName: string;
  additionalDutyDurationHours: number;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedByName?: string;
  remarks?: string;
  createdAt: string;
}

export interface WeeklyOffPolicy {
  id: string;
  tenantId: string;
  companyId: string;
  policyName: string;
  policyType: 'employee_specific' | 'site_specific' | 'shift_specific' | 'rotational';
  daysOfWeek: number[]; // 0 for Sunday, 6 for Saturday
  applicableSiteIds?: string[];
  applicableShiftIds?: string[];
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface CompanyHoliday {
  id: string;
  tenantId: string;
  companyId: string;
  holidayName: string;
  holidayDate: string; // YYYY-MM-DD
  holidayType: 'national' | 'state' | 'company' | 'site_specific';
  applicableSiteIds?: string[];
  applicableDepartmentIds?: string[];
  isMandatory: boolean;
  status: 'active' | 'cancelled';
  description?: string;
  createdAt: string;
}

export interface MissingPunchCorrection {
  id: string;
  tenantId: string;
  companyId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  siteId: string;
  siteName: string;
  attendanceDate: string;
  correctionType: 'missing_check_in' | 'missing_check_out' | 'both_punches' | 'incorrect_shift' | 'gps_failure' | 'qr_failure';
  previousCheckIn?: string;
  previousCheckOut?: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  reason: string;
  supportingDocUrl?: string;
  supervisorStatus: 'pending' | 'verified' | 'rejected';
  hrStatus: 'pending' | 'approved' | 'rejected';
  supervisorRemarks?: string;
  hrRemarks?: string;
  verifiedBySupervisor?: string;
  approvedByHr?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface AttendancePeriodFinalization {
  id: string;
  tenantId: string;
  companyId: string;
  period: string; // YYYY-MM
  startDate: string;
  endDate: string;
  status: 'open' | 'under_review' | 'finalized' | 'reopened';
  totalScheduledDays: number;
  totalPresentDays: number;
  totalAbsentDays: number;
  totalOvertimeHours: number;
  totalDoubleDutyCount: number;
  finalizedBy?: string;
  finalizedByName?: string;
  finalizedAt?: string;
  reopenedBy?: string;
  reopenedAt?: string;
  remarks?: string;
  createdAt: string;
}

export interface PayrollReadyAttendanceSummary {
  id: string;
  tenantId: string;
  companyId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  designation: string;
  period: string; // e.g. "2026-11"
  assignedSiteId: string;
  assignedSiteName: string;
  totalScheduledShifts: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  approvedLeaveDays: number;
  weeklyOffDays: number;
  holidayDutyDays: number;
  regularWorkingHours: number;
  approvedOvertimeHours: number;
  approvedDoubleDutyCount: number;
  lateMinutes: number;
  earlyLeavingMinutes: number;
  finalizationStatus: 'open' | 'finalized';
  generatedAt: string;
}

// ==========================================
// Phase 7: Payroll & Salary Management Models
// ==========================================

export type SalaryType =
  | 'monthly'
  | 'daily'
  | 'hourly'
  | 'shift'
  | 'fixed_contract';

export type PayrollStatus =
  | 'draft'
  | 'calculated'
  | 'pending_approval'
  | 'approved'
  | 'finalized'
  | 'partially_paid'
  | 'paid'
  | 'cancelled';

export interface SalaryStructure {
  id: string;
  tenantId: string;
  companyId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  designation: string;
  department: string;
  clientId?: string;
  siteId?: string;
  siteName?: string;
  salaryType: SalaryType;
  basicSalary: number;
  hra: number;
  conveyanceAllowance: number;
  specialAllowance: number;
  otherAllowances: number;
  monthlyGrossSalary: number;
  dailyWageRate: number;
  hourlyRate: number;
  shiftRate: number;
  overtimeHourlyRate: number;
  doubleDutyShiftRate: number;
  holidayDutyRate: number;
  pfApplicable: boolean;
  esiApplicable: boolean;
  ptApplicable: boolean;
  tdsApplicable: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'active' | 'superseded' | 'archived';
  revisionNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SalaryRevision {
  id: string;
  tenantId: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  previousStructureId: string;
  newStructureId: string;
  effectiveDate: string;
  previousGross: number;
  newGross: number;
  incrementAmount: number;
  incrementPercent: number;
  reason: string;
  approvedBy: string;
  createdAt: string;
}

export interface EmployeeAdvance {
  id: string;
  tenantId: string;
  companyId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  advanceDate: string;
  advanceAmount: number;
  monthlyRecoveryAmount: number;
  recoveredAmount: number;
  outstandingAmount: number;
  paymentMode: 'bank_transfer' | 'cash' | 'upi' | 'cheque';
  referenceNumber?: string;
  approvedBy: string;
  status: 'active' | 'settled' | 'cancelled';
  remarks?: string;
  createdAt: string;
}

export interface AdvanceTransaction {
  id: string;
  tenantId: string;
  companyId: string;
  advanceId: string;
  employeeId: string;
  payrollRunId?: string;
  transactionDate: string;
  amount: number;
  transactionType: 'disbursement' | 'recovery' | 'waiver';
  remarks?: string;
  recordedBy: string;
}

export interface PayrollDeductionItem {
  id: string;
  tenantId: string;
  companyId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  deductionCategory: 'uniform' | 'shoes' | 'equipment' | 'id_card' | 'loan' | 'penalty' | 'other';
  description: string;
  originalAmount: number;
  monthlyDeductionAmount: number;
  totalDeductedAmount: number;
  remainingBalance: number;
  status: 'active' | 'settled' | 'pending_approval';
  approvedBy?: string;
  createdAt: string;
}

export interface StatutoryConfiguration {
  id: string;
  tenantId: string;
  companyId: string;
  pfEmployeePercent: number; // e.g. 12%
  pfEmployerPercent: number; // e.g. 12%
  pfWageCeiling: number; // e.g. 15,000
  esiEmployeePercent: number; // e.g. 0.75%
  esiEmployerPercent: number; // e.g. 3.25%
  esiWageCeiling: number; // e.g. 21,000
  ptSlabs: { minGross: number; maxGross: number; taxAmount: number }[];
  tdsStandardExemptionAnnual: number;
  standardDivisor: 26 | 30 | 'calendar_days';
  effectiveYear: string;
  updatedAt: string;
}

export interface PayrollRun {
  id: string;
  tenantId: string;
  companyId: string;
  period: string; // "2026-11"
  monthName: string;
  year: number;
  status: PayrollStatus;
  totalEmployees: number;
  totalGrossAmount: number;
  totalOvertimeAmount: number;
  totalDoubleDutyAmount: number;
  totalDeductionsAmount: number;
  totalNetAmount: number;
  totalEmployerContribution: number;
  totalAdvancesRecovered: number;
  preparedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  finalizedBy?: string;
  finalizedAt?: string;
  reopenedBy?: string;
  reopenedAt?: string;
  reopenReason?: string;
  paidCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PayrollEntry {
  id: string;
  tenantId: string;
  companyId: string;
  payrollRunId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  designation: string;
  department: string;
  siteId: string;
  siteName: string;
  period: string;
  salaryType: SalaryType;
  paymentMode: 'bank_transfer' | 'cash' | 'upi' | 'cheque';
  bankAccountMasked?: string;
  ifscCode?: string;
  bankName?: string;
  panNumberMasked?: string;
  scheduledDays: number;
  payableDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  paidLeaveDays: number;
  weeklyOffDays: number;
  holidayDays: number;
  overtimeHours: number;
  doubleDutyCount: number;
  basicEarned: number;
  hraEarned: number;
  allowancesEarned: number;
  overtimeAmount: number;
  doubleDutyAmount: number;
  holidayDutyAmount: number;
  bonusAmount: number;
  totalGrossSalary: number;
  pfEmployee: number;
  esiEmployee: number;
  ptAmount: number;
  tdsAmount: number;
  advanceDeduction: number;
  uniformEquipmentDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netPayable: number;
  pfEmployer: number;
  esiEmployer: number;
  totalCostToCompany: number;
  paymentStatus: 'unpaid' | 'pending' | 'processing' | 'paid' | 'failed';
  transactionRef?: string;
  paidAt?: string;
  remarks?: string;
}

export interface SalarySlip {
  id: string;
  tenantId: string;
  companyId: string;
  payrollRunId: string;
  payrollEntryId: string;
  employeeId: string;
  period: string;
  netSalary: number;
  generatedAt: string;
  downloadCount: number;
}

export interface BankPaymentStatement {
  id: string;
  tenantId: string;
  companyId: string;
  payrollRunId: string;
  period: string;
  totalAmount: number;
  totalCount: number;
  paymentMode: 'NEFT_RTGS' | 'UPI' | 'CASH';
  status: 'generated' | 'reconciled';
  fileExportDate: string;
  entries: {
    employeeId: string;
    employeeName: string;
    employeeCode: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
    amount: number;
    remarks: string;
  }[];
}

// ==========================================
// Phase 8: Client Billing, GST Invoicing & Payments Models
// ==========================================

export type BillingRateType =
  | 'per_month'
  | 'per_day'
  | 'per_hour'
  | 'per_shift'
  | 'fixed_contract'
  | 'quantity_based';

export type InvoiceStatus =
  | 'draft'
  | 'pending_review'
  | 'pending_approval'
  | 'approved'
  | 'finalized'
  | 'sent'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export type InvoiceType =
  | 'monthly_tax_invoice'
  | 'site_wise_invoice'
  | 'supplementary_invoice'
  | 'additional_services_invoice'
  | 'one_time_invoice';

export type ClientPaymentStatus =
  | 'pending'
  | 'received'
  | 'partially_received'
  | 'reconciled'
  | 'failed'
  | 'reversed';

export type ClientPaymentMode =
  | 'bank_transfer'
  | 'upi'
  | 'cheque'
  | 'cash'
  | 'other';

export interface RateCardItem {
  id: string;
  tenantId: string;
  companyId: string;
  clientId: string;
  clientName: string;
  contractId?: string;
  siteId?: string;
  siteName?: string;
  serviceCategory: 'security' | 'housekeeping' | 'manpower' | 'facility_management';
  designation: string; // e.g. Security Guard, Security Supervisor, Housekeeper
  rateType: BillingRateType;
  clientBillingRate: number; // ₹ charged to client
  overtimeHourlyRate: number; // ₹ OT rate charged to client
  doubleDutyShiftRate: number; // ₹ Additional shift rate charged to client
  hsnSacCode: string; // e.g. "998525" (Security), "998513" (Cleaning)
  taxRatePercent: number; // Default 18%
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BillingPolicy {
  id: string;
  tenantId: string;
  companyId: string;
  clientId: string;
  contractId?: string;
  policyName: string;
  calculationMethod:
    | 'fixed_monthly'
    | 'actual_present_days'
    | 'calendar_day_rate'
    | 'per_shift'
    | 'minimum_guaranteed';
  divisorDays: 26 | 30 | 'calendar_days';
  deductAbsentDays: boolean;
  minGuaranteedStaffingCount?: number;
  otBillingMultiplier?: number;
  createdAt: string;
}

export interface AdditionalServiceItem {
  id: string;
  tenantId: string;
  companyId: string;
  clientId: string;
  siteId?: string;
  serviceName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  hsnSacCode: string;
  taxRate: number;
  totalAmount: number;
  isRecurring: boolean;
  status: 'active' | 'billed' | 'cancelled';
  createdAt: string;
}

export interface ServiceChargeConfig {
  id: string;
  tenantId: string;
  companyId: string;
  clientId: string;
  chargeType: 'percentage' | 'fixed' | 'per_employee' | 'per_site';
  chargeValue: number;
  taxTreatment: 'taxable_under_gst' | 'exempt';
  status: 'active' | 'inactive';
}

export interface InvoiceLineItem {
  id: string;
  serviceCategory: string;
  designation: string;
  description: string;
  hsnSacCode: string;
  siteName: string;
  deployedCount: number;
  billableDays: number;
  rateType: BillingRateType;
  unitRate: number;
  baseAmount: number;
  overtimeHours: number;
  overtimeRate: number;
  overtimeAmount: number;
  doubleDutyCount: number;
  doubleDutyRate: number;
  doubleDutyAmount: number;
  discount: number;
  taxableValue: number;
  sourceAttendanceRecordIds?: string[];
}

export interface ClientInvoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  companyId: string;
  clientId: string;
  clientName: string;
  clientLegalName?: string;
  clientAddress: string;
  clientGstin: string;
  clientPan?: string;
  clientState: string;
  clientStateCode: string;
  placeOfSupply: string;
  siteId?: string;
  siteName?: string;
  contractId?: string;
  contractNumber?: string;
  invoiceType: InvoiceType;
  billingPeriod: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceLineItem[];
  additionalServices: AdditionalServiceItem[];
  subTotal: number;
  serviceChargePercent?: number;
  serviceChargeAmount: number;
  taxableAmount: number;
  isInterState: boolean;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalGst: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
  paidAmount: number;
  outstandingAmount: number;
  isFinalized: boolean;
  finalizedAt?: string;
  finalizedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  paymentTerms: string;
  bankDetails: {
    beneficiaryName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branchName: string;
    upiId?: string;
  };
  termsAndConditions: string;
  supplierGstin: string;
  supplierAddress: string;
  supplierStateCode: string;
  cancelledAt?: string;
  cancelReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DebitNoteItem {
  id: string;
  documentNumber: string;
  tenantId: string;
  companyId: string;
  clientId: string;
  clientName: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  documentDate: string;
  reason: string;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
  status: 'draft' | 'approved' | 'settled';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface CreditNoteItem {
  id: string;
  documentNumber: string;
  tenantId: string;
  companyId: string;
  clientId: string;
  clientName: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  documentDate: string;
  reason: string;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
  status: 'draft' | 'approved' | 'settled';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface ClientPaymentRecord {
  id: string;
  receiptNumber: string;
  tenantId: string;
  companyId: string;
  clientId: string;
  clientName: string;
  invoiceId: string;
  invoiceNumber: string;
  paymentDate: string;
  amountReceived: number;
  paymentMode: ClientPaymentMode;
  bankName?: string;
  referenceNumber: string;
  utrNumber?: string;
  chequeNumber?: string;
  status: ClientPaymentStatus;
  recordedBy: string;
  reconciledBy?: string;
  reconciledAt?: string;
  notes?: string;
  createdAt: string;
}

export interface ClientLedgerEntry {
  id: string;
  tenantId: string;
  companyId: string;
  clientId: string;
  clientName: string;
  transactionDate: string;
  entryType: 'INVOICE' | 'PAYMENT' | 'DEBIT_NOTE' | 'CREDIT_NOTE' | 'OPENING_BALANCE';
  referenceNumber: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  runningBalance: number;
  createdAt: string;
}

export interface GstConfiguration {
  id: string;
  tenantId: string;
  companyId: string;
  supplierLegalName: string;
  supplierTradeName: string;
  supplierGstin: string;
  supplierPan: string;
  stateName: string;
  stateCode: string;
  registeredAddress: string;
  defaultSecuritySacCode: string;
  defaultHousekeepingSacCode: string;
  defaultManpowerSacCode: string;
  standardGstRate: number;
  reverseChargeApplicable: boolean;
  invoiceNumberPrefix: string;
  financialYear: string;
  nextInvoiceSequence: number;
  updatedAt: string;
}

export interface ClientProfitabilityReport {
  id: string;
  clientId: string;
  clientName: string;
  siteId?: string;
  siteName?: string;
  period: string;
  billedRevenue: number;
  serviceChargeRevenue: number;
  overtimeBilledRevenue: number;
  additionalServiceRevenue: number;
  totalClientRevenue: number;
  workforceGrossWages: number;
  workforceOvertimeCost: number;
  workforceDoubleDutyCost: number;
  employerStatutoryCost: number;
  operationalCosts: number;
  totalCostOfService: number;
  estimatedGrossMargin: number;
  grossMarginPercentage: number;
  estimatedOperatingProfit: number;
}

// ==========================================
// Phase 9: Accounting & Financial Management Types
// ==========================================

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export type AccountSubCategory =
  | 'cash'
  | 'bank'
  | 'accounts_receivable'
  | 'advances'
  | 'current_asset'
  | 'fixed_asset'
  | 'accounts_payable'
  | 'salary_payable'
  | 'statutory_payable'
  | 'current_liability'
  | 'long_term_liability'
  | 'owner_equity'
  | 'retained_earnings'
  | 'direct_income'
  | 'indirect_income'
  | 'payroll_expense'
  | 'direct_operational_expense'
  | 'administrative_expense'
  | 'financial_expense'
  | 'depreciation_expense';

export interface ChartOfAccount {
  id: string;
  tenantId: string;
  companyId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  subCategory: AccountSubCategory;
  parentAccountId?: string;
  description: string;
  openingBalance: number;
  currentBalance: number;
  isSystemAccount: boolean;
  isActive: boolean;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  lineNarration?: string;
}

export type JournalReferenceType =
  | 'client_invoice'
  | 'client_payment'
  | 'client_credit_note'
  | 'client_debit_note'
  | 'payroll_salary'
  | 'salary_disbursement'
  | 'expense_voucher'
  | 'purchase_bill'
  | 'vendor_payment'
  | 'fixed_asset_purchase'
  | 'depreciation'
  | 'bank_contra'
  | 'manual_journal'
  | 'opening_balance'
  | 'period_closing';

export interface JournalEntry {
  id: string;
  tenantId: string;
  companyId: string;
  journalNumber: string;
  accountingDate: string;
  financialYear: string;
  financialPeriod: string;
  narration: string;
  referenceType: JournalReferenceType;
  referenceId?: string;
  totalDebit: number;
  totalCredit: number;
  status: 'draft' | 'posted' | 'reversed';
  lines: JournalLine[];
  createdBy: string;
  approvedBy?: string;
  postedAt?: string;
  isReversed?: boolean;
  reversalOfJournalId?: string;
  reversedByJournalId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CashTransaction {
  id: string;
  tenantId: string;
  companyId: string;
  voucherNumber: string;
  date: string;
  type: 'cash_in' | 'cash_out' | 'deposit_to_bank' | 'withdraw_from_bank';
  amount: number;
  accountId: string;
  accountName: string;
  description: string;
  referenceNumber?: string;
  paymentMode: 'cash';
  balanceAfter: number;
  approvedBy?: string;
  status: 'posted' | 'cancelled';
  journalId?: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  tenantId: string;
  companyId: string;
  bankName: string;
  accountName: string;
  accountNumberMasked: string;
  ifscCode: string;
  branchName: string;
  accountType: 'current' | 'savings' | 'overdraft' | 'escrow';
  openingBalance: number;
  currentBalance: number;
  bookBalance: number;
  isPrimary: boolean;
  status: 'active' | 'inactive';
  upiId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankTransaction {
  id: string;
  tenantId: string;
  companyId: string;
  bankAccountId: string;
  voucherNumber: string;
  transactionDate: string;
  type: 'credit' | 'debit';
  amount: number;
  contraBankAccountId?: string;
  contraCashAccountId?: string;
  description: string;
  utrNumber?: string;
  chequeNumber?: string;
  partyName?: string;
  referenceType?: JournalReferenceType;
  referenceId?: string;
  isReconciled: boolean;
  reconciliationDate?: string;
  reconciliationId?: string;
  balanceAfter: number;
  status: 'posted' | 'cleared' | 'bounced' | 'cancelled';
  journalId?: string;
  createdAt: string;
}

export interface BankReconciliation {
  id: string;
  tenantId: string;
  companyId: string;
  bankAccountId: string;
  statementDate: string;
  statementBalance: number;
  bookBalance: number;
  unreconciledChequesTotal: number;
  unreconciledDepositsTotal: number;
  adjustedBookBalance: number;
  difference: number;
  status: 'reconciled' | 'discrepant';
  reconciledBy: string;
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'office_rent'
  | 'electricity'
  | 'internet_telecom'
  | 'transport_fuel'
  | 'uniform_kits'
  | 'security_equipment'
  | 'cleaning_materials'
  | 'office_stationery'
  | 'software_licenses'
  | 'professional_legal_fees'
  | 'repairs_maintenance'
  | 'marketing_advertisement'
  | 'travel_food'
  | 'bank_charges'
  | 'miscellaneous';

export interface ExpenseRecord {
  id: string;
  tenantId: string;
  companyId: string;
  expenseNumber: string;
  expenseDate: string;
  category: ExpenseCategory;
  vendorId?: string;
  vendorName?: string;
  siteId?: string;
  siteName?: string;
  clientId?: string;
  clientName?: string;
  description: string;
  amount: number;
  taxableAmount: number;
  gstAmount: number;
  gstRate: number;
  isItcEligible: boolean;
  paymentMode: 'cash' | 'bank_transfer' | 'cheque' | 'upi';
  bankAccountId?: string;
  invoiceNumber?: string;
  receiptUrl?: string;
  status: 'draft' | 'approved' | 'rejected' | 'posted';
  approvedBy?: string;
  journalId?: string;
  paymentVoucherId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeRecord {
  id: string;
  tenantId: string;
  companyId: string;
  incomeNumber: string;
  date: string;
  category: 'security_services' | 'housekeeping_services' | 'manpower_supply' | 'consultancy' | 'interest_income' | 'other_income';
  clientName?: string;
  clientId?: string;
  description: string;
  amount: number;
  paymentMode: 'bank_transfer' | 'cash' | 'cheque' | 'upi';
  bankAccountId?: string;
  referenceNumber?: string;
  status: 'draft' | 'approved' | 'posted';
  journalId?: string;
  receiptVoucherId?: string;
  createdAt: string;
  updatedAt: string;
}

export type VendorCategory =
  | 'uniforms'
  | 'security_equipment'
  | 'cleaning_supplies'
  | 'office_supplies'
  | 'it_hardware'
  | 'facility_consumables'
  | 'professional_services'
  | 'logistics_transport'
  | 'other';

export interface Vendor {
  id: string;
  tenantId: string;
  companyId: string;
  vendorCode: string;
  vendorName: string;
  businessName: string;
  category: VendorCategory;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  gstin: string;
  pan: string;
  paymentTerms: string;
  bankDetails: {
    bankName: string;
    accountNumberMasked: string;
    ifscCode: string;
    branchName: string;
    upiId?: string;
  };
  openingBalance: number;
  currentBalance: number;
  totalBilled: number;
  totalPaid: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseBillItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitRate: number;
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
}

export interface PurchaseBill {
  id: string;
  tenantId: string;
  companyId: string;
  billNumber: string;
  vendorId: string;
  vendorName: string;
  vendorInvoiceNumber: string;
  billDate: string;
  dueDate: string;
  category: VendorCategory;
  items: PurchaseBillItem[];
  subTotal: number;
  discount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGst: number;
  isItcEligible: boolean;
  grandTotal: number;
  paidAmount: number;
  outstandingAmount: number;
  status: 'draft' | 'approved' | 'partially_paid' | 'paid' | 'posted';
  journalId?: string;
  paymentVoucherIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentVoucher {
  id: string;
  tenantId: string;
  companyId: string;
  voucherNumber: string;
  voucherDate: string;
  voucherType: 'vendor_payment' | 'expense_payment' | 'salary_payment' | 'advance_payment' | 'statutory_payment' | 'other_payment';
  payeeName: string;
  payeeType: 'vendor' | 'employee' | 'statutory' | 'utility' | 'other';
  payeeId?: string;
  debitAccountId: string;
  debitAccountName: string;
  creditAccountId: string;
  creditAccountName: string;
  amount: number;
  tdsDeducted?: number;
  netPaidAmount: number;
  paymentMode: 'cash' | 'bank_transfer' | 'cheque' | 'upi';
  bankAccountId?: string;
  chequeOrUtrNumber?: string;
  narration: string;
  referenceType?: string;
  referenceId?: string;
  journalId?: string;
  approvedBy?: string;
  status: 'posted' | 'cancelled';
  createdAt: string;
}

export interface ReceiptVoucher {
  id: string;
  tenantId: string;
  companyId: string;
  voucherNumber: string;
  voucherDate: string;
  voucherType: 'client_payment' | 'advance_receipt' | 'other_income' | 'cash_sale';
  receivedFrom: string;
  payerType: 'client' | 'other';
  payerId?: string;
  debitAccountId: string;
  debitAccountName: string;
  creditAccountId: string;
  creditAccountName: string;
  amount: number;
  tdsDeducted?: number;
  netReceivedAmount: number;
  paymentMode: 'cash' | 'bank_transfer' | 'cheque' | 'upi';
  bankAccountId?: string;
  chequeOrUtrNumber?: string;
  narration: string;
  referenceType?: string;
  referenceId?: string;
  journalId?: string;
  approvedBy?: string;
  status: 'posted' | 'cancelled';
  createdAt: string;
}

export interface GeneralLedgerEntry {
  id: string;
  tenantId: string;
  companyId: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  date: string;
  financialYear: string;
  voucherType: string;
  voucherNumber: string;
  referenceId?: string;
  narration: string;
  debit: number;
  credit: number;
  runningBalance: number;
  journalId: string;
  createdAt: string;
}

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  subCategory: AccountSubCategory;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
}

export interface AccountingPeriod {
  periodKey: string;
  monthName: string;
  startDate: string;
  endDate: string;
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
}

export interface FinancialYearConfig {
  id: string;
  tenantId: string;
  companyId: string;
  label: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isClosed: boolean;
  closedAt?: string;
  closedBy?: string;
  periods: AccountingPeriod[];
  createdAt: string;
  updatedAt: string;
}

export type FixedAssetCategory =
  | 'security_equipment'
  | 'vehicles'
  | 'it_computers'
  | 'furniture_fixtures'
  | 'cleaning_machinery'
  | 'office_equipment';

export interface FixedAssetRecord {
  id: string;
  tenantId: string;
  companyId: string;
  assetCode: string;
  assetName: string;
  category: FixedAssetCategory;
  purchaseDate: string;
  purchaseCost: number;
  vendorId?: string;
  vendorName?: string;
  invoiceNumber?: string;
  usefulLifeYears: number;
  salvageValue: number;
  depreciationMethod: 'straight_line' | 'written_down_value';
  depreciationRatePercentage: number;
  accumulatedDepreciation: number;
  currentBookValue: number;
  status: 'active' | 'disposed' | 'written_off';
  disposalDate?: string;
  disposalAmount?: number;
  lastDepreciationDate?: string;
  journalId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountingAuditLog {
  id: string;
  tenantId: string;
  companyId: string;
  timestamp: string;
  action: string;
  module: string;
  recordId: string;
  performedBy: string;
  details: string;
}




