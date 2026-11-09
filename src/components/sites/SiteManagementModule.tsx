/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Building2,
  Users,
  Clock,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Shield,
  Layers,
  ChevronRight,
  QrCode,
  ArrowRightLeft,
  Calendar,
  Compass,
  FileSpreadsheet,
  FileText,
  BadgeCheck,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  ClientSite,
  Client,
  Employee,
  SiteCategory,
  SiteManpowerRequirement,
  EmployeeDeployment,
} from '../../types';
import {
  getCompanySites,
  createCompanySite,
  updateCompanySite,
  deleteCompanySite,
  getCompanyClients,
  getNextSiteCode,
  getCompanyEmployees,
  getSiteManpowerRequirements,
  saveSiteManpowerRequirement,
  getEmployeeDeployments,
  deployEmployeeToSite,
  transferEmployeeDeployment,
  endEmployeeDeployment,
} from '../../services/tenantService';
import { SiteQrModal } from './SiteQrModal';

interface SiteFormData {
  clientId: string;
  clientName: string;
  siteName: string;
  siteCode: string;
  siteCategory: SiteCategory;
  siteType: string;
  siteDescription?: string;
  address: string;
  buildingName?: string;
  area?: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  contactPerson: string;
  contactNumber: string;
  siteContactEmail?: string;
  assignedBranch?: string;
  siteSupervisorName?: string;
  siteSupervisorId?: string;
  operationsManagerName?: string;
  requiredEmployees: number;
  shiftDetails: string;
  siteInstructions?: string;
  securityInstructions?: string;
  status: 'active' | 'pending' | 'inactive';
}

const INITIAL_FORM: SiteFormData = {
  clientId: '',
  clientName: '',
  siteName: '',
  siteCode: '',
  siteCategory: 'Commercial IT Park',
  siteType: 'Security',
  siteDescription: '',
  address: '',
  buildingName: '',
  area: '',
  city: '',
  state: '',
  pinCode: '',
  country: 'India',
  latitude: undefined,
  longitude: undefined,
  contactPerson: '',
  contactNumber: '',
  siteContactEmail: '',
  assignedBranch: '',
  siteSupervisorName: '',
  siteSupervisorId: '',
  operationsManagerName: '',
  requiredEmployees: 10,
  shiftDetails: '3 Shifts (8h each) • 24/7 Coverage',
  siteInstructions: '',
  securityInstructions: '',
  status: 'active',
};

const SITE_CATEGORIES: SiteCategory[] = [
  'Commercial IT Park',
  'Hospital & Healthcare',
  'Residential Gated Community',
  'Industrial Plant / Factory',
  'Retail Mall / Multiplex',
  'Educational Campus',
  'Warehouse & Logistics Hub',
  'Hotel & Hospitality',
  'Government Installation',
  'Financial Institution / Bank',
  'Construction Site',
  'Other',
];

