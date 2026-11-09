/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Users,
  Search,
  Filter,
  RefreshCw,
  FileText,
  BadgeCheck,
  MessageSquare,
} from 'lucide-react';
import {
  AttendanceRecord,
  OvertimeRequest,
  MissingPunchCorrection,
  ClientSite,
  Employee,
} from '../../types';
import {
  getCompanyAttendanceRecords,
  approveAttendanceRecord,
  getOvertimeRequests,
  updateOvertimeStatus,
  getMissingPunchCorrections,
  updateCorrectionStatus,
} from '../../services/attendanceService';

interface SupervisorPortalProps {
  companyId: string;
  tenantId: string;
  sites: ClientSite[];
  employees: Employee[];
}

export const SupervisorPortal: React.FC<SupervisorPortalProps> = ({
  companyId,
  tenantId,
  sites,
  employees,
}) => {
  const [selectedSiteId, setSelectedSiteId] = useState<string>(
    sites.length > 0 ? sites[0].id : 'all'
  );
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([]);
  const [corrections, setCorrections] = useState<MissingPunchCorrection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'daily_muster' | 'overtime' | 'corrections'>('daily_muster');
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const loadSupervisorData = async () => {
    setLoading(true);
    try {
      const [records, ots, corrs] = await Promise.all([
        getCompanyAttendanceRecords(companyId, {
          date: todayStr,
          siteId: selectedSiteId !== 'all' ? selectedSiteId : undefined,
        }),
        getOvertimeRequests(companyId),
        getMissingPunchCorrections(companyId),
      ]);
      setAttendanceRecords(records);
      setOvertimeRequests(
        ots.filter((o) => selectedSiteId === 'all' || o.siteId === selectedSiteId)
      );
      setCorrections(
        corrs.filter((c) => selectedSiteId === 'all' || c.siteId === selectedSiteId)
      );
    } catch (err) {
      console.error('Failed to load supervisor portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupervisorData();
  }, [companyId, selectedSiteId]);

  const currentSite = sites.find((s) => s.id === selectedSiteId);

  // Statistics
  const totalPunches = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((r) => r.attendanceStatus === 'present').length;
  const lateCount = attendanceRecords.filter((r) => r.attendanceStatus === 'late').length;
  const pendingApprovals = attendanceRecords.filter((r) => r.approvalStatus === 'pending').length;
  const pendingOts = overtimeRequests.filter((o) => o.status === 'pending').length;
  const pendingCorrs = corrections.filter((c) => c.supervisorStatus === 'pending').length;

  const handleApproveAttendance = async (id: string) => {
    setApprovingId(id);
    try {
      await approveAttendanceRecord(
        companyId,
        id,
        currentSite?.siteSupervisorName || 'Site Supervisor',
        'Verified on-site physical presence.'
      );
      await loadSupervisorData();
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setApprovingId(null);
    }
  };

  const handleApproveOvertime = async (
    otId: string,
    hours: number,
    status: 'verified_by_supervisor' | 'rejected'
  ) => {
    try {
      await updateOvertimeStatus(
        companyId,
        otId,
        status,
        hours,
        currentSite?.siteSupervisorName || 'Site Supervisor',
        status === 'verified_by_supervisor'
          ? 'Duty duration verified by on-duty supervisor'
          : 'Overtime rejected by site supervisor'
      );
      await loadSupervisorData();
    } catch (err) {
      console.error('OT update failed:', err);
    }
  };

  const handleApproveCorrection = async (
    corrId: string,
    status: 'verified' | 'rejected'
  ) => {
    try {
      await updateCorrectionStatus(
        companyId,
        corrId,
        'supervisor',
        status,
        currentSite?.siteSupervisorName || 'Site Supervisor',
        status === 'verified'
          ? 'Physical attendance verified via post log book'
          : 'Punch claim rejected'
      );
      await loadSupervisorData();
    } catch (err) {
      console.error('Correction update failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Site Selector */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
              Site Supervisor Portal
            </span>
            <span className="text-xs font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Assigned Post Guard
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            {currentSite ? currentSite.siteName : 'All Assigned Sites'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supervisor in charge:{' '}
            <span className="font-bold text-slate-800">
              {currentSite?.siteSupervisorName || 'Active Supervisor'}
            </span>{' '}
            • Today's Date: {todayStr}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-white text-slate-800"
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.siteName} ({s.siteCode})
              </option>
            ))}
            <option value="all">All Guard Sites</option>
          </select>

          <button
            onClick={loadSupervisorData}
            className="p-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700"
            title="Refresh Muster"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">Total Punches</div>
          <div className="text-xl font-black text-slate-900 mt-1">{totalPunches}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700">Present On Post</div>
          <div className="text-xl font-black text-emerald-600 mt-1">{presentCount}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700">Late Arrivals</div>
          <div className="text-xl font-black text-amber-600 mt-1">{lateCount}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs">
          <div className="text-[11px] font-bold text-rose-700">Pending Exceptions</div>
          <div className="text-xl font-black text-rose-600 mt-1">{pendingApprovals}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs">
          <div className="text-[11px] font-bold text-purple-700">Overtime Requests</div>
          <div className="text-xl font-black text-purple-600 mt-1">{pendingOts}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs">
          <div className="text-[11px] font-bold text-blue-700">Missing Punches</div>
          <div className="text-xl font-black text-blue-600 mt-1">{pendingCorrs}</div>
        </div>
      </div>

      {/* Supervisor Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold text-slate-600">
        <button
          onClick={() => setActiveTab('daily_muster')}
          className={`pb-3 flex items-center gap-1.5 transition-all border-b-2 ${
            activeTab === 'daily_muster'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Today's Guard Muster & Exceptions ({attendanceRecords.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('overtime')}
          className={`pb-3 flex items-center gap-1.5 transition-all border-b-2 ${
            activeTab === 'overtime'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Overtime Approvals ({pendingOts} Pending)</span>
        </button>
        <button
          onClick={() => setActiveTab('corrections')}
          className={`pb-3 flex items-center gap-1.5 transition-all border-b-2 ${
            activeTab === 'corrections'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Missing Punch Claims ({pendingCorrs} Pending)</span>
        </button>
      </div>

      {/* 1. Daily Guard Muster Table */}
      {activeTab === 'daily_muster' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Guard Personnel</th>
                  <th className="p-3.5">Shift & Times</th>
                  <th className="p-3.5">Verification Method</th>
                  <th className="p-3.5">Geofence Status</th>
                  <th className="p-3.5">Exceptions</th>
                  <th className="p-3.5 text-right">Approval Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No punches recorded for this site yet today.
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((record) => {
                    const isPending = record.approvalStatus === 'pending';
                    return (
                      <tr key={record.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{record.employeeName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {record.employeeCode}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800">{record.shiftName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            In: {record.checkInAt ? new Date(record.checkInAt).toLocaleTimeString() : '—'} • Out:{' '}
                            {record.checkOutAt ? new Date(record.checkOutAt).toLocaleTimeString() : 'On Duty'}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {record.checkInVerificationMethod}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-max ${
                              record.locationStatus === 'verified'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : record.locationStatus === 'outside_geofence'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <MapPin className="w-3 h-3" />
                            {record.locationStatus === 'verified'
                              ? 'In 100m Perimeter'
                              : record.locationStatus === 'outside_geofence'
                              ? `Outside (${record.checkInGps?.distanceMeters || '150+'}m)`
                              : record.locationStatus}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {record.exceptions && record.exceptions.length > 0 ? (
                            <div className="space-y-0.5">
                              {record.exceptions.map((ex, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 inline-block mr-1"
                                >
                                  {ex}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-semibold">
                              ✓ Clean Verification
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          {isPending ? (
                            <button
                              onClick={() => handleApproveAttendance(record.id)}
                              disabled={approvingId === record.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-all shadow-xs"
                            >
                              {approvingId === record.id ? 'Approving...' : 'Verify & Approve'}
                            </button>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              ✓ Approved
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Overtime Approvals Tab */}
      {activeTab === 'overtime' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-800">
            Pending Overtime & Double Duty Requests
          </div>
          <div className="divide-y divide-slate-100">
            {overtimeRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No pending overtime requests for this site.
              </div>
            ) : (
              overtimeRequests.map((ot) => (
                <div
                  key={ot.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/60"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {ot.employeeName} ({ot.employeeCode})
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Date: <span className="font-semibold text-slate-700">{ot.dutyDate}</span> • Shift:{' '}
                      <span className="font-semibold text-slate-700">{ot.shiftName}</span>
                    </div>
                    <div className="text-slate-600 mt-1">
                      Reason: <span className="italic">{ot.reason}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-black text-sm text-purple-700">
                        {ot.requestedOtHours} hrs Requested
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">Type: {ot.otType}</div>
                    </div>

                    {ot.status === 'pending' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleApproveOvertime(ot.id, ot.requestedOtHours, 'verified_by_supervisor')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs"
                        >
                          Verify OT
                        </button>
                        <button
                          onClick={() => handleApproveOvertime(ot.id, 0, 'rejected')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-rose-700 rounded-lg font-bold text-xs border border-slate-200"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {ot.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. Missing Punch Claims Tab */}
      {activeTab === 'corrections' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-800">
            Missing Punch & Attendance Regularization Requests
          </div>
          <div className="divide-y divide-slate-100">
            {corrections.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No missing punch claims submitted.
              </div>
            ) : (
              corrections.map((corr) => (
                <div
                  key={corr.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/60"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {corr.employeeName} ({corr.employeeCode})
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Date: <span className="font-semibold text-slate-700">{corr.attendanceDate}</span> • Claimed Time:{' '}
                      <span className="font-mono text-blue-700 font-bold">
                        {corr.requestedCheckIn} – {corr.requestedCheckOut}
                      </span>
                    </div>
                    <div className="text-slate-600 mt-1">
                      Reason: <span className="italic">{corr.reason}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {corr.supervisorStatus === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleApproveCorrection(corr.id, 'verified')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs"
                        >
                          Verify Claim
                        </button>
                        <button
                          onClick={() => handleApproveCorrection(corr.id, 'rejected')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-rose-700 rounded-lg font-bold text-xs border border-slate-200"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        Supervisor: {corr.supervisorStatus.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
