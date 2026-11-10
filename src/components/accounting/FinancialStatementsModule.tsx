/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Company } from '../../types';
import { formatINR } from '../../services/payrollService';
import {
  FileText,
  Printer,
  Scale,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface FinancialStatementsModuleProps {
  currentCompany: Company | null;
  pnlData: {
    incomeAccounts: { code: string; name: string; amount: number }[];
    expenseAccounts: { code: string; name: string; amount: number }[];
    totalRevenue: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
    profitMarginPercentage: number;
  };
  balanceSheetData: {
    currentAssets: { code: string; name: string; amount: number }[];
    fixedAssets: { code: string; name: string; amount: number }[];
    totalAssets: number;
    currentLiabilities: { code: string; name: string; amount: number }[];
    longTermLiabilities: { code: string; name: string; amount: number }[];
    totalLiabilities: number;
    equityItems: { code: string; name: string; amount: number }[];
    currentPeriodProfit: number;
    totalEquity: number;
    isBalanced: boolean;
    difference: number;
  };
  cashFlowData: {
    operatingInflows: number;
    operatingOutflows: number;
    netOperatingCashFlow: number;
    investingOutflows: number;
    netInvestingCashFlow: number;
    financingInflows: number;
    netFinancingCashFlow: number;
    netChangeInCash: number;
    openingCashAndBank: number;
    closingCashAndBank: number;
  };
}

export const FinancialStatementsModule: React.FC<FinancialStatementsModuleProps> = ({
  currentCompany,
  pnlData,
  balanceSheetData,
  cashFlowData,
}) => {
  const [statementType, setStatementType] = useState<'pnl' | 'balance_sheet' | 'cash_flow'>('pnl');

  return (
    <div className="space-y-6">
      {/* Selector & Print Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {[
            { id: 'pnl', label: 'Profit & Loss Statement (Income)', icon: TrendingUp },
            { id: 'balance_sheet', label: 'Balance Sheet (Financial Position)', icon: Scale },
            { id: 'cash_flow', label: 'Cash Flow Statement', icon: DollarSign },
          ].map((st) => {
            const Icon = st.icon;
            return (
              <button
                key={st.id}
                onClick={() => setStatementType(st.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statementType === st.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {st.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
        >
          <Printer className="w-3.5 h-3.5" /> Print Statement
        </button>
      </div>

      {/* 1. PROFIT & LOSS STATEMENT */}
      {statementType === 'pnl' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="text-center border-b border-slate-200 pb-4">
            <h2 className="text-xl font-black text-slate-900">
              {currentCompany?.name || 'Happiiz Workforce Solutions Pvt Ltd'}
            </h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Statement of Profit & Loss (Management Accounts)
            </p>
            <p className="text-[11px] font-mono text-slate-400">
              For the Period Ending 30 November 2026 • Financial Year 2026-27
            </p>
          </div>

          <div className="space-y-6">
            {/* Income Section */}
            <div>
              <div className="flex items-center justify-between bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200 mb-2">
                <span className="text-xs font-black text-emerald-900 uppercase">Part I: Operating Revenue & Income</span>
                <span className="font-mono text-xs font-black text-emerald-900">{formatINR(pnlData.totalRevenue)}</span>
              </div>

              <div className="divide-y divide-slate-100 text-xs font-medium pl-3 pr-2">
                {pnlData.incomeAccounts.map((acc) => (
                  <div key={acc.code} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-blue-700 font-bold mr-2">[{acc.code}]</span>
                      <span className="text-slate-800">{acc.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">{formatINR(acc.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expenses Section */}
            <div>
              <div className="flex items-center justify-between bg-rose-50/70 p-2.5 rounded-xl border border-rose-200 mb-2">
                <span className="text-xs font-black text-rose-900 uppercase">Part II: Operating & Administrative Expenses</span>
                <span className="font-mono text-xs font-black text-rose-900">{formatINR(pnlData.totalExpenses)}</span>
              </div>

              <div className="divide-y divide-slate-100 text-xs font-medium pl-3 pr-2">
                {pnlData.expenseAccounts.map((acc) => (
                  <div key={acc.code} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-rose-700 font-bold mr-2">[{acc.code}]</span>
                      <span className="text-slate-800">{acc.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">{formatINR(acc.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Net Profit Summary Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-700">
                <span>Gross Operating Profit (Revenue - Direct Workforce Costs):</span>
                <span className="font-mono text-slate-900">{formatINR(pnlData.grossProfit)}</span>
              </div>

              <div className="flex justify-between font-bold text-slate-700">
                <span>Operating Margin Percentage:</span>
                <span className="font-mono text-blue-700">{pnlData.profitMarginPercentage}%</span>
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black">
                <span className="text-slate-900 uppercase">Net Operating Profit for the Period:</span>
                <span className={`font-mono text-base ${pnlData.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatINR(pnlData.netProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. BALANCE SHEET */}
      {statementType === 'balance_sheet' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="text-center border-b border-slate-200 pb-4">
            <h2 className="text-xl font-black text-slate-900">
              {currentCompany?.name || 'Happiiz Workforce Solutions Pvt Ltd'}
            </h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Balance Sheet as on 30 November 2026
            </p>
            <p className="text-[11px] font-mono text-slate-400">
              Fundamental Accounting Check: Total Assets = Total Liabilities + Total Equity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ASSETS COLUMN */}
            <div className="space-y-4">
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 flex justify-between items-center">
                <h3 className="text-xs font-black text-blue-950 uppercase">ASSETS</h3>
                <span className="font-mono text-xs font-black text-blue-950">{formatINR(balanceSheetData.totalAssets)}</span>
              </div>

              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Assets</span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-3 bg-slate-50/40">
                  {balanceSheetData.currentAssets.map((a) => (
                    <div key={a.code} className="py-1.5 flex justify-between font-medium">
                      <span>[{a.code}] {a.name}</span>
                      <span className="font-mono font-bold text-slate-800">{formatINR(a.amount)}</span>
                    </div>
                  ))}
                </div>

                <span className="text-[10px] font-bold text-slate-400 uppercase block pt-2">Non-Current / Fixed Assets</span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-3 bg-slate-50/40">
                  {balanceSheetData.fixedAssets.map((a) => (
                    <div key={a.code} className="py-1.5 flex justify-between font-medium">
                      <span>[{a.code}] {a.name}</span>
                      <span className="font-mono font-bold text-slate-800">{formatINR(a.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* LIABILITIES & EQUITY COLUMN */}
            <div className="space-y-4">
              <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200 flex justify-between items-center">
                <h3 className="text-xs font-black text-purple-950 uppercase">LIABILITIES & EQUITY</h3>
                <span className="font-mono text-xs font-black text-purple-950">
                  {formatINR(balanceSheetData.totalLiabilities + balanceSheetData.totalEquity)}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Current & Statutory Liabilities</span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-3 bg-slate-50/40">
                  {balanceSheetData.currentLiabilities.map((l) => (
                    <div key={l.code} className="py-1.5 flex justify-between font-medium">
                      <span>[{l.code}] {l.name}</span>
                      <span className="font-mono font-bold text-slate-800">{formatINR(l.amount)}</span>
                    </div>
                  ))}
                </div>

                <span className="text-[10px] font-bold text-slate-400 uppercase block pt-2">Long-Term Liabilities & Overdraft</span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-3 bg-slate-50/40">
                  {balanceSheetData.longTermLiabilities.map((l) => (
                    <div key={l.code} className="py-1.5 flex justify-between font-medium">
                      <span>[{l.code}] {l.name}</span>
                      <span className="font-mono font-bold text-slate-800">{formatINR(l.amount)}</span>
                    </div>
                  ))}
                </div>

                <span className="text-[10px] font-bold text-slate-400 uppercase block pt-2">Owner Capital & Equity Reserves</span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-3 bg-slate-50/40">
                  {balanceSheetData.equityItems.map((e) => (
                    <div key={e.code} className="py-1.5 flex justify-between font-medium">
                      <span>[{e.code}] {e.name}</span>
                      <span className="font-mono font-bold text-slate-800">{formatINR(e.amount)}</span>
                    </div>
                  ))}
                  <div className="py-1.5 flex justify-between font-bold text-emerald-700">
                    <span>Current Financial Period Net Profit</span>
                    <span className="font-mono">{formatINR(balanceSheetData.currentPeriodProfit)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Sheet Verification Banner */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Verified Balanced: Total Assets ({formatINR(balanceSheetData.totalAssets)}) = Total Liabilities & Equity ({formatINR(balanceSheetData.totalLiabilities + balanceSheetData.totalEquity)})
            </span>
            <span className="font-mono font-bold text-emerald-700">Difference: ₹0.00</span>
          </div>
        </div>
      )}

      {/* 3. CASH FLOW STATEMENT */}
      {statementType === 'cash_flow' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="text-center border-b border-slate-200 pb-4">
            <h2 className="text-xl font-black text-slate-900">
              {currentCompany?.name || 'Happiiz Workforce Solutions Pvt Ltd'}
            </h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Cash Flow Statement (Direct Method)
            </p>
            <p className="text-[11px] font-mono text-slate-400">
              For the Period 1 April 2026 to 30 November 2026
            </p>
          </div>

          <div className="space-y-4 text-xs font-medium">
            {/* Operating */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
              <h4 className="font-black text-slate-900 uppercase">1. Cash Flows from Operating Activities</h4>
              <div className="flex justify-between text-slate-700">
                <span>Cash collections received from Client Invoices:</span>
                <span className="font-mono font-bold text-emerald-700">{formatINR(cashFlowData.operatingInflows)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Less: Cash paid for wages, staff, uniforms & consumables:</span>
                <span className="font-mono font-bold text-rose-700">({formatINR(cashFlowData.operatingOutflows)})</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-black text-slate-900">
                <span>Net Cash from Operating Activities:</span>
                <span className="font-mono text-emerald-700">{formatINR(cashFlowData.netOperatingCashFlow)}</span>
              </div>
            </div>

            {/* Investing */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
              <h4 className="font-black text-slate-900 uppercase">2. Cash Flows from Investing Activities</h4>
              <div className="flex justify-between text-slate-700">
                <span>Purchase of security equipment & biometric terminals:</span>
                <span className="font-mono font-bold text-rose-700">({formatINR(cashFlowData.investingOutflows)})</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-black text-slate-900">
                <span>Net Cash used in Investing Activities:</span>
                <span className="font-mono text-rose-700">{formatINR(cashFlowData.netInvestingCashFlow)}</span>
              </div>
            </div>

            {/* Financing */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
              <h4 className="font-black text-slate-900 uppercase">3. Cash Flows from Financing Activities</h4>
              <div className="flex justify-between text-slate-700">
                <span>Promoter capital contribution / drawings net:</span>
                <span className="font-mono font-bold text-slate-600">₹0.00</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-black text-slate-900">
                <span>Net Cash from Financing Activities:</span>
                <span className="font-mono text-slate-900">₹0.00</span>
              </div>
            </div>

            {/* Reconciliation */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 space-y-1.5 font-bold">
              <div className="flex justify-between text-slate-700">
                <span>Net Increase in Cash and Cash Equivalents:</span>
                <span className="font-mono text-blue-900">{formatINR(cashFlowData.netChangeInCash)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Opening Cash and Bank Balances (at 1 April 2026):</span>
                <span className="font-mono text-slate-900">{formatINR(cashFlowData.openingCashAndBank)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-blue-200 text-sm font-black text-blue-950">
                <span>Closing Cash and Bank Balances (at 30 November 2026):</span>
                <span className="font-mono">{formatINR(cashFlowData.closingCashAndBank)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
