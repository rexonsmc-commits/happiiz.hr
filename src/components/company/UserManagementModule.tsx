/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CompanyUser, CompanyRole, CompanyDepartment, CompanyBranch } from '../../types';
import {
  getCompanyUsers,
  createCompanyUser,
  updateCompanyUser,
  setCompanyUserStatus,
  resetCompanyUserPassword,
  getCompanyRoles,
  getCompanyDepartments,
  getCompanyBranches,
} from '../../services/tenantService';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Key,
  Shield,
  Building2,
  MapPin,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  Briefcase,
  Lock,
  UserX,
  UserCheck,
  RefreshCw,
  Eye,
  Edit2,
  X,
} from 'lucide-react';

export const UserManagementModule: React.FC = () => {
  const { currentCompany, currentUser } = useAuth();

  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [departments, setDepartments] = useState<CompanyDepartment[]>([]);
  const [branches, setBranches] = useState<CompanyBranch[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<CompanyUser | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [branch, setBranch] = useState('');
  const [assignedRoleId, setAssignedRoleId] = useState('');
  const [accountStatus, setAccountStatus] = useState<'active' | 'deactivated' | 'suspended'>('active');
  const [joiningDate, setJoiningDate] = useState('');

  // UI feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, [currentCompany]);

  async function loadAllData() {
    if (!currentCompany) return;
    setLoading(true);
    try {
      const [userList, roleList, deptList, branchList] = await Promise.all([
        getCompanyUsers(currentCompany.id),
        getCompanyRoles(currentCompany.id, currentCompany.tenantId),
        getCompanyDepartments(currentCompany.id, currentCompany.tenantId),
        getCompanyBranches(currentCompany.id, currentCompany.tenantId),
      ]);
      setUsers(userList);
      setRoles(roleList);
      setDepartments(deptList);
      setBranches(branchList);
    } catch (err) {
      console.error('Failed to load user management data:', err);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setFullName('');
    setEmail('');
    setMobileNumber('');
    setDesignation('Staff Member');
    setDepartment(departments[0]?.name || 'Operations & Deployments');
    setBranch(branches[0]?.branchName || 'Headquarters');
    setAssignedRoleId(roles[1]?.id || roles[0]?.id || '');
    setAccountStatus('active');
    setJoiningDate(new Date().toISOString().substring(0, 10));
    setErrorMsg(null);
    setIsAddModalOpen(true);
  }

  function openEditModal(user: CompanyUser) {
    setEditingUser(user);
    setFullName(user.fullName);
    setEmail(user.email);
    setMobileNumber(user.mobileNumber || '');
    setDesignation(user.designation || '');
    setDepartment(user.department || '');
    setBranch(user.branch || '');
    setAssignedRoleId(user.assignedRoleId || '');
    setAccountStatus(user.accountStatus || 'active');
    setJoiningDate(user.joiningDate || '');
    setErrorMsg(null);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!currentCompany) return;

    if (!fullName.trim() || !email.trim()) {
      setErrorMsg('Full Name and Email address are required.');
      return;
    }

    const selectedRole = roles.find((r) => r.id === assignedRoleId);
    if (!selectedRole) {
      setErrorMsg('Please select a valid role.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const newUser = await createCompanyUser(
        currentCompany.id,
        currentCompany.tenantId,
        {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          mobileNumber: mobileNumber.trim(),
          designation: designation.trim() || 'Staff Specialist',
          department: department || 'Operations',
          branch: branch || 'Headquarters',
          assignedRoleId: selectedRole.id,
          assignedRoleName: selectedRole.roleName,
          accountStatus,
          joiningDate: joiningDate || new Date().toISOString().substring(0, 10),
        },
        currentUser?.uid || 'company_admin',
        currentUser?.email || 'admin@happiiz.io'
      );

      setUsers([newUser, ...users]);
      setIsAddModalOpen(false);
      setSuccessMsg(`User ${newUser.fullName} has been provisioned and invitation dispatched.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!currentCompany || !editingUser) return;

    const selectedRole = roles.find((r) => r.id === assignedRoleId);

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const updated = await updateCompanyUser(
        currentCompany.id,
        editingUser.id,
        {
          fullName: fullName.trim(),
          mobileNumber: mobileNumber.trim(),
          designation: designation.trim(),
          department,
          branch,
          assignedRoleId: selectedRole ? selectedRole.id : editingUser.assignedRoleId,
          assignedRoleName: selectedRole ? selectedRole.roleName : editingUser.assignedRoleName,
          accountStatus,
          joiningDate,
        },
        currentUser?.email || 'admin@happiiz.io'
      );

      setUsers(users.map((u) => (u.id === updated.id ? updated : u)));
      setEditingUser(null);
      setSuccessMsg(`User ${updated.fullName} details updated successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update user profile.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(user: CompanyUser) {
    if (!currentCompany) return;
    const nextStatus = user.accountStatus === 'active' ? 'deactivated' : 'active';
    try {
      await setCompanyUserStatus(currentCompany.id, user.id, nextStatus, currentUser?.email || 'admin@happiiz.io');
      setUsers(users.map((u) => (u.id === user.id ? { ...u, accountStatus: nextStatus } : u)));
      setSuccessMsg(`User ${user.fullName} is now ${nextStatus}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to change status.');
    }
  }

  async function handlePasswordReset(user: CompanyUser) {
    if (!currentCompany) return;
    try {
      const res = await resetCompanyUserPassword(currentCompany.id, user.id, currentUser?.email || 'admin@happiiz.io');
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to dispatch password reset.');
    }
  }

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.designation || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.assignedRoleId === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.accountStatus === statusFilter;
    const matchesDept = departmentFilter === 'all' || u.department === departmentFilter;
    return matchesSearch && matchesRole && matchesStatus && matchesDept;
  });

  const activeCount = users.filter((u) => u.accountStatus === 'active').length;
  const deactivatedCount = users.filter((u) => u.accountStatus !== 'active').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {currentCompany?.tenantId}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Company Administration
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900">Company User Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authorized staff accounts, department managers, supervisors, and role assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400">Total Registered Users</span>
          <div className="mt-1 text-2xl font-black text-slate-900">{users.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Staff & Managers</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400">Active Accounts</span>
          <div className="mt-1 text-2xl font-black text-emerald-600">{activeCount}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Ready for login</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400">Deactivated / Suspended</span>
          <div className="mt-1 text-2xl font-black text-slate-500">{deactivatedCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Access disabled</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400">Configured Roles</span>
          <div className="mt-1 text-2xl font-black text-blue-600">{roles.length}</div>
          <div className="text-[10px] text-blue-600 font-medium mt-0.5">Granular RBAC</div>
        </div>
      </div>

      {/* Feedback Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-900 font-semibold animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by full name, work email, or designation..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          >
            <option value="all">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.roleName}
              </option>
            ))}
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="deactivated">Deactivated</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* User Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">User Details</th>
                <th className="py-3.5 px-4">Designation</th>
                <th className="py-3.5 px-4">Department & Branch</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-600">No users found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try refining your search terms or add a new user.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isActive = user.accountStatus === 'active';
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                            {user.fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{user.fullName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
                            {user.mobileNumber && (
                              <div className="text-[10px] text-slate-400">{user.mobileNumber}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{user.designation}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{user.department}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{user.branch}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {user.assignedRoleName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{user.accountStatus}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {user.joiningDate || user.createdAt?.substring(0, 10)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedUserDetails(user)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="View User Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handlePasswordReset(user)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Send Password Reset"
                          >
                            <Key className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isActive
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={isActive ? 'Deactivate User' : 'Activate User'}
                          >
                            {isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Add New Company User</h3>
                <p className="text-xs text-slate-500">Provide staff information and assign access permissions.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rameshwar Gupta"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Work Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="r.gupta@company.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Contact</label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Operations Executive"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Branch Location *</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.branchName}>
                        {b.branchName} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Role *</label>
                  <select
                    value={assignedRoleId}
                    onChange={(e) => setAssignedRoleId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    {roles
                      // Protect Super Admin / Platform Owner from appearing in Company User creation
                      .filter((r) => {
                        const code = (r.roleCode || r.id || '').toLowerCase();
                        return !code.includes('super') && !code.includes('platform');
                      })
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.roleName}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={accountStatus}
                    onChange={(e) => setAccountStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="active">Active (Access Granted)</option>
                    <option value="deactivated">Deactivated (Access Revoked)</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Provisioning...' : 'Provision User Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Edit User Profile</h3>
                <p className="text-xs text-slate-500">Update designation, role, department, or status.</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email (Immutable)</label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Contact</label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.branchName}>
                        {b.branchName} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={assignedRoleId}
                    onChange={(e) => setAssignedRoleId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    {roles
                      .filter((r) => {
                        const code = (r.roleCode || r.id || '').toLowerCase();
                        return !code.includes('super') && !code.includes('platform');
                      })
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.roleName}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={accountStatus}
                    onChange={(e) => setAccountStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="deactivated">Deactivated</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>{isSubmitting ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Details Modal */}
      {selectedUserDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">User Profile Overview</h3>
              <button
                onClick={() => setSelectedUserDetails(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shrink-0">
                  {selectedUserDetails.fullName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{selectedUserDetails.fullName}</h4>
                  <p className="text-[11px] text-slate-500">{selectedUserDetails.designation}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedUserDetails.assignedRoleName}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Email Address:</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedUserDetails.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-semibold text-slate-800">{selectedUserDetails.mobileNumber || 'Not provided'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-semibold text-slate-800">{selectedUserDetails.department}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Branch Office:</span>
                  <span className="font-semibold text-slate-800">{selectedUserDetails.branch}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Account Status:</span>
                  <span className="font-bold uppercase text-emerald-600">{selectedUserDetails.accountStatus}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Date of Joining:</span>
                  <span className="font-mono text-slate-700">{selectedUserDetails.joiningDate || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Tenant ID:</span>
                  <span className="font-mono text-blue-700">{selectedUserDetails.tenantId}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedUserDetails(null)}
                  className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
