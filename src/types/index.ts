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

