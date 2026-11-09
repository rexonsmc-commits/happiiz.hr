/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileCheck,
  ShieldAlert,
  Clock,
  Banknote,
  Search,
} from 'lucide-react';
import {
  AttendancePeriodFinalization,
  PayrollReadyAttendanceSummary,
  Employee,
  ClientSite,
  AttendanceRecord,
  OvertimeRequest,
  DoubleDutyRecord,
} from '../../types';
import {
  getAttendancePeriods,
  finalizeAttendancePeriod,
  reopenAttendancePeriod,
  generatePayrollReadySummary,
  getCompanyAttendanceRecords,
  getOvertimeRequests,
  getDoubleDutyRecords,
} from '../../services/attendanceService';

interface AttendanceFinalizationModuleProps {
  companyId: string;
  tenantId: string;
  employees: Employee[];
  sites: ClientSite[];
}

export const AttendanceFinalizationModule: React.FC<AttendanceFinalizationModuleProps> = ({
  companyId,
  tenantId,
  employees,
  sites,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-11');
  const [periods, setPeriods] = useState<AttendancePeriodFinalization[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<PayrollReadyAttendanceSummary[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [otRequests, setOtRequests] = useState<OvertimeRequest[]>([]);
  const [doubleDuties, setDoubleDuties] = useState<DoubleDutyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Reopen Modal
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  const currentPeriodRecord = periods.find((p) => p.period === selectedPeriod);
  const isFinalized = currentPeriodRecord?.status === 'finalized';

  const loadData = async () => {
    setLoading(true);
    try {
      const [pers, recs, ots, dds] = await Promise.all([
        getAttendancePeriods(companyId),
        getCompanyAttendanceRecords(companyId),
        getOvertimeRequests(companyId),
        getDoubleDutyRecords(companyId),
      ]);
      setPeriods(pers);
      setRecords(recs);
      setOtRequests(ots);
      setDoubleDuties(dds);

      // Generate provisional or finalized summary
      const summary = await generatePayrollReadySummary(
        companyId,
        tenantId,
        selectedPeriod,
        employees,
        recs,
        ots,
        dds
      );
      setPayrollSummary(summary);
    } catch (err) {
      console.error('Failed to load finalization data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId, selectedPeriod]);

  // Handle Finalization Action
  const handleFinalize = async () => {
    if (!confirm(`Are you sure you want to finalize and lock attendance for ${selectedPeriod}? Once finalized, ordinary edits will be restricted for Phase 7 Payroll integrity.`)) {
      return;
    }

    const newPeriodRecord: AttendancePeriodFinalization = {
      id: `period_${companyId}_${selectedPeriod}`,
      tenantId,
      companyId,
      period: selectedPeriod,
      startDate: `${selectedPeriod}-01`,
      endDate: `${selectedPeriod}-30`,
      status: 'finalized',
      totalScheduledDays: payrollSummary.reduce((acc, c) => acc + c.totalScheduledShifts, 0),
      totalPresentDays: payrollSummary.reduce((acc, c) => acc + c.presentDays, 0),
      totalAbsentDays: payrollSummary.reduce((acc, c) => acc + c.absentDays, 0),
      totalOvertimeHours: payrollSummary.reduce((acc, c) => acc + c.approvedOvertimeHours, 0),
      totalDoubleDutyCount: payrollSummary.reduce((acc, c) => acc + c.approvedDoubleDutyCount, 0),
      finalizedBy: 'HR Operations Head',
      finalizedByName: 'HR Operations Head',
      finalizedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await finalizeAttendancePeriod(companyId, newPeriodRecord);
    await loadData();
    alert(`Period ${selectedPeriod} has been officially locked and finalized for Payroll.`);
  };

  // Handle Reopen Action
  const handleReopen = async () => {
    if (!reopenReason) {
      alert('Please provide an official audit reason for reopening this period.');
      return;
    }
    const periodId = `period_${companyId}_${selectedPeriod}`;
    await reopenAttendancePeriod(companyId, periodId, 'Chief Compliance Officer', reopenReason);
    setIsReopenModalOpen(false);
    setReopenReason('');
    await loadData();
    alert(`Period ${selectedPeriod} has been reopened with audit log recorded.`);
  };

  // Export Payroll CSV
  const handleExportPayrollSummary = () => {
    const headers = [
      'Employee Code',
      'Employee Name',
      'Designation',
      'Period',
      'Scheduled Shifts',
      'Present Days',
      'Absent Days',
      'Half Days',
      'Leave Days',
      'Weekly Off Days',
      'Holiday Duty Days',
      'Regular Hours',
      'Approved OT Hours',
      'Double Duty Count',
      'Late Minutes',
      'Early Leaving (m)',
      'Finalization Status',
    ];

    const rows = payrollSummary.map((s) => [
      s.employeeCode,
      `"${s.employeeName}"`,
      `"${s.designation}"`,
      s.period,
      s.totalScheduledShifts,
      s.presentDays,
      s.absentDays,
      s.halfDays,
      s.approvedLeaveDays,
      s.weeklyOffDays,
      s.holidayDutyDays,
      s.regularWorkingHours,
      s.approvedOvertimeHours,
      s.approvedDoubleDutyCount,
      s.lateMinutes,
      s.earlyLeavingMinutes,
      isFinalized ? 'FINALIZED' : 'PROVISIONAL',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payroll_ready_attendance_${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSummary = payrollSummary.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.employeeName.toLowerCase().includes(q) ||
      s.employeeCode.toLowerCase().includes(q) ||
      s.designation.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Phase 7 Gateway
            </span>
            <span className="text-xs font-bold uppercase text-slate-500">
              Audit & Sign-Off
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Attendance Period Finalization</h1>
          <p className="text-xs text-slate-500 mt-1">
            Lock verified attendance records, freeze duty rosters, and generate payroll-ready workforce summaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-white"
          />

          {isFinalized ? (
            <button
              onClick={() => setIsReopenModalOpen(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Unlock className="w-4 h-4" />
              <span>Reopen Period</span>
            </button>
          ) : (
            <button
              onClick={handleFinalize}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Lock className="w-4 h-4" />
              <span>Finalize & Lock Period</span>
            </button>
          )}

          <button
            onClick={handleExportPayrollSummary}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Payroll CSV</span>
          </button>
        </div>
      </div>

      {/* Finalization Status Banner */}
      <div
        className={`p-5 rounded-3xl border flex items-center justify-between ${
          isFinalized
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${
              isFinalized ? 'bg-emerald-600' : 'bg-amber-600'
            }`}
          >
            {isFinalized ? <Lock className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-extrabold text-sm">
              Status for Period {selectedPeriod}:{' '}
              <span className="uppercase">{isFinalized ? 'Finalized & Locked' : 'Open / Provisional'}</span>
            </div>
            <div className="text-xs opacity-80 mt-0.5">
              {isFinalized
                ? `Locked by ${currentPeriodRecord?.finalizedByName || 'HR'} on ${
                    currentPeriodRecord?.finalizedAt ? new Date(currentPeriodRecord.finalizedAt).toLocaleDateString() : ''
                  }. Payroll calculation engine may safely ingest.`
                : 'Punches and rosters are still active. Review pending supervisor verifications before finalizing.'}
            </div>
          </div>
        </div>

        <div className="text-right text-xs">
          <div className="font-bold">Total Billable Workforce</div>
          <div className="text-lg font-black">{payrollSummary.length} Personnel</div>
        </div>
      </div>

      {/* Payroll-Ready Attendance Summary Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800">
            Payroll-Ready Attendance Summary ({filteredSummary.length} Records)
          </span>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search personnel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 font-medium text-slate-700 bg-white w-52"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Personnel</th>
                <th className="p-3.5">Designation</th>
                <th className="p-3.5">Scheduled</th>
                <th className="p-3.5 text-emerald-700">Present</th>
                <th className="p-3.5 text-rose-700">Absent</th>
                <th className="p-3.5 text-orange-700">Half Days</th>
                <th className="p-3.5 text-sky-700">Leave</th>
                <th className="p-3.5">Weekly Off</th>
                <th className="p-3.5">Regular Duty (h)</th>
                <th className="p-3.5 text-purple-700">Approved OT (h)</th>
                <th className="p-3.5 text-blue-700">Double Duty</th>
                <th className="p-3.5">Late (mins)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSummary.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    No workforce members found for this period.
                  </td>
                </tr>
              ) : (
                filteredSummary.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="p-3.5 font-bold text-slate-900">
                      <div>{s.employeeName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{s.employeeCode}</div>
                    </td>
                    <td className="p-3.5 text-slate-700">{s.designation}</td>
                    <td className="p-3.5 font-bold text-slate-900">{s.totalScheduledShifts}</td>
                    <td className="p-3.5 font-black text-emerald-600">{s.presentDays}</td>
                    <td className="p-3.5 font-black text-rose-600">{s.absentDays}</td>
                    <td className="p-3.5 font-semibold text-orange-600">{s.halfDays}</td>
                    <td className="p-3.5 font-semibold text-sky-600">{s.approvedLeaveDays}</td>
                    <td className="p-3.5 text-slate-600">{s.weeklyOffDays}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">
                      {s.regularWorkingHours} hrs
                    </td>
                    <td className="p-3.5 font-mono font-bold text-purple-700">
                      {s.approvedOvertimeHours} hrs
                    </td>
                    <td className="p-3.5 font-bold text-blue-700">{s.approvedDoubleDutyCount}</td>
                    <td className="p-3.5 font-mono text-amber-600 font-semibold">
                      {s.lateMinutes > 0 ? `${s.lateMinutes}m` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reopen Audit Modal */}
      {isReopenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-base font-extrabold">Reopen Attendance Period</h2>
              <button
                onClick={() => setIsReopenModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 text-amber-900 rounded-xl border border-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Reopening a finalized period will trigger an immutable compliance audit record.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Reopening <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. Correcting missing punch for 2 guards at Tech Park site following supervisor review."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReopen}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs"
              >
                Confirm Reopen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
