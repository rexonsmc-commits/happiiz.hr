/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  QrCode,
  MapPin,
  Calendar,
  Building2,
  RefreshCw,
  Plus,
  ShieldCheck,
  Zap,
  TrendingUp,
  Search,
} from 'lucide-react';
import {
  AttendanceRecord,
  Employee,
  ClientSite,
  ShiftDefinition,
} from '../../types';
import {
  getCompanyAttendanceRecords,
  getCompanyShifts,
  runAutoAbsentDetection,
} from '../../services/attendanceService';

interface AttendanceDashboardProps {
  companyId: string;
  tenantId: string;
  employees: Employee[];
  sites: ClientSite[];
  onOpenCheckIn: () => void;
  onNavigateTab: (tabKey: string) => void;
}

export const AttendanceDashboard: React.FC<AttendanceDashboardProps> = ({
  companyId,
  tenantId,
  employees,
  sites,
  onOpenCheckIn,
  onNavigateTab,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [shifts, setShifts] = useState<ShiftDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAutoAbsent, setRunningAutoAbsent] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [records, shiftList] = await Promise.all([
        getCompanyAttendanceRecords(companyId, {
          date: selectedDate,
          siteId: selectedSiteId !== 'all' ? selectedSiteId : undefined,
        }),
        getCompanyShifts(companyId, tenantId),
      ]);
      setAttendanceRecords(records);
      setShifts(shiftList);
    } catch (err) {
      console.error('Failed to load attendance dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId, selectedDate, selectedSiteId]);

  // Handle Auto Absent trigger
  const handleAutoAbsent = async () => {
    setRunningAutoAbsent(true);
    try {
      const res = await runAutoAbsentDetection(companyId, selectedDate);
      await loadData();
      alert(
        `Auto-Absent Detection completed for ${selectedDate}. ${res.absentCreated} unpunched scheduled posts marked for review.`
      );
    } catch (err) {
      console.error('Auto absent error:', err);
    } finally {
      setRunningAutoAbsent(false);
    }
  };

  // KPIs
  const totalAssignedEmployees = employees.filter((e) => e.status === 'active').length;
  const presentToday = attendanceRecords.filter((r) => r.attendanceStatus === 'present').length;
  const lateEmployees = attendanceRecords.filter((r) => r.attendanceStatus === 'late').length;
  const absentToday = attendanceRecords.filter((r) => r.attendanceStatus === 'absent').length;
  const onLeave = attendanceRecords.filter((r) => r.attendanceStatus === 'on_leave').length;
  const weeklyOff = attendanceRecords.filter((r) => r.attendanceStatus === 'weekly_off').length;
  const halfDay = attendanceRecords.filter((r) => r.attendanceStatus === 'half_day').length;
  const pendingVerification = attendanceRecords.filter((r) => r.approvalStatus === 'pending').length;
  const overtimeEmployees = attendanceRecords.filter((r) => r.isOvertime || (r.overtimeHours || 0) > 0).length;
  const missingCheckOut = attendanceRecords.filter((r) => r.checkInAt && !r.checkOutAt).length;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Phase 6
            </span>
            <span className="text-xs font-bold uppercase text-slate-500">
              Workforce Presence System
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Attendance Command Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time GPS geofencing, QR scan verification, duty muster, and supervisor approval pipeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-white text-slate-800"
          />

          <button
            onClick={handleAutoAbsent}
            disabled={runningAutoAbsent}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all border border-slate-200"
            title="Scan scheduled roster and mark guards with zero punches as absent candidate"
          >
            <Zap className={`w-3.5 h-3.5 text-amber-600 ${runningAutoAbsent ? 'animate-spin' : ''}`} />
            <span>Auto-Absent Scan</span>
          </button>

          <button
            onClick={onOpenCheckIn}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Mark Punch (GPS/QR)</span>
          </button>
        </div>
      </div>

      {/* 10 Statistics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">Total Active Workforce</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalAssignedEmployees}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700">Present Today</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{presentToday}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700">Late Arrivals</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{lateEmployees}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs">
          <div className="text-[11px] font-bold text-rose-700">Absent Today</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{absentToday}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-xs">
          <div className="text-[11px] font-bold text-sky-700">On Approved Leave</div>
          <div className="text-2xl font-black text-sky-600 mt-1">{onLeave}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">Weekly Off / Rest</div>
          <div className="text-2xl font-black text-slate-700 mt-1">{weeklyOff}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-xs">
          <div className="text-[11px] font-bold text-orange-700">Half Day</div>
          <div className="text-2xl font-black text-orange-600 mt-1">{halfDay}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs">
          <div className="text-[11px] font-bold text-indigo-700">Pending Exceptions</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">{pendingVerification}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs">
          <div className="text-[11px] font-bold text-purple-700">Overtime Personnel</div>
          <div className="text-2xl font-black text-purple-600 mt-1">{overtimeEmployees}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs">
          <div className="text-[11px] font-bold text-blue-700">On Duty (Pending Out)</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{missingCheckOut}</div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <button
          onClick={() => onNavigateTab('roster')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 text-left transition-all group shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-extrabold text-slate-900 group-hover:text-blue-600">
              Duty Roster
            </span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-[11px] text-slate-400">
            Schedule 3 shifts 24/7, bulk post assignments & conflict checks.
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('supervisor')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-sky-400 text-left transition-all group shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-extrabold text-slate-900 group-hover:text-sky-600">
              Supervisor Portal
            </span>
            <ShieldCheck className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-[11px] text-slate-400">
            Verify geofence dropouts, approve overtime & site daily muster.
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('corrections')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 text-left transition-all group shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-extrabold text-slate-900 group-hover:text-amber-600">
              Missing Punch
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-[11px] text-slate-400">
            Regularize GPS dropouts, forgotten biometric punches with audit trails.
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('finalization')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 text-left transition-all group shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-extrabold text-slate-900 group-hover:text-emerald-600">
              Period Finalization
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-[11px] text-slate-400">
            Lock monthly attendance and export payroll-ready workforce summaries.
          </p>
        </button>
      </div>

      {/* Main Breakdown: Site-Wise Deployment Muster & Recent Live Punches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Site-Wise Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-xs text-slate-900">
                Site-Wise Post Fulfillment ({sites.length} Sites)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Deployment Site</th>
                  <th className="p-3.5">Required Guards</th>
                  <th className="p-3.5 text-emerald-700">Present Today</th>
                  <th className="p-3.5 text-rose-700">Absent</th>
                  <th className="p-3.5">Coverage Rate</th>
                  <th className="p-3.5">QR Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sites.map((site) => {
                  const sitePunches = attendanceRecords.filter((r) => r.siteId === site.id);
                  const sitePresent = sitePunches.filter(
                    (r) => r.attendanceStatus === 'present' || r.attendanceStatus === 'late'
                  ).length;
                  const req = site.requiredEmployees || site.guardsRequired || 1;
                  const coveragePercent = Math.min(100, Math.round((sitePresent / req) * 100));

                  return (
                    <tr key={site.id} className="hover:bg-slate-50/60">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{site.siteName}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {site.siteCode} • {site.clientName}
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">{req} Guards</td>
                      <td className="p-3.5 font-black text-emerald-600">{sitePresent}</td>
                      <td className="p-3.5 font-black text-rose-600">
                        {Math.max(0, req - sitePresent)}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                coveragePercent >= 90
                                  ? 'bg-emerald-500'
                                  : coveragePercent >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${coveragePercent}%` }}
                            />
                          </div>
                          <span className="font-bold text-[11px] text-slate-700">
                            {coveragePercent}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="text-[10px] font-mono bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-200 font-bold">
                          {site.qrVerificationToken ? 'Active QR' : 'Static'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Recent Verified Check-ins Feed */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Live Attendance Feed</span>
            </span>
            <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
              {attendanceRecords.length} Today
            </span>
          </div>

          <div className="p-4 overflow-y-auto space-y-3 flex-1 max-h-[460px]">
            {attendanceRecords.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No attendance punches recorded yet today.
              </div>
            ) : (
              attendanceRecords.slice(0, 10).map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition-all text-xs space-y-1.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{r.employeeName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {r.siteName} • {r.shiftName}
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        r.attendanceStatus === 'present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.attendanceStatus === 'late'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {r.attendanceStatus.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span className="font-mono">
                      {r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString() : '—'}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-600 font-medium">
                      <MapPin className="w-3 h-3 text-sky-600" />
                      {r.checkInVerificationMethod} (
                      {r.locationStatus === 'verified' ? 'In Perimeter' : r.locationStatus})
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
