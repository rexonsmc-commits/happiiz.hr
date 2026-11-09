/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import {
  X,
  QrCode,
  Download,
  Printer,
  ShieldCheck,
  MapPin,
  Clock,
  Building2,
  CheckCircle2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { ClientSite } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SiteQrModalProps {
  site: ClientSite;
  onClose: () => void;
}

export const SiteQrModal: React.FC<SiteQrModalProps> = ({ site, onClose }) => {
  const { currentCompany } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Safe QR payload string (No wage or commercial billing rates leaked)
  const token = site.qrVerificationToken || `HHR-QR-${site.siteCode}-A981B`;
  const verificationUrl = `https://happiizhr.com/patrol/verify?tenant=${site.companyId}&site=${site.id}&token=${token}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
    verificationUrl
  )}&margin=10`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Official Site QR Code Card</h2>
              <p className="text-xs text-slate-400 font-mono">
                {site.siteCode} • {site.siteName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div ref={printRef} className="p-6 sm:p-8 bg-slate-50 border-b border-slate-200">
          <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 text-center shadow-lg relative overflow-hidden">
            {/* Top Brand Banner */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div className="flex items-center gap-2 text-left">
                <div className="w-9 h-9 rounded-xl bg-blue-700 text-white font-black text-sm flex items-center justify-center">
                  HHR
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    {currentCompany?.name || 'Happiiz HR Enterprise'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold">
                    Workforce & Site Patrol Verification Post
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
                {site.siteCategory || 'Commercial'}
              </span>
            </div>

            {/* Site Name and Code Banner */}
            <div className="mb-4">
              <span className="inline-block px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-mono font-bold tracking-widest mb-2">
                SITE CODE: {site.siteCode}
              </span>
              <h3 className="text-xl font-black text-slate-900 leading-tight">
                {site.siteName}
              </h3>
              <p className="text-xs font-semibold text-blue-700 mt-1 flex items-center justify-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Client: {site.clientName}
              </p>
            </div>

            {/* QR Code Container */}
            <div className="my-6 inline-block p-4 bg-white border-4 border-slate-900 rounded-2xl shadow-md">
              <img
                src={qrImageUrl}
                alt={`QR code for ${site.siteCode}`}
                className="w-56 h-56 mx-auto object-contain"
              />
            </div>

            {/* Instruction Callout for Guards & Supervisors */}
            <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 text-left mb-4">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div className="text-[11px] text-blue-900 leading-relaxed font-medium">
                  <span className="font-bold">Instructions for Security Guards & Supervisors:</span>{' '}
                  Scan this official QR poster using your Happiiz HR Mobile App upon arrival to clock in, register shift duty muster, and conduct perimeter patrol checkpoint wand audits.
                </div>
              </div>
            </div>

            {/* Site Details Footer */}
            <div className="grid grid-cols-2 gap-3 text-left text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Location</div>
                <div className="text-xs font-bold text-slate-800 truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                  {site.city}, {site.state}
                </div>
                {site.latitude && site.longitude && (
                  <div className="text-[10px] font-mono text-slate-500">
                    GPS: {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Supervisor / Contact</div>
                <div className="text-xs font-bold text-slate-800 truncate">
                  {site.siteSupervisorName || site.contactPerson || 'Assigned Supervisor'}
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {site.contactNumber || 'Emergency Line'}
                </div>
              </div>
            </div>

            {/* Anti-leak badge */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
              <span>Security Token: {token.substring(0, 16)}...</span>
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3 h-3" /> Commercial Privacy Encrypted
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-6 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyLink}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Link Copied!' : 'Copy Verification URL'}
            </button>
            <a
              href={qrImageUrl}
              download={`${site.siteCode}_QR_Poster.png`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              Download PNG
            </a>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Official Poster
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
