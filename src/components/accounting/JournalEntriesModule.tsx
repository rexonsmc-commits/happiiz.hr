/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { JournalEntry, ChartOfAccount, JournalLine } from '../../types';
import { formatINR, round2 } from '../../services/payrollService';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Eye,
  FileText,
  Calendar,
  Layers,
  Scale,
  Trash2,
  ArrowRight,
} from 'lucide-react';

interface JournalEntriesModuleProps {
  journals: JournalEntry[];
  accounts: ChartOfAccount[];
  currentUser: { name: string; role?: string };
  onPostJournal: (params: {
    financialYear: string;
    financialPeriod: string;
    accountingDate: string;
    narration: string;
    referenceType: any;
    referenceId?: string;
    lines: { accountId: string; debit: number; credit: number; lineNarration?: string }[];
  }) => Promise<void>;
  onReverseJournal: (journalId: string, reason: string) => Promise<void>;
}

export const JournalEntriesModule: React.FC<JournalEntriesModuleProps> = ({
  journals,
  accounts,
  currentUser,
  onPostJournal,
  onReverseJournal,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [reversalTarget, setReversalTarget] = useState<JournalEntry | null>(null);
  const [reversalReason, setReversalReason] = useState<string>('');

  // New Journal Entry Form State
  const [newJournalHeader, setNewJournalHeader] = useState({
    accountingDate: new Date().toISOString().split('T')[0],
    financialYear: '2026-2027',
    financialPeriod: '2026-11',
    narration: '',
  });

  const [entryLines, setEntryLines] = useState<
    { accountId: string; debit: number; credit: number; lineNarration: string }[]
  >([
    { accountId: accounts[0]?.id || '', debit: 0, credit: 0, lineNarration: '' },
    { accountId: accounts[1]?.id || '', debit: 0, credit: 0, lineNarration: '' },
  ]);

  const totalDebit = round2(entryLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0));
  const totalCredit = round2(entryLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0));
  const difference = round2(Math.abs(totalDebit - totalCredit));
  const isBalanced = totalDebit > 0 && totalCredit > 0 && difference < 0.01;

  const filteredJournals = journals.filter((j) => {
    if (filterType !== 'all' && j.status !== filterType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        j.journalNumber.toLowerCase().includes(q) ||
        j.narration.toLowerCase().includes(q) ||
        j.referenceType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddLine = () => {
    setEntryLines([
      ...entryLines,
      { accountId: accounts[0]?.id || '', debit: 0, credit: 0, lineNarration: '' },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    if (entryLines.length <= 2) return;
    setEntryLines(entryLines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: string, val: any) => {
    const updated = [...entryLines];
    (updated[idx] as any)[field] = val;
    setEntryLines(updated);
  };

  const handleSubmitNewJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced || !newJournalHeader.narration) return;

    await onPostJournal({
      financialYear: newJournalHeader.financialYear,
      financialPeriod: newJournalHeader.financialPeriod,
      accountingDate: newJournalHeader.accountingDate,
      narration: newJournalHeader.narration,
      referenceType: 'manual_journal',
      lines: entryLines.map((l) => ({
        accountId: l.accountId,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        lineNarration: l.lineNarration || newJournalHeader.narration,
      })),
    });

    setShowNewModal(false);
    setNewJournalHeader({
      accountingDate: new Date().toISOString().split('T')[0],
      financialYear: '2026-2027',
      financialPeriod: '2026-11',
      narration: '',
    });
    setEntryLines([
      { accountId: accounts[0]?.id || '', debit: 0, credit: 0, lineNarration: '' },
      { accountId: accounts[1]?.id || '', debit: 0, credit: 0, lineNarration: '' },
    ]);
  };

  const handleExecuteReversal = async () => {
    if (!reversalTarget || !reversalReason.trim()) return;
    await onReverseJournal(reversalTarget.id, reversalReason.trim());
    setReversalTarget(null);
    setReversalReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'posted', 'reversed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterType(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                filterType === st ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Journals' : `${st} Only`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search journal # or narration..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-60 focus:outline-blue-600 bg-slate-50 focus:bg-white"
            />
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New Manual Journal
          </button>
        </div>
      </div>

      {/* Journals Master Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Journal Number</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Origin Module</th>
                <th className="py-3 px-4">Narration</th>
                <th className="py-3 px-4 text-right">Debit (INR)</th>
                <th className="py-3 px-4 text-right">Credit (INR)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJournals.map((j) => (
                <tr key={j.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">{j.journalNumber}</td>
                  <td className="py-3 px-4 text-slate-600">{j.accountingDate}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {j.referenceType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-800 max-w-sm truncate">{j.narration}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{formatINR(j.totalDebit)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">{formatINR(j.totalCredit)}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        j.status === 'posted'
                          ? 'bg-emerald-50 text-emerald-700'
                          : j.status === 'reversed'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {j.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => setSelectedJournal(j)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      View Lines
                    </button>
                    {j.status === 'posted' && !j.isReversed && (
                      <button
                        onClick={() => setReversalTarget(j)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition-colors cursor-pointer"
                        title="Post Reversal Counter-Entry"
                      >
                        Reverse
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Journal Lines Modal */}
      {selectedJournal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {selectedJournal.journalNumber}
                  </span>
                  <span className="text-xs font-bold uppercase text-slate-500">
                    {selectedJournal.financialPeriod}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 mt-1">Double-Entry Journal Breakdown</h3>
                <p className="text-xs text-slate-500">{selectedJournal.narration}</p>
              </div>
              <button
                onClick={() => setSelectedJournal(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Account Name</th>
                    <th className="py-2.5 px-3">Line Narration</th>
                    <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                    <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {selectedJournal.lines.map((l) => (
                    <tr key={l.id}>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{l.accountCode}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{l.accountName}</td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">{l.lineNarration || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {l.debit > 0 ? formatINR(l.debit) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700">
                        {l.credit > 0 ? formatINR(l.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-black text-xs border-t-2 border-slate-200">
                    <td colSpan={3} className="py-2.5 px-3 text-slate-700 text-right">
                      Total Balanced Sum:
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-mono">
                      {formatINR(selectedJournal.totalDebit)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-blue-700 font-mono">
                      {formatINR(selectedJournal.totalCredit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Posted By: <strong className="text-slate-800">{selectedJournal.createdBy}</strong></span>
              <span>Posted At: {new Date(selectedJournal.createdAt).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Manual Double-Entry Journal Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Post Manual Double-Entry Journal</h3>
                <p className="text-xs text-slate-500">
                  Enforces mathematical equality: Total Debit must equal Total Credit before posting.
                </p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitNewJournal} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Accounting Date</label>
                  <input
                    type="date"
                    required
                    value={newJournalHeader.accountingDate}
                    onChange={(e) => setNewJournalHeader({ ...newJournalHeader, accountingDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Financial Period</label>
                  <input
                    type="text"
                    value={newJournalHeader.financialPeriod}
                    onChange={(e) => setNewJournalHeader({ ...newJournalHeader, financialPeriod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Financial Year</label>
                  <input
                    type="text"
                    disabled
                    value={newJournalHeader.financialYear}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Journal Narration / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adjustment for field guard kits damage recovery"
                  value={newJournalHeader.narration}
                  onChange={(e) => setNewJournalHeader({ ...newJournalHeader, narration: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              {/* Multi-line Entry Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden space-y-2 p-3 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900">Journal Legs (Minimum 2 Accounts)</h4>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Leg
                  </button>
                </div>

                <div className="space-y-2">
                  {entryLines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-xl border border-slate-200">
                      <div className="col-span-5">
                        <select
                          value={line.accountId}
                          onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                        >
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.accountCode} - {a.accountName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Debit (₹)"
                          value={line.debit || ''}
                          onChange={(e) => {
                            handleLineChange(idx, 'debit', e.target.value);
                            if (Number(e.target.value) > 0) handleLineChange(idx, 'credit', 0);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-right"
                        />
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Credit (₹)"
                          value={line.credit || ''}
                          onChange={(e) => {
                            handleLineChange(idx, 'credit', e.target.value);
                            if (Number(e.target.value) > 0) handleLineChange(idx, 'debit', 0);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-right"
                        />
                      </div>

                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          disabled={entryLines.length <= 2}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Double-Entry Balancing Verification Strip */}
                <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Total Debit: </span>
                    <strong className="text-emerald-700 font-mono">{formatINR(totalDebit)}</strong>
                    <span className="text-slate-500 ml-4">Total Credit: </span>
                    <strong className="text-blue-700 font-mono">{formatINR(totalCredit)}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {isBalanced ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Balanced Journal
                      </span>
                    ) : (
                      <span className="text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> Difference: {formatINR(difference)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isBalanced || !newJournalHeader.narration}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
                >
                  Post Journal Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Journal Reversal Confirmation Modal */}
      {reversalTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Reverse Journal Entry</h3>
                <p className="text-xs text-slate-500">Posting an immutable counter-balancing journal</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div>Target Journal: <strong className="font-mono text-blue-700">{reversalTarget.journalNumber}</strong></div>
              <div>Amount: <strong className="font-mono text-slate-900">{formatINR(reversalTarget.totalDebit)}</strong></div>
              <div className="text-slate-500 italic">"{reversalTarget.narration}"</div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Reason for Reversal *</label>
              <textarea
                rows={2}
                required
                placeholder="State statutory audit reason, billing cancellation or correction..."
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-blue-600"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setReversalTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reversalReason.trim()}
                onClick={handleExecuteReversal}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-xs font-bold cursor-pointer transition-all"
              >
                Confirm Reversal Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
