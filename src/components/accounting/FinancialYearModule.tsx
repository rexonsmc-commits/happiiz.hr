/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinancialYearConfig } from '../../types';
import {
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Building2,
} from 'lucide-react';

interface FinancialYearModuleProps {
  financialYears: FinancialYearConfig[];
  currentUser: { name: string; role?: string };
}

export const FinancialYearModule: React.FC<FinancialYearModuleProps> = ({
  financialYears,
  currentUser,
}) => {
  const currentFY = financialYears[0];
  const [periods, setPeriods] = useState(currentFY?.periods || []);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const togglePeriodLock = (periodKey: string) => {
    const updated = periods.map((p) => {
      if (p.periodKey === periodKey) {
        const nextState = !p.isLocked;
        setActionMessage(
          `Period ${p.monthName} has been ${nextState ? 'LOCKED (Posting Disabled)' : 'UNLOCKED (Posting Enabled)'}.`
        );
        setTimeout(() => setActionMessage(null), 4000);
        return {
          ...p,
          isLocked: nextState,
          lockedAt: nextState ? new Date().toISOString() : undefined,
          lockedBy: nextState ? currentUser.name : undefined,
        };
      }
      return p;
    });
    setPeriods(updated);
  };

  return (
    <div className="space-y-6">
      {/* FY Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {currentFY?.label || 'FY 2026-27'}
            </span>
            <span className="text-xs font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Current Operating Year
            </span>
          </div>
          <h2 className="text-lg font-black text-slate-900 mt-1">Financial Year & Period Control</h2>
          <p className="text-xs text-slate-500">
            Indian Financial Cycle: 1 April 2026 to 31 March 2027. Lock closed periods to prevent unauthorized ledger modifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Cycle Start</span>
            <div className="text-xs font-mono font-bold text-slate-800">{currentFY?.startDate}</div>
          </div>
          <div className="text-right border-l border-slate-200 pl-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Cycle End</span>
            <div className="text-xs font-mono font-bold text-slate-800">{currentFY?.endDate}</div>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          {actionMessage}
        </div>
      )}

      {/* 12-Month Period Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900">Monthly Accounting Periods</h3>
            <p className="text-xs text-slate-500">
              Closed historical periods are locked against backdated journal insertions
            </p>
          </div>
          <span className="text-xs text-slate-400">
            {periods.filter((p) => p.isLocked).length} Locked • {periods.filter((p) => !p.isLocked).length} Open
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {periods.map((p) => (
            <div
              key={p.periodKey}
              className={`p-3.5 rounded-xl border transition-all ${
                p.isLocked ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white border-blue-200 shadow-xs ring-1 ring-blue-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">{p.monthName}</span>
                <button
                  onClick={() => togglePeriodLock(p.periodKey)}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    p.isLocked
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                  title={p.isLocked ? 'Click to Unlock' : 'Click to Lock'}
                >
                  {p.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="mt-2 text-[10px] font-mono text-slate-400">
                {p.startDate} to {p.endDate}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className={`font-bold uppercase ${p.isLocked ? 'text-slate-500' : 'text-emerald-700'}`}>
                  {p.isLocked ? 'Locked' : 'Active (Open)'}
                </span>
                <span className="text-slate-400">{p.lockedBy || 'Current'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
