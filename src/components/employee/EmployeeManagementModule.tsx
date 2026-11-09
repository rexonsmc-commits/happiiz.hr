/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Employee,
  CompanyDepartment,
  CompanyBranch,
  EmployeeLifecycleStatus,
} from '../../types';
import {
  getCompanyEmployees,
  getCompanyDepartments,
  getCompanyBranches,
  changeEmployeeStatus,
} from '../../services/tenantService';
import { EmployeeRegistrationModal } from './EmployeeRegistrationModal';
import { EmployeeProfileView } from './EmployeeProfileView';
import { EmployeeIdCardGenerator } from './EmployeeIdCardGenerator';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Shield,
  Download,
  Printer,
  FileSpreadsheet,
  Building2,
  Calendar,
  IdCard,
  CreditCard,
  Eye,
  Edit2,
  UserCheck,
  UserX,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
} from 'lucide-react';

export const EmployeeManagementModule: React.FC = () => {
  const { currentCompany, currentUser } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<CompanyDepartment[]>([]);
  const [branches, setBranches] = useState<CompanyBranch[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Active Selected Views
  const [selectedEmployeeForProfile, setSelectedEmployeeForProfile] = useState<Employee | null>(null);
  const [selectedEmployeeForIdCard, setSelectedEmployeeForIdCard] = useState<Employee | null>(null);

  // Registration Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Status Change Modal State
  const [statusChangeEmp, setStatusChangeEmp] = useState<Employee | null>(null);
  const [newStatusVal, setNewStatusVal] = useState<EmployeeLifecycleStatus>('active');
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Feedback
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAllData();
  }, [currentCompany]);

  async function loadAllData() {
    if (!currentCompany) return;
    setLoading(true);
    try {
      const [empList, deptList, branchList] = await Promise.all([
        getCompanyEmployees(currentCompany.id),
        getCompanyDepartments(currentCompany.id, currentCompany.tenantId),
        getCompanyBranches(currentCompany.id, currentCompany.tenantId),
      ]);
      setEmployees(empList);
      setDepartments(deptList);
      setBranches(branchList);
    } catch (err) {
      console.error('Failed to load employee directory:', err);
    } finally {
      setLoading(false);
    }
  }

  function showToast(text: string, type: 'success' | 'error' = 'success') {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  }

  // Handle Status Change
  async function handleStatusTransitionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!statusChangeEmp || !currentCompany) return;

    setIsUpdatingStatus(true);
    try {
      const updated = await changeEmployeeStatus(
        currentCompany.id,
        statusChangeEmp.id,
        newStatusVal,
        statusReason || 'Administrative update',
        currentUser?.email || 'admin@happiiz.io'
      );
      setEmployees(employees.map((e) => (e.id === updated.id ? updated : e)));
      setStatusChangeEmp(null);
      setStatusReason('');
      showToast(`Employee ${updated.employeeCode} transitioned to ${newStatusVal.toUpperCase()}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update employee status.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  // Export CSV Handler
  function handleExportCsv() {
    if (!employees.length) return;
    const headers = [
      'Employee Code',
      'Full Name',
      'Designation',
      'Category',
      'Department',
      'Branch',
      'Phone',
      'Status',
      'Joining Date',
      'KYC Status',
    ];
    const rows = filteredEmployees.map((e) => [
      `"${e.employeeCode}"`,
      `"${e.fullName}"`,
      `"${e.designation}"`,
      `"${e.category}"`,
      `"${e.department}"`,
      `"${e.branch}"`,
      `"${e.phone}"`,
      `"${e.status}"`,
      `"${e.dateOfJoining}"`,
      `"${e.documentVerificationStatus}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HappiizHR_Employees_${currentCompany?.tenantId}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Employee roster CSV report generated successfully.');
  }

  // Filtered List
  const filteredEmployees = employees.filter((e) => {
    const matchesSearch =
      e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.designation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesDept = deptFilter === 'all' || e.department === deptFilter;
    const matchesBranch = branchFilter === 'all' || e.branch === branchFilter;
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    const matchesVerification =
      verificationFilter === 'all' || e.documentVerificationStatus === verificationFilter;

    return matchesSearch && matchesStatus && matchesDept && matchesBranch && matchesCategory && matchesVerification;
  });

  // Pagination Slice
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics
  const totalCount = employees.length;
  const activeCount = employees.filter((e) => e.status === 'active').length;
  const inactiveCount = employees.filter((e) => e.status === 'inactive').length;
  const pendingVerificationCount = employees.filter(
    (e) => e.documentVerificationStatus === 'pending' || e.documentVerificationStatus === 'under_review'
  ).length;
  const suspendedCount = employees.filter((e) => e.status === 'suspended').length;
  const resignedCount = employees.filter((e) => e.status === 'resigned').length;
  const onLeaveCount = employees.filter((e) => e.status === 'on_leave').length;

  // Capacity calculations
  const maxCapacity = currentCompany?.maxEmployees || 500;
  const capacityPercent = Math.min(100, Math.round((totalCount / maxCapacity) * 100));
  const isAtCapacity = totalCount >= maxCapacity;

  if (!currentCompany) return null;

  // If viewing detailed profile
  if (selectedEmployeeForProfile) {
    return (
      <EmployeeProfileView
        employee={selectedEmployeeForProfile}
        company={currentCompany}
        onBack={() => setSelectedEmployeeForProfile(null)}
        onUpdate={(updated) => {
          setEmployees(employees.map((e) => (e.id === updated.id ? updated : e)));
          setSelectedEmployeeForProfile(updated);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & CAPACITY METER */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
              {currentCompany.tenantId}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Phase 4 HRMS Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Workforce & Employee Directory</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Manage full workforce lifecycles for security guards, housekeeping staff, facility managers, and supervisors with zero-trust masked identity verification and digital ID cards.
          </p>
        </div>

        {/* Capacity Meter & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 min-w-[200px]">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-slate-700">Workforce Quota</span>
              <span className="font-mono font-black text-slate-900">
                {totalCount} / {maxCapacity}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isAtCapacity ? 'bg-rose-500' : capacityPercent > 80 ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              {isAtCapacity ? 'Capacity reached (Upgrade required)' : `${maxCapacity - totalCount} seats available`}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2.5 rounded-2xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/30 cursor-pointer transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Employee</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMsg && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-2.5 text-xs font-semibold animate-in fade-in ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* 2. STATS KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Roster</span>
          <span className="text-xl font-black text-slate-900 mt-0.5 block">{totalCount}</span>
          <span className="text-[10px] text-blue-600 font-semibold">100% Registered</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active On Duty</span>
          <span className="text-xl font-black text-emerald-600 mt-0.5 block">{activeCount}</span>
          <span className="text-[10px] text-emerald-600 font-semibold">Deployable</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pending KYC</span>
          <span className="text-xl font-black text-amber-600 mt-0.5 block">{pendingVerificationCount}</span>
          <span className="text-[10px] text-amber-600 font-semibold">Needs Audit</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">On Leave</span>
          <span className="text-xl font-black text-blue-600 mt-0.5 block">{onLeaveCount}</span>
          <span className="text-[10px] text-blue-600 font-semibold">Temporary Off</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Suspended</span>
          <span className="text-xl font-black text-rose-600 mt-0.5 block">{suspendedCount}</span>
          <span className="text-[10px] text-rose-600 font-semibold">Disciplinary</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Resigned</span>
          <span className="text-xl font-black text-slate-700 mt-0.5 block">{resignedCount}</span>
          <span className="text-[10px] text-slate-500 font-semibold">Relieved</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Inactive</span>
          <span className="text-xl font-black text-slate-600 mt-0.5 block">{inactiveCount}</span>
          <span className="text-[10px] text-slate-400 font-semibold">On Hold</span>
        </div>
      </div>

      {/* 3. ADVANCED SEARCH & MULTI-FILTER BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by code, name, phone, designation..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.branchName}>
                  {b.branchName}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option value="all">All Categories</option>
              <option value="Security Guard">Security Guard</option>
              <option value="Security Supervisor">Security Supervisor</option>
              <option value="Security Officer">Security Officer</option>
              <option value="Housekeeping Staff">Housekeeping Staff</option>
              <option value="Housekeeping Supervisor">Housekeeping Supervisor</option>
              <option value="Technician">Technician</option>
              <option value="Field Staff">Field Staff</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending_joining">Pending Joining</option>
              <option value="on_leave">On Leave</option>
              <option value="suspended">Suspended</option>
              <option value="resigned">Resigned</option>
              <option value="terminated">Terminated</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. PROFESSIONAL EMPLOYEE DIRECTORY TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-4 px-6">Employee</th>
                <th className="py-4 px-4">Contact</th>
                <th className="py-4 px-4">Designation & Category</th>
                <th className="py-4 px-4">Department & Hub</th>
                <th className="py-4 px-4">Joining Date</th>
                <th className="py-4 px-4">Employment Status</th>
                <th className="py-4 px-4">KYC Verification</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No employees matching the selected criteria.
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Employee Profile Cell */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            emp.photoUrl ||
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                          }
                          alt={emp.fullName}
                          className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <span className="font-extrabold text-slate-900 block">{emp.fullName}</span>
                          <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold">
                            {emp.employeeCode}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-4 px-4">
                      <span className="font-mono text-slate-800 font-bold block">{emp.phone}</span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                        {emp.city || 'Gurugram'}, {emp.state || 'Haryana'}
                      </span>
                    </td>

                    {/* Designation */}
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-900 block">{emp.designation}</span>
                      <span className="text-[10px] text-slate-500 font-semibold block">{emp.category}</span>
                    </td>

                    {/* Department & Branch */}
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-800 block truncate max-w-[140px]">
                        {emp.department.split('&')[0]}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                        {emp.branch}
                      </span>
                    </td>

                    {/* Joining Date */}
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-700 block">{emp.dateOfJoining}</span>
                      <span className="text-[10px] text-slate-400 block">{emp.employmentType}</span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          emp.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : emp.status === 'suspended'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : emp.status === 'on_leave'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            emp.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span>{emp.status}</span>
                      </span>
                    </td>

                    {/* KYC Verification Badge */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          emp.documentVerificationStatus === 'verified'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        <span className="capitalize">{emp.documentVerificationStatus}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Profile */}
                        <button
                          type="button"
                          onClick={() => setSelectedEmployeeForProfile(emp)}
                          title="View Complete Profile"
                          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-blue-600 cursor-pointer transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* View ID Card */}
                        <button
                          type="button"
                          onClick={() => setSelectedEmployeeForIdCard(emp)}
                          title="Generate ID Card"
                          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-indigo-600 cursor-pointer transition-colors"
                        >
                          <IdCard className="w-4 h-4" />
                        </button>

                        {/* Quick Status Change */}
                        <button
                          type="button"
                          onClick={() => {
                            setStatusChangeEmp(emp);
                            setNewStatusVal(emp.status);
                          }}
                          title="Change Employment Status"
                          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-amber-600 cursor-pointer transition-colors"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span className="text-slate-500">
            Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
            <strong>{Math.min(currentPage * itemsPerPage, filteredEmployees.length)}</strong> of{' '}
            <strong>{filteredEmployees.length}</strong> employees
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-800">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODAL: REGISTRATION ================= */}
      <EmployeeRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        departments={departments}
        branches={branches}
        currentCount={totalCount}
        maxCapacity={maxCapacity}
        onSuccess={(newEmp) => {
          setEmployees([newEmp, ...employees]);
          showToast(`Employee ${newEmp.employeeCode} enrolled successfully.`);
        }}
      />

      {/* ================= MODAL: DIGITAL ID CARD POPUP ================= */}
      {selectedEmployeeForIdCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl p-6 sm:p-8 space-y-4 my-8 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  Identity Card Preview
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {selectedEmployeeForIdCard.fullName} • {selectedEmployeeForIdCard.employeeCode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmployeeForIdCard(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <EmployeeIdCardGenerator
              employee={selectedEmployeeForIdCard}
              company={currentCompany}
              onClose={() => setSelectedEmployeeForIdCard(null)}
            />
          </div>
        </div>
      )}

      {/* ================= MODAL: STATUS TRANSITION ================= */}
      {statusChangeEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                  Status Transition
                </span>
                <h3 className="text-sm font-black text-slate-900">
                  {statusChangeEmp.fullName} ({statusChangeEmp.employeeCode})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStatusChangeEmp(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusTransitionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Employment Status *</label>
                <select
                  value={newStatusVal}
                  onChange={(e) => setNewStatusVal(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="active">Active (On Duty)</option>
                  <option value="on_leave">On Leave (Approved)</option>
                  <option value="suspended">Suspended (Under Review)</option>
                  <option value="resigned">Resigned (Notice Period)</option>
                  <option value="terminated">Terminated (Separated)</option>
                  <option value="inactive">Inactive (On Hold)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Audit Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Mandatory administrative justification recorded in tenant audit logs..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusChangeEmp(null)}
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
    </div>
  );
};
