/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CompanyBranch, CompanyUser } from '../../types';
import {
  getCompanyBranches,
  createCompanyBranch,
  updateCompanyBranch,
  deleteCompanyBranch,
  getCompanyUsers,
} from '../../services/tenantService';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Users,
  Edit2,
  Trash2,
  UserCheck,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';

export const BranchManagementModule: React.FC = () => {
  const { currentCompany, currentUser } = useAuth();

  const [branches, setBranches] = useState<CompanyBranch[]>([]);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<CompanyBranch | null>(null);

  // Form State
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [branchManager, setBranchManager] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
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
      const [branchList, userList] = await Promise.all([
        getCompanyBranches(currentCompany.id, currentCompany.tenantId),
        getCompanyUsers(currentCompany.id),
      ]);
      setBranches(branchList);
      setUsers(userList);
    } catch (err) {
      console.error('Failed to load branches:', err);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setBranchName('');
    setBranchCode('');
    setBranchManager('');
    setContactNumber(currentCompany?.phone || '');
    setEmail(currentCompany?.adminEmail || '');
    setAddress('');
    setCity(currentCompany?.city || '');
    setState(currentCompany?.state || '');
    setPinCode(currentCompany?.pinCode || '');
    setStatus('active');
    setErrorMsg(null);
    setIsAddModalOpen(true);
  }

  function openEditModal(branch: CompanyBranch) {
    setEditingBranch(branch);
    setBranchName(branch.branchName);
    setBranchCode(branch.branchCode);
    setBranchManager(branch.branchManager || '');
    setContactNumber(branch.contactNumber || '');
    setEmail(branch.email || '');
    setAddress(branch.address || '');
    setCity(branch.city || '');
    setState(branch.state || '');
    setPinCode(branch.pinCode || '');
    setStatus(branch.status || 'active');
    setErrorMsg(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentCompany) return;

    if (!branchName.trim() || !branchCode.trim()) {
      setErrorMsg('Branch Name and Branch Code are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const created = await createCompanyBranch(
        currentCompany.id,
        currentCompany.tenantId,
        {
          branchName: branchName.trim(),
          branchCode: branchCode.trim().toUpperCase(),
          branchManager: branchManager.trim(),
          contactNumber: contactNumber.trim(),
          email: email.trim().toLowerCase(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pinCode: pinCode.trim(),
          status,
          userCount: 0,
        },
        currentUser?.email || 'admin@happiiz.io'
      );

      setBranches([...branches, created]);
      setIsAddModalOpen(false);
      setSuccessMsg(`Branch "${created.branchName}" created with code ${created.branchCode}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create branch.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentCompany || !editingBranch) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const updated = await updateCompanyBranch(
        currentCompany.id,
        editingBranch.id,
        {
          branchName: branchName.trim(),
          branchCode: branchCode.trim().toUpperCase(),
          branchManager: branchManager.trim(),
          contactNumber: contactNumber.trim(),
          email: email.trim().toLowerCase(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pinCode: pinCode.trim(),
          status,
        },
        currentUser?.email || 'admin@happiiz.io'
      );

      setBranches(branches.map((b) => (b.id === updated.id ? updated : b)));
      setEditingBranch(null);
      setSuccessMsg(`Branch "${updated.branchName}" updated successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update branch.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(branch: CompanyBranch) {
    if (!currentCompany) return;
    if (window.confirm(`Are you sure you want to remove branch "${branch.branchName}"?`)) {
      try {
        await deleteCompanyBranch(currentCompany.id, branch.id, currentUser?.email || 'admin@happiiz.io');
        setBranches(branches.filter((b) => b.id !== branch.id));
        setSuccessMsg(`Branch "${branch.branchName}" removed.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to delete branch.');
      }
    }
  }

  const filteredBranches = branches.filter((b) => {
    const matchesSearch =
      b.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.branchCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.branchManager || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
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
              Regional Operations
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900">Branch Office Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage regional dispatch offices, branch managers, contact hotlines, and operational jurisdictions.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Branch</span>
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
            placeholder="Search branches by name, unique code, city, or manager..."
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

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBranches.map((branch) => {
          const branchUsers = users.filter((u) => u.branch === branch.branchName);
          const activeUserCount = branchUsers.length || branch.userCount || 0;
          const isActive = branch.status === 'active';

          return (
            <div
              key={branch.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-blue-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 font-bold flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{branch.branchName}</h3>
                      <span className="font-mono text-[10px] text-blue-600 font-bold">
                        {branch.branchCode}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {branch.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-start gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      {branch.address ? `${branch.address}, ` : ''}
                      {branch.city}, {branch.state} - {branch.pinCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-600">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Manager: <strong className="text-slate-900">{branch.branchManager || 'Unassigned'}</strong>
                    </span>
                  </div>

                  {branch.contactNumber && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{branch.contactNumber}</span>
                    </div>
                  )}

                  {branch.email && (
                    <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{branch.email}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Assigned Personnel:</span>
                  <span className="font-bold text-blue-600 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{activeUserCount} Staff</span>
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(branch)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Branch</span>
                </button>

                <button
                  onClick={() => handleDelete(branch)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete Branch"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Branch Modal */}
      {(isAddModalOpen || editingBranch) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingBranch ? 'Edit Branch Office' : 'Add New Branch Office'}
                </h3>
                <p className="text-xs text-slate-500">Provide branch operational jurisdiction and manager contact.</p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingBranch(null);
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingBranch ? handleUpdate : handleCreate} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g. Pune Central Industrial Hub"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Branch Code (Unique) *</label>
                  <input
                    type="text"
                    required
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    placeholder="e.g. PUN-IND-04"
                    className="w-full px-3 py-2 text-xs font-mono uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Branch Manager</label>
                  <input
                    type="text"
                    value={branchManager}
                    onChange={(e) => setBranchManager(e.target.value)}
                    placeholder="e.g. Anita Deshmukh"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Branch Hotline Phone</label>
                  <input
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+91 99887 66554"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Branch Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="branch@company.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Suite 101, Business Park"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Pune"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PIN / Postal Code</label>
                  <input
                    type="text"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="411014"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingBranch(null);
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
                  <span>{isSubmitting ? 'Saving...' : editingBranch ? 'Save Branch Changes' : 'Create Branch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
