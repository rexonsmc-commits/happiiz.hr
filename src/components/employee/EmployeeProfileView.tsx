/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Employee,
  Company,
  EmployeeDocument,
  EmployeeAgreement,
  EmployeeExitRecord,
  EmployeeLifecycleStatus,
} from '../../types';
import {
  updateCompanyEmployee,
  changeEmployeeStatus,
  getEmployeeDocuments,
  uploadEmployeeDocument,
  verifyEmployeeDocument,
  getEmployeeAgreements,
  createEmployeeAgreement,
  submitEmployeeExitRecord,
} from '../../services/tenantService';
import { EmployeeIdCardGenerator } from './EmployeeIdCardGenerator';
import {
  User,
  Shield,
  CreditCard,
  FileText,
  Clock,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building2,
  AlertCircle,
  CheckCircle2,
  X,
  Upload,
  Eye,
  Download,
  Printer,
  Edit2,
  Trash2,
  UserX,
  RefreshCw,
  Lock,
  ExternalLink,
  ChevronRight,
  FileCheck,
  Award,
  LogOut,
  FolderOpen,
} from 'lucide-react';

interface EmployeeProfileViewProps {
  employee: Employee;
  company: Company;
  onBack: () => void;
  onUpdate: (updated: Employee) => void;
}

