/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Flag,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  CompanyHoliday,
  WeeklyOffPolicy,
  ClientSite,
} from '../../types';
import {
  getCompanyHolidays,
  saveCompanyHoliday,
  getWeeklyOffPolicies,
  saveWeeklyOffPolicy,
} from '../../services/attendanceService';

interface HolidaysWeeklyOffModuleProps {
  companyId: string;
  tenantId: string;
  sites: ClientSite[];
}

export const HolidaysWeeklyOffModule: React.FC<HolidaysWeeklyOffModuleProps> = ({
  companyId,
  tenantId,
  sites,
}) => {
  const [activeTab, setActiveTab] = useState<'holidays' | 'weekly_off'>('holidays');
  const [holidays, setHolidays] = useState<CompanyHoliday[]>([]);
  const [policies, setPolicies] = useState<WeeklyOffPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  // New Holiday Form Modal
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState(new Date().toISOString().split('T')[0]);
  const [holidayType, setHolidayType] = useState<CompanyHoliday['holidayType']>('national');
  const [isMandatory, setIsMandatory] = useState(true);
  const [description, setDescription] = useState('');

  // Weekly Off Form Modal
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [policyName, setPolicyName] = useState('');
  const [policyType, setPolicyType] = useState<WeeklyOffPolicy['policyType']>('site_specific');
  const [selectedDays, setSelectedDays] = useState<number[]>([0]); // Default Sunday

  const loadData = async () => {
    setLoading(true);
    try {
      const [hList, pList] = await Promise.all([
        getCompanyHolidays(companyId, tenantId),
        getWeeklyOffPolicies(companyId, tenantId),
      ]);
      setHolidays(hList);
      setPolicies(pList);
    } catch (err) {
      console.error('Failed to load holidays:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  const handleSaveHoliday = async () => {
    if (!holidayName || !holidayDate) {
      alert('Please provide holiday name and date.');
      return;
    }

    const newHol: CompanyHoliday = {
      id: `hol_${companyId}_${Date.now()}`,
      tenantId,
      companyId,
      holidayName,
      holidayDate,
      holidayType,
      isMandatory,
      status: 'active',
      description,
      createdAt: new Date().toISOString(),
    };

    await saveCompanyHoliday(companyId, newHol);
    setIsHolidayModalOpen(false);
    setHolidayName('');
    setDescription('');
    await loadData();
  };

  const handleSavePolicy = async () => {
    if (!policyName || selectedDays.length === 0) {
      alert('Please provide policy name and select at least one day.');
      return;
    }

    const newPolicy: WeeklyOffPolicy = {
      id: `wo_${companyId}_${Date.now()}`,
      tenantId,
      companyId,
      policyName,
      policyType,
      daysOfWeek: selectedDays,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    await saveWeeklyOffPolicy(companyId, newPolicy);
    setIsPolicyModalOpen(false);
    setPolicyName('');
    await loadData();
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Compliance Calendar
            </span>
            <span className="text-xs font-bold uppercase text-slate-500">
              Shifts & Rest Policy
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Weekly Off & Holiday Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            National gazetted holidays, state festivals, and rotational 24x7 weekly off rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('holidays')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'holidays'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Holidays Calendar ({holidays.length})
            </button>
            <button
              onClick={() => setActiveTab('weekly_off')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'weekly_off'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekly Off Rules ({policies.length})
            </button>
          </div>

          {activeTab === 'holidays' ? (
            <button
              onClick={() => setIsHolidayModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Holiday</span>
            </button>
          ) : (
            <button
              onClick={() => setIsPolicyModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Weekly Off Policy</span>
            </button>
          )}
        </div>
      </div>

      {/* Holidays Tab */}
      {activeTab === 'holidays' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {holidays.map((h) => (
            <div
              key={h.id}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 hover:border-emerald-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      h.holidayType === 'national'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : h.holidayType === 'state'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {h.holidayType} Holiday
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-1">{h.holidayName}</h3>
                </div>
                <div className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
                  {h.holidayDate}
                </div>
              </div>

              {h.description && (
                <p className="text-xs text-slate-500 leading-relaxed">{h.description}</p>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>{h.isMandatory ? 'Gazetted / Mandatory' : 'Optional / Discretionary'}</span>
                <span className="text-emerald-600 font-bold">Active</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Weekly Off Tab */}
      {activeTab === 'weekly_off' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {policies.map((p) => (
            <div
              key={p.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded uppercase">
                    {p.policyType.replace(/_/g, ' ')}
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1.5">{p.policyName}</h3>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Enforced
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1.5">
                  Designated Off Days
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {dayNames.map((day, idx) => {
                    const isSelected = p.daysOfWeek.includes(idx);
                    return (
                      <span
                        key={idx}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="text-[11px] text-slate-400">
                Guards deployed on scheduled weekly off days are automatically prompted for Double Duty or Overtime approval.
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Holiday Modal */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-base font-extrabold">Add Official Holiday</h2>
              <button
                onClick={() => setIsHolidayModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Holiday Name</label>
                <input
                  type="text"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  placeholder="e.g. Gandhi Jayanti"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Holiday Date</label>
                  <input
                    type="date"
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
                  <select
                    value={holidayType}
                    onChange={(e) => setHolidayType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="national">National Holiday</option>
                    <option value="state">State Holiday</option>
                    <option value="company">Company Holiday</option>
                    <option value="site_specific">Site-Specific Holiday</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details or double wage eligibility instructions..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={isMandatory}
                  onChange={(e) => setIsMandatory(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>Mandatory / Gazetted (Compensatory Off applies if worked)</span>
              </label>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsHolidayModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveHoliday}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs"
              >
                Save Holiday
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Weekly Off Modal */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-base font-extrabold">Configure Weekly Off Policy</h2>
              <button
                onClick={() => setIsPolicyModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Policy Title</label>
                <input
                  type="text"
                  value={policyName}
                  onChange={(e) => setPolicyName(e.target.value)}
                  placeholder="e.g. Corporate 5-Day Week (Sat-Sun Off)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Days of Week
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {dayNames.map((day, idx) => {
                    const isChecked = selectedDays.includes(idx);
                    return (
                      <label
                        key={idx}
                        className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer text-xs ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDays([...selectedDays, idx]);
                            } else {
                              setSelectedDays(selectedDays.filter((d) => d !== idx));
                            }
                          }}
                          className="rounded text-emerald-600"
                        />
                        <span>{day}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPolicyModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePolicy}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs"
              >
                Save Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
