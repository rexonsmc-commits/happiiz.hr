/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FixedAssetRecord, FixedAssetCategory } from '../../types';
import { formatINR, round2 } from '../../services/payrollService';
import {
  Shield,
  Plus,
  Play,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  Building2,
  Truck,
  Monitor,
} from 'lucide-react';

interface FixedAssetsModuleProps {
  fixedAssets: FixedAssetRecord[];
  currentUser: { name: string; role?: string };
  onPostDepreciation: (assetId: string) => Promise<void>;
}

export const FixedAssetsModule: React.FC<FixedAssetsModuleProps> = ({
  fixedAssets,
  currentUser,
  onPostDepreciation,
}) => {
  const [processingAssetId, setProcessingAssetId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const totalOriginalCost = fixedAssets.reduce((sum, a) => sum + a.purchaseCost, 0);
  const totalDepreciation = fixedAssets.reduce((sum, a) => sum + a.accumulatedDepreciation, 0);
  const totalBookValue = fixedAssets.reduce((sum, a) => sum + a.currentBookValue, 0);

  const handleRunDepreciation = async (assetId: string) => {
    setProcessingAssetId(assetId);
    try {
      await onPostDepreciation(assetId);
      setSuccessMsg('Monthly depreciation calculated and posted to General Ledger successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error posting depreciation');
    } finally {
      setProcessingAssetId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400">Total Fixed Assets (Gross Cost)</span>
          <div className="mt-1 text-2xl font-black text-slate-900">{formatINR(totalOriginalCost)}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Vehicles, metal detectors, biometrics & CCTV</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400">Total Accumulated Depreciation</span>
          <div className="mt-1 text-2xl font-black text-rose-700">{formatINR(totalDepreciation)}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Contra asset balance (Account 1599)</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400">Net Book Value (Balance Sheet)</span>
          <div className="mt-1 text-2xl font-black text-emerald-700">{formatINR(totalBookValue)}</div>
          <p className="text-[10px] text-emerald-600 mt-0.5">Current carrying value of operational assets</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Asset Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900">Fixed Asset & Equipment Register</h3>
            <p className="text-xs text-slate-500">Useful life, straight-line depreciation & book values</p>
          </div>
          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
            {fixedAssets.length} Registered Assets
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Asset Code</th>
                <th className="py-3 px-4">Asset Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Acquisition Date</th>
                <th className="py-3 px-4 text-right">Original Cost</th>
                <th className="py-3 px-4 text-center">Life (Yrs)</th>
                <th className="py-3 px-4 text-right">Accumulated Dep.</th>
                <th className="py-3 px-4 text-right">Net Book Value</th>
                <th className="py-3 px-4 text-center">Last Run</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {fixedAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">{asset.assetCode}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{asset.assetName}</div>
                    <div className="text-[11px] text-slate-400 capitalize">{asset.depreciationMethod.replace('_', ' ')}</div>
                  </td>
                  <td className="py-3 px-4 capitalize text-[11px]">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold uppercase text-[10px]">
                      {asset.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{asset.purchaseDate}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatINR(asset.purchaseCost)}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold">{asset.usefulLifeYears}</td>
                  <td className="py-3 px-4 text-right font-mono text-rose-700">{formatINR(asset.accumulatedDepreciation)}</td>
                  <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">{formatINR(asset.currentBookValue)}</td>
                  <td className="py-3 px-4 text-center text-[11px] text-slate-500 font-mono">{asset.lastDepreciationDate || '-'}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleRunDepreciation(asset.id)}
                      disabled={processingAssetId === asset.id || asset.currentBookValue <= asset.salvageValue}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 disabled:bg-slate-100 disabled:text-slate-400 text-blue-700 font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      {processingAssetId === asset.id ? 'Posting...' : 'Run Depreciation'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
