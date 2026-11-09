/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  FileText,
  AlertCircle,
  Eye,
  ShieldCheck,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { Company } from '../../../types';
import { approveCompanyRegistration, rejectCompanyRegistration } from '../../../services/platformService';

interface ApprovalQueueModuleProps {
  companies: Company[];
  onRefresh: () => void;
  adminEmail: string;
}

export const ApprovalQueueModule: React.FC<ApprovalQueueModuleProps> = ({
  companies,
  onRefresh,
  adminEmail,
}) => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [notes, setNotes] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter for pending registration/verification
  const pendingCompanies = companies.filter(
    (c) => c.subscriptionStatus === 'pending' || c.verificationStatus === 'pending'
  );

  const handleDecision = async () => {
    if (!selectedCompany || !actionType) return;
    setIsProcessing(true);
    try {
      if (actionType === 'approve') {
        await approveCompanyRegistration(selectedCompany.id, adminEmail, notes);
      } else {
        await rejectCompanyRegistration(selectedCompany.id, adminEmail, notes || 'Application rejected.');
      }
      setSelectedCompany(null);
      setActionType(null);
      setNotes('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Registration & Verification Queue</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
              {pendingCompanies.length} Awaiting Verification
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Review onboarding applications submitted by security contractors, housekeeping companies, and manpower agencies. Workspaces remain locked until authorized approval.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Strict Audit Trail Enforced</span>
          </span>
        </div>
      </div>

      {/* Pending Items Grid */}
      {pendingCompanies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">All Applications Processed</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No pending company onboarding requests in the queue. All registered enterprise tenants have been verified and activated.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingCompanies.map((comp) => (
            <div
              key={comp.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-sky-300 font-black text-sm flex items-center justify-center shrink-0">
                      {comp.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{comp.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-bold">
                          {comp.tenantId}
                        </span>
                        <span className="text-[10px] text-slate-500 capitalize">
                          {comp.companyType || comp.industry}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    Pending
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400">Owner / Director</span>
                    <div className="font-bold text-slate-800">{comp.adminName || comp.ownerName}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Official Email</span>
                    <div className="font-mono text-[11px] text-slate-700 truncate">{comp.adminEmail}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Contact Number</span>
                    <div className="font-mono text-[11px] text-slate-700">{comp.phone}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">GSTIN / Tax ID</span>
                    <div className="font-mono text-[11px] text-slate-700 font-bold">
                      {comp.gstNumber || comp.taxId || 'Optional / Not Provided'}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400">Address</span>
                    <div className="text-[11px] text-slate-700 truncate">
                      {comp.address}, {comp.city}, {comp.state} - {comp.pinCode}
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Requested Tier:</span>
                  <span className="font-bold text-blue-700 uppercase">
                    {comp.subscriptionPlan} Plan ({comp.employeeCount || 25} Initial Guards)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedCompany(comp);
                    setActionType('reject');
                    setNotes('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedCompany(comp);
                    setActionType('approve');
                    setNotes('');
                  }}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify & Approve</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Decision Confirmation Modal */}
      {selectedCompany && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold">
                  {selectedCompany.tenantId}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {actionType === 'approve' ? 'Approve Registration' : 'Reject Application'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedCompany(null);
                  setActionType(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {actionType === 'approve'
                ? `You are authorizing ${selectedCompany.name} to operate on Happiiz HR. Their isolated Firestore database will become operational and initial subscription will be active.`
                : `You are declining the registration request for ${selectedCompany.name}. A permanent record of this rejection will be stored in audit logs.`}
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {actionType === 'approve' ? 'Verification Notes / Reference (Optional)' : 'Rejection Reason *'}
              </label>
              <textarea
                rows={3}
                placeholder={actionType === 'approve' ? 'e.g. KYC verified with PSARA / MCA portal' : 'Specify exact reason for declining...'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedCompany(null);
                  setActionType(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDecision}
                disabled={isProcessing || (actionType === 'reject' && !notes)}
                className={`px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm ${
                  actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isProcessing ? 'Recording...' : actionType === 'approve' ? 'Activate Workspace' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
