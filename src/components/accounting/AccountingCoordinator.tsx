/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Company,
  ChartOfAccount,
  JournalEntry,
  BankAccount,
  BankTransaction,
  CashTransaction,
  ExpenseRecord,
  PurchaseBill,
  Vendor,
  PaymentVoucher,
  ReceiptVoucher,
  GeneralLedgerEntry,
  TrialBalanceRow,
  FixedAssetRecord,
  FinancialYearConfig,
  ClientInvoice,
  ClientPaymentRecord,
  PayrollRun,
  PayrollEntry,
} from '../../types';
import {
  getCompanyChartOfAccounts,
  createChartOfAccount,
  updateChartOfAccount,
  getCompanyJournals,
  postJournalEntry,
  reverseJournalEntry,
  getCompanyCashTransactions,
  recordCashTransaction,
  getCompanyBankAccounts,
  getCompanyBankTransactions,
  performBankReconciliation,
  getCompanyVendors,
  createVendor,
  getCompanyPurchaseBills,
  createAndPostPurchaseBill,
  getCompanyExpenses,
  createAndPostExpense,
  getCompanyPaymentVouchers,
  getCompanyReceiptVouchers,
  generateTrialBalance,
  generateProfitAndLoss,
  generateBalanceSheet,
  generateCashFlowStatement,
  syncPhase7And8Transactions,
  getCompanyFixedAssets,
  postMonthlyDepreciation,
  getCompanyFinancialYears,
} from '../../services/accountingService';
import { getClientInvoices, getClientPayments } from '../../services/billingService';
import { getPayrollRuns, getPayrollEntries } from '../../services/payrollService';
import { getCompanyClients, getCompanySites } from '../../services/tenantService';

import { AccountingDashboard } from './AccountingDashboard';
import { ChartOfAccountsModule } from './ChartOfAccountsModule';
import { JournalEntriesModule } from './JournalEntriesModule';
import { CashBankBookModule } from './CashBankBookModule';
import { ExpenseManagementModule } from './ExpenseManagementModule';
import { PurchaseVendorModule } from './PurchaseVendorModule';
import { VouchersModule } from './VouchersModule';
import { GeneralLedgerModule } from './GeneralLedgerModule';
import { TrialBalanceModule } from './TrialBalanceModule';
import { FinancialStatementsModule } from './FinancialStatementsModule';
import { GstTdsTaxModule } from './GstTdsTaxModule';
import { FixedAssetsModule } from './FixedAssetsModule';
import { FinancialYearModule } from './FinancialYearModule';

