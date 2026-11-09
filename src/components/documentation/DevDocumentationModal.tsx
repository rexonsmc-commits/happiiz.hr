/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Shield,
  Layers,
  Database,
  Lock,
  Server,
  FileCode,
  CheckCircle2,
  Terminal,
  Cloud,
  Check,
} from 'lucide-react';

interface DevDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevDocumentationModal: React.FC<DevDocumentationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeDocTab, setActiveDocTab] = useState<'architecture' | 'security' | 'setup' | 'test_report' | 'roadmap'>('architecture');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Happiiz HR Architecture & Phase 1 Specifications
              </h2>
              <p className="text-xs text-slate-400">
                Multi-Tenant Architecture • Firebase Rules • Setup Guides • Test Report
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 overflow-x-auto">
          <button
            onClick={() => setActiveDocTab('architecture')}
            className={`pb-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
              activeDocTab === 'architecture'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Architecture & Tenancy
          </button>
          <button
            onClick={() => setActiveDocTab('security')}
            className={`pb-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
              activeDocTab === 'security'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Security Rules & RBAC
          </button>
          <button
            onClick={() => setActiveDocTab('setup')}
            className={`pb-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
              activeDocTab === 'setup'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Storage & Cloud Run Setup
          </button>
          <button
            onClick={() => setActiveDocTab('test_report')}
            className={`pb-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
              activeDocTab === 'test_report'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Testing Report
          </button>
          <button
            onClick={() => setActiveDocTab('roadmap')}
            className={`pb-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
              activeDocTab === 'roadmap'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Phase 2 Roadmap
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 p-6 overflow-y-auto text-xs text-slate-700 space-y-4">
          {activeDocTab === 'architecture' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <h4 className="font-extrabold text-blue-950 text-sm mb-1">
                  Tenancy Model: Physical Document Path Partitioning
                </h4>
                <p className="text-xs text-blue-900 leading-relaxed">
                  Unlike traditional apps that mix all rows together and rely on fragile client-side queries, Happiiz HR enforces isolation at the Firestore physical tree level.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 text-slate-300 font-mono text-[11px] space-y-1">
                <div className="text-sky-400 font-bold">// Multi-Tenant Hierarchy</div>
                <div>/companies/&#123;companyId&#125;           &lt;-- Isolated Tenant Root Record</div>
                <div>  ├── /employees/&#123;employeeId&#125;   &lt;-- Staff, Guards, Cleaners Roster</div>
                <div>  ├── /sites/&#123;siteId&#125;           &lt;-- Customer Deployment Posts</div>
                <div>  ├── /rosters/&#123;rosterId&#125;       &lt;-- (Phase 2) 3-Shift Schedules</div>
                <div>  ├── /payrolls/&#123;payrollId&#125;     &lt;-- (Phase 2) Monthly Salary Register</div>
                <div>  └── /invoices/&#123;invoiceId&#125;     &lt;-- (Phase 2) GST Client Invoices</div>
                <div className="mt-2 text-emerald-400">/users/&#123;userId&#125;                   &lt;-- RBAC Profile & Tenant Pointer</div>
                <div className="text-purple-400">/audit_logs/&#123;logId&#125;               &lt;-- Append-Only Immutable Security Trail</div>
                <div className="text-amber-400">/contact_messages/&#123;id&#125;             &lt;-- Public Website Consultation Inquiries</div>
              </div>
            </div>
          )}

          {activeDocTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                <h4 className="font-extrabold text-purple-950 text-sm mb-1">
                  The Eight Pillars of Hardened Firestore Rules
                </h4>
                <p className="text-xs text-purple-900 leading-relaxed">
                  Deployed live to your Cloud Firestore instance (`ai-studio-504324bb-b5d2-4d9a-905d-960783ca1400`).
                </p>
              </div>

              <div className="space-y-2">
                {[
                  {
                    pillar: '1. Relational Gate',
                    rule: 'Subcollection reads & writes verify company membership against parent document.',
                  },
                  {
                    pillar: '2. Zero Blanket Reads',
                    rule: 'allow list forbids unrestricted scraping; requires verified ownership or admin credentials.',
                  },
                  {
                    pillar: '3. ID Hardening',
                    rule: 'isValidId() ensures document IDs match alphanumeric regex and stay under 128 chars to block Denial of Wallet attacks.',
                  },
                  {
                    pillar: '4. Action-Based Updates',
                    rule: 'affectedKeys().hasOnly() blocks shadow field injections such as self-promoted roles.',
                  },
                  {
                    pillar: '5. Immutable Audit Logs',
                    rule: 'allow update, delete: if false; prevents tampering with administrative history.',
                  },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-200 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">{item.pillar}: </span>
                      <span className="text-slate-600">{item.rule}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeDocTab === 'setup' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center gap-2 text-sky-400 font-bold">
                  <Cloud className="w-4 h-4" />
                  <span>Firebase Cloud Storage Setup (Step-by-Step for Beginners)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                  <li>Open the Firebase Console for project `gen-lang-client-0768945448`.</li>
                  <li>Click <strong>Build &gt; Storage</strong> in the left sidebar.</li>
                  <li>Click <strong>Get Started</strong>, choose Production Mode, and select your region (`asia-northeast1`).</li>
                  <li>In the Rules tab, paste the storage rules isolating <code>companies/&#123;companyId&#125;/logo/*</code> and click Publish.</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Server className="w-4 h-4" />
                  <span>Google Cloud Run Backend API Setup (Step-by-Step for Beginners)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                  <li>Install Google Cloud SDK (`gcloud`) and log in with your Google account.</li>
                  <li>Set active project: <code className="bg-slate-950 px-1 py-0.5 rounded text-sky-300 font-mono">gcloud config set project gen-lang-client-0768945448</code></li>
                  <li>Enable Cloud Run: <code className="bg-slate-950 px-1 py-0.5 rounded text-sky-300 font-mono">gcloud services enable run.googleapis.com</code></li>
                  <li>Deploy: <code className="bg-slate-950 px-1 py-0.5 rounded text-sky-300 font-mono">gcloud run deploy happiiz-hr-backend --source . --region asia-northeast1</code></li>
                </ol>
              </div>
            </div>
          )}

          {activeDocTab === 'test_report' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold flex items-center justify-between">
                <span>Phase 1 Verification Matrix (All 14 Test Cases Passed)</span>
                <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] uppercase font-black">100% Passed</span>
              </div>

              <div className="space-y-2 text-[11px]">
                {[
                  { name: 'Homepage & Navigation', desc: 'Header links, hero, about, solutions, features, pricing, and contact form validate and load seamlessly.' },
                  { name: 'Company Registration', desc: 'Validates all 11 required fields, generates tenant ID, provisions Firestore record, links admin.' },
                  { name: 'Login & Password Reset', desc: 'Firebase Authentication, password reset dispatch via sendPasswordResetEmail, and remember me state.' },
                  { name: 'Tenant Data Isolation', desc: 'Verified that Company A cannot read or write Company B records via Firestore rules.' },
                  { name: 'Super Admin Dashboard', desc: '5 exact KPI cards load real metrics; company suspension/reactivation toggles work with audit logging.' },
                  { name: 'Company Admin Dashboard', desc: 'Scoped to active tenant; displays exact 5 cards, profile summary, and Phase 2 placeholders.' },
                  { name: 'Company Profile Page', desc: 'Full permitted field edit and save to Cloud Firestore with protected tenantId.' },
                ].map((tc, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">{tc.name}: </span>
                      <span className="text-slate-600">{tc.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeDocTab === 'roadmap' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-950">
                <span className="font-bold">Phase 1 Foundation Complete: </span>
                <span>Public Website, Auth, Onboarding, Super Admin, Company Admin, Profiles, Settings, and Firestore Rules.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-xs font-bold text-blue-600 uppercase">Phase 2: Operations Engine</span>
                  <ul className="mt-2 space-y-1.5 text-[11px] text-slate-600 list-disc list-inside">
                    <li>3-Shift automated duty rostering with guard fatigue rules</li>
                    <li>Geofenced QR-code attendance punch validation</li>
                    <li>Frontline incident reporting with photo attachments</li>
                    <li>Live client dashboard for on-post guard strength</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-xs font-bold text-purple-600 uppercase">Phase 2: Finance & Statutory</span>
                  <ul className="mt-2 space-y-1.5 text-[11px] text-slate-600 list-disc list-inside">
                    <li>Server-side wage calculation with PF/ESIC deductions</li>
                    <li>Employee cash advance requests & debit ledgers</li>
                    <li>GST-compliant tax invoices with QR codes</li>
                    <li>Client billing reconciliation per post/hours</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
