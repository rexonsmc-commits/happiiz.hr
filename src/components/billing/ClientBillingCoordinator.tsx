/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Company,
  Client,
  ClientSite,
  ClientContract,
  ClientInvoice,
  RateCardItem,
  AdditionalServiceItem,
  ServiceChargeConfig,
  DebitNoteItem,
  CreditNoteItem,
  ClientPaymentRecord,
  ClientLedgerEntry,
  ClientProfitabilityReport,
  PayrollEntry,
} from '../../types';
import {
  getCompanyClients,
  getCompanySites,
  getClientContracts,
} from '../../services/tenantService';
import {
  getClientInvoices,
  getRateCards,
  getAdditionalServices,
  getServiceCharges,
  getDebitNotes,
  getCreditNotes,
  getClientPayments,
  getClientLedger,
  calculateInternalProfitability,
} from '../../services/billingService';
import { getPayrollEntries, getPayrollRuns } from '../../services/payrollService';
import { ClientBillingDashboard } from './ClientBillingDashboard';
import { InvoiceListModule } from './InvoiceListModule';
import { InvoiceGenerationCockpit } from './InvoiceGenerationCockpit';
import { ContractManagementModule } from './ContractManagementModule';
import { PaymentCollectionModule } from './PaymentCollectionModule';
import { ClientLedgerModule } from './ClientLedgerModule';
import { ProfitabilityAnalysisModule } from './ProfitabilityAnalysisModule';
import { BillingReportsModule } from './BillingReportsModule';
import { RateCardManagementModal } from './RateCardManagementModal';
import { TaxInvoiceModal } from './TaxInvoiceModal';
import {
  Receipt,
  FileText,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
  Calendar,
  Layers,
  ShieldCheck,
  RefreshCw,
  Plus,
  Play,
  FileSpreadsheet,
} from 'lucide-react';

interface ClientBillingCoordinatorProps {
  companyId: string;
  tenantId: string;
  currentCompany: Company | null;
  currentUser: { name: string; role?: string };
}