export const EmployeeProfileView: React.FC<EmployeeProfileViewProps> = ({
  employee,
  company,
  onBack,
  onUpdate,
}) => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'personal'
    | 'employment'
    | 'documents'
    | 'idcard'
    | 'bank'
    | 'salary'
    | 'agreements'
    | 'exit'
    | 'activity'
  >('overview');

  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [agreements, setAgreements] = useState<EmployeeAgreement[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Status Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<EmployeeLifecycleStatus>(employee.status);
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Document Upload Modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docType, setDocType] = useState<any>('Police Verification');
  const [docFileName, setDocFileName] = useState('');
  const [docFileUrl, setDocFileUrl] = useState('');
  const [docRemarks, setDocRemarks] = useState('');

  // Agreement Modal
  const [isAgrModalOpen, setIsAgrModalOpen] = useState(false);
  const [agrTitle, setAgrTitle] = useState('Security Guard Service Contract');
  const [agrTemplate, setAgrTemplate] = useState<any>('Standard Security Guard');
  const [agrClauses, setAgrClauses] = useState('');

  // Exit Modal
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [exitReason, setExitReason] = useState('Personal reasons / relocation');
  const [lastWorkingDate, setLastWorkingDate] = useState(new Date().toISOString().substring(0, 10));
  const [handoverDone, setHandoverDone] = useState(true);
  const [uniformsReturned, setUniformsReturned] = useState(true);

  // Feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadSubcollections();
  }, [employee.id]);

  async function loadSubcollections() {
    setLoadingDocs(true);
    try {
      const [docList, agrList] = await Promise.all([
        getEmployeeDocuments(company.id, employee.id),
        getEmployeeAgreements(company.id, employee.id),
      ]);
      setDocuments(docList);
      setAgreements(agrList);
    } catch (err) {
      console.warn('Subcollection fetch note:', err);
    } finally {
      setLoadingDocs(false);
    }
  }

  // Status Change Handler
  async function handleStatusChangeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!statusReason.trim()) {
      setErrorMsg('A valid administrative reason is required to record status transitions.');
      return;
    }

    setIsUpdatingStatus(true);
    setErrorMsg(null);
    try {
      const updated = await changeEmployeeStatus(
        company.id,
        employee.id,
        newStatus,
        statusReason,
        currentUser?.email || 'admin@happiiz.io'
      );
      onUpdate(updated);
      setIsStatusModalOpen(false);
      setStatusReason('');
      setSuccessMsg(`Employee status transitioned to ${newStatus.toUpperCase()}`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update employee status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  // Document Upload Handler
  async function handleDocUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!docFileName.trim()) return;

    try {
      const newDoc = await uploadEmployeeDocument(
        company.id,
        employee.id,
        {
          tenantId: employee.tenantId,
          documentType: docType,
          fileName: docFileName.trim(),
          fileSizeKb: Math.floor(Math.random() * 800) + 200,
          fileUrl: docFileUrl || 'https://storage.googleapis.com/happiiz-hr-docs/vault/doc.pdf',
          verificationStatus: 'under_review',
          uploadedBy: currentUser?.email || 'admin@happiiz.io',
          remarks: docRemarks,
        },
        currentUser?.email || 'admin@happiiz.io'
      );
      setDocuments([newDoc, ...documents]);
      setIsDocModalOpen(false);
      setDocFileName('');
      setSuccessMsg(`Document "${newDoc.fileName}" registered and queued for verification.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to upload document.');
    }
  }

  // Document Verification
  async function handleVerifyDocument(docId: string, status: 'verified' | 'rejected') {
    try {
      const updatedDoc = await verifyEmployeeDocument(
        company.id,
        employee.id,
        docId,
        status,
        `Audited by ${currentUser?.email || 'admin@happiiz.io'}`,
        currentUser?.email || 'admin@happiiz.io'
      );
      setDocuments(documents.map((d) => (d.id === docId ? updatedDoc : d)));
      setSuccessMsg(`Document marked as ${status.toUpperCase()}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Verification update failed.');
    }
  }

  // Agreement Creation
  async function handleCreateAgreementSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const newAgr = await createEmployeeAgreement(
        company.id,
        employee.id,
        {
          employeeName: employee.fullName,
          employeeCode: employee.employeeCode,
          tenantId: employee.tenantId,
          agreementTitle: agrTitle,
          templateType: agrTemplate,
          startDate: employee.dateOfJoining,
          status: 'active',
          termsAndConditions: [
            'Adherence to client premise security & housekeeping protocol.',
            'Maintain zero-tolerance against unapproved leaves or shift desertion.',
            'Mandatory 30 days notice period for relieving clearance.',
          ],
          employeeSpecificClauses: agrClauses,
          signedDate: new Date().toISOString().substring(0, 10),
        },
        currentUser?.email || 'admin@happiiz.io'
      );
      setAgreements([newAgr, ...agreements]);
      setIsAgrModalOpen(false);
      setSuccessMsg(`Service agreement "${newAgr.agreementTitle}" registered.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Agreement generation failed.');
    }
  }

  // Exit Submission
  async function handleExitSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await submitEmployeeExitRecord(
        company.id,
        employee.id,
        {
          employeeName: employee.fullName,
          employeeCode: employee.employeeCode,
          tenantId: employee.tenantId,
          resignationDate: new Date().toISOString().substring(0, 10),
          lastWorkingDate,
          noticePeriodDays: 30,
          exitReason,
          handoverCompleted: handoverDone,
          uniformsReturned,
          idCardReturned: true,
          equipmentReturned: true,
          accountsClearance: true,
          status: 'approved',
          relievingLetterIssued: true,
          experienceCertificateIssued: true,
          approvedBy: currentUser?.email || 'admin@happiiz.io',
          approvedAt: new Date().toISOString(),
        },
        currentUser?.email || 'admin@happiiz.io'
      );
      onUpdate({ ...employee, status: 'resigned' });
      setIsExitModalOpen(false);
      setSuccessMsg('Employee exit record logged and relieving certificate authorized.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit exit record.');
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'personal', label: 'Personal & Family', icon: User },
    { id: 'employment', label: 'Employment & Post', icon: Building2 },
    { id: 'documents', label: `Documents (${documents.length})`, icon: FolderOpen },
    { id: 'idcard', label: 'Digital ID Card', icon: CreditCard },
    { id: 'bank', label: 'Bank Account', icon: CreditCard },
    { id: 'salary', label: 'Salary Profile (P7)', icon: FileText },
    { id: 'agreements', label: `Agreements (${agreements.length})`, icon: FileCheck },
    { id: 'exit', label: 'Exit & Clearance', icon: LogOut },
    { id: 'activity', label: 'Audit Trail', icon: Clock },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>

          <div className="flex items-center gap-3">
            <img
              src={
                employee.photoUrl ||
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
              }
              alt={employee.fullName}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {employee.employeeCode}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    employee.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : employee.status === 'suspended'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {employee.status}
                </span>
              </div>
              <h1 className="text-xl font-black text-slate-900 mt-0.5">{employee.fullName}</h1>
              <span className="text-xs text-slate-500 font-semibold">
                {employee.designation} • {employee.department} • {employee.branch}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsStatusModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <UserX className="w-4 h-4" />
            <span>Transition Status</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('idcard')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Digital ID Card</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-900 font-semibold animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Navigation - Multi-Line Wrap */}
      <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREAS */}

      {/* 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Quick Profile */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Summary</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Employment Category</span>
                <span className="font-bold text-slate-900">{employee.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Employment Type</span>
                <span className="font-bold text-slate-900">{employee.employmentType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Joining Date</span>
                <span className="font-bold text-slate-900">{employee.dateOfJoining}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Assigned Deployment Site</span>
                <span className="font-bold text-blue-700">{employee.assignedSite || 'Reserve Pool'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Document Status</span>
                <span className="font-bold text-emerald-600 capitalize">
                  {employee.documentVerificationStatus} ({documents.filter((d) => d.verificationStatus === 'verified').length}/{documents.length || 4})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Aadhaar KYC</span>
                <span className="font-mono font-bold text-slate-800">
                  {employee.aadhaarNumberMasked || 'XXXX-XXXX-9999'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsDocModalOpen(true)}
                className="w-full py-2.5 rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload KYC Document</span>
              </button>
            </div>
          </div>

          {/* Center & Right Column: Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Identity Card Mini Teaser */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-6 rounded-3xl shadow-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider block">
                  Identity Card Ready
                </span>
                <h4 className="text-base font-black text-white mt-0.5">
                  Digital Employee Pass • QR Verified
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-md">
                  Tamper-proof front/back ID card ready for guard deployment check-in and client site security compliance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('idcard')}
                className="px-4 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-xs font-black shrink-0 cursor-pointer shadow-md"
              >
                View ID Card
              </button>
            </div>

            {/* Documents Readiness Progress */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Document Verification Checklist</h3>
                  <p className="text-xs text-slate-500">Statutory PSARA police clearance, medical fitness & identity proofs.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('documents')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Manage All ({documents.length})
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {documents.slice(0, 4).map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-slate-900 block truncate">{d.documentType}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{d.fileName}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${
                        d.verificationStatus === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : d.verificationStatus === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {d.verificationStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PERSONAL DETAILS */}
      {activeTab === 'personal' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-black text-slate-900">Personal & Kin Information</h3>
            <p className="text-xs text-slate-500">Biological records, family dependents, and emergency contacts.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Father's Name</span>
              <span className="font-bold text-slate-900 text-sm">{employee.fatherName || 'Not recorded'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Mother's Name</span>
              <span className="font-bold text-slate-900 text-sm">{employee.motherName || 'Not recorded'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Date of Birth</span>
              <span className="font-bold text-slate-900 text-sm">{employee.dateOfBirth || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Gender & Marital Status</span>
              <span className="font-bold text-slate-900 text-sm">
                {employee.gender || 'Male'} • {employee.maritalStatus || 'Single'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Blood Group</span>
              <span className="font-bold text-rose-600 text-sm">{employee.bloodGroup || 'O+'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Nationality</span>
              <span className="font-bold text-slate-900 text-sm">{employee.nationality || 'Indian'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Present Living Address</span>
              <span className="font-bold text-slate-900 text-sm">{employee.presentAddress || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">City & State</span>
              <span className="font-bold text-slate-900 text-sm">
                {employee.city || 'Gurugram'}, {employee.state || 'Haryana'} ({employee.pinCode || '122001'})
              </span>
            </div>
            <div className="sm:col-span-3 p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
              <span className="text-rose-800 font-bold uppercase text-[10px] block">Emergency Contact</span>
              <div className="mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-extrabold text-slate-900 text-sm">{employee.emergencyContactName || 'Family Member'}</span>
                  <span className="text-slate-500 ml-2">({employee.emergencyRelationship || 'Relative'})</span>
                </div>
                <span className="font-mono font-bold text-rose-700 text-sm">
                  {employee.emergencyContactPhone || employee.phone}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. EMPLOYMENT DETAILS */}
      {activeTab === 'employment' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-black text-slate-900">Employment & Placement Parameters</h3>
            <p className="text-xs text-slate-500">Designation, department, reporting chain, and probation period.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Employee Code</span>
              <span className="font-mono font-bold text-blue-700 text-sm">{employee.employeeCode}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Designation</span>
              <span className="font-bold text-slate-900 text-sm">{employee.designation}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Department</span>
              <span className="font-bold text-slate-900 text-sm">{employee.department}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Operational Branch</span>
              <span className="font-bold text-slate-900 text-sm">{employee.branch}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Reporting Manager</span>
              <span className="font-bold text-slate-900 text-sm">{employee.reportingManager || 'Operations Manager'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Field Supervisor</span>
              <span className="font-bold text-slate-900 text-sm">{employee.supervisorName || 'Area Officer'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Assigned Site Post</span>
              <span className="font-bold text-emerald-700 text-sm">{employee.assignedSite || 'General Reserve Pool'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Probation Period</span>
              <span className="font-bold text-slate-900 text-sm">{employee.probationPeriodDays || 90} Days</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Contract Tenure</span>
              <span className="font-bold text-slate-900 text-sm">
                {employee.contractStartDate || employee.dateOfJoining} to {employee.contractEndDate || 'Continuous / Permanent'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. DOCUMENTS MANAGEMENT */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Document Management & Compliance Vault</h3>
              <p className="text-xs text-slate-500">
                Uploaded certificates, police clearance, medical certificates, and ID cards.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsDocModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {documents.map((docItem) => (
                <div key={docItem.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{docItem.documentType}</span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            docItem.verificationStatus === 'verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : docItem.verificationStatus === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {docItem.verificationStatus}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 block mt-0.5">{docItem.fileName}</span>
                      {docItem.remarks && (
                        <span className="text-[11px] text-slate-400 block mt-0.5 italic">
                          Note: {docItem.remarks}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {docItem.verificationStatus !== 'verified' && (
                      <button
                        type="button"
                        onClick={() => handleVerifyDocument(docItem.id, 'verified')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs cursor-pointer border border-emerald-200"
                      >
                        Approve / Verify
                      </button>
                    )}
                    {docItem.verificationStatus !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleVerifyDocument(docItem.id, 'rejected')}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs cursor-pointer border border-rose-200"
                      >
                        Reject
                      </button>
                    )}
                    <a
                      href={docItem.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. DIGITAL ID CARD GENERATOR */}
      {activeTab === 'idcard' && (
        <EmployeeIdCardGenerator employee={employee} company={company} />
      )}

      {/* 6. BANK ACCOUNT DETAILS */}
      {activeTab === 'bank' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Protected Bank Account Details</h3>
              <p className="text-xs text-slate-500">Access restricted to authorized payroll and finance administrators.</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Sensitive Data Masking Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Account Beneficiary</span>
              <span className="font-extrabold text-slate-900 text-sm">
                {employee.bankDetails?.accountHolderName || employee.fullName}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Bank Name</span>
              <span className="font-bold text-slate-900 text-sm">
                {employee.bankDetails?.bankName || 'State Bank of India'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Account Number (Masked)</span>
              <span className="font-mono font-black text-slate-900 text-base">
                {employee.bankDetails?.accountNumberMasked || '******7890'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">IFSC Code</span>
              <span className="font-mono font-bold text-blue-700 text-sm">
                {employee.bankDetails?.ifscCode || 'SBIN0001234'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Branch Location</span>
              <span className="font-bold text-slate-900 text-sm">
                {employee.bankDetails?.branchName || 'Commercial Branch'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">UPI Virtual Payment ID</span>
              <span className="font-mono font-bold text-slate-700 text-sm">
                {employee.bankDetails?.upiId || 'Not registered'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 7. SALARY PROFILE (PHASE 7 PREPARATION) */}
      {activeTab === 'salary' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Employment Wage Profile</h3>
              <p className="text-xs text-slate-500">
                Authorized rate cards configured for Phase 7 Automated Wage Disbursement.
              </p>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
              Phase 7 Ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Basic Salary</span>
              <span className="font-mono font-black text-slate-950 text-lg">
                ₹{employee.salaryProfile?.basicSalary?.toLocaleString() || '16,500'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Statutory base calculation</span>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <span className="text-blue-600 font-bold uppercase text-[10px] block">Monthly Gross CTC</span>
              <span className="font-mono font-black text-blue-950 text-lg">
                ₹{employee.salaryProfile?.monthlySalary?.toLocaleString() || '21,500'}
              </span>
              <span className="text-[10px] text-blue-600 block mt-0.5">Fixed month basis</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Overtime Hourly Rate</span>
              <span className="font-mono font-black text-slate-950 text-lg">
                ₹{employee.salaryProfile?.overtimeRate || '179'}/hr
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Double basic hourly</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Double Duty Shift Rate</span>
              <span className="font-mono font-black text-slate-950 text-lg">
                ₹{employee.salaryProfile?.doubleDutyRate || '1,432'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Consecutive 8h extra shift</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Disbursement Mode</span>
              <span className="font-bold text-slate-900 text-sm">
                {employee.salaryProfile?.paymentMode || 'Bank Transfer'}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Compensation Structure</span>
              <span className="font-bold text-slate-900 text-sm">
                {employee.salaryProfile?.salaryType || 'Monthly Fixed'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 8. AGREEMENTS */}
      {activeTab === 'agreements' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Employment Agreements & Service Contracts</h3>
              <p className="text-xs text-slate-500">Formal legal agreements governing post terms and conduct.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAgrModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/30"
            >
              <FileCheck className="w-4 h-4" />
              <span>Create Agreement</span>
            </button>
          </div>

          <div className="space-y-4">
            {agreements.map((agr) => (
              <div key={agr.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                      {agr.templateType}
                    </span>
                    <h4 className="text-base font-black text-slate-900 mt-0.5">{agr.agreementTitle}</h4>
                    <span className="text-xs text-slate-400">
                      Executed: {agr.startDate} {agr.endDate ? `• Valid through: ${agr.endDate}` : ''}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase">
                    {agr.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Standard Enforced Clauses</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
                    {agr.termsAndConditions.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                  {agr.employeeSpecificClauses && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="font-bold text-slate-900">Custom Clause:</span>{' '}
                      <span className="text-slate-600">{agr.employeeSpecificClauses}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. EXIT & CLEARANCE */}
      {activeTab === 'exit' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Employee Exit & Relieving Management</h3>
              <p className="text-xs text-slate-500">Resignation submission, clearance checklist, and relieving letter.</p>
            </div>
            {employee.status !== 'resigned' && employee.status !== 'terminated' && (
              <button
                type="button"
                onClick={() => setIsExitModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/30"
              >
                <LogOut className="w-4 h-4" />
                <span>Initiate Exit Process</span>
              </button>
            )}
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Current Status</span>
                <span className="font-black text-slate-900 capitalize text-sm">{employee.status}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Resignation Date</span>
                <span className="font-bold text-slate-800 text-sm">{employee.resignationDate || 'Not resigned'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Last Working Day</span>
                <span className="font-bold text-slate-800 text-sm">{employee.lastWorkingDate || 'Active in service'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">Mandatory Clearance Checklist</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">Uniforms Return</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">Badge & ID Return</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">Post Handover</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">Accounts NOC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. ACTIVITY TRAIL */}
      {activeTab === 'activity' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900">Historical Audit & Transition Trail</h3>
            <p className="text-xs text-slate-500">Immutable ledger of administrative actions and status updates.</p>
          </div>

          <div className="divide-y divide-slate-100">
            {(employee.statusHistory || []).map((h, i) => (
              <div key={i} className="py-3 flex items-start gap-3 text-xs">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      Transition: {h.previousStatus} → <span className="text-blue-700">{h.newStatus}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{h.timestamp.substring(0, 10)}</span>
                  </div>
                  <span className="text-slate-600 block mt-0.5">Reason: {h.reason}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Changed by: {h.changedBy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: STATUS TRANSITION ================= */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Transition Employee Status</h3>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusChangeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="active">Active (On Duty / Deployable)</option>
                  <option value="on_leave">On Leave (Approved Absence)</option>
                  <option value="suspended">Suspended (Disciplinary Review)</option>
                  <option value="resigned">Resigned (Notice Period)</option>
                  <option value="terminated">Terminated (Separated)</option>
                  <option value="archived">Archived (Historical Record)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Administrative Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Mandatory explanation recorded permanently in tenant audit trail..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  {isUpdatingStatus ? 'Updating...' : 'Commit Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DOCUMENT UPLOAD ================= */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Upload KYC / Compliance File</h3>
              <button
                type="button"
                onClick={() => setIsDocModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDocUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Type *</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="Identity Proof">Identity Proof (Aadhaar / Voter ID)</option>
                  <option value="Police Verification">Police Verification Certificate</option>
                  <option value="Medical Fitness">Medical Fitness Certificate</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Bank Proof">Bank Proof (Cancelled Cheque)</option>
                  <option value="Educational Certificate">Educational Certificate</option>
                  <option value="Experience Certificate">Experience Certificate</option>
                  <option value="Other">Other Certificate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document File Name *</label>
                <input
                  type="text"
                  required
                  value={docFileName}
                  onChange={(e) => setDocFileName(e.target.value)}
                  placeholder="e.g. Police_Clearance_2026.pdf"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Storage URL / File Path</label>
                <input
                  type="url"
                  value={docFileUrl}
                  onChange={(e) => setDocFileUrl(e.target.value)}
                  placeholder="https://storage.googleapis.com/.../doc.pdf"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Verification Remarks</label>
                <input
                  type="text"
                  value={docRemarks}
                  onChange={(e) => setDocRemarks(e.target.value)}
                  placeholder="Issuing authority, reference seal..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  Upload & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE AGREEMENT ================= */}
      {isAgrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Create Service Agreement</h3>
              <button
                type="button"
                onClick={() => setIsAgrModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAgreementSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Agreement Title *</label>
                <input
                  type="text"
                  required
                  value={agrTitle}
                  onChange={(e) => setAgrTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contract Template</label>
                <select
                  value={agrTemplate}
                  onChange={(e) => setAgrTemplate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="Standard Security Guard">Standard Security Guard</option>
                  <option value="Supervisor Service">Supervisor Service</option>
                  <option value="Facility Staff">Facility Staff</option>
                  <option value="Custom Contract">Custom Contract</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Custom Specific Terms</label>
                <textarea
                  rows={2}
                  value={agrClauses}
                  onChange={(e) => setAgrClauses(e.target.value)}
                  placeholder="Special allowances, weapon custody rules, or rotation terms..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAgrModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  Execute Agreement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EXIT RECORD ================= */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Initiate Exit & Relieving Clearance</h3>
              <button
                type="button"
                onClick={() => setIsExitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExitSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Last Working Day *</label>
                <input
                  type="date"
                  required
                  value={lastWorkingDate}
                  onChange={(e) => setLastWorkingDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Departure *</label>
                <textarea
                  required
                  rows={2}
                  value={exitReason}
                  onChange={(e) => setExitReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={handoverDone}
                    onChange={(e) => setHandoverDone(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Post Handover & Register Signoff Complete</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={uniformsReturned}
                    onChange={(e) => setUniformsReturned(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Uniforms, Torch & Company Assets Returned</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExitModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 cursor-pointer"
                >
                  Approve Relieving
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
