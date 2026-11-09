/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
} from 'lucide-react';
import {
  AttendanceRecord,
  Employee,
  ClientSite,
  CompanyHoliday,
} from '../../types';
import {
  getCompanyAttendanceRecords,
  getCompanyHolidays,
} from '../../services/attendanceService';

interface AttendanceReportsModuleProps {
  companyId: string;
  tenantId: string;
  employees: Employee[];
  sites: ClientSite[];
}

export const AttendanceReportsModule: React.FC<AttendanceReportsModuleProps> = ({
  companyId,
  tenantId,
  employees,
  sites,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<CompanyHoliday[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate days array for the selected month (e.g. 1 to 30)
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [allRecords, allHolidays] = await Promise.all([
        getCompanyAttendanceRecords(companyId, {
          siteId: selectedSiteId !== 'all' ? selectedSiteId : undefined,
        }),
        getCompanyHolidays(companyId, tenantId),
      ]);
      setRecords(allRecords);
      setHolidays(allHolidays);
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [companyId, selectedMonth, selectedSiteId]);

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    if (selectedSiteId !== 'all' && emp.assignedSite !== selectedSiteId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        emp.fullName.toLowerCase().includes(q) ||
        emp.employeeCode.toLowerCase().includes(q) ||
        emp.designation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Cell attendance resolver
  const getCellStatus = (empId: string, day: number) => {
    const dayFormatted = day < 10 ? `0${day}` : `${day}`;
    const dateStr = `${selectedMonth}-${dayFormatted}`;
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();

    // Check holiday
    const isHoliday = holidays.some((h) => h.holidayDate === dateStr && h.status === 'active');
    if (isHoliday) {
      return { tag: 'H', label: 'Holiday', bg: 'bg-purple-100 text-purple-800' };
    }

    // Check actual attendance record
    const record = records.find(
      (r) => r.employeeId === empId && r.attendanceDate === dateStr
    );

    if (record) {
      if (record.attendanceStatus === 'late') {
        return { tag: 'L*', label: `Late (${record.lateMinutes}m)`, bg: 'bg-amber-100 text-amber-800 font-bold' };
      }
      if (record.attendanceStatus === 'present') {
        return { tag: 'P', label: 'Present', bg: 'bg-emerald-100 text-emerald-800 font-bold' };
      }
      if (record.attendanceStatus === 'half_day') {
        return { tag: 'HD', label: 'Half Day', bg: 'bg-orange-100 text-orange-800 font-bold' };
      }
      if (record.attendanceStatus === 'on_leave') {
        return { tag: 'LV', label: 'Approved Leave', bg: 'bg-sky-100 text-sky-800' };
      }
      if (record.attendanceStatus === 'absent') {
        return { tag: 'A', label: 'Absent', bg: 'bg-rose-100 text-rose-800 font-bold' };
      }
      if (record.attendanceStatus === 'weekly_off') {
        return { tag: 'WO', label: 'Weekly Off', bg: 'bg-slate-100 text-slate-500' };
      }
    }

    // Default Sunday Weekly Off
    if (dayOfWeek === 0) {
      return { tag: 'WO', label: 'Weekly Off', bg: 'bg-slate-100 text-slate-500' };
    }

    // Before or after today check
    const today = new Date();
    if (dateObj > today) {
      return { tag: '-', label: 'Upcoming', bg: 'text-slate-300' };
    }

    return { tag: 'A', label: 'Absent', bg: 'bg-rose-50 text-rose-600 font-bold' };
  };

  // Export Matrix CSV
  const handleExportMatrixCSV = () => {
    const headers = ['Employee Code', 'Employee Name', 'Designation', ...daysArray.map((d) => `Day ${d}`), 'Total Present', 'Total Absent', 'Total Late (m)'];
    const rows = filteredEmployees.map((emp) => {
      let presentCount = 0;
      let absentCount = 0;
      let totalLate = 0;

      const cells = daysArray.map((day) => {
        const status = getCellStatus(emp.id, day);
        if (status.tag === 'P' || status.tag === 'L*') presentCount++;
        if (status.tag === 'A') absentCount++;
        return status.tag;
      });

      const empRecords = records.filter(
        (r) => r.employeeId === emp.id && r.attendanceDate.startsWith(selectedMonth)
      );
      totalLate = empRecords.reduce((acc, c) => acc + (c.lateMinutes || 0), 0);

      return [
        emp.employeeCode,
        `"${emp.fullName}"`,
        `"${emp.designation}"`,
        ...cells,
        presentCount,
        absentCount,
        totalLate,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_muster_matrix_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Monthly Muster Roll
            </span>
            <span className="text-xs font-bold uppercase text-slate-500">
              Statutory Form D Inspection Ready
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Attendance Calendar & Muster Roll</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete month-at-a-glance presence matrix with late arrivals, overtime, and weekly off tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200"
          >
            <Printer className="w-4 h-4" />
            <span>Print Muster</span>
          </button>
          <button
            onClick={handleExportMatrixCSV}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Grid</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <label className="font-bold text-slate-700">Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-800 bg-white"
          />
        </div>

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

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search personnel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 font-medium text-slate-700 bg-white w-48"
            />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">P = Present</span>
          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">L* = Late</span>
          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">A = Absent</span>
          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">H = Holiday</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">WO = Off</span>
        </div>
      </div>

      {/* Monthly Attendance Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-wider">
                <th className="p-3 sticky left-0 z-20 bg-slate-900 min-w-[180px]">
                  Guard / Personnel
                </th>
                {daysArray.map((d) => (
                  <th key={d} className="p-2 text-center min-w-[28px] border-l border-slate-800">
                    {d}
                  </th>
                ))}
                <th className="p-3 text-center border-l border-slate-800 bg-slate-900">Present</th>
                <th className="p-3 text-center border-l border-slate-800 bg-slate-900">Absent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => {
                let presentCount = 0;
                let absentCount = 0;

                const dayCells = daysArray.map((day) => {
                  const status = getCellStatus(emp.id, day);
                  if (status.tag === 'P' || status.tag === 'L*') presentCount++;
                  if (status.tag === 'A') absentCount++;
                  return (
                    <td
                      key={day}
                      className="p-1 text-center border-l border-slate-100 font-mono text-[10px]"
                      title={`${status.label} on Day ${day}`}
                    >
                      <span
                        className={`inline-block w-6 h-6 leading-6 rounded-md font-bold ${status.bg}`}
                      >
                        {status.tag}
                      </span>
                    </td>
                  );
                });

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 sticky left-0 z-10 bg-white hover:bg-slate-50 font-medium border-r border-slate-200">
                      <div className="font-bold text-slate-900 truncate">{emp.fullName}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {emp.employeeCode} • {emp.designation}
                      </div>
                    </td>
                    {dayCells}
                    <td className="p-3 text-center font-black text-emerald-600 bg-emerald-50/30 border-l border-slate-200">
                      {presentCount}
                    </td>
                    <td className="p-3 text-center font-black text-rose-600 bg-rose-50/30 border-l border-slate-200">
                      {absentCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
