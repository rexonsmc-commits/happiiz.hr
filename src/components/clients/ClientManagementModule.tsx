/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Users,
  MapPin,
  FileText,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  Edit2,
  Trash2,
  QrCode,
  Download,
  IndianRupee,
  Layers,
  ArrowRightLeft,
  BadgeCheck,
  FileCheck,
  Calendar,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  Client,
  ClientSite,
  ClientContract,
  EmployeeDeployment,
  CommercialRate,
  SiteDocumentItem,
  Employee,
} from '../../types';
import {
  getCompanyClients,
  createCompanyClient,
  updateCompanyClient,
  deleteCompanyClient,
  getNextClientCode,
  getCompanySites,
  getClientContracts,
  createClientContract,
  getEmployeeDeployments,
  transferEmployeeDeployment,
  getCommercialRates,
  saveCommercialRate,
  getSiteDocuments,
  addSiteDocument,
  getCompanyEmployees,
} from '../../services/tenantService';
import { SiteQrModal } from '../sites/SiteQrModal';

export const ClientManagementModule: React.FC = () => {
  const { currentCompany } = useAuth();

  // State
  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<ClientSite[]>([]);
  const [contracts, setContracts] = useState<ClientContract[]>([]);
  const [deployments, setDeployments] = useState<EmployeeDeployment[]>([]);
  const [rates, setRates] = useState<CommercialRate[]>([]);
  const [documents, setDocuments] = useState<SiteDocumentItem[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');

  // Active view: List or Detail
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [profileTab, setProfileTab] = useState<'overview' | 'sites' | 'contracts' | 'rates' | 'deployments' | 'documents'>('overview');

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetDeployment, setTransferTargetDeployment] = useState<EmployeeDeployment | null>(null);
  const [activeQrSite, setActiveQrSite] = useState<ClientSite | null>(null);

  // Form states
  const [registerStep, setRegisterStep] = useState(1);
  const [nextClientCode, setNextClientCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Client form
  const [clientForm, setClientForm] = useState({
    clientName: '',
    tradeName: '',
    clientCode: '',
    clientType: 'Private Limited' as const,
    industryCategory: 'IT & Technology',
    panNumber: '',
    gstNumber: '',
    tanNumber: '',
    cinNumber: '',
    officialEmail: '',
    officialPhone: '',
    websiteUrl: '',
    clientDescription: '',
    accountStatus: 'active' as const,
    contactPersonName: '',
    contactPersonDesignation: '',
    contactPersonEmail: '',
    contactPersonPhone: '',
    contactPersonDepartment: '',
    billingName: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingPinCode: '',
    registeredAddress: '',
    city: '',
    state: '',
    pinCode: '',
    country: 'India',
    clientRelationshipManager: '',
    accountManager: '',
    clientStartDate: new Date().toISOString().split('T')[0],
    internalRemarks: '',
  });

  // Contract form
  const [contractForm, setContractForm] = useState({
    contractNumber: '',
    contractTitle: '',
    contractType: 'Security Services' as const,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    contractValue: 500000,
    billingFrequency: 'Monthly' as const,
    paymentTerms: 'Net 30 Days',
    status: 'active' as const,
    gstApplicability: true,
    gstRatePercent: 18,
    serviceDetails: '',
    specialTerms: '',
  });

  // Commercial rate form
  const [rateForm, setRateForm] = useState({
    serviceName: 'Manned Guarding Services',
    designation: 'Security Guard',
    rateType: 'Per Employee Per Month' as const,
    clientBillingRate: 28000,
    employeeWageRate: 19000,
    billingUnit: 'Per Head' as const,
    gstApplicable: true,
    serviceChargePercent: 10,
    effectiveFrom: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  // Site Document Form
  const [docForm, setDocForm] = useState({
    documentName: '',
    documentType: 'Client Agreement' as const,
    fileUrl: 'https://example.com/documents/sample_agreement.pdf',
    uploadDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    documentStatus: 'valid' as const,
    uploadedBy: 'Col. Rajesh Sharma',
    remarks: '',
  });

  // Transfer form
  const [transferForm, setTransferForm] = useState({
    destinationSiteId: '',
  });

  // Fetch all tenant data
  const loadData = async () => {
    if (!currentCompany) return;
    setLoading(true);
    try {
      const [
        clientList,
        siteList,
        contractList,
        deploymentList,
        rateList,
        docList,
        empList,
      ] = await Promise.all([
        getCompanyClients(currentCompany.id),
        getCompanySites(currentCompany.id),
        getClientContracts(currentCompany.id),
        getEmployeeDeployments(currentCompany.id),
        getCommercialRates(currentCompany.id),
        getSiteDocuments(currentCompany.id),
        getCompanyEmployees(currentCompany.id),
      ]);

      setClients(clientList);
      setSites(siteList);
      setContracts(contractList);
      setDeployments(deploymentList);
      setRates(rateList);
      setDocuments(docList);
      setAllEmployees(empList);

      const nextCode = await getNextClientCode(currentCompany.id);
      setNextClientCode(nextCode);
      setClientForm((prev) => ({ ...prev, clientCode: nextCode }));

      // If a client was selected, update reference
      if (selectedClient) {
        const refreshed = clientList.find((c) => c.id === selectedClient.id);
        if (refreshed) setSelectedClient(refreshed);
      }
    } catch (err: any) {
      console.error('[Happiiz HR] Error loading clients:', err);
      setFeedback({ type: 'error', message: err?.message || 'Failed to load client data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentCompany]);

  // KPIs
  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.accountStatus === 'active').length;
  const totalSites = sites.length;
  const activeContractsCount = contracts.filter((c) => c.status === 'active').length;
  const totalDeployedPersonnel = deployments.filter((d) => d.status === 'active').length;

  // Filtered Clients
  const filteredClients = clients.filter((c) => {
    const name = c.clientName || c.clientDisplayName || c.clientLegalName || '';
    const code = c.clientCode || c.clientId || '';
    const city = c.city || '';
    const ind = c.industryCategory || '';

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ind.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.accountStatus === statusFilter;
    const matchesIndustry = industryFilter === 'all' || c.industryCategory === industryFilter;

    return matchesSearch && matchesStatus && matchesIndustry;
  });

  // Client Registration Submission
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;
    if (!clientForm.clientName.trim()) {
      setFeedback({ type: 'error', message: 'Client Name is required.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const newClient = await createCompanyClient(
        currentCompany.id,
        {
          ...clientForm,
          companyId: currentCompany.id,
          tenantId: currentCompany.tenantId,
          country: 'India',
        },
        'authorized_admin',
        currentCompany.adminEmail
      );

      setFeedback({ type: 'success', message: `Client "${newClient.clientName}" (${newClient.clientCode}) registered successfully.` });
      setIsRegisterModalOpen(false);
      setRegisterStep(1);
      await loadData();
      setSelectedClient(newClient);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to register client.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Add Contract Submission
  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !selectedClient) return;

    setSubmitting(true);
    try {
      const generatedCode = contractForm.contractNumber.trim() || `HHR-CON-2026-${String(contracts.length + 1).padStart(3, '0')}`;
      await createClientContract(
        currentCompany.id,
        {
          ...contractForm,
          companyId: currentCompany.id,
          contractNumber: generatedCode,
          clientId: selectedClient.id,
          clientName: selectedClient.clientName || selectedClient.clientDisplayName || 'Client',
          tenantId: currentCompany.tenantId,
          contractValue: Number(contractForm.contractValue) || 100000,
        },
        currentCompany.adminEmail
      );

      setFeedback({ type: 'success', message: 'Service contract executed and recorded successfully.' });
      setIsContractModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to save contract.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Add Commercial Rate
  const handleCreateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !selectedClient) return;

    setSubmitting(true);
    try {
      await saveCommercialRate(currentCompany.id, {
        ...rateForm,
        companyId: currentCompany.id,
        clientId: selectedClient.id,
        clientName: selectedClient.clientName || selectedClient.clientDisplayName || 'Client',
        tenantId: currentCompany.tenantId,
        clientBillingRate: Number(rateForm.clientBillingRate),
        employeeWageRate: Number(rateForm.employeeWageRate),
      });

      setFeedback({ type: 'success', message: 'Commercial rate card saved with strict billing/wage segregation.' });
      setIsRateModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to save rate card.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Add Document
  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !selectedClient) return;

    setSubmitting(true);
    try {
      await addSiteDocument(currentCompany.id, {
        ...docForm,
        companyId: currentCompany.id,
        clientId: selectedClient.id,
        tenantId: currentCompany.tenantId,
      });

      setFeedback({ type: 'success', message: 'Document vaulted successfully.' });
      setIsDocModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to vault document.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Employee Transfer
  const handleExecuteTransfer = async () => {
    if (!currentCompany || !transferTargetDeployment || !transferForm.destinationSiteId) return;

    const destSite = sites.find((s) => s.id === transferForm.destinationSiteId);
    if (!destSite) {
      setFeedback({ type: 'error', message: 'Please select a valid destination site.' });
      return;
    }

    setSubmitting(true);
    try {
      await transferEmployeeDeployment(
        currentCompany.id,
        transferTargetDeployment.id,
        destSite.id,
        destSite.siteName,
        destSite.siteCode,
        destSite.clientId,
        destSite.clientName,
        currentCompany.adminEmail
      );

      setFeedback({
        type: 'success',
        message: `Transferred ${transferTargetDeployment.employeeName} to ${destSite.siteName} (${destSite.siteCode}).`,
      });
      setIsTransferModalOpen(false);
      setTransferTargetDeployment(null);
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Transfer failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Export CSV of Clients
  const exportClientsCsv = () => {
    if (clients.length === 0) return;
    const headers = ['Client Code', 'Client Name', 'Industry', 'Type', 'City', 'State', 'Contact Person', 'Phone', 'Total Sites', 'Active Contracts', 'Deployed Staff'];
    const rows = clients.map((c) => [
      c.clientCode || c.clientId || 'CLI',
      `"${(c.clientName || c.clientDisplayName || c.clientLegalName || '').replace(/"/g, '""')}"`,
      c.industryCategory || 'N/A',
      c.clientType,
      c.city,
      c.state,
      `"${c.contactPersonName.replace(/"/g, '""')}"`,
      c.contactPersonPhone || '',
      c.totalSitesCount || 0,
      c.activeContractsCount || 0,
      c.totalDeployedEmployees || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentCompany?.name || 'Happiiz'}_Clients_Directory.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Active client sub-items
  const clientSites = selectedClient
    ? sites.filter((s) => s.clientId === selectedClient.id || s.clientName === selectedClient.clientName)
    : [];

  const clientContracts = selectedClient
    ? contracts.filter((c) => c.clientId === selectedClient.id || c.clientName === selectedClient.clientName)
    : [];

  const clientRates = selectedClient
    ? rates.filter((r) => r.clientId === selectedClient.id || r.clientName === selectedClient.clientName)
    : [];

  const clientDeployments = selectedClient
    ? deployments.filter((d) => d.clientId === selectedClient.id || d.clientName === selectedClient.clientName)
    : [];

  const clientDocs = selectedClient
    ? documents.filter((doc) => doc.clientId === selectedClient.id)
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

      {/* TOP MODULE HEADER */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
              {currentCompany?.tenantId || 'TENANT'}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5" /> Phase 5 Architecture
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Client & Account Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Multi-client governance, facilities master catalog, service contracts, segregated commercial rate cards, and workforce deployment tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportClientsCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Directory (CSV)
          </button>
          <button
            onClick={() => {
              setRegisterStep(1);
              setIsRegisterModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Register New Client
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Clients</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalClients}</div>
          <div className="text-[11px] text-slate-500 mt-1">Registered Enterprise Accounts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Accounts</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{activeClients}</div>
          <div className="text-[11px] text-slate-500 mt-1">100% Billing Operational</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Connected Sites</span>
            <MapPin className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalSites}</div>
          <div className="text-[11px] text-slate-500 mt-1">Active Guard Posts & Facilities</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Contracts</span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{activeContractsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Live Service Agreements</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Deployed Workforce</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700">{totalDeployedPersonnel}</div>
          <div className="text-[11px] text-slate-500 mt-1">Guards & Staff on Duty</div>
        </div>
      </div>

      {/* MAIN VIEW: CLIENT DIRECTORY OR CLIENT PROFILE VIEW */}
      {!selectedClient ? (
        /* DIRECTORY VIEW */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {/* SEARCH & FILTERS TOOLBAR */}
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search clients by name, code, city, GST, or industry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Accounts</option>
                <option value="pending">Pending KYC</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="all">All Industries</option>
                <option value="IT & Technology">IT & Technology</option>
                <option value="Healthcare & Hospitals">Healthcare & Hospitals</option>
                <option value="Real Estate & Infrastructure">Real Estate & Infrastructure</option>
                <option value="Manufacturing & Industrial">Manufacturing & Industrial</option>
                <option value="Commercial IT Park">Commercial IT Park</option>
              </select>
            </div>
          </div>

          {/* TABLE VIEW */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold">
              Loading client accounts...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Clients Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No client companies match your search criteria. Click &quot;Register New Client&quot; to add your first commercial client.
              </p>
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Register Client
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3.5 px-5">Client Name & Code</th>
                    <th className="py-3.5 px-4">Industry & Type</th>
                    <th className="py-3.5 px-4">Contact Person</th>
                    <th className="py-3.5 px-4">Sites & Posts</th>
                    <th className="py-3.5 px-4">Active Contracts</th>
                    <th className="py-3.5 px-4">Deployed Staff</th>
                    <th className="py-3.5 px-4">Account Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map((client) => {
                    const clientSitesCount = client.totalSitesCount || 0;
                    const clientDeployedCount = client.totalDeployedEmployees || 0;
                    const clientContractsCount = client.activeContractsCount || 0;

                    return (
                      <tr
                        key={client.id}
                        className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedClient(client);
                          setProfileTab('overview');
                        }}
                      >
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center shrink-0">
                              {(client.clientName || client.clientDisplayName || 'CL').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                                {client.clientName || client.clientDisplayName || client.clientLegalName}
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                              <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2 mt-0.5">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-700">
                                  {client.clientCode}
                                </span>
                                <span>{client.city}, {client.state}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-semibold text-slate-800">{client.industryCategory || 'General'}</div>
                          <div className="text-[10px] text-slate-400">{client.clientType}</div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-semibold text-slate-800">{client.contactPersonName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{client.contactPersonPhone || client.contactPersonEmail}</div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <MapPin className="w-3 h-3 text-indigo-500" />
                            {clientSitesCount} {clientSitesCount === 1 ? 'Site' : 'Sites'}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <FileText className="w-3 h-3 text-amber-600" />
                            {clientContractsCount} {clientContractsCount === 1 ? 'Contract' : 'Contracts'}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
                            <Users className="w-3 h-3 text-purple-600" />
                            {clientDeployedCount} Staff
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              client.accountStatus === 'active'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${client.accountStatus === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {client.accountStatus}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              setProfileTab('overview');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors cursor-pointer"
                          >
                            View Profile
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* DETAILED CLIENT PROFILE VIEW WITH 6 TABS */
        <div className="space-y-6">
          {/* PROFILE HEADER CARD */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                <button
                  onClick={() => setSelectedClient(null)}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-1"
                  title="Back to Client Directory"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                      {selectedClient.clientCode}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        selectedClient.accountStatus === 'active'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {selectedClient.accountStatus}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Client Since {selectedClient.clientStartDate}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {selectedClient.clientName}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{selectedClient.industryCategory}</span> •
                    <span>{selectedClient.clientType}</span> •
                    <span className="flex items-center gap-1 text-slate-600 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-red-500" /> {selectedClient.city}, {selectedClient.state}
                    </span>
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsContractModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-600" />
                  + New Contract
                </button>
                <button
                  onClick={() => setIsRateModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  + Add Rate Card
                </button>
                <button
                  onClick={() => setIsDocModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Upload Document
                </button>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="mt-8 border-t border-slate-100 pt-4 flex flex-wrap gap-2">
              {[
                { id: 'overview', label: 'Overview & Profile', icon: Building2 },
                { id: 'sites', label: `Sites & Facilities (${clientSites.length})`, icon: MapPin },
                { id: 'contracts', label: `Service Contracts (${clientContracts.length})`, icon: FileText },
                { id: 'rates', label: `Commercial Rates (${clientRates.length})`, icon: IndianRupee },
                { id: 'deployments', label: `Deployed Workforce (${clientDeployments.length})`, icon: Users },
                { id: 'documents', label: `Document Vault (${clientDocs.length})`, icon: FileCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = profileTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setProfileTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: OVERVIEW & PROFILE */}
          {profileTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Business & Registration Info */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Statutory & Tax Identity
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] uppercase font-bold text-slate-400">GSTIN</div>
                      <div className="font-mono text-xs font-bold text-slate-900 mt-1">
                        {selectedClient.gstNumber || 'Not Registered'}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] uppercase font-bold text-slate-400">PAN</div>
                      <div className="font-mono text-xs font-bold text-slate-900 mt-1">
                        {selectedClient.panNumber || 'N/A'}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] uppercase font-bold text-slate-400">TAN</div>
                      <div className="font-mono text-xs font-bold text-slate-900 mt-1">
                        {selectedClient.tanNumber || 'N/A'}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] uppercase font-bold text-slate-400">CIN / Reg No</div>
                      <div className="font-mono text-xs font-bold text-slate-900 mt-1 truncate" title={selectedClient.cinNumber}>
                        {selectedClient.cinNumber || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="text-xs font-bold text-slate-700">Account Description & Operations Scope</div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {selectedClient.clientDescription || 'No detailed description provided.'}
                    </p>
                  </div>

                  {selectedClient.internalRemarks && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                      <span className="font-bold">Internal Operations Note:</span> {selectedClient.internalRemarks}
                    </div>
                  )}
                </div>

                {/* Registered and Billing Addresses */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    Addresses & Invoicing Demarcation
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="text-[11px] uppercase font-bold text-slate-400">Registered Office Address</div>
                      <div className="text-xs font-bold text-slate-800">{selectedClient.registeredAddress}</div>
                      <div className="text-xs text-slate-600 font-semibold">
                        {selectedClient.city}, {selectedClient.state} - {selectedClient.pinCode}
                      </div>
                      <div className="text-[11px] text-slate-400">{selectedClient.country || 'India'}</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="text-[11px] uppercase font-bold text-blue-600">Official Invoicing / Billing Address</div>
                      <div className="text-xs font-bold text-slate-800">
                        {selectedClient.billingName || selectedClient.clientName}
                      </div>
                      <div className="text-xs text-slate-600">
                        {selectedClient.billingAddress || selectedClient.registeredAddress}
                      </div>
                      <div className="text-xs text-slate-600 font-semibold">
                        {selectedClient.billingCity || selectedClient.city}, {selectedClient.billingState || selectedClient.state} - {selectedClient.billingPinCode || selectedClient.pinCode}
                      </div>
                      {selectedClient.billingEmail && (
                        <div className="text-[11px] text-blue-700 font-mono flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {selectedClient.billingEmail}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Contact Persons & Relationship Managers */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    Authorized Client Contact
                  </h3>

                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
                    <div className="text-xs font-black text-slate-900">
                      {selectedClient.contactPersonName}
                    </div>
                    <div className="text-xs font-semibold text-blue-800">
                      {selectedClient.contactPersonDesignation || 'Authorized Representative'}
                    </div>
                    {selectedClient.contactPersonDepartment && (
                      <div className="text-[11px] text-slate-500">
                        Dept: {selectedClient.contactPersonDepartment}
                      </div>
                    )}
                    <div className="pt-2 space-y-1 text-xs text-slate-700 border-t border-blue-200/60">
                      {selectedClient.contactPersonPhone && (
                        <div className="flex items-center gap-2 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {selectedClient.contactPersonPhone}
                        </div>
                      )}
                      {selectedClient.contactPersonEmail && (
                        <div className="flex items-center gap-2 font-mono truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {selectedClient.contactPersonEmail}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 space-y-2 text-xs">
                    <div className="text-[11px] uppercase font-bold text-slate-400">Official General Contacts</div>
                    {selectedClient.officialEmail && (
                      <div className="flex items-center gap-2 text-slate-700 font-mono">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {selectedClient.officialEmail}
                      </div>
                    )}
                    {selectedClient.officialPhone && (
                      <div className="flex items-center gap-2 text-slate-700 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {selectedClient.officialPhone}
                      </div>
                    )}
                    {selectedClient.websiteUrl && (
                      <div className="flex items-center gap-2 text-blue-600 truncate">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <a href={selectedClient.websiteUrl} target="_blank" rel="noreferrer" className="hover:underline">
                          {selectedClient.websiteUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Internal Account Oversight</h3>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500">Client Relationship Manager:</span>{' '}
                      <span className="font-bold text-slate-900">{selectedClient.clientRelationshipManager || 'Operations Lead'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Field Account Executive:</span>{' '}
                      <span className="font-bold text-slate-900">{selectedClient.accountManager || 'Area Supervisor'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SITES & GUARD POSTS */}
          {profileTab === 'sites' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Deployment Sites ({clientSites.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Physical operational locations demarcated under {selectedClient.clientName}.
                  </p>
                </div>
              </div>

              {clientSites.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                  <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-base font-bold text-slate-800">No Sites Linked to Client</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    There are currently no guard posts or deployment sites registered under this client. You can create a new site in the Sites Module.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clientSites.map((site) => (
                    <div key={site.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-block px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-900 text-white mb-1.5">
                            {site.siteCode}
                          </span>
                          <h4 className="text-base font-black text-slate-900">{site.siteName}</h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            {site.address}, {site.city}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider shrink-0">
                          {site.siteCategory || 'Commercial'}
                        </span>
                      </div>

                      {/* Manpower counts */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Required</div>
                          <div className="text-base font-black text-slate-900">{site.requiredEmployees || site.guardsRequired || 0}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-emerald-600">Assigned</div>
                          <div className="text-base font-black text-emerald-600">{site.assignedEmployeesCount || site.guardsDeployed || 0}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-rose-500">Vacancies</div>
                          <div className="text-base font-black text-rose-600">{site.remainingVacancies || 0}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div className="text-slate-600 truncate">
                          <span className="text-slate-400 text-[10px] uppercase block font-bold">Supervisor</span>
                          <span className="font-bold text-slate-900">{site.siteSupervisorName || 'Not Assigned'}</span>
                        </div>
                        <button
                          onClick={() => setActiveQrSite(site)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          View QR Card
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SERVICE CONTRACTS & SLAS */}
          {profileTab === 'contracts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Client Service Contracts & SLAs ({clientContracts.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bilateral service level agreements, billing frequency, and contract values.
                  </p>
                </div>
                <button
                  onClick={() => setIsContractModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Add Service Contract
                </button>
              </div>

              {clientContracts.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-base font-bold text-slate-800">No Contracts on File</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Execute and record a service agreement with {selectedClient.clientName} to define billing terms and SLAs.
                  </p>
                  <button
                    onClick={() => setIsContractModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Create Contract
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {clientContracts.map((contract) => (
                    <div key={contract.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {contract.contractNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {contract.status}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              {contract.contractType}
                            </span>
                          </div>
                          <h4 className="text-lg font-black text-slate-900 mt-1">{contract.contractTitle}</h4>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold uppercase text-slate-400">Contract Value</div>
                          <div className="text-xl font-black text-slate-900 flex items-center justify-end gap-1 text-emerald-700">
                            ₹{contract.contractValue.toLocaleString('en-IN')}
                            <span className="text-xs font-bold text-slate-500">/{contract.billingFrequency}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Start Date</span>
                          <span className="font-bold text-slate-800">{contract.startDate}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Expiry / Renewal</span>
                          <span className="font-bold text-slate-800">{contract.endDate}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Terms</span>
                          <span className="font-bold text-slate-800">{contract.paymentTerms}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">GST Applicability</span>
                          <span className="font-bold text-slate-800">
                            {contract.gstApplicability ? `Yes (${contract.gstRatePercent || 18}%)` : 'Exempted'}
                          </span>
                        </div>
                      </div>

                      {contract.serviceDetails && (
                        <div className="text-xs text-slate-600 leading-relaxed">
                          <span className="font-bold text-slate-800">Scope of Work:</span> {contract.serviceDetails}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMMERCIAL RATES (STRICT SEGREGATION DISPLAY) */}
          {profileTab === 'rates' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Commercial Billing Rates & Wage Demarcation ({clientRates.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Strict segregation between Client Invoiced Rate (₹) and Base Employee Wage (₹). Confidential profit margin preserved.
                  </p>
                </div>
                <button
                  onClick={() => setIsRateModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" /> Add Rate Card
                </button>
              </div>

              {/* Strict Security Callout */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <span className="font-bold">Enterprise Financial Isolation Policy:</span>{' '}
                  Client Invoiced Billing Rates and Employee Payable Base Wages are segregated across separate database schemas. Commercial profit margins and billable markup percentages are strictly restricted to Company Admin authorization and are never exposed to guards, supervisors, or public QR codes.
                </div>
              </div>

              {clientRates.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                  <IndianRupee className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-base font-bold text-slate-800">No Rate Cards Configured</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Configure standard rate cards per designation (Security Guard, Supervisor, Housekeeper) to streamline monthly client invoicing.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                        <th className="py-3.5 px-5">Designation & Service</th>
                        <th className="py-3.5 px-4">Rate Structure</th>
                        <th className="py-3.5 px-4 text-blue-700 font-black">Client Billing Rate (₹)</th>
                        <th className="py-3.5 px-4 text-emerald-700 font-black">Employee Wage Rate (₹)</th>
                        <th className="py-3.5 px-4">Gross Margin %</th>
                        <th className="py-3.5 px-4">Effective Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clientRates.map((rate) => {
                        const billing = rate.clientBillingRate || 0;
                        const wage = rate.employeeWageRate || 0;
                        const marginAmt = billing - wage;
                        const marginPercent = billing > 0 ? Math.round((marginAmt / billing) * 100) : 0;

                        return (
                          <tr key={rate.id} className="hover:bg-slate-50/50">
                            <td className="py-4 px-5">
                              <div className="font-bold text-slate-900">{rate.designation}</div>
                              <div className="text-[10px] text-slate-500">{rate.serviceName}</div>
                            </td>
                            <td className="py-4 px-4 font-semibold text-slate-700">
                              {rate.rateType}
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-mono font-black text-blue-700 text-sm">
                                ₹{billing.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-slate-500 block">/ {rate.billingUnit}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-mono font-black text-emerald-700 text-sm">
                                ₹{wage.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-slate-500 block">Base Staff Pay</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900">
                                +{marginPercent}% (₹{marginAmt.toLocaleString('en-IN')})
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-600 font-mono">
                              {rate.effectiveFrom}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DEPLOYED WORKFORCE ROSTER */}
          {profileTab === 'deployments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Deployed Personnel Roster ({clientDeployments.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live security guards, supervisors, and facility personnel currently deployed across {selectedClient.clientName}&apos;s sites.
                  </p>
                </div>
              </div>

              {clientDeployments.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                  <Users className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-base font-bold text-slate-800">No Employees Currently Deployed</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Assign registered employees to guard posts and deployment sites to view live personnel here.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                        <th className="py-3.5 px-5">Employee & Code</th>
                        <th className="py-3.5 px-4">Designation</th>
                        <th className="py-3.5 px-4">Deployed Site</th>
                        <th className="py-3.5 px-4">Assigned Since</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-5 text-right">Site Reassignment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clientDeployments.map((dep) => (
                        <tr key={dep.id} className="hover:bg-blue-50/30">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              {dep.employeePhotoUrl ? (
                                <img
                                  src={dep.employeePhotoUrl}
                                  alt={dep.employeeName}
                                  className="w-9 h-9 rounded-xl object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-black flex items-center justify-center shrink-0">
                                  {dep.employeeName.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-900">{dep.employeeName}</div>
                                <div className="text-[10px] font-mono text-slate-500">{dep.employeeCode}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 font-semibold text-slate-800">{dep.designation}</td>

                          <td className="py-4 px-4">
                            <div className="font-bold text-blue-700 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                              {dep.siteName}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500">{dep.siteCode}</div>
                          </td>

                          <td className="py-4 px-4 font-mono text-slate-600">{dep.startDate}</td>

                          <td className="py-4 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {dep.status}
                            </span>
                          </td>

                          <td className="py-4 px-5 text-right">
                            <button
                              onClick={() => {
                                setTransferTargetDeployment(dep);
                                setIsTransferModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                              Transfer Site
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: DOCUMENT VAULT */}
          {profileTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Client Legal Agreements & Document Vault ({clientDocs.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Master service agreements, client work orders, fire NOCs, and blueprint filings.
                  </p>
                </div>
                <button
                  onClick={() => setIsDocModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Upload Document
                </button>
              </div>

              {clientDocs.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                  <FileCheck className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-base font-bold text-slate-800">No Documents Uploaded</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Upload signed master service agreements or police verification records for compliance records.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clientDocs.map((doc) => (
                    <div key={doc.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 mb-1">
                              {doc.documentType}
                            </span>
                            <h4 className="text-sm font-black text-slate-900">{doc.documentName}</h4>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              Uploaded: {doc.uploadDate} {doc.expiryDate ? `• Expires: ${doc.expiryDate}` : ''}
                            </p>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                          {doc.documentStatus}
                        </span>
                      </div>

                      {doc.remarks && (
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {doc.remarks}
                        </p>
                      )}

                      <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                        <span className="text-slate-500">By {doc.uploadedBy}</span>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View PDF
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          MODAL 1: REGISTER NEW CLIENT (MULTI-STEP)
      ======================================================== */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Register New Enterprise Client</h3>
                  <p className="text-xs text-slate-400">
                    Step {registerStep} of 3 • Enterprise Onboarding
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper progress */}
            <div className="grid grid-cols-3 border-b border-slate-200 text-center text-xs font-bold">
              <button
                type="button"
                onClick={() => setRegisterStep(1)}
                className={`py-3 ${registerStep === 1 ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50' : 'text-slate-500'}`}
              >
                1. Company Info
              </button>
              <button
                type="button"
                onClick={() => setRegisterStep(2)}
                className={`py-3 ${registerStep === 2 ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50' : 'text-slate-500'}`}
              >
                2. Address & Tax Details
              </button>
              <button
                type="button"
                onClick={() => setRegisterStep(3)}
                className={`py-3 ${registerStep === 3 ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50' : 'text-slate-500'}`}
              >
                3. Contacts & Account Lead
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              {/* STEP 1: Basic Company Info */}
              {registerStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Client Legal Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Infosys Horizon Tech Park"
                        value={clientForm.clientName}
                        onChange={(e) => setClientForm({ ...clientForm, clientName: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Trade / Brand Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Infosys Tech Campus"
                        value={clientForm.tradeName}
                        onChange={(e) => setClientForm({ ...clientForm, tradeName: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Client Code (Auto)
                      </label>
                      <input
                        type="text"
                        value={clientForm.clientCode || nextClientCode}
                        onChange={(e) => setClientForm({ ...clientForm, clientCode: e.target.value.toUpperCase() })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-slate-50 uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Client Entity Type
                      </label>
                      <select
                        value={clientForm.clientType}
                        onChange={(e) => setClientForm({ ...clientForm, clientType: e.target.value as any })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                      >
                        <option value="Private Limited">Private Limited</option>
                        <option value="Public Limited">Public Limited</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Proprietorship">Proprietorship</option>
                        <option value="Government Entity">Government Entity</option>
                        <option value="LLP">LLP</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Industry Category
                      </label>
                      <select
                        value={clientForm.industryCategory}
                        onChange={(e) => setClientForm({ ...clientForm, industryCategory: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                      >
                        <option value="IT & Technology">IT & Technology</option>
                        <option value="Healthcare & Hospitals">Healthcare & Hospitals</option>
                        <option value="Real Estate & Infrastructure">Real Estate & Infrastructure</option>
                        <option value="Commercial IT Park">Commercial IT Park</option>
                        <option value="Manufacturing & Industrial">Manufacturing & Industrial</option>
                        <option value="Retail & Malls">Retail & Malls</option>
                        <option value="Education & Universities">Education & Universities</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Account Description & Facilities Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Enter operational scope, facility scale, or special instructions..."
                      value={clientForm.clientDescription}
                      onChange={(e) => setClientForm({ ...clientForm, clientDescription: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Address & Tax Details */}
              {registerStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        GSTIN Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 29AAACI1234F1Z5"
                        value={clientForm.gstNumber}
                        onChange={(e) => setClientForm({ ...clientForm, gstNumber: e.target.value.toUpperCase() })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        PAN Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. AAACI1234F"
                        value={clientForm.panNumber}
                        onChange={(e) => setClientForm({ ...clientForm, panNumber: e.target.value.toUpperCase() })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registered Address *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Door, Building, Street, Area..."
                      value={clientForm.registeredAddress}
                      onChange={(e) => setClientForm({ ...clientForm, registeredAddress: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bengaluru"
                        value={clientForm.city}
                        onChange={(e) => setClientForm({ ...clientForm, city: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Karnataka"
                        value={clientForm.state}
                        onChange={(e) => setClientForm({ ...clientForm, state: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 560100"
                        value={clientForm.pinCode}
                        onChange={(e) => setClientForm({ ...clientForm, pinCode: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Contacts & Account Lead */}
              {registerStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Authorized Contact Person *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Kavita Menon"
                        value={clientForm.contactPersonName}
                        onChange={(e) => setClientForm({ ...clientForm, contactPersonName: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Designation / Role
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. VP Facilities & Safety"
                        value={clientForm.contactPersonDesignation}
                        onChange={(e) => setClientForm({ ...clientForm, contactPersonDesignation: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Contact Phone / Mobile
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. +91 98450 11223"
                        value={clientForm.contactPersonPhone}
                        onChange={(e) => setClientForm({ ...clientForm, contactPersonPhone: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Contact Work Email
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. kavita.m@infosys.example.com"
                        value={clientForm.contactPersonEmail}
                        onChange={(e) => setClientForm({ ...clientForm, contactPersonEmail: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Client Relationship Manager
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Col. Rajesh Sharma"
                        value={clientForm.clientRelationshipManager}
                        onChange={(e) => setClientForm({ ...clientForm, clientRelationshipManager: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Account Start Date
                      </label>
                      <input
                        type="date"
                        value={clientForm.clientStartDate}
                        onChange={(e) => setClientForm({ ...clientForm, clientStartDate: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step Navigation Controls */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                {registerStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setRegisterStep(registerStep - 1)}
                    className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Previous Step
                  </button>
                ) : (
                  <div />
                )}

                {registerStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setRegisterStep(registerStep + 1)}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Registering...' : 'Complete Client Registration'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: EXECUTE SERVICE CONTRACT
      ======================================================== */}
      {isContractModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold">Execute Service Contract</h3>
                <p className="text-xs text-slate-400">For {selectedClient.clientName}</p>
              </div>
              <button
                onClick={() => setIsContractModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contract Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Security & Perimeter Patrol Agreement"
                  value={contractForm.contractTitle}
                  onChange={(e) => setContractForm({ ...contractForm, contractTitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contract Type</label>
                  <select
                    value={contractForm.contractType}
                    onChange={(e) => setContractForm({ ...contractForm, contractType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="Security Services">Security Services</option>
                    <option value="Housekeeping & Facility">Housekeeping & Facility</option>
                    <option value="Manpower Supply">Manpower Supply</option>
                    <option value="Integrated Facility">Integrated Facility</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contract Value (₹) *</label>
                  <input
                    type="number"
                    required
                    value={contractForm.contractValue}
                    onChange={(e) => setContractForm({ ...contractForm, contractValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Billing Frequency</label>
                  <select
                    value={contractForm.billingFrequency}
                    onChange={(e) => setContractForm({ ...contractForm, billingFrequency: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annually">Annually</option>
                    <option value="Per Shift">Per Shift</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={contractForm.paymentTerms}
                    onChange={(e) => setContractForm({ ...contractForm, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={contractForm.startDate}
                    onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={contractForm.endDate}
                    onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Scope of Work & SLA Terms</label>
                <textarea
                  rows={2}
                  value={contractForm.serviceDetails}
                  onChange={(e) => setContractForm({ ...contractForm, serviceDetails: e.target.value })}
                  placeholder="Specify guards per shift, patrol wand checkpoints, and SLA penalties..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {submitting ? 'Saving...' : 'Save Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: ADD COMMERCIAL RATE CARD
      ======================================================== */}
      {isRateModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold">Add Commercial Rate Card</h3>
                <p className="text-xs text-slate-400">Strict segregation of Client Billing vs Employee Pay</p>
              </div>
              <button
                onClick={() => setIsRateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRate} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Armed Security Guard"
                    value={rateForm.designation}
                    onChange={(e) => setRateForm({ ...rateForm, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rate Type</label>
                  <select
                    value={rateForm.rateType}
                    onChange={(e) => setRateForm({ ...rateForm, rateType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="Per Employee Per Month">Per Employee Per Month</option>
                    <option value="Per Employee Per Day">Per Employee Per Day</option>
                    <option value="Per Hour">Per Hour</option>
                    <option value="Fixed Monthly Contract">Fixed Monthly Contract</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-200">
                <div>
                  <label className="block font-extrabold text-blue-900 mb-1">
                    Client Invoiced Rate (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={rateForm.clientBillingRate}
                    onChange={(e) => setRateForm({ ...rateForm, clientBillingRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-blue-300 font-mono font-black text-blue-700 text-sm bg-white"
                  />
                  <span className="text-[10px] text-blue-600 block mt-0.5">Charged to {selectedClient.clientName}</span>
                </div>
                <div>
                  <label className="block font-extrabold text-emerald-900 mb-1">
                    Base Employee Wage (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={rateForm.employeeWageRate}
                    onChange={(e) => setRateForm({ ...rateForm, employeeWageRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 font-mono font-black text-emerald-700 text-sm bg-white"
                  />
                  <span className="text-[10px] text-emerald-600 block mt-0.5">Base staff payout (isolated)</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Calculated Gross Margin:</span>
                <span className="text-emerald-700 font-mono font-black text-sm">
                  ₹{(rateForm.clientBillingRate - rateForm.employeeWageRate).toLocaleString('en-IN')}{' '}
                  ({rateForm.clientBillingRate > 0 ? Math.round(((rateForm.clientBillingRate - rateForm.employeeWageRate) / rateForm.clientBillingRate) * 100) : 0}%)
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {submitting ? 'Saving...' : 'Save Rate Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: UPLOAD SITE / CLIENT DOCUMENT
      ======================================================== */}
      {isDocModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold">Vault Client Document</h3>
                <p className="text-xs text-slate-400">For {selectedClient.clientName}</p>
              </div>
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Service Agreement 2026"
                  value={docForm.documentName}
                  onChange={(e) => setDocForm({ ...docForm, documentName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Category</label>
                <select
                  value={docForm.documentType}
                  onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value as any })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                >
                  <option value="Client Agreement">Client Agreement</option>
                  <option value="Work Order">Work Order</option>
                  <option value="Purchase Order">Purchase Order</option>
                  <option value="Safety & Fire NOC">Safety & Fire NOC</option>
                  <option value="Site Instructions">Site Instructions</option>
                  <option value="Site Layout / Blueprint">Site Layout / Blueprint</option>
                  <option value="Compliance Checklist">Compliance Checklist</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Document File URL</label>
                <input
                  type="url"
                  required
                  value={docForm.fileUrl}
                  onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Upload Date</label>
                  <input
                    type="date"
                    value={docForm.uploadDate}
                    onChange={(e) => setDocForm({ ...docForm, uploadDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={docForm.expiryDate}
                    onChange={(e) => setDocForm({ ...docForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {submitting ? 'Vaulting...' : 'Vault Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 5: EMPLOYEE SITE TRANSFER
      ======================================================== */}
      {isTransferModalOpen && transferTargetDeployment && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold">Reassign / Transfer Employee</h3>
                <p className="text-xs text-slate-400">{transferTargetDeployment.employeeName} ({transferTargetDeployment.employeeCode})</p>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-400">Current Deployment Post</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{transferTargetDeployment.siteName}</div>
                <div className="text-xs text-slate-500 font-mono">{transferTargetDeployment.siteCode} • Client: {transferTargetDeployment.clientName}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Target Destination Site *</label>
                <select
                  value={transferForm.destinationSiteId}
                  onChange={(e) => setTransferForm({ destinationSiteId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                >
                  <option value="">-- Choose Target Guard Post / Site --</option>
                  {sites
                    .filter((s) => s.id !== transferTargetDeployment.siteId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.siteName} ({s.siteCode}) - {s.clientName}
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteTransfer}
                  disabled={submitting || !transferForm.destinationSiteId}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
                >
                  {submitting ? 'Transferring...' : 'Confirm Transfer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 6: SITE QR CODE & POSTER VIEWER
      ======================================================== */}
      {activeQrSite && (
        <SiteQrModal site={activeQrSite} onClose={() => setActiveQrSite(null)} />
      )}
    </div>
  );
};
