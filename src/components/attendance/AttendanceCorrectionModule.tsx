/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileEdit,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Search,
  Filter,
} from 'lucide-react';
import {
  MissingPunchCorrection,
  Employee,
  ClientSite,
} from '../../types';
import {
  getMissingPunchCorrections,
  submitMissingPunchCorrection,
  updateCorrectionStatus,
} from '../../services/attendanceService';

interface AttendanceCorrectionModuleProps {
  companyId: string;
  tenantId: string;
  employees: Employee[];
  sites: ClientSite[];
}

export const AttendanceCorrectionModule: React.FC<AttendanceCorrectionModuleProps> = ({
  companyId,
  tenantId,
  employees,
  sites,
}) => {
  const [corrections, setCorrections] = useState<MissingPunchCorrection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [empId, setEmpId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [corrType, setCorrType] = useState<MissingPunchCorrection['correctionType']>('missing_check_out');
  const [reqIn, setReqIn] = useState('06:00');
  const [reqOut, setReqOut] = useState('14:00');
  const [reason, setReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getMissingPunchCorrections(companyId);
      setCorrections(list);
      if (sites.length > 0 && !siteId) setSiteId(sites[0].id);
    } catch (err) {
      console.error('Failed to load missing punch corrections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  const handleSubmit = async () => {
    if (!empId || !siteId || !reason) {
      alert('Please fill all mandatory fields.');
      return;
    }

    const emp = employees.find((e) => e.id === empId);
    const site = sites.find((s) => s.id === siteId);
    if (!emp || !site) return;

    const newCorrection: MissingPunchCorrection = {
      id: `corr_${emp.id}_${attDate}_${Date.now()}`,
      tenantId,
      companyId,
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: emp.fullName,
      siteId: site.id,
      siteName: site.siteName,
      attendanceDate: attDate,
      correctionType: corrType,
      requestedCheckIn: reqIn,
      requestedCheckOut: reqOut,
      reason,
      supervisorStatus: 'pending',
      hrStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    await submitMissingPunchCorrection(companyId, newCorrection);
    setIsModalOpen(false);
    setReason('');
    await loadData();
  };

  const handleHrApprove = async (id: string) => {
    await updateCorrectionStatus(companyId, id, 'hr', 'approved', 'HR Operations Head', 'Approved and muster regularized.');
    await loadData();
  };

  const handleHrReject = async (id: string) => {
    await updateCorrectionStatus(companyId, id, 'hr', 'rejected', 'HR Operations Head', 'Correction request rejected.');
    await loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              Regularization
            </span>
            <span className="text-xs font-bold uppercase text-slate-500">
              Muster Corrections
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Missing Punch & Attendance Correction</h1>
          <p className="text-xs text-slate-500 mt-1">
            Resolve GPS dropouts, forgotten biometric punches, camera QR failures, and device offline events with strict audit trails.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Regularization Claim</span>
        </button>
      </div>

      {/* Corrections Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800">
            Claims Queue ({corrections.length} Total)
          </span>
          <span className="text-slate-500">
            Requires 2-level authorization: Site Supervisor → HR Manager
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Personnel / Guard</th>
                <th className="p-3.5">Deployment Site & Date</th>
                <th className="p-3.5">Failure / Correction Type</th>
                <th className="p-3.5">Claimed In / Out</th>
                <th className="p-3.5">Reason & Evidence</th>
                <th className="p-3.5">Supervisor Status</th>
                <th className="p-3.5">HR Final Status</th>
                <th className="p-3.5 text-right">HR Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {corrections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No missing punch regularization claims currently on file.
                  </td>
                </tr>
              ) : (
                corrections.map((corr) => (
                  <tr key={corr.id} className="hover:bg-slate-50/60">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{corr.employeeName}</div>
                      <div className="text-[11px] font-mono text-slate-400">{corr.employeeCode}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{corr.siteName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{corr.attendanceDate}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 capitalize">
                        {corr.correctionType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-semibold text-blue-700">
                      {corr.requestedCheckIn} – {corr.requestedCheckOut}
                    </td>
                    <td className="p-3.5 max-w-xs truncate" title={corr.reason}>
                      {corr.reason}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          corr.supervisorStatus === 'verified'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : corr.supervisorStatus === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {corr.supervisorStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          corr.hrStatus === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : corr.hrStatus === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {corr.hrStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {corr.hrStatus === 'pending' ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleHrApprove(corr.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleHrReject(corr.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-rose-600 rounded-lg font-bold text-[11px] border border-slate-200"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-semibold">
                          Resolved
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Claim Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-base font-extrabold">Submit Attendance Regularization Claim</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Employee</label>
                <select
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">-- Choose Personnel --</option>
                  {employees
                    .filter((e) => e.status === 'active')
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.employeeCode})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deployment Site</label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.siteName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duty Date</label>
                  <input
                    type="date"
                    value={attDate}
                    onChange={(e) => setAttDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Issue / Failure</label>
                  <select
                    value={corrType}
                    onChange={(e) => setCorrType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="missing_check_out">Missing Check-out</option>
                    <option value="missing_check_in">Missing Check-in</option>
                    <option value="gps_failure">GPS Signal Failure</option>
                    <option value="qr_failure">QR Code Scanner Malfunction</option>
                    <option value="both_punches">Device Offline / Both Missing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Claimed In Time</label>
                  <input
                    type="time"
                    value={reqIn}
                    onChange={(e) => setReqIn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Claimed Out Time</label>
                  <input
                    type="time"
                    value={reqOut}
                    onChange={(e) => setReqOut(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason & Ground Evidence <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Guard was on perimeter patrol duty; scanner phone battery died. Verified in physical security register."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs"
              >
                Submit Regularization Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
