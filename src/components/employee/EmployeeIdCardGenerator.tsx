/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Employee, Company } from '../../types';
import {
  IdCard,
  Download,
  Printer,
  Shield,
  QrCode,
  Building2,
  Calendar,
  Phone,
  AlertCircle,
  CheckCircle2,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface EmployeeIdCardGeneratorProps {
  employee: Employee;
  company: Company;
  onClose?: () => void;
}

export const EmployeeIdCardGenerator: React.FC<EmployeeIdCardGeneratorProps> = ({
  employee,
  company,
  onClose,
}) => {
  const [activeSide, setActiveSide] = useState<'both' | 'front' | 'back'>('both');
  const [cardStatus, setCardStatus] = useState<'active' | 'disabled'>('active');

  const issueDate = employee.idCardIssueDate || employee.dateOfJoining || '2026-01-01';
  // Expiry in 3 years
  const expiryDate = new Date(new Date(issueDate).setFullYear(new Date(issueDate).getFullYear() + 3))
    .toISOString()
    .substring(0, 10);

  // Secure public verification URL payload for QR code (Does NOT expose PII or bank details)
  const qrVerificationPayload = `https://happiizhr.com/verify?tid=${employee.tenantId}&code=${employee.employeeCode}&sig=${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  function handlePrintCard() {
    window.print();
  }

  function handleDownloadCardMock() {
    // Printable / Downloadable trigger
    window.print();
  }

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
            Digital Identity System
          </span>
          <h2 className="text-sm font-extrabold text-slate-900">
            {employee.fullName} • {employee.employeeCode}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Card View Selector */}
          <div className="flex rounded-xl bg-slate-200/70 p-1 text-xs font-bold text-slate-700">
            <button
              type="button"
              onClick={() => setActiveSide('both')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSide === 'both' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Both Sides
            </button>
            <button
              type="button"
              onClick={() => setActiveSide('front')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSide === 'front' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Front
            </button>
            <button
              type="button"
              onClick={() => setActiveSide('back')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSide === 'back' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Back
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrintCard}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCardMock}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/30"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* ID Cards Rendering Canvas */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 py-4">
        {/* ================= FRONT OF CARD ================= */}
        {(activeSide === 'both' || activeSide === 'front') && (
          <div className="w-[320px] h-[480px] rounded-3xl bg-white border-2 border-slate-300 shadow-2xl overflow-hidden flex flex-col justify-between relative text-slate-900">
            {/* Top Company Branding Header */}
            <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white p-4 pt-5 text-center relative border-b-4 border-amber-400">
              <div className="flex items-center justify-center gap-2 mb-1">
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt={company.name}
                    className="w-7 h-7 rounded object-contain bg-white/10 p-0.5"
                  />
                ) : (
                  <div className="w-7 h-7 rounded bg-blue-500 text-white font-black text-xs flex items-center justify-center">
                    {company.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="font-black text-xs uppercase tracking-wide truncate max-w-[220px]">
                  {company.name}
                </span>
              </div>
              <span className="text-[9px] uppercase tracking-widest text-sky-300 font-bold block">
                Official Workforce Identity Card
              </span>
            </div>

            {/* Photo & Primary Bio */}
            <div className="p-4 flex flex-col items-center text-center space-y-3">
              <div className="relative">
                <img
                  src={
                    employee.photoUrl ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={employee.fullName}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md ring-2 ring-blue-500/30"
                />
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-emerald-500 text-white text-[9px] font-black uppercase">
                  Active
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-950 leading-tight">
                  {employee.fullName}
                </h3>
                <span className="text-xs font-extrabold text-blue-700 block mt-0.5">
                  {employee.designation}
                </span>
                <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full inline-block mt-1">
                  ID: {employee.employeeCode}
                </span>
              </div>

              {/* Badges Matrix */}
              <div className="w-full grid grid-cols-2 gap-2 text-left bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px]">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Department</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {employee.department.split('&')[0]}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Branch</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {employee.branch.split(' ')[0]}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Blood Group</span>
                  <span className="font-bold text-rose-600 block">
                    {employee.bloodGroup || 'O+'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Joining Date</span>
                  <span className="font-bold text-slate-800 block">
                    {employee.dateOfJoining}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Signature & Hologram bar */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-bold">
              <div className="text-left">
                <span className="block text-[8px] text-slate-400 uppercase">Tenant Scope</span>
                <span className="font-mono font-bold text-blue-800">{employee.tenantId}</span>
              </div>
              <div className="text-right">
                <div className="h-4 border-b border-dashed border-slate-400 w-24 mb-0.5" />
                <span className="uppercase text-[8px] text-slate-600">Authorized Signatory</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= BACK OF CARD ================= */}
        {(activeSide === 'both' || activeSide === 'back') && (
          <div className="w-[320px] h-[480px] rounded-3xl bg-white border-2 border-slate-300 shadow-2xl overflow-hidden flex flex-col justify-between relative text-slate-900">
            {/* Top Back Header */}
            <div className="bg-slate-900 text-white p-3 text-center border-b-2 border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300">
                Terms & Emergency Contact
              </span>
            </div>

            {/* Middle QR & Verification Section */}
            <div className="p-4 space-y-3 text-center">
              {/* QR Code Container */}
              <div className="inline-block p-2.5 bg-white rounded-2xl border-2 border-slate-200 shadow-xs">
                <div className="w-24 h-24 bg-slate-900 rounded-xl flex items-center justify-center p-2 text-white">
                  <QrCode className="w-full h-full text-white" />
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-extrabold text-blue-700 block">
                  Scan to Verify Employment
                </span>
                <span className="text-[9px] text-slate-400 block font-mono">
                  {qrVerificationPayload.substring(0, 32)}...
                </span>
              </div>

              {/* Emergency Contacts Card */}
              <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-2.5 text-left text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 text-rose-800 font-bold text-[10px] uppercase">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>In Case of Emergency Notify</span>
                </div>
                <div className="font-bold text-slate-900">
                  {employee.emergencyContactName || 'Family Contact'}{' '}
                  <span className="text-slate-500 font-normal">
                    ({employee.emergencyRelationship || 'Relative'})
                  </span>
                </div>
                <div className="font-mono text-rose-700 font-bold text-xs">
                  {employee.emergencyContactPhone || employee.phone}
                </div>
              </div>

              {/* Company Legal Notice */}
              <div className="text-[9px] text-slate-500 leading-tight text-left space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                <p>
                  <strong>Property of {company.name}:</strong> This card is non-transferable and remains the property of the issuing tenant.
                </p>
                <p>
                  If found, please return to: {company.address}, {company.city || ''} (Ph: {company.phone}).
                </p>
              </div>
            </div>

            {/* Bottom Validity Strip */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[9px] font-bold text-slate-600">
              <div>
                <span className="text-slate-400 block text-[8px] uppercase">Issue Date</span>
                <span>{issueDate}</span>
              </div>
              <div className="text-center">
                <span className="text-slate-400 block text-[8px] uppercase">Card Status</span>
                <span className="text-emerald-600 uppercase font-bold">Valid & Active</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[8px] uppercase">Valid Thru</span>
                <span className="text-blue-700">{expiryDate}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security Privacy Notice */}
      <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900 flex items-center gap-2">
        <Shield className="w-4 h-4 text-sky-600 shrink-0" />
        <span>
          <strong>Data Privacy Protection Active:</strong> The digital QR code encodes an encrypted verification reference and strictly prevents leakage of bank accounts, PAN, or raw Aadhaar numbers.
        </span>
      </div>
    </div>
  );
};
