/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Employee,
  EmployeeCategory,
  EmploymentType,
  CompanyDepartment,
  CompanyBranch,
} from '../../types';
import {
  createCompanyEmployee,
  getNextEmployeeCode,
} from '../../services/tenantService';
import {
  UserPlus,
  Building2,
  Shield,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Users,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Lock,
  Sparkles,
  Banknote,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

interface EmployeeRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEmployee: Employee) => void;
  departments: CompanyDepartment[];
  branches: CompanyBranch[];
  currentCount: number;
  maxCapacity: number;
}

export const EmployeeRegistrationModal: React.FC<EmployeeRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  departments,
  branches,
  currentCount,
  maxCapacity,
}) => {
  const { currentCompany, currentUser } = useAuth();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // SECTION A: Personal Information
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [maritalStatus, setMaritalStatus] = useState<'Single' | 'Married' | 'Divorced' | 'Widowed'>('Single');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [email, setEmail] = useState('');
  const [presentAddress, setPresentAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [city, setCity] = useState('Gurugram');
  const [state, setState] = useState('Haryana');
  const [pinCode, setPinCode] = useState('122001');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('Parent');
  const [nomineeName, setNomineeName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // SECTION B: Identity Information
  const [identityDocType, setIdentityDocType] = useState<'Aadhaar' | 'PAN' | 'Voter ID' | 'Driving Licence' | 'Passport'>('Aadhaar');
  const [rawPanNumber, setRawPanNumber] = useState('');
  const [rawAadhaarNumber, setRawAadhaarNumber] = useState('');
  const [voterId, setVoterId] = useState('');
  const [drivingLicense, setDrivingLicense] = useState('');

  // SECTION C: Employment Information
  const [customPrefix, setCustomPrefix] = useState('HHR-EMP');
  const [designation, setDesignation] = useState('Security Guard');
  const [category, setCategory] = useState<EmployeeCategory>('Security Guard');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('Permanent');
  const [department, setDepartment] = useState(departments[0]?.name || 'Operations & Guard Deployment');
  const [branch, setBranch] = useState(branches[0]?.branchName || 'Headquarters');
  const [assignedSite, setAssignedSite] = useState('General Reserve Deployment');
  const [dateOfJoining, setDateOfJoining] = useState(new Date().toISOString().substring(0, 10));
  const [reportingManager, setReportingManager] = useState('Operations Manager');
  const [supervisorName, setSupervisorName] = useState('Field Area Supervisor');
  const [workLocation, setWorkLocation] = useState('Assigned Client Premises');
  const [probationDays, setProbationDays] = useState(90);

  // SECTION D: Bank Information
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('State Bank of India');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('SBIN0001234');
  const [bankBranch, setBankBranch] = useState('Main Branch');
  const [upiId, setUpiId] = useState('');

  // SECTION E: Compensation Profile (Phase 7 Preparation)
  const [basicSalary, setBasicSalary] = useState(16500);
  const [monthlySalary, setMonthlySalary] = useState(21500);
  const [dailyWageRate, setDailyWageRate] = useState(716);
  const [hourlyRate, setHourlyRate] = useState(89.5);
  const [overtimeRate, setOvertimeRate] = useState(179);
  const [doubleDutyRate, setDoubleDutyRate] = useState(1432);
  const [salaryType, setSalaryType] = useState<'Monthly' | 'Daily Wage' | 'Hourly' | 'Piece Rate'>('Monthly');
  const [paymentMode, setPaymentMode] = useState<'Bank Transfer' | 'Cheque' | 'Cash' | 'UPI'>('Bank Transfer');

  if (!isOpen) return null;

  // Capacity Warning
  const isAtCapacity = currentCount >= maxCapacity;

  async function handleNextStep() {
    setErrorMsg(null);

    if (currentStep === 1) {
      if (!fullName.trim()) {
        setErrorMsg('Employee Full Name is required.');
        return;
      }
      if (!phone.trim() || phone.trim().length < 10) {
        setErrorMsg('Valid 10-digit primary mobile number is required.');
        return;
      }
      if (!dateOfBirth) {
        setErrorMsg('Date of Birth is required for statutory compliance (minimum 18 years).');
        return;
      }
    }

    if (currentStep === 2) {
      if (identityDocType === 'Aadhaar' && rawAadhaarNumber && rawAadhaarNumber.replace(/\D/g, '').length !== 12) {
        setErrorMsg('Aadhaar number must contain 12 numeric digits.');
        return;
      }
      if (rawPanNumber && rawPanNumber.trim().length !== 10) {
        setErrorMsg('PAN card number must contain exactly 10 alphanumeric characters (e.g., ABCDE1234F).');
        return;
      }
    }

    if (currentStep === 3) {
      if (!designation.trim()) {
        setErrorMsg('Designation is required.');
        return;
      }
    }

    if (currentStep < 6) {
      setCurrentStep((prev) => (prev + 1) as any);
    }
  }

  async function handleSubmitRegistration(e: React.FormEvent) {
    e.preventDefault();
    if (!currentCompany) return;

    if (isAtCapacity) {
      setErrorMsg(`Subscription workforce limit reached (${currentCount}/${maxCapacity}). Please upgrade plan.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const generatedCode = await getNextEmployeeCode(currentCompany.id, customPrefix);

      // Mask sensitive numbers before passing to persistence layer
      const cleanAadhaar = rawAadhaarNumber.replace(/\D/g, '');
      const maskedAadhaar = cleanAadhaar.length >= 4 ? `XXXX-XXXX-${cleanAadhaar.slice(-4)}` : '';

      const cleanPan = rawPanNumber.trim().toUpperCase();
      const maskedPan = cleanPan.length >= 5 ? `${cleanPan.substring(0, 2)}******${cleanPan.slice(-1)}` : cleanPan;

      const cleanAccount = accountNumber.trim();
      const maskedAccount = cleanAccount.length >= 4 ? `******${cleanAccount.slice(-4)}` : cleanAccount;

      const newEmp = await createCompanyEmployee(
        currentCompany.id,
        {
          tenantId: currentCompany.tenantId,
          employeeCode: generatedCode,
          fullName: fullName.trim(),
          designation: designation.trim(),
          department: department || 'Operations & Guard Deployment',
          branch: branch || 'Headquarters',
          assignedSite,
          phone: phone.trim(),
          status: 'active',
          dateOfJoining,
          category,
          employmentType,
          documentVerificationStatus: 'pending',

          // Personal
          photoUrl: photoUrl.trim() || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          fatherName,
          motherName,
          dateOfBirth,
          gender,
          maritalStatus,
          bloodGroup,
          alternatePhone,
          email,
          nationality: 'Indian',
          presentAddress,
          permanentAddress: permanentAddress || presentAddress,
          city,
          state,
          pinCode,
          emergencyContactName,
          emergencyContactPhone,
          emergencyRelationship,
          nomineeName,

          // Identity (Encrypted / Masked references)
          identityDocType,
          panNumberMasked: maskedPan,
          aadhaarNumberMasked: maskedAadhaar,
          aadhaarVerificationStatus: 'pending',
          voterIdMasked: voterId ? `***${voterId.slice(-4)}` : '',
          drivingLicenseMasked: drivingLicense ? `***${drivingLicense.slice(-4)}` : '',

          // Employment
          reportingManager,
          supervisorName,
          workLocation,
          probationPeriodDays: probationDays,
          contractStartDate: dateOfJoining,

          // Bank Details
          bankDetails: {
            accountHolderName: accountHolderName || fullName,
            bankName,
            accountNumberMasked: maskedAccount,
            ifscCode: ifscCode.toUpperCase(),
            branchName: bankBranch,
            upiId,
          },

          // Salary Profile (Phase 7 Integration)
          salaryProfile: {
            basicSalary: Number(basicSalary),
            monthlySalary: Number(monthlySalary),
            dailyWageRate: Number(dailyWageRate),
            hourlyRate: Number(hourlyRate),
            overtimeRate: Number(overtimeRate),
            doubleDutyRate: Number(doubleDutyRate),
            salaryType,
            paymentMode,
          },

          verifiedDocumentsCount: 0,
          totalDocumentsCount: 4,
          idCardIssued: true,
          idCardIssueDate: dateOfJoining,
          statusHistory: [
            {
              previousStatus: 'draft',
              newStatus: 'active',
              reason: 'Initial Employee Onboarding & Registration',
              changedBy: currentUser?.email || 'admin@happiiz.io',
              timestamp: new Date().toISOString(),
            },
          ],
        },
        currentUser?.email || 'admin@happiiz.io'
      );

      onSuccess(newEmp);
      onClose();
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMsg(err?.message || 'Failed to enroll employee.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                  Workforce Enrollment Engine
                </span>
                <h2 className="text-lg font-black text-white">Employee Registration (6-Step Lifecycle)</h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
            >
              Cancel (ESC)
            </button>
          </div>

          {/* Stepper Navigation */}
          <div className="grid grid-cols-6 gap-2 mt-6">
            {[
              { num: 1, label: 'Personal' },
              { num: 2, label: 'Identity' },
              { num: 3, label: 'Employment' },
              { num: 4, label: 'Bank' },
              { num: 5, label: 'Salary (P7)' },
              { num: 6, label: 'Review' },
            ].map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrentStep(s.num as any)}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border ${
                  currentStep === s.num
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/40'
                    : currentStep > s.num
                    ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                }`}
              >
                <span className="block text-[10px] opacity-75">Step {s.num}</span>
                <span className="truncate block">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Capacity Warning Banner */}
        {isAtCapacity && (
          <div className="bg-rose-50 border-b border-rose-200 p-4 text-xs text-rose-800 font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              Workforce Capacity Exceeded ({currentCount}/{maxCapacity} Employees). Please upgrade your plan in Subscriptions to allow additional enrollments.
            </span>
          </div>
        )}

        {/* Error Feedback */}
        {errorMsg && (
          <div className="m-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-bold flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmitRegistration} className="p-6 sm:p-8 space-y-6">
          {/* ================= STEP 1: PERSONAL INFORMATION ================= */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900">Step 1: Personal Information & Contact</h3>
                <p className="text-xs text-slate-500">Official biological, family, and emergency coordinates.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar Verma"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Father's Name *</label>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="e.g. Sh. Ram Lal"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mother's Name (Optional)</label>
                  <input
                    type="text"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    placeholder="e.g. Smt. Shanti Devi"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alternate Mobile</label>
                  <input
                    type="tel"
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value)}
                    placeholder="+91 98110 00000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Present Living Address</label>
                  <input
                    type="text"
                    value={presentAddress}
                    onChange={(e) => setPresentAddress(e.target.value)}
                    placeholder="House / Street / Colony"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City & State</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Gurugram, Haryana"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Person</label>
                  <input
                    type="text"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="e.g. Geeta Verma"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Number</label>
                  <input
                    type="tel"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee Photo URL (Optional)</label>
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: IDENTITY & KYC MASKING ================= */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Step 2: Identity & Statutory Verification</h3>
                    <p className="text-xs text-slate-500">Protected data masking prevents plain-text exposure.</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> Zero-Trust Masking Active
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Document Type *</label>
                  <select
                    value={identityDocType}
                    onChange={(e) => setIdentityDocType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="Aadhaar">Aadhaar Card (UIDAI)</option>
                    <option value="PAN">PAN Card (Income Tax)</option>
                    <option value="Voter ID">Voter ID (Election Commission)</option>
                    <option value="Driving Licence">Driving Licence (RTO)</option>
                    <option value="Passport">Passport</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Aadhaar Number (12 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={14}
                    value={rawAadhaarNumber}
                    onChange={(e) => setRawAadhaarNumber(e.target.value)}
                    placeholder="1234 5678 9012"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Storage preview: <strong>XXXX-XXXX-{rawAadhaarNumber.replace(/\D/g, '').slice(-4) || 'XXXX'}</strong>
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PAN Card Number (10 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={rawPanNumber}
                    onChange={(e) => setRawPanNumber(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="w-full px-3 py-2 text-xs font-mono uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Voter ID (EPIC Number)</label>
                  <input
                    type="text"
                    value={voterId}
                    onChange={(e) => setVoterId(e.target.value.toUpperCase())}
                    placeholder="DL/01/001/000000"
                    className="w-full px-3 py-2 text-xs font-mono uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Driving Licence Number (Optional)</label>
                  <input
                    type="text"
                    value={drivingLicense}
                    onChange={(e) => setDrivingLicense(e.target.value.toUpperCase())}
                    placeholder="HR-26-2020-000000"
                    className="w-full px-3 py-2 text-xs font-mono uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Statutory Privacy Rule:</strong> Full Aadhaar numbers are never stored in plain text or rendered on standard rosters. Non-authorized operators will only see masked identifiers.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: EMPLOYMENT INFORMATION ================= */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900">Step 3: Employment, Category & Post Assignment</h3>
                <p className="text-xs text-slate-500">Designation, operational branch, department, and ID prefix.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID Prefix</label>
                  <input
                    type="text"
                    value={customPrefix}
                    onChange={(e) => setCustomPrefix(e.target.value.toUpperCase())}
                    placeholder="HHR-EMP"
                    className="w-full px-3 py-2 text-xs font-mono uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Generates sequential IDs: {customPrefix}-00000X
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="Security Guard">Security Guard</option>
                    <option value="Security Supervisor">Security Supervisor</option>
                    <option value="Security Officer">Security Officer</option>
                    <option value="Housekeeping Staff">Housekeeping Staff</option>
                    <option value="Housekeeping Supervisor">Housekeeping Supervisor</option>
                    <option value="Office Boy">Office Boy / Peon</option>
                    <option value="Helper">Helper / Attendant</option>
                    <option value="Technician">Technician / CCTV Specialist</option>
                    <option value="Manpower Worker">Manpower Supply Worker</option>
                    <option value="Field Staff">Field Area Staff</option>
                    <option value="Other">Other Category</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employment Type *</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="Permanent">Permanent</option>
                    <option value="Temporary">Temporary</option>
                    <option value="Contract">Contract</option>
                    <option value="Daily Wages">Daily Wages</option>
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Designation *</label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Armed Security Guard"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Operational Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.branchName}>
                        {b.branchName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date *</label>
                  <input
                    type="date"
                    required
                    value={dateOfJoining}
                    onChange={(e) => setDateOfJoining(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reporting Operations Manager</label>
                  <input
                    type="text"
                    value={reportingManager}
                    onChange={(e) => setReportingManager(e.target.value)}
                    placeholder="Col. Rajesh Sharma"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Probation Period (Days)</label>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={probationDays}
                    onChange={(e) => setProbationDays(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: BANK DETAILS ================= */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900">Step 4: Bank & Wage Disbursement Details</h3>
                <p className="text-xs text-slate-500">Authorized accounts for direct salary transfer and PF/ESIC link.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder={fullName || 'Name on Bank Passbook'}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. State Bank of India"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="000000000000"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="SBIN0001234"
                    className="w-full px-3 py-2 text-xs font-mono uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank Branch</label>
                  <input
                    type="text"
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    placeholder="Main Commercial Branch"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID (Optional)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="guard@upi"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 5: SALARY PROFILE PREPARATION ================= */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Step 5: Compensation Profile (Phase 7 Payroll Prep)</h3>
                    <p className="text-xs text-slate-500">Stores wage parameters without triggering live disbursement.</p>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                    Future Payroll Ready
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Salary Frequency / Type</label>
                  <select
                    value={salaryType}
                    onChange={(e) => setSalaryType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="Monthly">Monthly Fixed Salary</option>
                    <option value="Daily Wage">Daily Wage Rate</option>
                    <option value="Hourly">Hourly Rate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="Bank Transfer">NEFT / RTGS Bank Transfer</option>
                    <option value="Cheque">Account Payee Cheque</option>
                    <option value="Cash">Cash Voucher</option>
                    <option value="UPI">Direct UPI Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Basic Pay (₹)</label>
                  <input
                    type="number"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gross Monthly CTC (₹)</label>
                  <input
                    type="number"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Overtime Hourly Rate (₹)</label>
                  <input
                    type="number"
                    value={overtimeRate}
                    onChange={(e) => setOvertimeRate(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Double Duty Shift Rate (₹)</label>
                  <input
                    type="number"
                    value={doubleDutyRate}
                    onChange={(e) => setDoubleDutyRate(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 6: ENROLLMENT REVIEW & SUBMIT ================= */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900">Step 6: Review Summary & Confirmation</h3>
                <p className="text-xs text-slate-500">Confirm all parameters before committing to tenant Firestore ledger.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Candidate Name</span>
                  <span className="font-extrabold text-slate-900">{fullName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Designation</span>
                  <span className="font-bold text-blue-700">{designation}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Category & Type</span>
                  <span className="font-bold text-slate-800">{category} ({employmentType})</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Assigned Hub</span>
                  <span className="font-bold text-slate-800">{branch} • {department}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Primary Contact</span>
                  <span className="font-mono font-bold text-slate-800">{phone}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Identity Record</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {identityDocType} (XXXX-XXXX-{rawAadhaarNumber.replace(/\D/g, '').slice(-4) || '9999'})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Bank & Mode</span>
                  <span className="font-bold text-slate-800">{bankName} ({paymentMode})</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Monthly Gross Compensation</span>
                  <span className="font-mono font-black text-slate-950">₹{monthlySalary.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Ready to enroll. An automated unique Employee ID, digital verification QR token, and audit history record will be generated.
                </span>
              </div>
            </div>
          )}

          {/* Stepper Footer Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Step</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  <span>Continue to Step {currentStep + 1}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || isAtCapacity}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Committing Record...' : 'Complete Registration'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
