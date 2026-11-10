/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  SalaryStructure,
  SalaryRevision,
  Employee,
  SalaryType,
} from '../../types';
import {
  formatINR,
  round2,
  saveSalaryStructure,
  createSalaryRevision,
} from '../../services/payrollService';
import {
  Search,
  Filter,
  Plus,
  Edit3,
  TrendingUp,
  History,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Briefcase,
  DollarSign,
  User,
  X,
  ArrowUpRight,
} from 'lucide-react';

interface SalaryStructureModuleProps {
  companyId: string;
  tenantId: string;
  structures: SalaryStructure[];
  revisions: SalaryRevision[];
  employees: Employee[];
  onRefresh: () => void;
}

export const SalaryStructureModule: React.FC<SalaryStructureModuleProps> = ({
  companyId,
  tenantId,
  structures,
  revisions,
  employees,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [editingStructure, setEditingStructure] = useState<SalaryStructure | null>(null);
  const [revisionStructure, setRevisionStructure] = useState<SalaryStructure | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [selectedEmpHistory, setSelectedEmpHistory] = useState<string | null>(null);

  // Form states for Editing Structure
  const [editForm, setEditForm] = useState<Partial<SalaryStructure>>({});

  // Form states for Salary Revision
  const [newGross, setNewGross] = useState<number>(0);
  const [revisionDate, setRevisionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [revisionReason, setRevisionReason] = useState<string>('Annual Performance Appraisal');
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const filteredStructures = structures.filter((s) => {
    const matchesSearch =
      s.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || s.salaryType === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalMonthlyBase = structures
    .filter((s) => s.status === 'active' && s.salaryType === 'monthly')
    .reduce((sum, s) => sum + s.monthlyGrossSalary, 0);

  const pfEnrolledCount = structures.filter((s) => s.pfApplicable).length;
  const esiEnrolledCount = structures.filter((s) => s.esiApplicable).length;
  const dailyWageCount = structures.filter((s) => s.salaryType === 'daily').length;

  const handleOpenEdit = (struct: SalaryStructure) => {
    setEditingStructure(struct);
    setEditForm({ ...struct });
  };

  const handleSaveEdit = async () => {
    if (!editingStructure || !editForm) return;
    setIsSaving(true);
    try {
      const basic = Number(editForm.basicSalary) || 0;
      const hra = Number(editForm.hra) || 0;
      const conv = Number(editForm.conveyanceAllowance) || 0;
      const spl = Number(editForm.specialAllowance) || 0;
      const other = Number(editForm.otherAllowances) || 0;
      const monthlyGross =
        editForm.salaryType === 'daily'
          ? (Number(editForm.dailyWageRate) || 0) * 26
          : basic + hra + conv + spl + other;

      const updated: SalaryStructure = {
        ...editingStructure,
        ...editForm,
        basicSalary: basic,
        hra,
        conveyanceAllowance: conv,
        specialAllowance: spl,
        otherAllowances: other,
        monthlyGrossSalary: round2(monthlyGross),
        dailyWageRate: Number(editForm.dailyWageRate) || 0,
        overtimeHourlyRate: Number(editForm.overtimeHourlyRate) || 160,
        doubleDutyShiftRate: Number(editForm.doubleDutyShiftRate) || 850,
      } as SalaryStructure;

      await saveSalaryStructure(companyId, updated);
      setEditingStructure(null);
      setNotification(`Salary structure for ${updated.employeeName} updated successfully.`);
      setTimeout(() => setNotification(null), 3500);
      onRefresh();
    } catch {
      alert('Failed to update salary structure.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenRevision = (struct: SalaryStructure) => {
    setRevisionStructure(struct);
    setNewGross(Math.round(struct.monthlyGrossSalary * 1.1)); // default 10% increment
    setRevisionDate(new Date().toISOString().split('T')[0]);
    setRevisionReason('Annual Performance Appraisal');
  };

  const handleApplyRevision = async () => {
    if (!revisionStructure) return;
    setIsSaving(true);
    try {
      const previousGross = revisionStructure.monthlyGrossSalary;
      const incrementAmount = round2(newGross - previousGross);
      const incrementPercent = round2((incrementAmount / previousGross) * 100);

      const basic = round2(newGross * 0.5);
      const hra = round2(newGross * 0.25);
      const conv = round2(newGross * 0.1);
      const spl = round2(newGross * 0.1);
      const other = round2(newGross - (basic + hra + conv + spl));

      const updatedStructure: SalaryStructure = {
        ...revisionStructure,
        basicSalary: basic,
        hra,
        conveyanceAllowance: conv,
        specialAllowance: spl,
        otherAllowances: other,
        monthlyGrossSalary: newGross,
        hourlyRate: round2(newGross / 208),
        shiftRate: round2(newGross / 26),
        effectiveFrom: revisionDate,
        updatedAt: new Date().toISOString(),
      };

      const revision: SalaryRevision = {
        id: `rev_${revisionStructure.employeeId}_${Date.now()}`,
        tenantId,
        companyId,
        employeeId: revisionStructure.employeeId,
        employeeName: revisionStructure.employeeName,
        previousStructureId: revisionStructure.id,
        newStructureId: revisionStructure.id,
        effectiveDate: revisionDate,
        previousGross,
        newGross,
        incrementAmount,
        incrementPercent,
        reason: revisionReason,
        approvedBy: 'Company Administration',
        createdAt: new Date().toISOString(),
      };

      await createSalaryRevision(companyId, revision, updatedStructure);
      setRevisionStructure(null);
      setNotification(
        `Increment of ${incrementPercent}% applied for ${revisionStructure.employeeName}.`
      );
      setTimeout(() => setNotification(null), 3500);
      onRefresh();
    } catch {
      alert('Failed to apply salary revision.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Monthly Payroll Base
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatINR(totalMonthlyBase)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Across all monthly employees</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              PF (EPF) Coverage
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {pfEnrolledCount} <span className="text-sm font-normal text-slate-500">/ {structures.length}</span>
          </div>
          <p className="text-xs text-emerald-600 mt-1 font-medium">12% EPF statutory deduction</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              ESIC Coverage
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {esiEnrolledCount} <span className="text-sm font-normal text-slate-500">Employees</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Gross ≤ ₹21,000 ceiling</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Daily & Shift Wage Staff
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {dailyWageCount} <span className="text-sm font-normal text-slate-500">Guards/Staff</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Calculated per day worked</p>
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex flex-1 items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by employee, code, or designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">All Wage Types</option>
              <option value="monthly">Monthly Salary</option>
              <option value="daily">Daily Wage</option>
              <option value="hourly">Hourly Rate</option>
              <option value="shift">Shift Wage</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowHistoryModal(true)}
          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-colors w-full sm:w-auto justify-center"
        >
          <History className="w-4 h-4 text-slate-500" />
          <span>Revision History ({revisions.length})</span>
        </button>
      </div>

      {/* Structure Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Wage Model</th>
                <th className="py-3 px-4">Basic Wage</th>
                <th className="py-3 px-4">Monthly Gross</th>
                <th className="py-3 px-4">OT Rate (1h)</th>
                <th className="py-3 px-4">Double Duty</th>
                <th className="py-3 px-4">Statutory Coverage</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredStructures.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No salary structures match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredStructures.map((struct) => (
                  <tr key={struct.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{struct.employeeName}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        {struct.employeeCode} • {struct.designation}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-slate-100 text-slate-700">
                        {struct.salaryType}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {struct.salaryType === 'daily'
                        ? `${formatINR(struct.dailyWageRate)}/day`
                        : formatINR(struct.basicSalary)}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {formatINR(struct.monthlyGrossSalary)}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700">
                      ₹{struct.overtimeHourlyRate}/hr
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700">
                      ₹{struct.doubleDutyShiftRate}/shift
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5 text-xs">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            struct.pfApplicable
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-400 line-through'
                          }`}
                        >
                          PF
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            struct.esiApplicable
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-400 line-through'
                          }`}
                        >
                          ESIC
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            struct.ptApplicable
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-400 line-through'
                          }`}
                        >
                          PT
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenRevision(struct)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                          title="Apply Salary Increment / Revision"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Increment</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(struct)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Structure Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Structure Modal */}
      {editingStructure && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 animate-fadeIn">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Salary Structure</h3>
                <p className="text-xs text-slate-500">
                  {editingStructure.employeeName} ({editingStructure.employeeCode})
                </p>
              </div>
              <button
                onClick={() => setEditingStructure(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Salary Type</label>
                <select
                  value={editForm.salaryType}
                  onChange={(e) => setEditForm({ ...editForm, salaryType: e.target.value as SalaryType })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="monthly">Monthly Fixed</option>
                  <option value="daily">Daily Wage</option>
                  <option value="hourly">Hourly Rate</option>
                  <option value="shift">Per Shift</option>
                </select>
              </div>

              {editForm.salaryType === 'daily' ? (
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Daily Wage Rate (₹)</label>
                  <input
                    type="number"
                    value={editForm.dailyWageRate || 0}
                    onChange={(e) => setEditForm({ ...editForm, dailyWageRate: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Basic Salary (₹)</label>
                  <input
                    type="number"
                    value={editForm.basicSalary || 0}
                    onChange={(e) => setEditForm({ ...editForm, basicSalary: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">HRA (₹)</label>
                <input
                  type="number"
                  value={editForm.hra || 0}
                  onChange={(e) => setEditForm({ ...editForm, hra: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Conveyance Allowance (₹)</label>
                <input
                  type="number"
                  value={editForm.conveyanceAllowance || 0}
                  onChange={(e) =>
                    setEditForm({ ...editForm, conveyanceAllowance: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Special / Other Allowances (₹)</label>
                <input
                  type="number"
                  value={editForm.specialAllowance || 0}
                  onChange={(e) =>
                    setEditForm({ ...editForm, specialAllowance: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Overtime Hourly Rate (₹/hr)</label>
                <input
                  type="number"
                  value={editForm.overtimeHourlyRate || 160}
                  onChange={(e) =>
                    setEditForm({ ...editForm, overtimeHourlyRate: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Double Duty Shift Rate (₹/shift)</label>
                <input
                  type="number"
                  value={editForm.doubleDutyShiftRate || 850}
                  onChange={(e) =>
                    setEditForm({ ...editForm, doubleDutyShiftRate: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              {/* Statutory Checkboxes */}
              <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                <label className="text-xs font-bold text-slate-600 block mb-2">Statutory Applicability</label>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.pfApplicable || false}
                      onChange={(e) => setEditForm({ ...editForm, pfApplicable: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-700">Provident Fund (12%)</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.esiApplicable || false}
                      onChange={(e) => setEditForm({ ...editForm, esiApplicable: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-700">ESIC (0.75%)</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.ptApplicable || false}
                      onChange={(e) => setEditForm({ ...editForm, ptApplicable: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-700">Professional Tax (PT)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setEditingStructure(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Structure'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Salary Revision / Increment Modal */}
      {revisionStructure && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-fadeIn">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span>Salary Increment Revision</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {revisionStructure.employeeName} ({revisionStructure.employeeCode})
                </p>
              </div>
              <button
                onClick={() => setRevisionStructure(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-6">
              {/* Current Gross vs New Gross card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                    Current Monthly Gross
                  </span>
                  <span className="text-lg font-bold font-mono text-slate-700">
                    {formatINR(revisionStructure.monthlyGrossSalary)}
                  </span>
                </div>
                <ArrowUpRight className="w-6 h-6 text-emerald-500" />
                <div className="text-right">
                  <span className="text-[11px] uppercase tracking-wider text-emerald-600 font-bold block">
                    New Proposed Gross
                  </span>
                  <span className="text-xl font-black font-mono text-emerald-700">
                    {formatINR(newGross)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  New Monthly Gross Salary (₹)
                </label>
                <input
                  type="number"
                  value={newGross}
                  onChange={(e) => setNewGross(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Increment stats */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100">
                  <span className="text-slate-500 block">Increment Amount</span>
                  <span className="font-bold text-emerald-800 font-mono">
                    +{formatINR(Math.max(0, newGross - revisionStructure.monthlyGrossSalary))}
                  </span>
                </div>
                <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100">
                  <span className="text-slate-500 block">Percentage Hike</span>
                  <span className="font-bold text-blue-800 font-mono">
                    {(
                      ((newGross - revisionStructure.monthlyGrossSalary) /
                        revisionStructure.monthlyGrossSalary) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Effective Date</label>
                <input
                  type="date"
                  value={revisionDate}
                  onChange={(e) => setRevisionDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Reason for Revision / Notes
                </label>
                <textarea
                  rows={2}
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  placeholder="e.g. Annual Appraisal, Promotion to Senior Supervisor, Client Site Rate Revision..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setRevisionStructure(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyRevision}
                disabled={isSaving || newGross <= revisionStructure.monthlyGrossSalary}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                {isSaving ? 'Processing...' : 'Approve & Apply Revision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 animate-fadeIn max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <History className="w-5 h-5 text-blue-600" />
                  <span>Salary Revision Audit History</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Immutable record of increments, promotions and structure changes
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 py-4">
              {revisions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No salary revisions have been recorded yet.
                </div>
              ) : (
                revisions.map((rev) => (
                  <div key={rev.id} className="py-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{rev.employeeName}</span>
                        <span className="text-xs text-slate-500 ml-2">
                          Effective: {rev.effectiveDate}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono font-bold text-xs">
                        +{rev.incrementPercent}% (+{formatINR(rev.incrementAmount)})
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-xs font-mono text-slate-600">
                      <span>Previous: {formatINR(rev.previousGross)}</span>
                      <span>→</span>
                      <span className="font-bold text-slate-900">New: {formatINR(rev.newGross)}</span>
                    </div>

                    <p className="text-xs text-slate-600 italic">"{rev.reason}"</p>
                    <div className="text-[11px] text-slate-400">
                      Approved by {rev.approvedBy} on {new Date(rev.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 text-right">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
