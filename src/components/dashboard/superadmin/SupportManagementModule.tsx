/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LifeBuoy,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MessageSquare,
  Search,
  Filter,
  X,
  Edit2,
  Building2,
} from 'lucide-react';
import { SupportTicket, Company } from '../../../types';
import { updateSupportTicket } from '../../../services/platformService';

interface SupportManagementModuleProps {
  tickets: SupportTicket[];
  companies: Company[];
  onRefresh: () => void;
  adminEmail: string;
}

export const SupportManagementModule: React.FC<SupportManagementModuleProps> = ({
  tickets,
  companies,
  onRefresh,
  adminEmail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [editStatus, setEditStatus] = useState<SupportTicket['status']>('open');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const filtered = tickets.filter((t) => {
    const matchesSearch =
      t.ticketCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleOpenTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setEditStatus(ticket.status);
    setResolutionNotes(ticket.resolutionNotes || '');
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    setIsProcessing(true);
    try {
      const now = new Date().toISOString();
      await updateSupportTicket(
        selectedTicket.id,
        {
          status: editStatus,
          resolutionNotes,
          resolvedAt: editStatus === 'resolved' || editStatus === 'closed' ? now : undefined,
          assignedAdminEmail: adminEmail,
          assignedAdminName: 'Super Admin',
        },
        adminEmail
      );
      setSelectedTicket(null);
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
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Customer Support & Help Desk</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-black uppercase">
              Multi-Tenant Escalations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Triage operational inquiries from security commanders, housekeeping managers, and facility administrators across all registered workspaces.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ticket code, issue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 w-56"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-700 focus:ring-2 focus:ring-blue-600 font-semibold"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_for_customer">Waiting on Customer</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Ticket Code</th>
                <th className="px-4 py-3.5">Tenant Company</th>
                <th className="px-4 py-3.5">Subject & Details</th>
                <th className="px-4 py-3.5">Priority</th>
                <th className="px-4 py-3.5">Assigned Admin</th>
                <th className="px-4 py-3.5">Created Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    No support tickets match your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-700">
                      {t.ticketCode}
                    </td>

                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      <div>{t.companyName}</div>
                      <span className="font-mono text-[10px] text-slate-400">{t.tenantId}</span>
                    </td>

                    <td className="px-4 py-3.5 max-w-[240px]">
                      <div className="font-bold text-slate-800 text-xs truncate">{t.subject}</div>
                      <div className="text-[11px] text-slate-500 truncate">{t.description}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          t.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-800 font-bold'
                            : t.priority === 'high'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 font-medium">
                      {t.assignedAdminName || 'Unassigned'}
                    </td>

                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          t.status === 'resolved' || t.status === 'closed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenTicket(t)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs"
                      >
                        Resolve
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TICKET DETAILS & RESOLUTION MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold">
                  {selectedTicket.ticketCode} • {selectedTicket.companyName}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {selectedTicket.subject}
                </h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
              {selectedTicket.description}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Update Ticket Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-blue-600"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_for_customer">Waiting on Customer Response</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Resolution Summary / Support Response</label>
                <textarea
                  rows={3}
                  placeholder="Explain actions taken to assist tenant..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTicket}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
              >
                {isProcessing ? 'Updating...' : 'Save Ticket Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