export const ClientBillingCoordinator: React.FC<ClientBillingCoordinatorProps> = ({
  companyId,
  tenantId,
  currentCompany,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Core Data States
  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<ClientSite[]>([]);
  const [contracts, setContracts] = useState<ClientContract[]>([]);
  const [rateCards, setRateCards] = useState<RateCardItem[]>([]);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [additionalServices, setAdditionalServices] = useState<AdditionalServiceItem[]>([]);
  const [serviceCharges, setServiceCharges] = useState<ServiceChargeConfig[]>([]);
  const [debitNotes, setDebitNotes] = useState<DebitNoteItem[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNoteItem[]>([]);
  const [payments, setPayments] = useState<ClientPaymentRecord[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<ClientLedgerEntry[]>([]);
  const [profitabilityReports, setProfitabilityReports] = useState<ClientProfitabilityReport[]>([]);
  const [selectedProfitabilityPeriod, setSelectedProfitabilityPeriod] = useState<string>('2026-11');

  // Modals
  const [showRateCardModal, setShowRateCardModal] = useState<boolean>(false);
  const [viewInvoice, setViewInvoice] = useState<ClientInvoice | null>(null);

  const loadAllBillingData = async () => {
    setIsLoading(true);
    try {
      const [
        loadedClients,
        loadedSites,
        loadedContracts,
      ] = await Promise.all([
        getCompanyClients(companyId),
        getCompanySites(companyId),
        getClientContracts(companyId),
      ]);

      setClients(loadedClients);
      setSites(loadedSites);
      setContracts(loadedContracts);

      const [
        loadedRateCards,
        loadedInvoices,
        loadedAdditionalServices,
        loadedServiceCharges,
        loadedDebitNotes,
        loadedCreditNotes,
        loadedPayments,
        loadedLedger,
      ] = await Promise.all([
        getRateCards(companyId, tenantId, loadedClients, loadedSites),
        getClientInvoices(companyId, tenantId, currentCompany, loadedClients),
        getAdditionalServices(companyId, tenantId),
        getServiceCharges(companyId, tenantId),
        getDebitNotes(companyId, tenantId),
        getCreditNotes(companyId, tenantId),
        getClientPayments(companyId, tenantId),
        getClientLedger(companyId, tenantId),
      ]);

      setRateCards(loadedRateCards);
      setInvoices(loadedInvoices);
      setAdditionalServices(loadedAdditionalServices);
      setServiceCharges(loadedServiceCharges);
      setDebitNotes(loadedDebitNotes);
      setCreditNotes(loadedCreditNotes);
      setPayments(loadedPayments);
      setLedgerEntries(loadedLedger);

      // Load matching payroll entries for internal profitability
      const payrollRuns = await getPayrollRuns(companyId, tenantId);
      const activeRun = payrollRuns[0];
      let payrollEntries: PayrollEntry[] = [];
      if (activeRun) {
        payrollEntries = await getPayrollEntries(companyId, activeRun.id);
      }

      const profReports = await calculateInternalProfitability(
        companyId,
        tenantId,
        selectedProfitabilityPeriod,
        loadedInvoices,
        payrollEntries
      );
      setProfitabilityReports(profReports);
    } catch (err) {
      console.error('Error loading client billing data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllBillingData();
  }, [companyId, tenantId]);

  const handlePeriodChange = async (newPeriod: string) => {
    setSelectedProfitabilityPeriod(newPeriod);
    const payrollRuns = await getPayrollRuns(companyId, tenantId);
    const matchedRun = payrollRuns.find((r) => r.period === newPeriod) || payrollRuns[0];
    let payrollEntries: PayrollEntry[] = [];
    if (matchedRun) {
      payrollEntries = await getPayrollEntries(companyId, matchedRun.id);
    }
    const profReports = await calculateInternalProfitability(
      companyId,
      tenantId,
      newPeriod,
      invoices,
      payrollEntries
    );
    setProfitabilityReports(profReports);
  };

  const tabs = [
    { id: 'dashboard', label: 'Billing Dashboard', icon: DollarSign },
    { id: 'invoices', label: 'Invoices Register', icon: Receipt, count: invoices.length },
    { id: 'generate', label: 'Generate Invoice', icon: Play },
    { id: 'contracts', label: 'Contracts & Rates', icon: FileText, count: contracts.length },
    { id: 'payments', label: 'Payments & Receipts', icon: CreditCard, count: payments.length },
    { id: 'ledger', label: 'Client Ledger', icon: Layers },
    { id: 'profitability', label: 'Profitability Analysis', icon: TrendingUp },
    { id: 'reports', label: 'Tax & Aging Reports', icon: FileSpreadsheet },
  ];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Client Billing & GST Invoicing
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              Phase 8 Complete
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise client billing engine, attendance-based invoice generation, GST compliance (SAC 998525/998513), payment collection, and operational profitability.
          </p>
        </div>

        <button
          onClick={loadAllBillingData}
          disabled={isLoading}
          className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Tabs Navigation Strip - Multi-Line Wrap */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-slate-50/70 border border-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading client billing ledger and GST invoice registry...</p>
        </div>
      )}

      {/* Active Tab View */}
      {!isLoading && (
        <>
          {activeTab === 'dashboard' && (
            <ClientBillingDashboard
              company={currentCompany}
              invoices={invoices}
              clients={clients}
              sites={sites}
              contracts={contracts}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenViewInvoice={(inv) => setViewInvoice(inv)}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoiceListModule
              companyId={companyId}
              tenantId={tenantId}
              company={currentCompany}
              invoices={invoices}
              clients={clients}
              currentUser={currentUser}
              onRefresh={loadAllBillingData}
              onRecordPaymentClick={(inv) => {
                setActiveTab('payments');
              }}
            />
          )}

          {activeTab === 'generate' && (
            <InvoiceGenerationCockpit
              companyId={companyId}
              tenantId={tenantId}
              company={currentCompany}
              clients={clients}
              sites={sites}
              rateCards={rateCards}
              additionalServices={additionalServices}
              currentUser={currentUser}
              onInvoiceGenerated={(newInv) => {
                setViewInvoice(newInv);
                setActiveTab('invoices');
                loadAllBillingData();
              }}
            />
          )}

          {activeTab === 'contracts' && (
            <ContractManagementModule
              companyId={companyId}
              tenantId={tenantId}
              contracts={contracts}
              clients={clients}
              sites={sites}
              onOpenRateCards={() => setShowRateCardModal(true)}
              onRefresh={loadAllBillingData}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentCollectionModule
              companyId={companyId}
              tenantId={tenantId}
              payments={payments}
              invoices={invoices}
              clients={clients}
              currentUser={currentUser}
              onRefresh={loadAllBillingData}
            />
          )}

          {activeTab === 'ledger' && (
            <ClientLedgerModule
              clients={clients}
              ledgerEntries={ledgerEntries}
            />
          )}

          {activeTab === 'profitability' && (
            <ProfitabilityAnalysisModule
              reports={profitabilityReports}
              selectedPeriod={selectedProfitabilityPeriod}
              onPeriodChange={handlePeriodChange}
            />
          )}

          {activeTab === 'reports' && (
            <BillingReportsModule
              invoices={invoices}
              clients={clients}
            />
          )}
        </>
      )}

      {/* Rate Card Modal */}
      {showRateCardModal && (
        <RateCardManagementModal
          companyId={companyId}
          tenantId={tenantId}
          rateCards={rateCards}
          clients={clients}
          sites={sites}
          onClose={() => setShowRateCardModal(false)}
          onRefresh={loadAllBillingData}
        />
      )}

      {/* View Tax Invoice Modal */}
      {viewInvoice && (
        <TaxInvoiceModal
          invoice={viewInvoice}
          company={currentCompany}
          onClose={() => setViewInvoice(null)}
        />
      )}
    </div>
  );
};
