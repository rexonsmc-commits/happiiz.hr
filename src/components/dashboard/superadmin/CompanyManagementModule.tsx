/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Building2,
  Search,
  Filter,
  Eye,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  Archive,
  RefreshCw,
  Plus,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Lock,
} from 'lucide-react';
import { Company, IndustryType, SubscriptionPlan, SubscriptionStatus } from '../../../types';
import { updateCompanyProfile, updateCompanyStatus } from '../../../services/tenantService';
import {
  approveCompanyRegistration,
  rejectCompanyRegistration,
  archiveCompany,
} from '../../../services/platformService';

interface CompanyManagementModuleProps {
  companies: Company[];
  onRefresh: () => void;
  onOpenRegister: () => void;
  onSwitchToCompany: (company: Company) => void;
  adminEmail: string;
}

export const CompanyManagementModule: React.FC<CompanyManagementModuleProps> = ({
  companies,
  onRefresh,
  onOpenRegister,
  onSwitchToCompany,
  adminEmail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'employees' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Modals state
  const [selectedCompanyDetail, setSelectedCompanyDetail] = useState<Company | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [approvalModal, setApprovalModal] = useState<{
    company: Company;
    action: 'approve' | 'reject';
    notes: string;
  } | null>(null);
  const [archiveModal, setArchiveModal] = useState<{
    company: Company;
    reason: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState<Partial<Company>>({});

  // Filter & Search
  const filtered = companies.filter((comp) => {
    // Archived filter
    if (!showArchived && comp.isArchived) return false;
    if (showArchived && !comp.isArchived) return false;

    const matchesSearch =
      comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.tenantId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comp.adminName && comp.adminName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (comp.ownerName && comp.ownerName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesIndustry = industryFilter === 'all' || comp.industry === industryFilter;
    const matchesStatus = statusFilter === 'all' || comp.subscriptionStatus === statusFilter;
    const matchesPlan = planFilter === 'all' || comp.subscriptionPlan === planFilter;

    return matchesSearch && matchesIndustry && matchesStatus && matchesPlan;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
    else if (sortBy === 'date') comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    else if (sortBy === 'employees') comparison = (a.employeeCount || 0) - (b.employeeCount || 0);
    else if (sortBy === 'status') comparison = a.subscriptionStatus.localeCompare(b.subscriptionStatus);
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginatedCompanies = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (field: 'name' | 'date' | 'employees' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Status toggle handler
  const handleToggleStatus = async (comp: Company) => {
    const nextStatus = comp.subscriptionStatus === 'suspended' ? 'active' : 'suspended';
    setIsProcessing(true);
    try {
      await updateCompanyStatus(comp.id, nextStatus, adminEmail);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Open Edit Form
  const handleOpenEdit = (comp: Company) => {
    setEditingCompany(comp);
    setEditFormData({
      name: comp.name,
      phone: comp.phone,
      adminEmail: comp.adminEmail,
      adminName: comp.adminName || comp.ownerName,
      address: comp.address,
      city: comp.city,
      state: comp.state,
      pinCode: comp.pinCode,
      gstNumber: comp.gstNumber || comp.taxId,
      maxEmployees: comp.maxEmployees,
      description: comp.description,
    });
  };

  // Save Edit Form
  const handleSaveEdit = async () => {
    if (!editingCompany) return;
    setIsProcessing(true);
    try {
      await updateCompanyProfile(editingCompany.id, editFormData, adminEmail);
      setEditingCompany(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Approve or Reject
  const handleConfirmApprovalAction = async () => {
    if (!approvalModal) return;
    setIsProcessing(true);
    try {
      if (approvalModal.action === 'approve') {
        await approveCompanyRegistration(approvalModal.company.id, adminEmail, approvalModal.notes);
      } else {
        await rejectCompanyRegistration(approvalModal.company.id, adminEmail, approvalModal.notes || 'Verification requirements not satisfied.');
      }
      setApprovalModal(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Archive
  const handleConfirmArchive = async () => {
    if (!archiveModal) return;
    setIsProcessing(true);
    try {
      await archiveCompany(archiveModal.company.id, adminEmail, archiveModal.reason || 'Legal retention archive requested.');
      setArchiveModal(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
      {/* Table Header & Search Filters */}
      <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900">Tenant Companies Directory</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
              {filtered.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full enterprise lifecycle management: verification, tier upgrades, suspension, and legal archiving.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search company, Tenant ID, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 w-52 sm:w-64"
            />
          </div>

          {/* Industry Filter */}
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-700 focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Industries</option>
            <option value="security">Security Guard Agency</option>
            <option value="housekeeping">Housekeeping Services</option>
            <option value="manpower">Manpower Supply</option>
            <option value="facility_management">Facility Management</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-700 focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending Approval</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspended</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-700 focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Plans</option>
            <option value="micro">Micro (₹499)</option>
            <option value="starter">Starter (₹20/emp)</option>
            <option value="growth">Growth (₹15/emp)</option>
            <option value="enterprise">Enterprise (₹12/emp)</option>
            <option value="custom">Custom</option>
          </select>

          {/* Archive Toggle */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              showArchived
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{showArchived ? 'Viewing Archived' : 'Archived'}</span>
          </button>

          <button
            onClick={onOpenRegister}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Onboard</span>
          </button>
        </div>
      </div>

      {/* Main Table: Complete Required Columns */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3.5 cursor-pointer hover:text-blue-600" onClick={() => toggleSort('name')}>
                <div className="flex items-center gap-1">
                  <span>Company Name</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-3.5">Unique Tenant ID</th>
              <th className="px-4 py-3.5">Sector</th>
              <th className="px-4 py-3.5">Owner / Admin</th>
              <th className="px-4 py-3.5">Contact</th>
              <th className="px-4 py-3.5 cursor-pointer hover:text-blue-600" onClick={() => toggleSort('date')}>
                <div className="flex items-center gap-1">
                  <span>Registered</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-3.5 cursor-pointer hover:text-blue-600" onClick={() => toggleSort('employees')}>
                <div className="flex items-center gap-1">
                  <span>Workforce</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-3.5">Subscription Plan</th>
              <th className="px-4 py-3.5 cursor-pointer hover:text-blue-600" onClick={() => toggleSort('status')}>
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedCompanies.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-5 py-10 text-center text-slate-400">
                  No company records match your selected criteria.
                </td>
              </tr>
            ) : (
              paginatedCompanies.map((comp) => {
                const regDate = comp.createdAt
                  ? new Date(comp.createdAt).toLocaleDateString([], {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Active';

                const isPending = comp.subscriptionStatus === 'pending' || comp.verificationStatus === 'pending';

                return (
                  <tr key={comp.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Company Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 text-sky-300 font-black text-xs flex items-center justify-center shrink-0">
                          {comp.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs">{comp.name}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                            {comp.city || 'India'} • GST: {comp.gstNumber || comp.taxId || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Immutable Tenant ID */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[11px] text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded font-bold">
                        {comp.tenantId}
                      </span>
                    </td>

                    {/* Sector */}
                    <td className="px-4 py-3.5 capitalize text-slate-700 text-[11px]">
                      {comp.companyType || comp.industry}
                    </td>

                    {/* Owner / Admin */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 text-xs">{comp.adminName || comp.ownerName}</div>
                      <div className="text-[10px] text-slate-400">Authorized Operator</div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-[11px] text-slate-700">{comp.phone}</div>
                      <div className="font-mono text-[10px] text-slate-400 truncate max-w-[130px]">{comp.adminEmail}</div>
                    </td>

                    {/* Registration Date */}
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {regDate}
                    </td>

                    {/* Active Employee Count */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-blue-700 text-xs font-mono">
                        {comp.employeeCount || 0} Staff
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Cap: {comp.maxEmployees || 100}
                      </div>
                    </td>

                    {/* Subscription Plan & Monthly Rate */}
                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-black uppercase rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {comp.subscriptionPlan}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        ₹{comp.monthlyFee || (comp.subscriptionPlan === 'micro' ? 499 : 20 * (comp.employeeCount || 25))}/mo
                      </div>
                    </td>

                    {/* Account Status Badge */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          comp.subscriptionStatus === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : comp.subscriptionStatus === 'suspended'
                            ? 'bg-rose-100 text-rose-800'
                            : comp.subscriptionStatus === 'trial'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            comp.subscriptionStatus === 'active'
                              ? 'bg-emerald-600'
                              : comp.subscriptionStatus === 'suspended'
                              ? 'bg-rose-600'
                              : comp.subscriptionStatus === 'trial'
                              ? 'bg-indigo-600'
                              : 'bg-amber-600'
                          }`}
                        />
                        {comp.subscriptionStatus}
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Details */}
                        <button
                          onClick={() => setSelectedCompanyDetail(comp)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Info */}
                        <button
                          onClick={() => handleOpenEdit(comp)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          title="Edit Permitted Info"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* If Pending: Approve / Reject Buttons */}
                        {isPending ? (
                          <>
                            <button
                              onClick={() => setApprovalModal({ company: comp, action: 'approve', notes: '' })}
                              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setApprovalModal({ company: comp, action: 'reject', notes: '' })}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Open Workspace */}
                            <button
                              onClick={() => onSwitchToCompany(comp)}
                              className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center gap-1 transition-colors"
                              title="Open Tenant Workspace"
                            >
                              <span>Open</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>

                            {/* Suspend / Reactivate */}
                            <button
                              onClick={() => handleToggleStatus(comp)}
                              disabled={isProcessing}
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                                comp.subscriptionStatus === 'suspended'
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                              }`}
                            >
                              {comp.subscriptionStatus === 'suspended' ? 'Reactivate' : 'Suspend'}
                            </button>

                            {/* Archive */}
                            {!comp.isArchived && (
                              <button
                                onClick={() => setArchiveModal({ company: comp, reason: '' })}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                                title="Safely Archive Company"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({sorted.length} total companies)
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-slate-800">{currentPage}</span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MODAL 1: View Company Details */}
      {selectedCompanyDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-bold">
                  {selectedCompanyDetail.tenantId}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {selectedCompanyDetail.name}
                </h3>
                <p className="text-xs text-slate-500 capitalize">
                  {selectedCompanyDetail.companyType || selectedCompanyDetail.industry}
                </p>
              </div>
              <button
                onClick={() => setSelectedCompanyDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Administrator / Owner</span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {selectedCompanyDetail.adminName || selectedCompanyDetail.ownerName}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Official Email</span>
                <div className="font-bold text-slate-900 mt-0.5 font-mono truncate">
                  {selectedCompanyDetail.adminEmail}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Phone</span>
                <div className="font-bold text-slate-900 mt-0.5 font-mono">
                  {selectedCompanyDetail.phone}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">GSTIN / Corporate Tax ID</span>
                <div className="font-bold text-slate-900 mt-0.5 font-mono">
                  {selectedCompanyDetail.gstNumber || selectedCompanyDetail.taxId || 'Not registered / Optional'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 col-span-2">
                <span className="text-slate-500">Headquarters Address</span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {selectedCompanyDetail.address}, {selectedCompanyDetail.city}, {selectedCompanyDetail.state} - {selectedCompanyDetail.pinCode}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Active Workforce Capacity</span>
                <div className="font-bold text-blue-700 mt-0.5">
                  {selectedCompanyDetail.employeeCount} / {selectedCompanyDetail.maxEmployees} Headcount
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Subscription Status</span>
                <div className="font-bold text-emerald-700 mt-0.5 uppercase">
                  {selectedCompanyDetail.subscriptionStatus} ({selectedCompanyDetail.subscriptionPlan})
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <button
                onClick={() => {
                  onSwitchToCompany(selectedCompanyDetail);
                  setSelectedCompanyDetail(null);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <span>Launch Tenant Workspace</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedCompanyDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Permitted Company Information */}
      {editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-bold">
                  {editingCompany.tenantId} (Immutable)
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Edit Permitted Company Information
                </h3>
              </div>
              <button
                onClick={() => setEditingCompany(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Registered Name</label>
                <input
                  type="text"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Administrator / Contact Name</label>
                  <input
                    type="text"
                    value={editFormData.adminName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, adminName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Official Email</label>
                  <input
                    type="email"
                    value={editFormData.adminEmail || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, adminEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">GST Number (Optional)</label>
                  <input
                    type="text"
                    value={editFormData.gstNumber || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, gstNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Address</label>
                <input
                  type="text"
                  value={editFormData.address || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={editFormData.city || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">State</label>
                  <input
                    type="text"
                    value={editFormData.state || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pin Code</label>
                  <input
                    type="text"
                    value={editFormData.pinCode || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, pinCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setEditingCompany(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
              >
                {isProcessing ? 'Saving Changes...' : 'Save Permitted Info'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Approval / Rejection Decision Modal */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">
              {approvalModal.action === 'approve'
                ? `Approve Registration: ${approvalModal.company.name}`
                : `Reject Registration: ${approvalModal.company.name}`}
            </h3>
            <p className="text-xs text-slate-500">
              {approvalModal.action === 'approve'
                ? 'Approving will immediately activate the company tenant workspace and initialize their subscription billing account.'
                : 'Rejecting will decline this registration. An audit trail will be maintained with the administrator decision.'}
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {approvalModal.action === 'approve' ? 'Approval Notes (Optional)' : 'Reason for Rejection *'}
              </label>
              <textarea
                rows={3}
                placeholder={approvalModal.action === 'approve' ? 'Enter verification notes...' : 'Explain rejection cause...'}
                value={approvalModal.notes}
                onChange={(e) => setApprovalModal({ ...approvalModal, notes: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setApprovalModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApprovalAction}
                disabled={isProcessing || (approvalModal.action === 'reject' && !approvalModal.notes)}
                className={`px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm ${
                  approvalModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isProcessing
                  ? 'Processing...'
                  : approvalModal.action === 'approve'
                  ? 'Confirm & Activate Tenant'
                  : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Safe Archive Confirmation */}
      {archiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-2 text-amber-700">
              <Archive className="w-5 h-5" />
              <h3 className="text-base font-extrabold text-slate-900">Archive Company Account</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              In accordance with enterprise compliance rules, company financial and statutory records are <strong>never permanently deleted</strong>. Archiving pauses access while preserving all historic invoices, audit logs, and employee rosters.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Archiving Reason / Justification</label>
              <input
                type="text"
                placeholder="e.g. Contract terminated by customer"
                value={archiveModal.reason}
                onChange={(e) => setArchiveModal({ ...archiveModal, reason: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setArchiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmArchive}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm"
              >
                {isProcessing ? 'Archiving...' : 'Confirm Safe Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
