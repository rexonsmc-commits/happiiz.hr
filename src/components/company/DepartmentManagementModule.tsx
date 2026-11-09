/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CompanyDepartment, CompanyUser } from '../../types';
import {
  getCompanyDepartments,
  createCompanyDepartment,
  updateCompanyDepartment,
  deleteCompanyDepartment,
  getCompanyUsers,
} from '../../services/tenantService';
import {
  Layers,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  Edit2,
  Trash2,
  Briefcase,
  Mail,
  UserCheck,
  Check,
  X,
  Building,
} from 'lucide-react';

export const DepartmentManagementModule: React.FC = () => {
  const { currentCompany, currentUser } = useAuth();

  const [departments, setDepartments] = useState<CompanyDepartment[]>([]);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<CompanyDepartment | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [headOfDepartment, setHeadOfDepartment] = useState('');
  const [headEmail, setHeadEmail] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [currentCompany]);

  async function loadData() {
    if (!currentCompany) return;
    setLoading(true);
    try {
      const [deptList, userList] = await Promise.all([
        getCompanyDepartments(currentCompany.id, currentCompany.tenantId),
        getCompanyUsers(currentCompany.id),
      ]);
      setDepartments(deptList);
      setUsers(userList);
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setName('');
    setCode('');
    setDescription('');
    setHeadOfDepartment('');
    setHeadEmail('');
    setStatus('active');
    setErrorMsg(null);
    setIsAddModalOpen(true);
  }

  function openEditModal(dept: CompanyDepartment) {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setDescription(dept.description || '');
    setHeadOfDepartment(dept.headOfDepartment || '');
    setHeadEmail(dept.headEmail || '');
    setStatus(dept.status || 'active');
    setErrorMsg(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentCompany) return;

    if (!name.trim()) {
      setErrorMsg('Department Name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const created = await createCompanyDepartment(
        currentCompany.id,
        currentCompany.tenantId,
        {
          name: name.trim(),
          code: (code || name.substring(0, 3)).trim().toUpperCase(),
          description: description.trim(),
          headOfDepartment: headOfDepartment.trim(),
          headEmail: headEmail.trim().toLowerCase(),
          userCount: 0,
          status,
        },
        currentUser?.email || 'admin@happiiz.io'
      );

      setDepartments([...departments, created]);
      setIsAddModalOpen(false);
      setSuccessMsg(`Department "${created.name}" created successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create department.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentCompany || !editingDept) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const updated = await updateCompanyDepartment(
        currentCompany.id,
        editingDept.id,
        {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
          headOfDepartment: headOfDepartment.trim(),
          headEmail: headEmail.trim().toLowerCase(),
          status,
        },
        currentUser?.email || 'admin@happiiz.io'
      );

      setDepartments(departments.map((d) => (d.id === updated.id ? updated : d)));
      setEditingDept(null);
      setSuccessMsg(`Department "${updated.name}" updated successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update department.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(dept: CompanyDepartment) {
    if (!currentCompany) return;
    if (window.confirm(`Are you sure you want to delete the department "${dept.name}"?`)) {
      try {
        await deleteCompanyDepartment(currentCompany.id, dept.id, currentUser?.email || 'admin@happiiz.io');
        setDepartments(departments.filter((d) => d.id !== dept.id));
        setSuccessMsg(`Department "${dept.name}" removed.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to delete department.');
      }
    }
  }

  const filteredDepts = departments.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.headOfDepartment || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {currentCompany?.tenantId}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Organization Structure
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900">Department Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize staff, supervisors, and operations teams into dedicated business divisions.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Department</span>
        </button>
      </div>

      {/* Notifications */}
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

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search departments by name, code, or department head..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                statusFilter === s
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDepts.map((dept) => {
          const deptUsers = users.filter((u) => u.department === dept.name);
          const activeUserCount = deptUsers.length || dept.userCount || 0;
          const isActive = dept.status === 'active';

          return (
            <div
              key={dept.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-blue-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 font-mono font-bold flex items-center justify-center shrink-0">
                      {dept.code || 'DEP'}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{dept.name}</h3>
                      <span className="font-mono text-[10px] text-slate-400">Code: {dept.code}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {dept.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                  {dept.description || 'Specialized workforce division.'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Department Head:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[160px]">
                      {dept.headOfDepartment || 'Unassigned'}
                    </span>
                  </div>

                  {dept.headEmail && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Contact Email:</span>
                      <span className="font-mono text-[11px] text-slate-600 truncate max-w-[160px]">
                        {dept.headEmail}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Assigned Staff:</span>
                    <span className="font-bold text-blue-600 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{activeUserCount} Members</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(dept)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>

                <button
                  onClick={() => handleDelete(dept)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete Department"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Department Modal */}
      {(isAddModalOpen || editingDept) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingDept ? 'Edit Department' : 'Create New Department'}
                </h3>
                <p className="text-xs text-slate-500">Configure divisional leadership and responsibilities.</p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingDept(null);
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingDept ? handleUpdate : handleCreate} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. VIP Armed Escort Command"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. VIP-OPS"
                  className="w-full px-3.5 py-2 text-xs uppercase font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Head of Department</label>
                <input
                  type="text"
                  value={headOfDepartment}
                  onChange={(e) => setHeadOfDepartment(e.target.value)}
                  placeholder="e.g. Capt. Sandeep Rathore"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Head Contact Email</label>
                <input
                  type="email"
                  value={headEmail}
                  onChange={(e) => setHeadEmail(e.target.value)}
                  placeholder="head@company.com"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Operational scope of this department..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingDept(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : editingDept ? 'Save Changes' : 'Create Department'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
