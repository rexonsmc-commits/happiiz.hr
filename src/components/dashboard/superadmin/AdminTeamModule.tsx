/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  UserCheck,
  ShieldCheck,
  Lock,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  X,
  Mail,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { PlatformAdminUser, AdminRole } from '../../../types';
import { updateAdminUser } from '../../../services/platformService';

interface AdminTeamModuleProps {
  admins: PlatformAdminUser[];
  onRefresh: () => void;
  currentAdminEmail: string;
}

export const AdminTeamModule: React.FC<AdminTeamModuleProps> = ({
  admins,
  onRefresh,
  currentAdminEmail,
}) => {
  const [editingAdmin, setEditingAdmin] = useState<PlatformAdminUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<AdminRole>('support_admin');
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if current logged in admin is platform owner (Sandeep Rana or developer account)
  const isPlatformOwner =
    currentAdminEmail?.toLowerCase() === 'superadmin@happiizhr.com' ||
    currentAdminEmail?.toLowerCase() === 'rexon.smc@gmail.com';

  const roleDescriptions: Record<AdminRole, { label: string; desc: string; badge: string }> = {
    platform_owner: {
      label: 'Platform Owner',
      desc: 'Full omnipotent administration across security, finance, infrastructure, and team roles.',
      badge: 'bg-purple-100 text-purple-900 border-purple-200',
    },
    super_admin: {
      label: 'Super Admin',
      desc: 'Master operational control, tenant registration approvals, and company lifecycle.',
      badge: 'bg-blue-100 text-blue-900 border-blue-200',
    },
    finance_admin: {
      label: 'Finance Admin',
      desc: 'Subscription billing, invoices, payment reconciliation, and GST reports.',
      badge: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    },
    verification_admin: {
      label: 'Verification Admin',
      desc: 'Review company registrations, audit legal documents, and approve new tenants.',
      badge: 'bg-amber-100 text-amber-900 border-amber-200',
    },
    support_admin: {
      label: 'Support Admin',
      desc: 'Customer support tickets, communication, and tenant troubleshooting.',
      badge: 'bg-sky-100 text-sky-900 border-sky-200',
    },
    auditor: {
      label: 'Read-Only Auditor',
      desc: 'Inspect financial statements and immutable audit trails without edit privileges.',
      badge: 'bg-slate-100 text-slate-800 border-slate-300',
    },
  };

  const handleOpenEdit = (admin: PlatformAdminUser) => {
    setEditingAdmin(admin);
    setSelectedRole(admin.adminRole);
  };

  const handleSaveRole = async () => {
    if (!editingAdmin) return;
    setIsProcessing(true);
    try {
      await updateAdminUser(
        {
          ...editingAdmin,
          adminRole: selectedRole,
        },
        currentAdminEmail
      );
      setEditingAdmin(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Platform Admin Team & RBAC</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
              Role Based Access Control
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Granular permissions architecture ensuring least-privilege access. Only authorized Platform Owners can grant privileged roles.
          </p>
        </div>

        {isPlatformOwner ? (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-bold text-purple-700">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Platform Owner Mode</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Role Modification Restricted</span>
          </span>
        )}
      </div>

      {/* Role Descriptions Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(Object.keys(roleDescriptions) as AdminRole[]).map((roleKey) => {
          const roleInfo = roleDescriptions[roleKey];
          return (
            <div key={roleKey} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${roleInfo.badge}`}>
                {roleInfo.label}
              </span>
              <p className="text-xs text-slate-600 leading-snug pt-1">{roleInfo.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Admin Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Administrator</th>
                <th className="px-4 py-3.5">Assigned Admin Role</th>
                <th className="px-4 py-3.5">Permissions Granted</th>
                <th className="px-4 py-3.5">Assigned Date</th>
                <th className="px-4 py-3.5">Account Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((admin) => {
                const isOwner = admin.adminRole === 'platform_owner';
                const roleInfo = roleDescriptions[admin.adminRole] || roleDescriptions.support_admin;

                return (
                  <tr key={admin.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 text-sky-300 font-black text-xs flex items-center justify-center">
                          {admin.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>{admin.name}</span>
                            {isOwner && (
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                            )}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400">{admin.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${roleInfo.badge}`}>
                        {roleInfo.label}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {admin.permissions.map((p, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono text-[9px]"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(admin.assignedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                        {admin.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {isPlatformOwner && !isOwner ? (
                        <button
                          onClick={() => handleOpenEdit(admin)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-[11px] flex items-center gap-1 ml-auto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Change Role</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          {isOwner ? 'Platform Root' : 'Protected'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT ROLE MODAL */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Update Administrator Role
                </h3>
                <p className="text-xs text-slate-500">{editingAdmin.email}</p>
              </div>
              <button onClick={() => setEditingAdmin(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-bold text-slate-700 block">Select Delegated Role</label>
              <div className="space-y-2">
                {(['super_admin', 'finance_admin', 'verification_admin', 'support_admin', 'auditor'] as AdminRole[]).map((r) => (
                  <label
                    key={r}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedRole === r ? 'border-purple-600 bg-purple-50/50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="admin_role"
                      value={r}
                      checked={selectedRole === r}
                      onChange={() => setSelectedRole(r)}
                      className="mt-0.5 accent-purple-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900">{roleDescriptions[r].label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{roleDescriptions[r].desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setEditingAdmin(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRole}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm"
              >
                {isProcessing ? 'Updating...' : 'Confirm Role Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
