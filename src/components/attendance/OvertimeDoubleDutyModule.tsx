/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Shield,
  FileCheck,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  OvertimeRequest,
  DoubleDutyRecord,
  ShiftDefinition,
  Employee,
  ClientSite,
} from '../../types';
import {
  getOvertimeRequests,
  updateOvertimeStatus,
  getDoubleDutyRecords,
  saveDoubleDutyRecord,
  getCompanyShifts,
} from '../../services/attendanceService';

interface OvertimeDoubleDutyModuleProps {
  companyId: string;
  tenantId: string;
  employees: Employee[];
  sites: ClientSite[];
}

export const OvertimeDoubleDutyModule: React.FC<OvertimeDoubleDutyModuleProps> = ({
  companyId,
  tenantId,
  employees,
  sites,
}) => {
  const [activeTab, setActiveTab] = useState<'overtime' | 'double_duty'>('overtime');
  const [overtimeList, setOvertimeList] = useState<OvertimeRequest[]>([]);
  const [doubleDutyList, setDoubleDutyList] = useState<DoubleDutyRecord[]>([]);
  const [shifts, setShifts] = useState<ShiftDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  // Double Duty Modal
  const [isDoubleDutyModalOpen, setIsDoubleDutyModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [primaryShiftId, setPrimaryShiftId] = useState('');
  const [additionalShiftId, setAdditionalShiftId] = useState('');
  const [dutyDate, setDutyDate] = useState(new Date().toISOString().split('T')[0]);
  const [ddDuration, setDdDuration] = useState<number>(8);
  const [remarks, setRemarks] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ots, dds, shs] = await Promise.all([
        getOvertimeRequests(companyId),
        getDoubleDutyRecords(companyId),
        getCompanyShifts(companyId, tenantId),
      ]);
      setOvertimeList(ots);
      setDoubleDutyList(dds);
      setShifts(shs);

      if (sites.length > 0 && !selectedSiteId) setSelectedSiteId(sites[0].id);
      if (shs.length > 0) {
        if (!primaryShiftId) setPrimaryShiftId(shs[0].id);
        if (!additionalShiftId) setAdditionalShiftId(shs[1]?.id || shs[0].id);
      }
    } catch (err) {
      console.error('Failed to load OT and double duty data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  // HR Final Approval for OT
  const handleHrApproveOt = async (otId: string, hours: number) => {
    await updateOvertimeStatus(companyId, otId, 'approved_by_hr', hours, 'HR Operations Head', 'Approved for payroll entry');
    await loadData();
  };

  const handleHrRejectOt = async (otId: string) => {
    await updateOvertimeStatus(companyId, otId, 'rejected', 0, 'HR Operations Head', 'Rejected during audit review');
    await loadData();
  };

  // Submit Double Duty
  const handleSaveDoubleDuty = async () => {
    if (!selectedEmpId || !selectedSiteId || !primaryShiftId || !additionalShiftId) {
      alert('Please fill all mandatory fields.');
      return;
    }

    if (primaryShiftId === additionalShiftId) {
      alert('Primary and Additional shifts cannot be identical.');
      return;
    }

    const emp = employees.find((e) => e.id === selectedEmpId);
    const site = sites.find((s) => s.id === selectedSiteId);
    const primaryShift = shifts.find((s) => s.id === primaryShiftId);
    const addShift = shifts.find((s) => s.id === additionalShiftId);

    if (!emp || !site || !primaryShift || !addShift) return;

    const record: DoubleDutyRecord = {
      id: `dd_${emp.id}_${dutyDate}_${Date.now()}`,
      tenantId,
      companyId,
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: emp.fullName,
      siteId: site.id,
      siteName: site.siteName,
      dutyDate,
      primaryShiftId: primaryShift.id,
      primaryShiftName: primaryShift.shiftName,
      additionalShiftId: addShift.id,
      additionalShiftName: addShift.shiftName,
      additionalDutyDurationHours: ddDuration,
      status: 'approved',
      approvedByName: 'Operations Manager',
      remarks: remarks || 'Back-to-back post coverage authorized due to client request.',
      createdAt: new Date().toISOString(),
    };

    await saveDoubleDutyRecord(companyId, record);
    setIsDoubleDutyModalOpen(false);
    await loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
              Workforce Compliance
            </span>
            <span className="text-xs font-bold uppercase text-slate-500">
              Hours Audit
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Overtime & Double Duty Engine</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track extraordinary duty hours, relief shift assignments, and prepare verified records for Phase 7 Payroll.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('overtime')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'overtime'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overtime Requests ({overtimeList.length})
            </button>
            <button
              onClick={() => setActiveTab('double_duty')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'double_duty'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Double Duty Records ({doubleDutyList.length})
            </button>
          </div>

          {activeTab === 'double_duty' && (
            <button
              onClick={() => setIsDoubleDutyModalOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Record Double Duty</span>
            </button>
          )}
        </div>
      </div>

      {/* Overtime List */}
      {activeTab === 'overtime' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">
              Overtime Ledger ({overtimeList.length} Entries)
            </span>
            <span className="text-slate-500">
              Only verified and HR-approved hours will sync to payroll calculations.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Site & Duty Date</th>
                  <th className="p-3.5">OT Category</th>
                  <th className="p-3.5">Hours (Req / Appr)</th>
                  <th className="p-3.5">Approval Status</th>
                  <th className="p-3.5 text-right">HR Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overtimeList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No overtime records logged yet.
                    </td>
                  </tr>
                ) : (
                  overtimeList.map((ot) => (
                    <tr key={ot.id} className="hover:bg-slate-50/60">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{ot.employeeName}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {ot.employeeCode}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{ot.siteName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Date: {ot.dutyDate} • Shift: {ot.shiftName}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 capitalize">
                          {ot.otType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900">{ot.requestedOtHours} hrs</span>{' '}
                        <span className="text-slate-400">→</span>{' '}
                        <span className="font-black text-emerald-600">
                          {ot.approvedOtHours || 0} hrs
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ot.status === 'approved_by_hr'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : ot.status === 'verified_by_supervisor'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : ot.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {ot.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {ot.status === 'verified_by_supervisor' || ot.status === 'pending' ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleHrApproveOt(ot.id, ot.requestedOtHours)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px]"
                            >
                              Approve HR
                            </button>
                            <button
                              onClick={() => handleHrRejectOt(ot.id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-rose-600 rounded-lg font-bold text-[11px] border border-slate-200"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">
                            Finalized
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
      )}

      {/* Double Duty List */}
      {activeTab === 'double_duty' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">
              Double Duty Registry ({doubleDutyList.length} Records)
            </span>
            <span className="text-slate-500">
              Consecutive or double post coverage strictly authorized with rest policies.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Guard / Personnel</th>
                  <th className="p-3.5">Deployment Site</th>
                  <th className="p-3.5">Duty Date</th>
                  <th className="p-3.5">Primary Shift</th>
                  <th className="p-3.5">Additional Shift</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doubleDutyList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No double duty assignments logged yet.
                    </td>
                  </tr>
                ) : (
                  doubleDutyList.map((dd) => (
                    <tr key={dd.id} className="hover:bg-slate-50/60">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{dd.employeeName}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {dd.employeeCode}
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">{dd.siteName}</td>
                      <td className="p-3.5 font-mono text-slate-700">{dd.dutyDate}</td>
                      <td className="p-3.5 text-blue-700 font-semibold">{dd.primaryShiftName}</td>
                      <td className="p-3.5 text-purple-700 font-semibold">
                        {dd.additionalShiftName}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {dd.additionalDutyDurationHours} hrs
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {dd.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Double Duty Modal */}
      {isDoubleDutyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-base font-extrabold">Record Double Duty Assignment</h2>
              <button
                onClick={() => setIsDoubleDutyModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Employee <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">-- Choose Guard Personnel --</option>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Site Post <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
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
                    value={dutyDate}
                    onChange={(e) => setDutyDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Additional Hours
                  </label>
                  <input
                    type="number"
                    value={ddDuration}
                    onChange={(e) => setDdDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Shift</label>
                  <select
                    value={primaryShiftId}
                    onChange={(e) => setPrimaryShiftId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.shiftName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Additional Shift (Relief)
                  </label>
                  <select
                    value={additionalShiftId}
                    onChange={(e) => setAdditionalShiftId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.shiftName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Remarks & Reason</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Relief coverage for absentee guard as approved by Operations Manager."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDoubleDutyModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDoubleDuty}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs"
              >
                Authorize Double Duty
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
