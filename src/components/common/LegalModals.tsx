/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Shield, Lock, FileText } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalModals: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              {type === 'privacy' ? <Lock className="w-4 h-4 text-sky-300" /> : <FileText className="w-4 h-4 text-sky-300" />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {type === 'privacy' ? 'Happiiz HR Privacy Policy' : 'Happiiz HR Terms & Conditions'}
              </h3>
              <p className="text-[11px] text-slate-400">Enterprise SaaS Data Protection & Governance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto text-xs text-slate-600 leading-relaxed space-y-4 font-sans">
          {type === 'privacy' ? (
            <>
              <p>
                <strong>1. Multi-Tenant Data Isolation Principle:</strong> Happiiz HR is built upon physical and logical data isolation. Each customer organization (tenant) receives a cryptographically protected workspace and dedicated Firestore collection hierarchy. No tenant data is shared or co-mingled with other tenants.
              </p>
              <p>
                <strong>2. Frontline Personnel & Employee Data:</strong> Workforce personal information, staff codes, contact numbers, and post assignments collected through the platform are managed strictly on behalf of the customer company (Data Controller). Happiiz HR acts exclusively as a secure Data Processor.
              </p>
              <p>
                <strong>3. Audit Logs & Compliance:</strong> System transactions, logins, role modifications, and status changes are recorded in append-only immutable audit logs to satisfy statutory labor regulations (including Private Security Agencies Regulation Act - PSARA, Contract Labour Regulation Act, and ISO/IEC 27001 requirements).
              </p>
              <p>
                <strong>4. Cloud Infrastructure & Security:</strong> All data in transit is encrypted using TLS 1.3, and all data at rest is encrypted using AES-256 via Google Cloud Run and Cloud Firestore.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>1. Service Acceptance:</strong> By registering an organization on the Happiiz HR platform, you represent that you are an authorized representative of the registered security, housekeeping, manpower, or facility management company.
              </p>
              <p>
                <strong>2. Tenant Responsibility:</strong> Each tenant is responsible for maintaining the confidentiality of administrative credentials, managing field staff rosters responsibly, and adhering to regional labor wage guidelines.
              </p>
              <p>
                <strong>3. Service Level & Scaling:</strong> Happiiz HR provides 99.9% uptime architecture on Google Cloud Run and Firebase. Subscriptions are billed per tenant based on contracted workforce scale.
              </p>
              <p>
                <strong>4. Account Suspension:</strong> The platform super administrator reserves the right to suspend workspaces in the event of confirmed terms violations, fraudulent billing, or non-payment.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
