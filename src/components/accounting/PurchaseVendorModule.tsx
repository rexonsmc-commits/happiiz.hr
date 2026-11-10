/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PurchaseBill, Vendor, VendorCategory } from '../../types';
import { formatINR, round2 } from '../../services/payrollService';
import {
  Plus,
  Search,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Users,
  CreditCard,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';

interface PurchaseVendorModuleProps {
  purchaseBills: PurchaseBill[];
  vendors: Vendor[];
  currentUser: { name: string; role?: string };
  onCreatePurchaseBill: (billData: any) => Promise<void>;
  onCreateVendor: (vendorData: any) => Promise<void>;
}

export const PurchaseVendorModule: React.FC<PurchaseVendorModuleProps> = ({
  purchaseBills,
  vendors,
  currentUser,
  onCreatePurchaseBill,
  onCreateVendor,
}) => {
  const [subTab, setSubTab] = useState<'bills' | 'vendors' | 'aging'>('bills');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddBillModal, setShowAddBillModal] = useState<boolean>(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState<boolean>(false);

  // New Purchase Bill Form State
  const [billForm, setBillForm] = useState({
    vendorId: vendors[0]?.id || '',
    vendorInvoiceNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    category: 'uniforms' as VendorCategory,
    itemDescription: 'Security Guard Uniform Sets & Badges',
    quantity: 50,
    unit: 'Sets',
    unitRate: 850,
    gstRate: 18,
    isInterState: false,
    isItcEligible: true,
  });

  // New Vendor Form State
  const [vendorForm, setVendorForm] = useState({
    vendorCode: `VEN-00${vendors.length + 1}`,
    vendorName: '',
    businessName: '',
    category: 'uniforms' as VendorCategory,
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: 'Gurugram',
    state: 'Haryana',
    stateCode: '06',
    gstin: '',
    pan: '',
    paymentTerms: 'Net 30 Days',
    bankName: 'HDFC Bank',
    accountNumberMasked: 'XXXX-XXXX-1234',
    ifscCode: 'HDFC0001234',
    branchName: 'Gurugram',
    openingBalance: 0,
  });

  const totalPayables = purchaseBills.reduce((sum, b) => sum + b.outstandingAmount, 0);
  const totalBilled = purchaseBills.reduce((sum, b) => sum + b.grandTotal, 0);

  // Bill Form Math
  const subTotal = round2(billForm.quantity * billForm.unitRate);
  const taxable = subTotal;
  const gstAmount = round2((taxable * billForm.gstRate) / 100);
  const grandTotal = round2(taxable + gstAmount);

  const handleBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find((v) => v.id === billForm.vendorId) || vendors[0];

    await onCreatePurchaseBill({
      vendorId: vendor.id,
      vendorName: vendor.vendorName,
      vendorInvoiceNumber: billForm.vendorInvoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
      billDate: billForm.billDate,
      dueDate: billForm.dueDate,
      category: billForm.category,
      items: [
        {
          id: 'item_1',
          description: billForm.itemDescription,
          quantity: Number(billForm.quantity),
          unit: billForm.unit,
          unitRate: Number(billForm.unitRate),
          taxableAmount: taxable,
          gstRate: billForm.gstRate,
          gstAmount,
          totalAmount: grandTotal,
        },
      ],
      subTotal,
      discount: 0,
      taxableAmount: taxable,
      cgstAmount: billForm.isInterState ? 0 : round2(gstAmount / 2),
      sgstAmount: billForm.isInterState ? 0 : round2(gstAmount / 2),
      igstAmount: billForm.isInterState ? gstAmount : 0,
      totalGst: gstAmount,
      isItcEligible: billForm.isItcEligible,
      grandTotal,
    });

    setShowAddBillModal(false);
  };

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateVendor({
      vendorCode: vendorForm.vendorCode,
      vendorName: vendorForm.vendorName,
      businessName: vendorForm.businessName || vendorForm.vendorName,
      category: vendorForm.category,
      contactPerson: vendorForm.contactPerson,
      email: vendorForm.email,
      phone: vendorForm.phone,
      address: vendorForm.address,
      city: vendorForm.city,
      state: vendorForm.state,
      stateCode: vendorForm.stateCode,
      gstin: vendorForm.gstin,
      pan: vendorForm.pan || vendorForm.gstin.substring(2, 12),
      paymentTerms: vendorForm.paymentTerms,
      bankDetails: {
        bankName: vendorForm.bankName,
        accountNumberMasked: vendorForm.accountNumberMasked,
        ifscCode: vendorForm.ifscCode,
        branchName: vendorForm.branchName,
      },
      openingBalance: Number(vendorForm.openingBalance) || 0,
      status: 'active',
    });

    setShowAddVendorModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs Selector */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          {[
            { id: 'bills', label: 'Purchase Bills (Inward)', icon: ShoppingBag },
            { id: 'vendors', label: 'Vendor Directory', icon: Building2 },
            { id: 'aging', label: 'Payables Aging Analysis', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  subTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {subTab === 'bills' ? (
            <button
              onClick={() => setShowAddBillModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Create Purchase Bill
            </button>
          ) : (
            <button
              onClick={() => setShowAddVendorModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Vendor
            </button>
          )}
        </div>
      </div>

      {/* 1. PURCHASE BILLS REGISTER */}
      {subTab === 'bills' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400">Total Inward Purchases</span>
              <div className="mt-1 text-2xl font-black text-slate-900">{formatINR(totalBilled)}</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Uniforms, badges, torches & cleaning chemicals</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400">Outstanding Vendor Payables</span>
              <div className="mt-1 text-2xl font-black text-rose-700">{formatINR(totalPayables)}</div>
              <p className="text-[10px] text-rose-600 mt-0.5">Liabilities booked in Accounts Payable 2001</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400">Eligible Input Tax Credit (ITC)</span>
              <div className="mt-1 text-2xl font-black text-blue-700">
                {formatINR(purchaseBills.filter((b) => b.isItcEligible).reduce((sum, b) => sum + b.totalGst, 0))}
              </div>
              <p className="text-[10px] text-emerald-600 mt-0.5">Set-off against Output GST on billing</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Purchase Bills Inward Register</h3>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                {purchaseBills.length} Bills
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Bill #</th>
                    <th className="py-2.5 px-4">Bill Date</th>
                    <th className="py-2.5 px-4">Vendor</th>
                    <th className="py-2.5 px-4">Invoice #</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4 text-right">Taxable (₹)</th>
                    <th className="py-2.5 px-4 text-right">GST (₹)</th>
                    <th className="py-2.5 px-4 text-right">Grand Total (₹)</th>
                    <th className="py-2.5 px-4 text-right">Outstanding (₹)</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {purchaseBills.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-700">{b.billNumber}</td>
                      <td className="py-2.5 px-4 text-slate-600">{b.billDate}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{b.vendorName}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">{b.vendorInvoiceNumber}</td>
                      <td className="py-2.5 px-4 capitalize text-[11px]">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold uppercase text-[10px]">
                          {b.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-700">{formatINR(b.taxableAmount)}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-blue-700">{formatINR(b.totalGst)}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900">{formatINR(b.grandTotal)}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-700">
                        {formatINR(b.outstandingAmount)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          b.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. VENDOR DIRECTORY */}
      {subTab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">Registered Suppliers & Vendors ({vendors.length})</h3>
            <span className="text-xs text-slate-500">Uniform fabricators, armories, cleaning suppliers</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Vendor Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Contact / Phone</th>
                  <th className="py-3 px-4">GSTIN / PAN</th>
                  <th className="py-3 px-4">Payment Terms</th>
                  <th className="py-3 px-4 text-right">Current Payable</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{v.vendorCode}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{v.vendorName}</div>
                      <div className="text-[11px] text-slate-500">{v.businessName}</div>
                    </td>
                    <td className="py-3 px-4 capitalize text-[11px]">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold uppercase text-[10px]">
                        {v.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{v.contactPerson}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{v.phone}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="font-bold text-slate-800">{v.gstin}</div>
                      <div className="text-slate-400">{v.pan}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{v.paymentTerms}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-rose-700">
                      {formatINR(v.currentBalance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. PAYABLES AGING ANALYSIS */}
      {subTab === 'aging' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Creditors & Payables Aging Matrix</h3>
              <p className="text-xs text-slate-500">Aging buckets of outstanding trade liabilities</p>
            </div>
            <span className="font-mono text-sm font-black text-rose-700">{formatINR(totalPayables)}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-700 uppercase">0 - 30 Days (Current)</span>
              <div className="mt-1 text-lg font-black text-emerald-900">{formatINR(round2(totalPayables * 0.7))}</div>
              <p className="text-[10px] text-emerald-600 mt-0.5">Within standard credit terms</p>
            </div>

            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200">
              <span className="text-[11px] font-bold text-amber-700 uppercase">31 - 60 Days</span>
              <div className="mt-1 text-lg font-black text-amber-900">{formatINR(round2(totalPayables * 0.25))}</div>
              <p className="text-[10px] text-amber-600 mt-0.5">Payment due this cycle</p>
            </div>

            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-200">
              <span className="text-[11px] font-bold text-orange-700 uppercase">61 - 90 Days</span>
              <div className="mt-1 text-lg font-black text-orange-900">{formatINR(round2(totalPayables * 0.05))}</div>
              <p className="text-[10px] text-orange-600 mt-0.5">Follow-up required</p>
            </div>

            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200">
              <span className="text-[11px] font-bold text-rose-700 uppercase">&gt; 90 Days (Overdue)</span>
              <div className="mt-1 text-lg font-black text-rose-900">{formatINR(0)}</div>
              <p className="text-[10px] text-rose-600 mt-0.5">Critical settlement priority</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Purchase Bill Modal */}
      {showAddBillModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Create Inward Purchase Bill</h3>
              <button
                onClick={() => setShowAddBillModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleBillSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Select Supplier / Vendor</label>
                  <select
                    value={billForm.vendorId}
                    onChange={(e) => setBillForm({ ...billForm, vendorId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vendorName} ({v.gstin})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Vendor Invoice #</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. APX-9941"
                    value={billForm.vendorInvoiceNumber}
                    onChange={(e) => setBillForm({ ...billForm, vendorInvoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Bill Date</label>
                  <input
                    type="date"
                    required
                    value={billForm.billDate}
                    onChange={(e) => setBillForm({ ...billForm, billDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={billForm.dueDate}
                    onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Item Description</label>
                <input
                  type="text"
                  required
                  value={billForm.itemDescription}
                  onChange={(e) => setBillForm({ ...billForm, itemDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={billForm.quantity}
                    onChange={(e) => setBillForm({ ...billForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Unit Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={billForm.unitRate}
                    onChange={(e) => setBillForm({ ...billForm, unitRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">GST Rate</label>
                  <select
                    value={billForm.gstRate}
                    onChange={(e) => setBillForm({ ...billForm, gstRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value={18}>18% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={5}>5% GST</option>
                    <option value={0}>0%</option>
                  </select>
                </div>
              </div>

              {/* Live Calculation Strip */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Taxable Value:</span>
                  <span className="font-mono font-bold text-slate-800">{formatINR(taxable)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">GST ({billForm.gstRate}%):</span>
                  <span className="font-mono font-bold text-blue-700">{formatINR(gstAmount)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-black">
                  <span className="text-slate-900">Total Purchase Value:</span>
                  <span className="font-mono text-emerald-700">{formatINR(grandTotal)}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddBillModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
                >
                  Post Purchase Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Vendor Modal */}
      {showAddVendorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Register New Supplier / Vendor</h3>
              <button
                onClick={() => setShowAddVendorModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleVendorSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Vendor Code</label>
                  <input
                    type="text"
                    required
                    value={vendorForm.vendorCode}
                    onChange={(e) => setVendorForm({ ...vendorForm, vendorCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Supply Category</label>
                  <select
                    value={vendorForm.category}
                    onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="uniforms">Uniforms & Guard Kits</option>
                    <option value="security_equipment">Security & Armory Tech</option>
                    <option value="cleaning_supplies">Cleaning Chemicals</option>
                    <option value="office_supplies">Stationery</option>
                    <option value="it_hardware">IT & Biometric Scanners</option>
                    <option value="professional_services">Professional & Legal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Vendor / Firm Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Tactical Gear & Uniforms"
                  value={vendorForm.vendorName}
                  onChange={(e) => setVendorForm({ ...vendorForm, vendorName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    value={vendorForm.contactPerson}
                    onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">GSTIN</label>
                  <input
                    type="text"
                    required
                    placeholder="06AAACA9876Q1Z2"
                    value={vendorForm.gstin}
                    onChange={(e) => setVendorForm({ ...vendorForm, gstin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Payment Terms</label>
                  <select
                    value={vendorForm.paymentTerms}
                    onChange={(e) => setVendorForm({ ...vendorForm, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="Net 15 Days">Net 15 Days</option>
                    <option value="Net 30 Days">Net 30 Days</option>
                    <option value="Immediate">Immediate</option>
                    <option value="Advance">Advance</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddVendorModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