import {
  LayoutDashboard,
  Layers,
  Scale,
  Wallet,
  Receipt,
  FileText,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Building2,
  Calendar,
  ShieldCheck,
  RefreshCw,
  Plus,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface AccountingCoordinatorProps {
  companyId: string;
  tenantId: string;
  currentCompany: Company | null;
  currentUser: { name: string; role?: string };
}

export const AccountingCoordinator: React.FC<AccountingCoordinatorProps> = ({
  companyId,
  tenantId,
  currentCompany,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [drilldownAccountId, setDrilldownAccountId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  // Core Data States
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [purchaseBills, setPurchaseBills] = useState<PurchaseBill[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [paymentVouchers, setPaymentVouchers] = useState<PaymentVoucher[]>([]);
  const [receiptVouchers, setReceiptVouchers] = useState<ReceiptVoucher[]>([]);
  const [fixedAssets, setFixedAssets] = useState<FixedAssetRecord[]>([]);
  const [financialYears, setFinancialYears] = useState<FinancialYearConfig[]>([]);

  // Generated Financial Reports
  const [trialBalanceData, setTrialBalanceData] = useState<any>({
    rows: [],
    totalOpeningDebit: 0,
    totalOpeningCredit: 0,
    totalPeriodDebit: 0,
    totalPeriodCredit: 0,
    totalClosingDebit: 0,
    totalClosingCredit: 0,
    isBalanced: true,
  });
  const [pnlData, setPnlData] = useState<any>({
    incomeAccounts: [],
    expenseAccounts: [],
    totalRevenue: 0,
    totalExpenses: 0,
    grossProfit: 0,
    netProfit: 0,
    profitMarginPercentage: 0,
  });
  const [balanceSheetData, setBalanceSheetData] = useState<any>({
    currentAssets: [],
    fixedAssets: [],
    totalAssets: 0,
    currentLiabilities: [],
    longTermLiabilities: [],
    totalLiabilities: 0,
    equityItems: [],
    currentPeriodProfit: 0,
    totalEquity: 0,
    isBalanced: true,
    difference: 0,
  });
  const [cashFlowData, setCashFlowData] = useState<any>({
    operatingInflows: 0,
    operatingOutflows: 0,
    netOperatingCashFlow: 0,
    investingOutflows: 0,
    netInvestingCashFlow: 0,
    financingInflows: 0,
    netFinancingCashFlow: 0,
    netChangeInCash: 0,
    openingCashAndBank: 0,
    closingCashAndBank: 0,
  });

  const loadAllAccountingData = async () => {
    setIsLoading(true);
    try {
      const [
        loadedCoa,
        loadedJournals,
        loadedBankAccs,
        loadedBankTxs,
        loadedCashTxs,
        loadedExpenses,
        loadedPurchases,
        loadedVendors,
        loadedPVs,
        loadedRVs,
        loadedAssets,
        loadedFYs,
      ] = await Promise.all([
        getCompanyChartOfAccounts(companyId, tenantId),
        getCompanyJournals(companyId),
        getCompanyBankAccounts(companyId, tenantId),
        getCompanyBankTransactions(companyId),
        getCompanyCashTransactions(companyId),
        getCompanyExpenses(companyId, tenantId),
        getCompanyPurchaseBills(companyId, tenantId),
        getCompanyVendors(companyId, tenantId),
        getCompanyPaymentVouchers(companyId),
        getCompanyReceiptVouchers(companyId),
        getCompanyFixedAssets(companyId, tenantId),
        getCompanyFinancialYears(companyId, tenantId),
      ]);

      setAccounts(loadedCoa);
      setJournals(loadedJournals);
      setBankAccounts(loadedBankAccs);
      setBankTransactions(loadedBankTxs);
      setCashTransactions(loadedCashTxs);
      setExpenses(loadedExpenses);
      setPurchaseBills(loadedPurchases);
      setVendors(loadedVendors);
      setPaymentVouchers(loadedPVs);
      setReceiptVouchers(loadedRVs);
      setFixedAssets(loadedAssets);
      setFinancialYears(loadedFYs);

      // Compute Reports
      const [tb, pnl, bs, cf] = await Promise.all([
        generateTrialBalance(companyId, tenantId),
        generateProfitAndLoss(companyId, tenantId),
        generateBalanceSheet(companyId, tenantId),
        generateCashFlowStatement(companyId, tenantId),
      ]);

      setTrialBalanceData(tb);
      setPnlData(pnl);
      setBalanceSheetData(bs);
      setCashFlowData(cf);
    } catch (err) {
      console.error('[Happiiz HR] Accounting data load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllAccountingData();
  }, [companyId, tenantId]);

  // Automatic Phase 7 & 8 Synchronization Handler
  const handleRunSync = async () => {
    setIsSyncing(true);
    try {
      const clients = await getCompanyClients(companyId);
      const invoices = await getClientInvoices(companyId, tenantId, currentCompany, clients);
      const payments = await getClientPayments(companyId, tenantId);
      const payrollRuns = await getPayrollRuns(companyId, tenantId);
      const payrollEntries =
        payrollRuns.length > 0 ? await getPayrollEntries(companyId, payrollRuns[0].id) : [];

      const result = await syncPhase7And8Transactions(
        companyId,
        tenantId,
        invoices,
        payments,
        payrollRuns,
        payrollEntries,
        currentUser.name
      );

      setSyncNotification(
        `Sync Successful: Generated ${result.totalJournalsGenerated} balanced journals (${result.invoicesSynced} client invoices, ${result.paymentsSynced} payments, ${result.payrollSynced} payroll runs). ${result.alreadySyncedCount} transactions were already posted.`
      );
      setTimeout(() => setSyncNotification(null), 6000);

      await loadAllAccountingData();
    } catch (err: any) {
      console.error('[Happiiz HR] Sync error:', err);
      setSyncNotification(`Sync error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDrilldownLedger = (accountId: string) => {
    setDrilldownAccountId(accountId);
    setActiveTab('general_ledger');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-sm font-bold text-slate-700">Loading Double-Entry Accounting Ledger...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Synchronization Notification Alert */}
      {syncNotification && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{syncNotification}</span>
          </div>
          <button
            onClick={() => setSyncNotification(null)}
            className="text-indigo-400 hover:text-indigo-700 text-sm font-bold cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Navigation Suite Tabs - Responsive Multi-Line Wrap */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-1.5">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'coa', label: 'Chart of Accounts', icon: Layers },
          { id: 'journals', label: 'Journal Entries', icon: Scale },
          { id: 'cash_bank', label: 'Cash & Bank Book', icon: Wallet },
          { id: 'expenses', label: 'Expenses', icon: TrendingUp },
          { id: 'purchases', label: 'Purchases & Vendors', icon: ShoppingBag },
          { id: 'vouchers', label: 'Vouchers', icon: Receipt },
          { id: 'general_ledger', label: 'General Ledger', icon: FileText },
          { id: 'trial_balance', label: 'Trial Balance', icon: Scale },
          { id: 'statements', label: 'Financial Statements', icon: DollarSign },
          { id: 'gst_tds', label: 'GST & TDS Taxes', icon: Building2 },
          { id: 'fixed_assets', label: 'Fixed Assets', icon: ShieldCheck },
          { id: 'financial_year', label: 'Financial Year', icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-slate-50/70 border border-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Renderers */}
      {activeTab === 'dashboard' && (
        <AccountingDashboard
          accounts={accounts}
          journals={journals}
          bankAccounts={bankAccounts}
          cashTransactions={cashTransactions}
          expenses={expenses}
          purchaseBills={purchaseBills}
          pnlData={pnlData}
          balanceSheetData={balanceSheetData}
          onNavigateTab={(t) => setActiveTab(t)}
          onOpenSync={handleRunSync}
          onOpenNewJournal={() => setActiveTab('journals')}
          onOpenNewExpense={() => setActiveTab('expenses')}
        />
      )}

      {activeTab === 'coa' && (
        <ChartOfAccountsModule
          accounts={accounts}
          onCreateAccount={async (data) => {
            await createChartOfAccount(companyId, tenantId, data);
            await loadAllAccountingData();
          }}
          onUpdateAccount={async (id, updates) => {
            await updateChartOfAccount(companyId, id, updates);
            await loadAllAccountingData();
          }}
          onDrilldownLedger={handleDrilldownLedger}
        />
      )}

      {activeTab === 'journals' && (
        <JournalEntriesModule
          journals={journals}
          accounts={accounts}
          currentUser={currentUser}
          onPostJournal={async (params) => {
            await postJournalEntry({
              ...params,
              companyId,
              tenantId,
              createdBy: currentUser.name,
            });
            await loadAllAccountingData();
          }}
          onReverseJournal={async (journalId, reason) => {
            await reverseJournalEntry(companyId, tenantId, journalId, reason, currentUser.name);
            await loadAllAccountingData();
          }}
        />
      )}

      {activeTab === 'cash_bank' && (
        <CashBankBookModule
          cashTransactions={cashTransactions}
          bankAccounts={bankAccounts}
          bankTransactions={bankTransactions}
          accounts={accounts}
          currentUser={currentUser}
          onRecordCashTx={async (txData) => {
            await recordCashTransaction(companyId, tenantId, txData, currentUser.name);
            await loadAllAccountingData();
          }}
          onReconcileBank={async (bankAccId, date, bal, ids) => {
            await performBankReconciliation(companyId, tenantId, bankAccId, date, bal, ids, currentUser.name);
            await loadAllAccountingData();
          }}
        />
      )}

      {activeTab === 'expenses' && (
        <ExpenseManagementModule
          expenses={expenses}
          bankAccounts={bankAccounts}
          currentUser={currentUser}
          onRecordExpense={async (data) => {
            await createAndPostExpense(companyId, tenantId, data, currentUser.name);
            await loadAllAccountingData();
          }}
        />
      )}

      {activeTab === 'purchases' && (
        <PurchaseVendorModule
          purchaseBills={purchaseBills}
          vendors={vendors}
          currentUser={currentUser}
          onCreatePurchaseBill={async (data) => {
            await createAndPostPurchaseBill(companyId, tenantId, data, currentUser.name);
            await loadAllAccountingData();
          }}
          onCreateVendor={async (data) => {
            await createVendor(companyId, tenantId, data);
            await loadAllAccountingData();
          }}
        />
      )}

      {activeTab === 'vouchers' && (
        <VouchersModule
          paymentVouchers={paymentVouchers}
          receiptVouchers={receiptVouchers}
          currentCompany={currentCompany}
        />
      )}

      {activeTab === 'general_ledger' && (
        <GeneralLedgerModule
          accounts={accounts}
          selectedAccountId={drilldownAccountId}
        />
      )}

      {activeTab === 'trial_balance' && (
        <TrialBalanceModule trialBalanceData={trialBalanceData} />
      )}

      {activeTab === 'statements' && (
        <FinancialStatementsModule
          currentCompany={currentCompany}
          pnlData={pnlData}
          balanceSheetData={balanceSheetData}
          cashFlowData={cashFlowData}
        />
      )}

      {activeTab === 'gst_tds' && (
        <GstTdsTaxModule accounts={accounts} purchaseBills={purchaseBills} />
      )}

      {activeTab === 'fixed_assets' && (
        <FixedAssetsModule
          fixedAssets={fixedAssets}
          currentUser={currentUser}
          onPostDepreciation={async (assetId) => {
            await postMonthlyDepreciation(companyId, tenantId, assetId, currentUser.name);
            await loadAllAccountingData();
          }}
        />
      )}

      {activeTab === 'financial_year' && (
        <FinancialYearModule
          financialYears={financialYears}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};
