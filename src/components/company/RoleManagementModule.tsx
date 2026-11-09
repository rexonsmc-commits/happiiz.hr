/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CompanyRole } from '../../types';
import {
  getCompanyRoles,
  createCompanyRole,
  updateCompanyRole,
  duplicateCompanyRole,
} from '../../services/tenantService';
import {
  PERMISSION_GROUPS,
  ALL_PERMISSION_KEYS,
  PermissionGroup,
} from '../../services/seedData';
import {
  Shield,
  Plus,
  Copy,
  Edit2,
  Check,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sparkles,
  Search,
  Filter,
  CheckSquare,
  Square,
  Users,
  Eye,
  Sliders,
  X,
} from 'lucide-react';

export const RoleManagementModule: React.FC = () => {
  const { currentCompany, currentUser } = useAuth();

  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'system' | 'custom'>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CompanyRole | null>(null);
  const [duplicatingRole, setDuplicatingRole] = useState<CompanyRole | null>(null);
  const [duplicateName, setDuplicateName] = useState('');

  // Form State
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // UI feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadRoles();
  }, [currentCompany]);

  async function loadRoles() {
    if (!currentCompany) return;
    setLoading(true);
    try {
      const list = await getCompanyRoles(currentCompany.id, currentCompany.tenantId);
      setRoles(list);
    } catch (err) {
      console.error('Failed to load roles:', err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissions([
      'dashboard:view',
      'company:view',
      'employees:view',
      'sites:view',
    ]);
    setErrorMsg(null);
    setIsCreateModalOpen(true);
  }

  function openEditModal(role: CompanyRole) {
    setEditingRole(role);
    setRoleName(role.roleName);
    setRoleDescription(role.description || '');
    setSelectedPermissions([...role.permissions]);
    setErrorMsg(null);
  }

  function openDuplicateModal(role: CompanyRole) {
    setDuplicatingRole(role);
    setDuplicateName(`${role.roleName} (Copy)`);
    setErrorMsg(null);
  }

  function togglePermission(key: string) {
    if (selectedPermissions.includes(key)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== key));
    } else {
      setSelectedPermissions([...selectedPermissions, key]);
    }
  }

  function toggleModuleAll(group: PermissionGroup) {
    const groupKeys = group.permissions.map((p) => p.key);
    const hasAll = groupKeys.every((k) => selectedPermissions.includes(k));

    if (hasAll) {
      // Uncheck all
      setSelectedPermissions(selectedPermissions.filter((k) => !groupKeys.includes(k)));
    } else {
      // Check all
      const combined = Array.from(new Set([...selectedPermissions, ...groupKeys]));
      setSelectedPermissions(combined);
    }
  }

  function selectAllPermissions() {
    setSelectedPermissions([...ALL_PERMISSION_KEYS]);
  }

  function clearAllPermissions() {
    setSelectedPermissions([]);
  }

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    if (!currentCompany) return;

    if (!roleName.trim()) {
      setErrorMsg('Role Name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const newRole = await createCompanyRole(
        currentCompany.id,
        currentCompany.tenantId,
        {
          roleName: roleName.trim(),
          description: roleDescription.trim(),
          permissions: selectedPermissions,
        },
        currentUser?.email || 'admin@happiiz.io'
      );

      setRoles([newRole, ...roles]);
      setIsCreateModalOpen(false);
      setSuccessMsg(`Custom role "${newRole.roleName}" created with ${newRole.permissions.length} permissions.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create role.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateRole(e: React.FormEvent) {
    e.preventDefault();
    if (!currentCompany || !editingRole) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const updated = await updateCompanyRole(
        currentCompany.id,
        editingRole.id,
        {
          roleName: editingRole.isSystemRole ? editingRole.roleName : roleName.trim(),
          description: roleDescription.trim(),
          permissions: selectedPermissions,
        },
        currentUser?.email || 'admin@happiiz.io'
      );

      setRoles(roles.map((r) => (r.id === updated.id ? updated : r)));
      setEditingRole(null);
      setSuccessMsg(`Role "${updated.roleName}" permissions updated.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update role.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDuplicate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentCompany || !duplicatingRole) return;

    if (!duplicateName.trim()) {
      setErrorMsg('Please enter a role name for the duplicated role.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const cloned = await duplicateCompanyRole(
        currentCompany.id,
        currentCompany.tenantId,
        duplicatingRole.id,
        duplicateName.trim(),
        currentUser?.email || 'admin@happiiz.io'
      );

      setRoles([cloned, ...roles]);
      setDuplicatingRole(null);
      setSuccessMsg(`Role duplicated into "${cloned.roleName}".`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to duplicate role.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredRoles = roles.filter((r) => {
    const matchesSearch =
      r.roleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === 'all' ||
      (filterType === 'system' && r.isSystemRole) ||
      (filterType === 'custom' && !r.isSystemRole);
    return matchesSearch && matchesType;
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
              Access Control & RBAC
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900">Role & Permission Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure system default roles and create custom organizational roles with granular modular permissions.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Custom Role</span>
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

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roles by title or scope..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'system', 'custom'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                filterType === t
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'all' ? 'All Roles' : t === 'system' ? 'System Roles (12)' : 'Custom Roles'}
            </button>
          ))}
        </div>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoles.map((role) => {
          const isFullAdmin = role.permissions.length === ALL_PERMISSION_KEYS.length;
          return (
            <div
              key={role.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-blue-300 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                        {role.roleName}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {role.isSystemRole ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            <Lock className="w-2.5 h-2.5" />
                            <span>System Default</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Custom Role</span>
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {role.permissions.length} Perms
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                  {role.description || 'No description provided.'}
                </p>

                {/* Permissions summary pill bar */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Authorized Scope
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {isFullAdmin ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        Omnipotent Full Platform Access
                      </span>
                    ) : (
                      role.permissions.slice(0, 4).map((p: string) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700"
                        >
                          {p.replace(':', ' • ')}
                        </span>
                      ))
                    )}
                    {!isFullAdmin && role.permissions.length > 4 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-50 text-slate-400">
                        +{role.permissions.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => openDuplicateModal(role)}
                  className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Clone as Custom Role"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>

                <button
                  onClick={() => openEditModal(role)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Configure Permissions</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission Editor Modal (Create or Edit) */}
      {(isCreateModalOpen || editingRole) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingRole ? `Configure Permissions: ${editingRole.roleName}` : 'Create New Custom Role'}
                </h3>
                <p className="text-xs text-slate-500">
                  Select permitted operations across operational modules using checkbox matrix.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingRole(null);
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form
              onSubmit={editingRole ? handleUpdateRole : handleCreateRole}
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Role Title and Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role Name * {editingRole?.isSystemRole && <span className="text-slate-400 font-normal">(System Protected)</span>}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editingRole?.isSystemRole}
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. Night Shift Operations Supervisor"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role Description</label>
                  <input
                    type="text"
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    placeholder="Brief description of responsibilities..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Module Permissions Matrix ({selectedPermissions.length} selected)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllPermissions}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={clearAllPermissions}
                    className="text-[11px] font-bold text-slate-500 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Checkbox Permission Modules */}
              <div className="space-y-4">
                {PERMISSION_GROUPS.map((group) => {
                  const groupKeys = group.permissions.map((p) => p.key);
                  const isAllChecked = groupKeys.every((k) => selectedPermissions.includes(k));
                  const isSomeChecked = groupKeys.some((k) => selectedPermissions.includes(k)) && !isAllChecked;

                  return (
                    <div
                      key={group.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">{group.name}</h4>
                            <span className="text-[10px] text-slate-400 font-medium">({group.permissions.length} actions)</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{group.description}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleModuleAll(group)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            isAllChecked
                              ? 'bg-blue-600 text-white'
                              : isSomeChecked
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {isAllChecked ? <Check className="w-3 h-3" /> : null}
                          <span>{isAllChecked ? 'All Enabled' : 'Select Group'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {group.permissions.map((perm) => {
                          const isChecked = selectedPermissions.includes(perm.key);
                          return (
                            <label
                              key={perm.key}
                              className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                                isChecked
                                  ? 'bg-blue-50/70 border-blue-200 text-blue-900 font-semibold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(perm.key)}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                              />
                              <div className="truncate">
                                <span className="block truncate">{perm.label}</span>
                                <span className="text-[10px] uppercase font-mono text-slate-400 block">
                                  {perm.action}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit footer inside modal */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingRole(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Saving...'
                      : editingRole
                      ? 'Apply Permission Changes'
                      : 'Create Custom Role'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Role Modal */}
      {duplicatingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Duplicate Role Template</h3>
                <p className="text-xs text-slate-500">Clone permissions into a new custom role.</p>
              </div>
              <button
                onClick={() => setDuplicatingRole(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmDuplicate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Role Name *</label>
                <input
                  type="text"
                  required
                  value={duplicateName}
                  onChange={(e) => setDuplicateName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 text-slate-600 text-xs">
                Cloning <span className="font-bold text-slate-900">{duplicatingRole.roleName}</span> with all{' '}
                <span className="font-bold text-blue-600">{duplicatingRole.permissions.length}</span> assigned
                permissions.
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDuplicatingRole(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Duplicating...' : 'Duplicate Role'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
