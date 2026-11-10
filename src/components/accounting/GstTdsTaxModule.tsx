/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChartOfAccount, PurchaseBill } from '../../types';
import { formatINR, round2 } from '../../services/payrollService';
import {
  FileText,
  Scale,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Building2,
  Download,
} from 'lucide-react';

interface GstTdsTaxModuleProps {
  accounts: ChartOfAccount[];
  purchaseBills: PurchaseBill[];
}

export const GstTdsTaxModule: React.FC<GstTdsTaxModuleProps> = ({ accounts, purchaseBills }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'sales' | 'purchases' | 'tds'>('summary');

  // Output GST
  const outputCgst = accounts.find((a) => a.accountCode === '2301')?.currentBalance || 0;
  const outputSgst = accounts.find((a) => a.accountCode === '2302')?.currentBalance || 0;
  const outputIgst = accounts.find((a) => a.accountCode === '2303')?.currentBalance || 0;
  const totalOutputGst = round2(outputCgst + outputSgst + outputIgst);

  // Input GST (ITC)
  const inputCgst = accounts.find((a) => a.accountCode === '1301')?.currentBalance || 0;
  const inputSgst = accounts.find((a) => a.accountCode === '1302')?.currentBalance || 0;
  const inputIgst = accounts.find((a) => a.accountCode === '1303')?.currentBalance || 0;
  const totalInputGst = round2(inputCgst + inputSgst + inputIgst);

  // Net GST Payable
  const netCgst = Math.max(0, round2(outputCgst - inputCgst));
  const netSgst = Math.max(0, round2(outputSgst - inputSgst));
  const netIgst = Math.max(0, round2(outputIgst - inputIgst));
  const totalNetGstPayable = round2(netCgst + netSgst + netIgst);

  // TDS
  const tdsReceivable = accounts.find((a) => a.accountCode === '1401')?.currentBalance || 0;
  const tdsPayable = accounts.find((a) => a.accountCode === '2401')?.currentBalance || 0;

  return (
    <div className="space-y-6">
      {/* Tab Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[
            { id: 'summary', label: 'GST Liability & Set-Off (GSTR-3B)' },
            { id: 'sales', label: 'Output GST (Client Sales)' },
            { id: 'purchases', label: 'Input Tax Credit (Purchases)' },
            { id: 'tds', label: 'TDS Registers (Sec 194C)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
          State Jurisdiction: 06 (Haryana)
        </span>
      </div>

      {/* 1. GST SUMMARY & SET-OFF */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400">Total Output GST Collected</span>
              <div className="mt-1 text-2xl font-black text-rose-700">{formatINR(totalOutputGst)}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">From Security & Janitorial service invoices</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400">Total Input Tax Credit (ITC)</span>
              <div className="mt-1 text-2xl font-black text-emerald-700">{formatINR(totalInputGst)}</div>
              <p className="text-[10px] text-emerald-600 mt-0.5">Paid on guard uniforms, chemicals & leases</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400">Net GST Cash Liability</span>
              <div className="mt-1 text-2xl font-black text-blue-700">{formatINR(totalNetGstPayable)}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Payable via PMT-06 electronic cash ledger</p>
            </div>
          </div>

          {/* GSTR-3B Computation Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">GSTR-3B Tax Set-Off Summary</h3>
                <p className="text-xs text-slate-500">Utilization of Input Tax Credit against Output Tax liability</p>
              </div>
              <span className="font-mono text-xs font-bold text-slate-700">Period: November 2026</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Tax Head</th>
                    <th className="py-2.5 px-3 text-right">Output Tax Liability (₹)</th>
                    <th className="py-2.5 px-3 text-right">Eligible ITC Set-Off (₹)</th>
                    <th className="py-2.5 px-3 text-right">Net Tax Payable in Cash (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-800">Central GST (CGST - 9%)</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">{formatINR(outputCgst)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700">{formatINR(inputCgst)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-blue-700">{formatINR(netCgst)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-800">State GST (SGST - 9%)</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">{formatINR(outputSgst)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700">{formatINR(inputSgst)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-blue-700">{formatINR(netSgst)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-800">Integrated GST (IGST - 18%)</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">{formatINR(outputIgst)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700">{formatINR(inputIgst)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-blue-700">{formatINR(netIgst)}</td>
                  </tr>
                  <tr className="bg-slate-100 font-black border-t-2 border-slate-300">
                    <td className="py-2.5 px-3 text-slate-900 uppercase">Total Consolidated Dues</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatINR(totalOutputGst)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-800">{formatINR(totalInputGst)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-900">{formatINR(totalNetGstPayable)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. TDS SECTION */}
      {activeTab === 'tds' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Tax Deducted at Source (TDS - Section 194C)</h3>
              <p className="text-xs text-slate-500">Statutory withholding on manpower contracts and professional payments</p>
            </div>
            <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
              FY 2026-27
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">TDS Receivable (Asset Account 1401)</span>
              <div className="text-2xl font-black text-emerald-700">{formatINR(tdsReceivable)}</div>
              <p className="text-xs text-slate-600">
                TDS withheld by corporate clients (2% under Sec 194C) upon invoice settlement. Can be claimed in annual Income Tax Return (ITR-6) against advance tax liability.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">TDS Payable (Liability Account 2401)</span>
              <div className="text-2xl font-black text-rose-700">{formatINR(tdsPayable)}</div>
              <p className="text-xs text-slate-600">
                TDS withheld from uniform fabricators, security equipment suppliers, and CA professional fees. Deposited via Challan 281 by 7th of subsequent month.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
