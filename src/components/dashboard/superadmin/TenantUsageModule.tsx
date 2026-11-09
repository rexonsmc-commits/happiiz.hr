/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Layers,
  HardDrive,
  Users,
  Activity,
  MapPin,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Settings,
  ArrowUpRight,
  Search,
  X,
  ShieldAlert,
} from 'lucide-react';
import { Company, CompanyUsage } from '../../../types';
import { getCompanyUsageStats } from '../../../services/platformService';
import { updateCompanyProfile } from '../../../services/tenantService';

interface TenantUsageModuleProps {
  companies: Company[];
  onRefresh: () => void;
  onSwitchToCompany: (company: Company) => void;
  adminEmail: string;
}

export const TenantUsageModule: React.FC<TenantUsageModuleProps> = ({
  companies,
  onRefresh,
  onSwitchToCompany,
  adminEmail,
}) => {
  const [usageStats, setUsageStats] = useState<CompanyUsage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenantLimits, setSelectedTenantLimits] = useState<Company | null>(null);
  const [newMaxEmployees, setNewMaxEmployees] = useState<number>(100);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function loadStats() {
      const stats = await getCompanyUsageStats();
      setUsageStats(stats);
    }
    loadStats();
  }, [companies]);

  const filtered = usageStats.filter(
    (u) =>
      u.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.tenantId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveLimits = async () => {
    if (!selectedTenantLimits) return;
    setIsUpdating(true);
    try {
      await updateCompanyProfile(
        selectedTenantLimits.id,
        { maxEmployees: newMaxEmployees },
        adminEmail
      );
      setSelectedTenantLimits(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Tenant Isolation & Resource Usage</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
              Per-Tenant Limits
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Real-time monitoring of workforce capacity, storage quotas, API volume, deployed sites, and attendance record consumption across tenants.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tenant or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 w-64"
          />
        </div>
      </div>

      {/* Tenant Usage Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((stat) => {
          const comp = companies.find((c) => c.id === stat.companyId);
          const isNearCapacity = stat.usagePercent >= 80;

          return (
            <div
              key={stat.companyId}
              className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                isNearCapacity ? 'border-amber-300 bg-amber-50/10' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold">
                      {stat.tenantId}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-sm mt-1 leading-snug truncate max-w-[220px]">
                      {stat.companyName}
                    </h4>
                  </div>

                  {isNearCapacity ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold flex items-center gap-1 shrink-0">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      {stat.usagePercent}% Cap
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Optimal
                    </span>
                  )}
                </div>

                {/* Progress bar: Workforce capacity */}
                <div className="my-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-semibold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-600" /> Workforce Limit
                    </span>
                    <span className="font-mono text-slate-800 font-bold">
                      {stat.activeEmployees} / {stat.maxEmployees} ({stat.usagePercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${stat.usagePercent}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        stat.usagePercent > 90
                          ? 'bg-rose-500'
                          : stat.usagePercent > 75
                          ? 'bg-amber-500'
                          : 'bg-blue-600'
                      }`}
                    />
                  </div>
                  {isNearCapacity && (
                    <div className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Approaching plan capacity limit. Recommend tier upgrade.
                    </div>
                  )}
                </div>

                {/* Detailed Resource Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Cloud Storage</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {stat.storageUsedMb} MB <span className="text-slate-400 font-normal">/ {stat.storageLimitMb} MB</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">API Calls (Mo)</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {stat.monthlyApiCalls.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Deployed Sites</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {stat.siteCount} Locations
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Monthly Attendance</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {stat.monthlyAttendanceRecords.toLocaleString()} Logs
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (comp) {
                      setSelectedTenantLimits(comp);
                      setNewMaxEmployees(comp.maxEmployees || 100);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span>Configure Limits</span>
                </button>

                {comp && (
                  <button
                    onClick={() => onSwitchToCompany(comp)}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <span>Inspect</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Configure Tenant Limits */}
      {selectedTenantLimits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold">
                  {selectedTenantLimits.tenantId}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Adjust Tenant Capacity Limits
                </h3>
                <p className="text-xs text-slate-500">{selectedTenantLimits.name}</p>
              </div>
              <button
                onClick={() => setSelectedTenantLimits(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Max Workforce Headcount Limit
                </label>
                <input
                  type="number"
                  min={1}
                  max={50000}
                  value={newMaxEmployees}
                  onChange={(e) => setNewMaxEmployees(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Current Active Workforce: {selectedTenantLimits.employeeCount} staff
                </span>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedTenantLimits(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLimits}
                disabled={isUpdating}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
              >
                {isUpdating ? 'Saving...' : 'Update Limits'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