export const SiteManagementModule: React.FC = () => {
  const { currentCompany } = useAuth();
  const [sites, setSites] = useState<ClientSite[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [deployments, setDeployments] = useState<EmployeeDeployment[]>([]);
  const [siteRequirements, setSiteRequirements] = useState<Record<string, SiteManpowerRequirement[]>>({});

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');

  // Modals & Panels
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<ClientSite | null>(null);
  const [selectedSiteDetail, setSelectedSiteDetail] = useState<ClientSite | null>(null);
  const [activeQrSite, setActiveQrSite] = useState<ClientSite | null>(null);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isAddReqModalOpen, setIsAddReqModalOpen] = useState(false);

  // Forms
  const [formData, setFormData] = useState<SiteFormData>(INITIAL_FORM);
  const [deployForm, setDeployForm] = useState({
    employeeId: '',
    designation: 'Security Guard',
    startDate: new Date().toISOString().split('T')[0],
  });

  const [reqForm, setReqForm] = useState({
    designation: 'Security Guard',
    requiredCount: 5,
    shiftPattern: '3 Shifts (8h) • 24x7',
    skillRequirement: 'PSARA Certified',
  });

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchAllData = async () => {
    if (!currentCompany) return;
    setLoading(true);
    try {
      const [siteList, clientList, empList, depList] = await Promise.all([
        getCompanySites(currentCompany.id),
        getCompanyClients(currentCompany.id),
        getCompanyEmployees(currentCompany.id),
        getEmployeeDeployments(currentCompany.id),
      ]);

      setSites(siteList);
      setClients(clientList);
      setEmployees(empList);
      setDeployments(depList);

      // Load requirements for all sites
      const reqMap: Record<string, SiteManpowerRequirement[]> = {};
      for (const s of siteList) {
        reqMap[s.id] = await getSiteManpowerRequirements(currentCompany.id, s.id);
      }
      setSiteRequirements(reqMap);

      if (selectedSiteDetail) {
        const refreshed = siteList.find((s) => s.id === selectedSiteDetail.id);
        if (refreshed) setSelectedSiteDetail(refreshed);
      }
    } catch (err: any) {
      console.error('[Happiiz HR] Error loading sites:', err);
      setFeedback({ type: 'error', message: err?.message || 'Failed to fetch sites data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [currentCompany]);

  // Open Create Modal & generate next site code
  const handleOpenCreate = async () => {
    if (!currentCompany) return;
    setEditingSite(null);
    const nextCode = await getNextSiteCode(currentCompany.id);
    const firstClient = clients[0];
    setFormData({
      ...INITIAL_FORM,
      siteCode: nextCode,
      clientId: firstClient?.id || '',
      clientName: firstClient?.clientName || '',
    });
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (site: ClientSite) => {
    setEditingSite(site);
    setFormData({
      clientId: site.clientId || '',
      clientName: site.clientName,
      siteName: site.siteName,
      siteCode: site.siteCode,
      siteCategory: site.siteCategory || 'Commercial IT Park',
      siteType: site.siteType || 'Security',
      siteDescription: site.siteDescription || '',
      address: site.address,
      buildingName: site.buildingName || '',
      area: site.area || '',
      city: site.city,
      state: site.state,
      pinCode: site.pinCode,
      country: site.country || 'India',
      latitude: site.latitude,
      longitude: site.longitude,
      contactPerson: site.contactPerson,
      contactNumber: site.contactNumber,
      siteContactEmail: site.siteContactEmail || '',
      assignedBranch: site.assignedBranch || '',
      siteSupervisorName: site.siteSupervisorName || '',
      siteSupervisorId: site.siteSupervisorId || '',
      operationsManagerName: site.operationsManagerName || '',
      requiredEmployees: site.requiredEmployees || site.guardsRequired || 1,
      shiftDetails: site.shiftDetails || '3 Shifts (8h each) • 24/7 Coverage',
      siteInstructions: site.siteInstructions || '',
      securityInstructions: site.securityInstructions || '',
      status: (site.status === 'archived' || site.status === 'completed' ? 'inactive' : site.status) as any,
    });
    setIsCreateModalOpen(true);
  };

  // Client Selection Change
  const handleClientChange = (clientId: string) => {
    const selected = clients.find((c) => c.id === clientId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        clientId: selected.id,
        clientName: selected.clientName || selected.clientDisplayName || selected.clientLegalName || '',
        city: prev.city || selected.city || '',
        state: prev.state || selected.state || '',
        pinCode: prev.pinCode || selected.pinCode || '',
      }));
    }
  };

  // Supervisor Selection Change
  const handleSupervisorSelect = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setFormData((prev) => ({
        ...prev,
        siteSupervisorId: emp.id,
        siteSupervisorName: emp.fullName,
      }));
    }
  };

  // Save Site (Create or Update)
  const handleSubmitSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;

    if (!formData.siteName.trim()) {
      setFeedback({ type: 'error', message: 'Site Name is required.' });
      return;
    }
    if (!formData.clientName.trim()) {
      setFeedback({ type: 'error', message: 'Please select or enter a Client Name.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      if (editingSite) {
        await updateCompanySite(
          currentCompany.id,
          editingSite.id,
          {
            ...formData,
            guardsRequired: formData.requiredEmployees,
          },
          currentCompany.adminEmail
        );
        setFeedback({ type: 'success', message: `Site "${formData.siteName}" updated successfully.` });
      } else {
        const newSite = await createCompanySite(
          currentCompany.id,
          {
            ...formData,
            tenantId: currentCompany.tenantId,
          },
          'authorized_admin',
          currentCompany.adminEmail
        );
        setFeedback({ type: 'success', message: `Site "${newSite.siteName}" (${newSite.siteCode}) provisioned with official QR code.` });
      }

      setIsCreateModalOpen(false);
      await fetchAllData();
    } catch (err: any) {
      console.error('[Happiiz HR] Save site error:', err);
      setFeedback({ type: 'error', message: err?.message || 'Failed to save site.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Site
  const handleDeleteSite = async (site: ClientSite) => {
    if (!currentCompany) return;
    if (!window.confirm(`Are you sure you want to delete site "${site.siteName}" (${site.siteCode})?`)) {
      return;
    }

    try {
      await deleteCompanySite(currentCompany.id, site.id, currentCompany.adminEmail);
      setFeedback({ type: 'success', message: `Site "${site.siteName}" deleted successfully.` });
      if (selectedSiteDetail?.id === site.id) {
        setSelectedSiteDetail(null);
      }
      await fetchAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to delete site.' });
    }
  };

  // Deploy Employee to Site
  const handleDeployEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !selectedSiteDetail || !deployForm.employeeId) return;

    const emp = employees.find((e) => e.id === deployForm.employeeId);
    if (!emp) return;

    setSubmitting(true);
    try {
      await deployEmployeeToSite(
        currentCompany.id,
        {
          companyId: currentCompany.id,
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          employeeName: emp.fullName,
          employeePhone: emp.phone,
          employeePhotoUrl: emp.photoUrl,
          clientId: selectedSiteDetail.clientId,
          clientName: selectedSiteDetail.clientName,
          siteId: selectedSiteDetail.id,
          siteCode: selectedSiteDetail.siteCode,
          siteName: selectedSiteDetail.siteName,
          designation: deployForm.designation,
          serviceCategory: selectedSiteDetail.siteCategory || 'Security Site',
          reportingSupervisorName: selectedSiteDetail.siteSupervisorName,
          assignedDate: deployForm.startDate,
          startDate: deployForm.startDate,
          status: 'active',
          tenantId: currentCompany.tenantId,
        },
        currentCompany.adminEmail
      );

      setFeedback({ type: 'success', message: `Deployed ${emp.fullName} to ${selectedSiteDetail.siteName}.` });
      setIsDeployModalOpen(false);
      await fetchAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Deployment failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Add Manpower Requirement
  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !selectedSiteDetail) return;

    setSubmitting(true);
    try {
      await saveSiteManpowerRequirement(currentCompany.id, {
        companyId: currentCompany.id,
        siteId: selectedSiteDetail.id,
        siteName: selectedSiteDetail.siteName,
        tenantId: currentCompany.tenantId,
        serviceCategory: selectedSiteDetail.siteCategory || 'Commercial IT Park',
        designation: reqForm.designation,
        requiredCount: Number(reqForm.requiredCount),
        assignedCount: 0,
        vacanciesCount: Number(reqForm.requiredCount),
        shiftPattern: reqForm.shiftPattern,
        skillRequirement: reqForm.skillRequirement,
      });

      setFeedback({ type: 'success', message: 'Manpower post requirement saved.' });
      setIsAddReqModalOpen(false);
      await fetchAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to save requirement.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Sites
  const filteredSites = sites.filter((site) => {
    const matchesSearch =
      site.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.siteCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || site.siteCategory === categoryFilter;
    const matchesStatus = statusFilter === 'all' || site.status === statusFilter;
    const matchesClient = clientFilter === 'all' || site.clientId === clientFilter || site.clientName === clientFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesClient;
  });

  // Export Sites CSV
  const exportSitesCsv = () => {
    if (sites.length === 0) return;
    const headers = ['Site Code', 'Site Name', 'Client Name', 'Category', 'City', 'State', 'Required Staff', 'Assigned Staff', 'Vacancies', 'Supervisor', 'Shift Pattern'];
    const rows = sites.map((s) => [
      s.siteCode,
      `"${s.siteName.replace(/"/g, '""')}"`,
      `"${s.clientName.replace(/"/g, '""')}"`,
      s.siteCategory || 'General',
      s.city,
      s.state,
      s.requiredEmployees || s.guardsRequired || 0,
      s.assignedEmployeesCount || s.guardsDeployed || 0,
      s.remainingVacancies || 0,
      `"${(s.siteSupervisorName || '').replace(/"/g, '""')}"`,
      `"${(s.shiftDetails || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentCompany?.name || 'Happiiz'}_Sites_Catalog.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalRequiredAllSites = sites.reduce((sum, s) => sum + (s.requiredEmployees || s.guardsRequired || 0), 0);
  const totalAssignedAllSites = sites.reduce((sum, s) => sum + (s.assignedEmployeesCount || s.guardsDeployed || 0), 0);
  const totalVacanciesAllSites = sites.reduce((sum, s) => sum + (s.remainingVacancies || 0), 0);

  // Selected site sub-lists
  const selectedSiteDeployments = selectedSiteDetail
    ? deployments.filter((d) => d.siteId === selectedSiteDetail.id && (d.status === 'active' || d.status === 'Active'))
    : [];

  const selectedSiteReqs = selectedSiteDetail
    ? siteRequirements[selectedSiteDetail.id] || []
    : [];

  return (
    <div className="space-y-6">
      {/* FEEDBACK BANNER */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
              {currentCompany?.tenantId || 'TENANT'}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5" /> Phase 5 Multi-Site Suite
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Sites, Guard Posts & Facility Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Multi-site per client management, official QR code poster verification, post manpower requirements, and live workforce post deployments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportSitesCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Sites (CSV)
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Provision New Site
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Sites</span>
            <MapPin className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{sites.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Demarcated Guard Posts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Required Posts</span>
            <Shield className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700">{totalRequiredAllSites}</div>
          <div className="text-[11px] text-slate-500 mt-1">Target Personnel Slots</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Deployed Staff</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{totalAssignedAllSites}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active Personnel on Duty</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Remaining Vacancies</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">{totalVacanciesAllSites}</div>
          <div className="text-[11px] text-slate-500 mt-1">Unfilled Posts Requiring Staff</div>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by site name, client, code (REX-SITE-0001), or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="all">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.clientName || c.clientDisplayName || c.clientLegalName || 'Client'}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="all">All Categories</option>
              {SITE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* SITES TABLE */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            Loading site catalog...
          </div>
        ) : filteredSites.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Deployment Sites Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No sites match your search criteria. Click &quot;Provision New Site&quot; to create a new deployment location.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3.5 px-5">Site Name & Code</th>
                  <th className="py-3.5 px-4">Client Organization</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Workforce (Req / Ass / Vac)</th>
                  <th className="py-3.5 px-4">Site Supervisor</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSites.map((site) => {
                  const req = site.requiredEmployees || site.guardsRequired || 0;
                  const ass = site.assignedEmployeesCount || site.guardsDeployed || 0;
                  const vac = site.remainingVacancies || Math.max(0, req - ass);

                  return (
                    <tr
                      key={site.id}
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedSiteDetail(site)}
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center shrink-0">
                            {site.siteName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                              {site.siteName}
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-2">
                              <span className="bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded text-[10px]">
                                {site.siteCode}
                              </span>
                              <span>{site.siteType || 'Security'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          {site.clientName}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {site.siteCategory || 'Commercial'}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="text-slate-800 font-medium truncate max-w-[180px]">
                          {site.city}, {site.state}
                        </div>
                        {site.latitude && site.longitude && (
                          <div className="text-[10px] font-mono text-slate-400">
                            GPS: {site.latitude.toFixed(2)}, {site.longitude.toFixed(2)}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <span className="font-bold text-slate-800">{req}</span>
                          <span className="text-slate-400">/</span>
                          <span className="font-bold text-emerald-600">{ass}</span>
                          <span className="text-slate-400">/</span>
                          <span className={`font-bold ${vac > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            {vac} {vac > 0 ? 'vac' : ''}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-800 truncate max-w-[140px]">
                          {site.siteSupervisorName || site.contactPerson || 'Unassigned'}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            site.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${site.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {site.status}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setActiveQrSite(site)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                            title="View Official QR Poster"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(site)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="Edit Site Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSite(site)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                            title="Delete Site"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          DRAWER / MODAL: SITE DETAIL & DEPLOYMENT MANAGEMENT
      ======================================================== */}
      {selectedSiteDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 flex items-start justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950 px-2.5 py-0.5 rounded border border-blue-800">
                    {selectedSiteDetail.siteCode}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-600/30 text-blue-300 border border-blue-500/30">
                    {selectedSiteDetail.siteCategory || 'Commercial'}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    Client: {selectedSiteDetail.clientName}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white">{selectedSiteDetail.siteName}</h2>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  {selectedSiteDetail.address}, {selectedSiteDetail.city}, {selectedSiteDetail.state} - {selectedSiteDetail.pinCode}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveQrSite(selectedSiteDetail)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <QrCode className="w-4 h-4" />
                  Print QR Poster
                </button>
                <button
                  onClick={() => setSelectedSiteDetail(null)}
                  className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Site Overview Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Required Posts</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {selectedSiteDetail.requiredEmployees || selectedSiteDetail.guardsRequired || 0}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-600">Assigned Personnel</div>
                  <div className="text-lg font-black text-emerald-600 mt-0.5">
                    {selectedSiteDetail.assignedEmployeesCount || selectedSiteDeployments.length}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-rose-500">Remaining Vacancies</div>
                  <div className="text-lg font-black text-rose-600 mt-0.5">
                    {selectedSiteDetail.remainingVacancies || 0}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Lead Supervisor</div>
                  <div className="text-xs font-bold text-slate-900 mt-1 truncate">
                    {selectedSiteDetail.siteSupervisorName || selectedSiteDetail.contactPerson || 'None'}
                  </div>
                </div>
              </div>

              {/* Instructions and Shift details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" /> Shift Pattern & Manning
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {selectedSiteDetail.shiftDetails || 'Standard Shifts'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" /> Emergency & Site Contact
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {selectedSiteDetail.contactPerson} ({selectedSiteDetail.contactNumber})
                  </p>
                </div>
              </div>

              {/* SECTION: LIVE DEPLOYED EMPLOYEES */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-600" />
                    Live Deployed Staff ({selectedSiteDeployments.length})
                  </h3>
                  <button
                    onClick={() => {
                      setDeployForm({
                        employeeId: employees.find((e) => e.status === 'active')?.id || '',
                        designation: 'Security Guard',
                        startDate: new Date().toISOString().split('T')[0],
                      });
                      setIsDeployModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Deploy Staff to Site
                  </button>
                </div>

                {selectedSiteDeployments.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
                    No employees currently deployed to this site. Click &quot;Deploy Staff to Site&quot; to assign personnel.
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <th className="py-2.5 px-4">Employee</th>
                          <th className="py-2.5 px-4">Designation</th>
                          <th className="py-2.5 px-4">Assigned Date</th>
                          <th className="py-2.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedSiteDeployments.map((dep) => (
                          <tr key={dep.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{dep.employeeName}</div>
                              <div className="text-[10px] font-mono text-slate-500">{dep.employeeCode}</div>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-700">{dep.designation}</td>
                            <td className="py-3 px-4 font-mono text-slate-600">{dep.startDate}</td>
                            <td className="py-3 px-4 text-right">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Active on Post
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECTION: MANPOWER REQUIREMENTS BY DESIGNATION */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    Manpower Post Requirements
                  </h3>
                  <button
                    onClick={() => setIsAddReqModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" /> Add Requirement
                  </button>
                </div>

                {selectedSiteReqs.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
                    No granular designation requirements configured yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedSiteReqs.map((req) => (
                      <div key={req.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{req.designation}</span>
                          <span className="font-mono font-black text-indigo-700">{req.requiredCount} Posts</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Shift: {req.shiftPattern}
                        </div>
                        {req.skillRequirement && (
                          <div className="text-[10px] text-slate-400">
                            Skills: {req.skillRequirement}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedSiteDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                Close Site Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: DEPLOY EMPLOYEE TO SITE
      ======================================================== */}
      {isDeployModalOpen && selectedSiteDetail && (
        <div className="fixed inset-0 z-55 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Deploy Employee to Site</h3>
                <p className="text-xs text-slate-500">{selectedSiteDetail.siteName}</p>
              </div>
              <button
                onClick={() => setIsDeployModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDeployEmployee} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Active Employee *</label>
                <select
                  required
                  value={deployForm.employeeId}
                  onChange={(e) => setDeployForm({ ...deployForm, employeeId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees
                    .filter((e) => e.status !== 'inactive' && e.status !== 'resigned' && e.status !== 'terminated')
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.employeeCode}) - {emp.designation}
                      </option>
                    ))}
                </select>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Only active verified employees can be deployed.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Post Designation *</label>
                <input
                  type="text"
                  required
                  value={deployForm.designation}
                  onChange={(e) => setDeployForm({ ...deployForm, designation: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deployment Start Date *</label>
                <input
                  type="date"
                  required
                  value={deployForm.startDate}
                  onChange={(e) => setDeployForm({ ...deployForm, startDate: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeployModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !deployForm.employeeId}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
                >
                  {submitting ? 'Deploying...' : 'Confirm Deployment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD MANPOWER REQUIREMENT
      ======================================================== */}
      {isAddReqModalOpen && selectedSiteDetail && (
        <div className="fixed inset-0 z-55 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Add Post Requirement</h3>
                <p className="text-xs text-slate-500">{selectedSiteDetail.siteName}</p>
              </div>
              <button
                onClick={() => setIsAddReqModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRequirement} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Designation *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Armed Guard / Escort"
                  value={reqForm.designation}
                  onChange={(e) => setReqForm({ ...reqForm, designation: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Required Posts Count *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={reqForm.requiredCount}
                  onChange={(e) => setReqForm({ ...reqForm, requiredCount: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Shift Pattern</label>
                <input
                  type="text"
                  value={reqForm.shiftPattern}
                  onChange={(e) => setReqForm({ ...reqForm, shiftPattern: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddReqModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {submitting ? 'Saving...' : 'Save Requirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CREATE / EDIT SITE
      ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold">
                  {editingSite ? 'Edit Deployment Site' : 'Provision New Deployment Site & QR'}
                </h3>
                <p className="text-xs text-slate-400">Enterprise Site & Facility Setup</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSite} className="p-6 space-y-4 text-xs">
              {/* Client Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Select Client Organization *
                  </label>
                  {clients.length > 0 ? (
                    <select
                      value={formData.clientId}
                      onChange={(e) => handleClientChange(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                    >
                      <option value="">-- Choose Client --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.clientName || c.clientDisplayName || c.clientLegalName || 'Client'} ({c.clientCode || c.clientId || 'CLI'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g. Infosys Horizon Tech Park"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Site Code (Auto-Generated Unique) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.siteCode}
                    onChange={(e) => setFormData({ ...formData, siteCode: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono font-bold uppercase bg-slate-50"
                  />
                </div>
              </div>

              {/* Site Name and Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Site / Post Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Campus Main Gate 1 & 2 Security Post"
                    value={formData.siteName}
                    onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Facility Category</label>
                  <select
                    value={formData.siteCategory}
                    onChange={(e) => setFormData({ ...formData, siteCategory: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    {SITE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Physical Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Street address, landmark, building..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              {/* City, State, PIN */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="PIN Code"
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              {/* GPS Coordinates */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Latitude (GPS Geofencing)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 12.8452"
                    value={formData.latitude ?? ''}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Longitude (GPS Geofencing)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 77.6602"
                    value={formData.longitude ?? ''}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono bg-white"
                  />
                </div>
              </div>

              {/* Supervisor & Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Site Supervisor</label>
                  {employees.length > 0 ? (
                    <select
                      value={formData.siteSupervisorId}
                      onChange={(e) => handleSupervisorSelect(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                    >
                      <option value="">-- Choose Employee as Supervisor --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.designation})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Supervisor name"
                      value={formData.siteSupervisorName}
                      onChange={(e) => setFormData({ ...formData, siteSupervisorName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Required Personnel Count *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.requiredEmployees}
                    onChange={(e) => setFormData({ ...formData, requiredEmployees: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Person (On-Site) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Name"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Emergency Mobile / Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91..."
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Shift Details & Schedule</label>
                <input
                  type="text"
                  placeholder="e.g. 3 Shifts (8h each) • 24/7 Coverage"
                  value={formData.shiftDetails}
                  onChange={(e) => setFormData({ ...formData, shiftDetails: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingSite ? 'Update Site' : 'Provision Site & QR Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {activeQrSite && (
        <SiteQrModal site={activeQrSite} onClose={() => setActiveQrSite(null)} />
      )}
    </div>
  );
};
