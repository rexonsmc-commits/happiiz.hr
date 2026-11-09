/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  Plus,
  Users,
  MapPin,
  Filter,
  Download,
  Copy,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';
import {
  DutyRoster,
  ShiftDefinition,
  Employee,
  ClientSite,
} from '../../types';
import {
  getCompanyDutyRosters,
  saveDutyRoster,
  bulkCreateDutyRosters,
  deleteDutyRoster,
  getCompanyShifts,
  saveCompanyShift,
  deleteCompanyShift,
} from '../../services/attendanceService';

interface DutyRosterModuleProps {
  companyId: string;
  tenantId: string;
  employees: Employee[];
  sites: ClientSite[];
}

export const DutyRosterModule: React.FC<DutyRosterModuleProps> = ({
  companyId,
  tenantId,
  employees,
  sites,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'shifts'>('roster');
  const [rosters, setRosters] = useState<DutyRoster[]>([]);
  const [shifts, setShifts] = useState<ShiftDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [selectedShiftId, setSelectedShiftId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk Assign Modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkSiteId, setBulkSiteId] = useState<string>('');
  const [bulkShiftId, setBulkShiftId] = useState<string>('');
  const [bulkStartDate, setBulkStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [bulkEndDate, setBulkEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [designationFilter, setDesignationFilter] = useState<string>('all');
  const [bulkConflictWarning, setBulkConflictWarning] = useState<string | null>(null);

  // Shift Modal state
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftDefinition | null>(null);
  const [shiftForm, setShiftForm] = useState<{
    shiftName: string;
    shiftCode: string;
    startTime: string;
    endTime: string;
    breakDurationMinutes: number;
    gracePeriodMinutes: number;
    lateThresholdMinutes: number;
    earlyLeavingThresholdMinutes: number;
    overtimeEligible: boolean;
    isOvernight: boolean;
  }>({
    shiftName: '',
    shiftCode: '',
    startTime: '06:00',
    endTime: '14:00',
    breakDurationMinutes: 45,
    gracePeriodMinutes: 15,
    lateThresholdMinutes: 30,
    earlyLeavingThresholdMinutes: 15,
    overtimeEligible: true,
    isOvernight: false,
  });

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [allShifts, allRosters] = await Promise.all([
        getCompanyShifts(companyId, tenantId),
        getCompanyDutyRosters(companyId, {
          date: selectedDate,
          siteId: selectedSiteId !== 'all' ? selectedSiteId : undefined,
        }),
      ]);
      setShifts(allShifts);
      setRosters(allRosters);

      // Seed initial shift selection for bulk modal
      if (allShifts.length > 0 && !bulkShiftId) {
        setBulkShiftId(allShifts[0].id);
      }
      if (sites.length > 0 && !bulkSiteId) {
        setBulkSiteId(sites[0].id);
      }
    } catch (err) {
      console.error('Failed to load duty roster data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId, selectedDate, selectedSiteId]);

  // Navigate Date
  const handleDateOffset = (offsetDays: number) => {
    const curr = new Date(selectedDate);
    curr.setDate(curr.getDate() + offsetDays);
    setSelectedDate(curr.toISOString().split('T')[0]);
  };

  // Filtered rosters
  const filteredRosters = rosters.filter((r) => {
    if (selectedShiftId !== 'all' && r.shiftId !== selectedShiftId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.employeeName.toLowerCase().includes(q) ||
        r.employeeCode.toLowerCase().includes(q) ||
        r.designation.toLowerCase().includes(q) ||
        r.siteName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Check conflicts before bulk assignment
  useEffect(() => {
    if (selectedEmployeeIds.length > 0 && bulkShiftId) {
      const shift = shifts.find((s) => s.id === bulkShiftId);
      const conflicts = rosters.filter(
        (r) =>
          selectedEmployeeIds.includes(r.employeeId) &&
          r.dutyDate >= bulkStartDate &&
          r.dutyDate <= bulkEndDate &&
          r.shiftId === bulkShiftId
      );
      if (conflicts.length > 0) {
        setBulkConflictWarning(
          `Conflict detected: ${conflicts.length} personnel already scheduled for this shift during selected date range.`
        );
      } else {
        setBulkConflictWarning(null);
      }
    } else {
      setBulkConflictWarning(null);
    }
  }, [selectedEmployeeIds, bulkShiftId, bulkStartDate, bulkEndDate, rosters]);

  // Handle Bulk Assignment Submission
  const handleBulkSubmit = async () => {
    if (!bulkSiteId || !bulkShiftId || selectedEmployeeIds.length === 0) {
      alert('Please select a site, shift, and at least one employee.');
      return;
    }

    const site = sites.find((s) => s.id === bulkSiteId);
    const shift = shifts.find((s) => s.id === bulkShiftId);
    if (!site || !shift) return;

    const start = new Date(bulkStartDate);
    const end = new Date(bulkEndDate);
    const newRosters: DutyRoster[] = [];

    // Loop dates
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];

      for (const empId of selectedEmployeeIds) {
        const emp = employees.find((e) => e.id === empId);
        if (!emp) continue;

        // Prevent duplicate assignment for same employee and shift on same date
        const existing = rosters.find(
          (r) => r.employeeId === empId && r.dutyDate === dateStr && r.shiftId === shift.id
        );
        if (existing) continue;

        newRosters.push({
          id: `rst_${empId}_${dateStr}_${shift.id}_${Date.now()}`,
          tenantId,
          companyId,
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          employeeName: emp.fullName,
          clientId: site.clientId,
          clientName: site.clientName,
          siteId: site.id,
          siteCode: site.siteCode,
          siteName: site.siteName,
          designation: emp.designation,
          shiftId: shift.id,
          shiftName: shift.shiftName,
          dutyDate: dateStr,
          dutyStartTime: shift.startTime,
          dutyEndTime: shift.endTime,
          reportingSupervisorName: site.siteSupervisorName || 'On-Duty Supervisor',
          status: 'scheduled',
          createdAt: new Date().toISOString(),
        });
      }
    }

    await bulkCreateDutyRosters(companyId, newRosters);
    setIsBulkModalOpen(false);
    setSelectedEmployeeIds([]);
    await loadData();
  };

  // Copy previous day's roster
  const handleCopyYesterday = async () => {
    const yesterday = new Date(selectedDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const yesterdayRosters = await getCompanyDutyRosters(companyId, {
      date: yesterdayStr,
      siteId: selectedSiteId !== 'all' ? selectedSiteId : undefined,
    });

    if (yesterdayRosters.length === 0) {
      alert(`No roster schedules found on previous day (${yesterdayStr}) to copy.`);
      return;
    }

    const cloned = yesterdayRosters.map((r) => ({
      ...r,
      id: `rst_${r.employeeId}_${selectedDate}_${r.shiftId}_${Date.now()}`,
      dutyDate: selectedDate,
      status: 'scheduled' as const,
      createdAt: new Date().toISOString(),
    }));

    await bulkCreateDutyRosters(companyId, cloned);
    await loadData();
    alert(`Successfully copied ${cloned.length} roster posts from ${yesterdayStr} to ${selectedDate}!`);
  };

  // Shift save
  const handleSaveShift = async () => {
    if (!shiftForm.shiftName || !shiftForm.shiftCode) {
      alert('Shift name and code are required.');
      return;
    }

    const shiftToSave: ShiftDefinition = {
      id: editingShift ? editingShift.id : `shift_${Date.now()}`,
      tenantId,
      companyId,
      ...shiftForm,
      status: 'active',
      createdAt: editingShift ? editingShift.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveCompanyShift(companyId, shiftToSave);
    setIsShiftModalOpen(false);
    setEditingShift(null);
    const updated = await getCompanyShifts(companyId, tenantId);
    setShifts(updated);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Duty Date',
      'Site Name',
      'Site Code',
      'Shift Name',
      'Timings',
      'Employee Code',
      'Employee Name',
      'Designation',
      'Status',
    ];
    const rows = filteredRosters.map((r) => [
      r.dutyDate,
      `"${r.siteName}"`,
      r.siteCode,
      `"${r.shiftName}"`,
      `${r.dutyStartTime} - ${r.dutyEndTime}`,
      r.employeeCode,
      `"${r.employeeName}"`,
      `"${r.designation}"`,
      r.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `duty_roster_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Switch */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Phase 6
            </span>
            <span className="text-xs font-bold uppercase text-slate-500">
              Workforce Scheduling Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Duty Roster & Shift Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated guard deployment scheduling, post fulfillment, overnight shifts & multi-site rotations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200">
            <button
              onClick={() => setActiveSubTab('roster')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'roster'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Duty Roster
            </button>
            <button
              onClick={() => setActiveSubTab('shifts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'shifts'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Shift Master ({shifts.length})
            </button>
          </div>

          {activeSubTab === 'roster' ? (
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Bulk Schedule Posts</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingShift(null);
                setShiftForm({
                  shiftName: '',
                  shiftCode: '',
                  startTime: '06:00',
                  endTime: '14:00',
                  breakDurationMinutes: 45,
                  gracePeriodMinutes: 15,
                  lateThresholdMinutes: 30,
                  earlyLeavingThresholdMinutes: 15,
                  overtimeEligible: true,
                  isOvernight: false,
                });
                setIsShiftModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Shift</span>
            </button>
          )}
        </div>
      </div>

      {activeSubTab === 'roster' && (
        <>
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Date Navigator */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDateOffset(-1)}
                className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-800 bg-white"
              />
              <button
                onClick={() => handleDateOffset(1)}
                className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100"
              >
                Today
              </button>
            </div>

            {/* Site & Shift Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 font-medium text-slate-700 bg-white"
              >
                <option value="all">All Deployment Sites</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.siteName}
                  </option>
                ))}
              </select>

              <select
                value={selectedShiftId}
                onChange={(e) => setSelectedShiftId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 font-medium text-slate-700 bg-white"
              >
                <option value="all">All Shifts</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shiftName}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search guard or designation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 font-medium text-slate-700 bg-white w-48"
                />
              </div>

              <button
                onClick={handleCopyYesterday}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center gap-1 border border-slate-200"
                title="Copy previous day's scheduled roster to current date"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Yesterday</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center gap-1 border border-slate-200"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Roster Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900 text-xs">
                  Scheduled Posts on {selectedDate} ({filteredRosters.length} Personnel)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Personnel / Guard</th>
                    <th className="p-3.5">Deployment Site</th>
                    <th className="p-3.5">Shift & Timings</th>
                    <th className="p-3.5">Reporting Supervisor</th>
                    <th className="p-3.5">Roster Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRosters.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No duty roster posts scheduled for this date and filter criteria.
                        <div className="mt-2">
                          <button
                            onClick={() => setIsBulkModalOpen(true)}
                            className="text-xs font-bold text-blue-600 hover:underline"
                          >
                            + Schedule Personnel Now
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRosters.map((roster) => (
                      <tr key={roster.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{roster.employeeName}</div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {roster.employeeCode} • {roster.designation}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800">{roster.siteName}</div>
                          <div className="text-[11px] text-slate-400">{roster.siteCode}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-blue-700 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {roster.shiftName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {roster.dutyStartTime} – {roster.dutyEndTime}
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-700">
                          {roster.reportingSupervisorName || 'On-Duty Supervisor'}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              roster.status === 'scheduled'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : roster.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {roster.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={async () => {
                              if (confirm(`Remove ${roster.employeeName} from this shift post?`)) {
                                await deleteDutyRoster(companyId, roster.id);
                                await loadData();
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Delete Roster Post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Shifts Master Subtab */}
      {activeSubTab === 'shifts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                    {shift.shiftCode}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-1.5">{shift.shiftName}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingShift(shift);
                      setShiftForm({
                        shiftName: shift.shiftName,
                        shiftCode: shift.shiftCode,
                        startTime: shift.startTime,
                        endTime: shift.endTime,
                        breakDurationMinutes: shift.breakDurationMinutes,
                        gracePeriodMinutes: shift.gracePeriodMinutes,
                        lateThresholdMinutes: shift.lateThresholdMinutes,
                        earlyLeavingThresholdMinutes: shift.earlyLeavingThresholdMinutes,
                        overtimeEligible: shift.overtimeEligible,
                        isOvernight: shift.isOvernight,
                      });
                      setIsShiftModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`Delete shift "${shift.shiftName}"?`)) {
                        await deleteCompanyShift(companyId, shift.id);
                        const updated = await getCompanyShifts(companyId, tenantId);
                        setShifts(updated);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Duty Window:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {shift.startTime} – {shift.endTime}{' '}
                    {shift.isOvernight && (
                      <span className="text-[10px] text-indigo-600 font-bold">(Overnight)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Grace Period:</span>
                  <span className="font-semibold text-slate-700">{shift.gracePeriodMinutes} mins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Late Threshold:</span>
                  <span className="font-semibold text-slate-700">{shift.lateThresholdMinutes} mins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Break Duration:</span>
                  <span className="font-semibold text-slate-700">{shift.breakDurationMinutes} mins</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{shift.overtimeEligible ? 'Overtime Eligible' : 'No Overtime'}</span>
                </span>
                <span className="font-mono text-[10px] text-slate-400">Asia/Kolkata (IST)</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bulk Assignment Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-extrabold">Bulk Duty Roster Assignment</h2>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {bulkConflictWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{bulkConflictWarning}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Site</label>
                  <select
                    value={bulkSiteId}
                    onChange={(e) => setBulkSiteId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                  >
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.siteName} ({s.siteCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Shift</label>
                  <select
                    value={bulkShiftId}
                    onChange={(e) => setBulkShiftId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.shiftName} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={bulkStartDate}
                    onChange={(e) => setBulkStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={bulkEndDate}
                    onChange={(e) => setBulkEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                  />
                </div>
              </div>

              {/* Personnel Select List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Select Personnel to Deploy ({selectedEmployeeIds.length} Selected)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const available = employees
                          .filter((e) => e.status === 'active')
                          .map((e) => e.id);
                        setSelectedEmployeeIds(available);
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      Select All Active
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedEmployeeIds([])}
                      className="text-[11px] font-bold text-slate-500 hover:underline"
                    >
                      Deselect
                    </button>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl p-2 space-y-1">
                  {employees
                    .filter((e) => e.status === 'active')
                    .map((emp) => {
                      const isChecked = selectedEmployeeIds.includes(emp.id);
                      return (
                        <label
                          key={emp.id}
                          className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                            isChecked ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedEmployeeIds([...selectedEmployeeIds, emp.id]);
                                } else {
                                  setSelectedEmployeeIds(
                                    selectedEmployeeIds.filter((id) => id !== emp.id)
                                  );
                                }
                              }}
                              className="rounded text-blue-600"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{emp.fullName}</div>
                              <div className="text-[10px] text-slate-400">
                                {emp.employeeCode} • {emp.designation}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{emp.phone}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkSubmit}
                disabled={selectedEmployeeIds.length === 0}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs disabled:opacity-50"
              >
                Schedule {selectedEmployeeIds.length} Personnel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shift Edit / Create Modal */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-base font-extrabold">
                {editingShift ? 'Edit Shift Configuration' : 'Create New Duty Shift'}
              </h2>
              <button
                onClick={() => setIsShiftModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Shift Name</label>
                  <input
                    type="text"
                    value={shiftForm.shiftName}
                    onChange={(e) => setShiftForm({ ...shiftForm, shiftName: e.target.value })}
                    placeholder="e.g. Morning Guard Shift"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Shift Code</label>
                  <input
                    type="text"
                    value={shiftForm.shiftCode}
                    onChange={(e) => setShiftForm({ ...shiftForm, shiftCode: e.target.value })}
                    placeholder="e.g. SH-MRN-01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time (24h)</label>
                  <input
                    type="time"
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Time (24h)</label>
                  <input
                    type="time"
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Grace (mins)</label>
                  <input
                    type="number"
                    value={shiftForm.gracePeriodMinutes}
                    onChange={(e) =>
                      setShiftForm({ ...shiftForm, gracePeriodMinutes: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Late (mins)</label>
                  <input
                    type="number"
                    value={shiftForm.lateThresholdMinutes}
                    onChange={(e) =>
                      setShiftForm({ ...shiftForm, lateThresholdMinutes: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Break (mins)</label>
                  <input
                    type="number"
                    value={shiftForm.breakDurationMinutes}
                    onChange={(e) =>
                      setShiftForm({ ...shiftForm, breakDurationMinutes: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={shiftForm.isOvernight}
                    onChange={(e) => setShiftForm({ ...shiftForm, isOvernight: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Overnight Shift (Crosses Midnight)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={shiftForm.overtimeEligible}
                    onChange={(e) =>
                      setShiftForm({ ...shiftForm, overtimeEligible: e.target.checked })
                    }
                    className="rounded text-blue-600"
                  />
                  <span>Overtime Eligibility Enabled</span>
                </label>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveShift}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs"
              >
                Save Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
