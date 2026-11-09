/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Clock,
  CalendarDays,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Lock,
  Calendar,
  Layers,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import {
  Employee,
  ClientSite,
  ShiftDefinition,
} from '../../types';
import {
  getCompanyEmployees,
  getCompanySites,
} from '../../services/tenantService';
import { getCompanyShifts } from '../../services/attendanceService';
import { AttendanceDashboard } from './AttendanceDashboard';
import { DutyRosterModule } from './DutyRosterModule';
import { SupervisorPortal } from './SupervisorPortal';
import { OvertimeDoubleDutyModule } from './OvertimeDoubleDutyModule';
import { AttendanceCorrectionModule } from './AttendanceCorrectionModule';
import { HolidaysWeeklyOffModule } from './HolidaysWeeklyOffModule';
import { AttendanceReportsModule } from './AttendanceReportsModule';
import { AttendanceFinalizationModule } from './AttendanceFinalizationModule';
import { EmployeeCheckInModal } from './EmployeeCheckInModal';

export const AttendanceManagementModule: React.FC = () => {
  const { currentCompany } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'roster' | 'supervisor' | 'overtime' | 'corrections' | 'holidays' | 'reports' | 'finalization'
  >('dashboard');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sites, setSites] = useState<ClientSite[]>([]);
  const [shifts, setShifts] = useState<ShiftDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadData = async () => {
    if (!currentCompany) return;
    setLoading(true);
    try {
      const [empList, siteList, shiftList] = await Promise.all([
        getCompanyEmployees(currentCompany.id),
        getCompanySites(currentCompany.id),
        getCompanyShifts(currentCompany.id, currentCompany.tenantId),
      ]);
      setEmployees(empList);
      setSites(siteList);
      setShifts(shiftList);
    } catch (err) {
      console.error('Failed to load attendance module data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentCompany, refreshTrigger]);

  if (!currentCompany) {
    return (
      <div className="p-8 text-center text-slate-500">
        Please select a tenant company to access the Attendance System.
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: Clock },
    { id: 'roster', label: 'Duty Roster & Shifts', icon: CalendarDays },
    { id: 'supervisor', label: 'Supervisor Portal', icon: ShieldCheck },
    { id: 'overtime', label: 'Overtime & Double Duty', icon: Layers },
    { id: 'corrections', label: 'Missing Punch', icon: AlertTriangle },
    { id: 'holidays', label: 'Holidays & Offs', icon: Calendar },
    { id: 'reports', label: 'Muster Roll & Grid', icon: FileText },
    { id: 'finalization', label: 'Payroll Finalization', icon: Lock },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Pill Header */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsCheckInModalOpen(true)}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
        >
          <Smartphone className="w-4 h-4 text-sky-400" />
          <span>Punch Portal (GPS/QR)</span>
        </button>
      </div>

      {/* Render Active Tab */}
      {activeTab === 'dashboard' && (
        <AttendanceDashboard
          companyId={currentCompany.id}
          tenantId={currentCompany.tenantId}
          employees={employees}
          sites={sites}
          onOpenCheckIn={() => setIsCheckInModalOpen(true)}
          onNavigateTab={(tabKey) => setActiveTab(tabKey as any)}
        />
      )}

      {activeTab === 'roster' && (
        <DutyRosterModule
          companyId={currentCompany.id}
          tenantId={currentCompany.tenantId}
          employees={employees}
          sites={sites}
        />
      )}

      {activeTab === 'supervisor' && (
        <SupervisorPortal
          companyId={currentCompany.id}
          tenantId={currentCompany.tenantId}
          sites={sites}
          employees={employees}
        />
      )}

      {activeTab === 'overtime' && (
        <OvertimeDoubleDutyModule
          companyId={currentCompany.id}
          tenantId={currentCompany.tenantId}
          employees={employees}
          sites={sites}
        />
      )}

      {activeTab === 'corrections' && (
        <AttendanceCorrectionModule
          companyId={currentCompany.id}
          tenantId={currentCompany.tenantId}
          employees={employees}
          sites={sites}
        />
      )}

      {activeTab === 'holidays' && (
        <HolidaysWeeklyOffModule
          companyId={currentCompany.id}
          tenantId={currentCompany.tenantId}
          sites={sites}
        />
      )}

      {activeTab === 'reports' && (
        <AttendanceReportsModule
          companyId={currentCompany.id}
          tenantId={currentCompany.tenantId}
          employees={employees}
          sites={sites}
        />
      )}

      {activeTab === 'finalization' && (
        <AttendanceFinalizationModule
          companyId={currentCompany.id}
          tenantId={currentCompany.tenantId}
          employees={employees}
          sites={sites}
        />
      )}

      {/* Check In / Check Out Modal */}
      <EmployeeCheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        companyId={currentCompany.id}
        employees={employees}
        sites={sites}
        shifts={shifts}
        onAttendanceUpdated={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </div>
  );
};
