/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Shield,
  Building2,
  Users,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  MapPin,
  CalendarCheck,
  Award,
  Sparkles,
  Server,
  Layers,
  ChevronRight,
  PhoneCall,
  Clock,
  Banknote,
  Receipt,
  Smartphone,
  Send,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { submitContactInquiry } from '../../services/tenantService';

interface LandingPageProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onExploreDemo: (role?: 'super_admin' | 'company_admin') => void;
  onOpenDocs: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToLogin,
  onGoToRegister,
  onExploreDemo,
  onOpenDocs,
  onOpenPrivacy,
  onOpenTerms,
}) => {
  // Contact form states
  const [contactName, setContactName] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactCompany.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      setContactError('Please fill in all required fields.');
      return;
    }
    if (!contactEmail.includes('@')) {
      setContactError('Please enter a valid business email address.');
      return;
    }

    setContactSubmitting(true);
    setContactError(null);

    try {
      await submitContactInquiry({
        name: contactName,
        companyName: contactCompany,
        email: contactEmail,
        phone: contactPhone,
        message: contactMessage,
      });

      setContactSuccess(true);
      setContactName('');
      setContactCompany('');
      setContactEmail('');
      setContactPhone('');
      setContactMessage('');
    } catch (err: any) {
      console.error(err);
      setContactError('Unable to transmit consultation inquiry. Please try again or contact support.');
    } finally {
      setContactSubmitting(false);
    }
  };

  // Section 7 Solutions categories (Informational Phase 1)
  const solutions = [
    {
      title: 'Security Management',
      desc: 'Guard deployment logs, post duty assignments, physical checkpoint patrolling, and emergency response dispatch.',
      icon: Shield,
      phase: 'Phase 1 Foundation Ready',
    },
    {
      title: 'Manpower Management',
      desc: 'Industrial labor pooling, contractual workforce rosters, skill tier verification, and daily headcount dispatch.',
      icon: Users,
      phase: 'Phase 1 Foundation Ready',
    },
    {
      title: 'Housekeeping Management',
      desc: 'Commercial facility hygiene logs, mechanized floor sanitation tasks, supervisor inspection rounds, and consumable tracking.',
      icon: Sparkles,
      phase: 'Phase 1 Foundation Ready',
    },
    {
      title: 'Workforce Management',
      desc: 'Centralized staff master registry, verified identity documentation, statutory compliance verification, and rank allocation.',
      icon: Layers,
      phase: 'Phase 1 Active',
    },
    {
      title: 'Client and Site Management',
      desc: 'Customer location accounts, contracted guard strength quotas, deployment posts, and SLA verification.',
      icon: MapPin,
      phase: 'Phase 1 Active',
    },
  ];

  // Section 7 Features Overview (Distinguishing Phase 1 available from upcoming)
  const featuresOverview = [
    {
      name: 'Employee Management',
      desc: 'Workforce records, rank codes, and employee directory.',
      isPhase1: true,
      badge: 'Available Now (Phase 1)',
      icon: Users,
    },
    {
      name: 'Site Management',
      desc: 'Customer posts, contracted headcount, and location directories.',
      isPhase1: true,
      badge: 'Available Now (Phase 1)',
      icon: MapPin,
    },
    {
      name: 'Management Dashboard',
      desc: 'Real-time operational cards, tenant context, and isolation monitor.',
      isPhase1: true,
      badge: 'Available Now (Phase 1)',
      icon: Building2,
    },
    {
      name: 'Attendance Management',
      desc: 'GPS geofencing, QR check-in, and biometric turnstile integration.',
      isPhase1: false,
      badge: 'Upcoming (Phase 2)',
      icon: Clock,
    },
    {
      name: 'Shift and Roster Management',
      desc: '3-Shift 24/7 automated guard allocation with fatigue and overtime rules.',
      isPhase1: false,
      badge: 'Upcoming (Phase 2)',
      icon: CalendarCheck,
    },
    {
      name: 'Payroll and Wage Management',
      desc: 'Server-side automated salary generation with statutory PF/ESI compliance.',
      isPhase1: false,
      badge: 'Upcoming (Phase 2)',
      icon: Banknote,
    },
    {
      name: 'Client Management & Portal',
      desc: 'Customer representative dashboard, post inspection, and invoice approvals.',
      isPhase1: false,
      badge: 'Upcoming (Phase 2)',
      icon: Award,
    },
    {
      name: 'Billing and Accounts',
      desc: 'GST tax invoice generation, client billing ledgers, and payment tracking.',
      isPhase1: false,
      badge: 'Upcoming (Phase 2)',
      icon: Receipt,
    },
    {
      name: 'Employee Mobile App',
      desc: 'Android and PWA self-service for digital attendance and salary slips.',
      isPhase1: false,
      badge: 'Upcoming (Phase 2)',
      icon: Smartphone,
    },
  ];

  // Section 7 Pricing Section (exact values and note requested)
  const pricingTiers = [
    {
      name: 'Micro',
      scale: 'Up to 25 employees',
      price: '₹499',
      period: '/month minimum',
      desc: 'For small security posts and neighborhood cleaning crews.',
      features: [
        'Dedicated Tenant ID & isolated database',
        'Up to 25 field staff profiles',
        'Basic deployment site directory',
        'Administrative dashboard access',
        'Standard audit logs',
      ],
      popular: false,
    },
    {
      name: 'Starter',
      scale: '26–100 employees',
      price: '₹20',
      period: 'per employee/month',
      desc: 'Ideal for expanding agencies handling commercial properties.',
      features: [
        'Custom tenant portal & branding',
        'Up to 100 field workers & supervisors',
        'Unlimited client deployment sites',
        'Role-based operator permissions',
        'Priority technical assistance',
      ],
      popular: true,
    },
    {
      name: 'Growth',
      scale: '101–500 employees',
      price: '₹15',
      period: 'per employee/month',
      desc: 'Tailored for mid-scale security contractors and facility firms.',
      features: [
        'Up to 500 field staff monitored',
        'Multi-city deployment site management',
        'Automated duty roster engine (Phase 2)',
        'Server-side payroll compliance (Phase 2)',
        'Full immutable security audit trail',
      ],
      popular: false,
    },
    {
      name: 'Enterprise',
      scale: '501–2,000 employees',
      price: '₹12',
      period: 'per employee/month',
      desc: 'High-volume workforce suppliers and industrial facility operators.',
      features: [
        'Up to 2,000 field personnel',
        'Dedicated Cloud Run microservice capacity',
        'GST invoicing & advances ledger (Phase 2)',
        'Custom SLAs & emergency support',
        'Dedicated compliance officer account',
      ],
      popular: false,
    },
    {
      name: 'Custom',
      scale: '2,000+ employees',
      price: 'Custom',
      period: 'Contact Sales',
      desc: 'For national security networks and large public utilities.',
      features: [
        'Unlimited workforce scaling',
        'Custom hardware biometric turnstile integration',
        'Private cloud partition options',
        'Tailored SLA & dedicated account manager',
        'On-premise / hybrid replication support',
      ],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Notification Bar */}
      <div className="bg-slate-950 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">Happiiz HR Enterprise Phase 1 Foundation</span>
            <span className="hidden sm:inline text-slate-400">— Multi-Tenant Workforce SaaS</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenDocs}
              className="text-sky-300 hover:text-white underline font-medium cursor-pointer"
            >
              Developer Architecture & API Docs
            </button>
          </div>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-950 via-blue-900 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Shield className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-2xl font-black text-slate-950">Happiiz</span>
                <span className="text-2xl font-black text-blue-600">HR</span>
              </div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Workforce Management
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#home" className="hover:text-blue-600 transition-colors">
              Home
            </a>
            <a href="#about" className="hover:text-blue-600 transition-colors">
              About Us
            </a>
            <a href="#solutions" className="hover:text-blue-600 transition-colors">
              Solutions
            </a>
            <a href="#features" className="hover:text-blue-600 transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">
              Pricing
            </a>
            <a href="#contact" className="hover:text-blue-600 transition-colors">
              Contact
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onGoToLogin}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors"
            >
              Login
            </button>
            <button
              onClick={onGoToRegister}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28 bg-gradient-to-b from-blue-50/60 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-6">
              <Shield className="w-3.5 h-3.5" />
              <span>Multi-Tenant Architecture for 1–500+ Workforce Headcount</span>
            </div>

            {/* Verbatim main heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-tight">
              Complete Workforce Management Made Simple
            </h1>

            {/* Verbatim supporting text */}
            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Manage employees, security teams, housekeeping staff, manpower operations, attendance, payroll and client services from one intelligent platform.
            </p>

            {/* Hero CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onGoToRegister}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onGoToLogin}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-sm border border-slate-300 shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Login</span>
              </button>

              <button
                onClick={() => onExploreDemo('company_admin')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Building2 className="w-4 h-4 text-sky-400" />
                <span>Launch Interactive Demo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                About Happiiz HR
              </span>
              {/* Verbatim heading */}
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
                One Platform for Your Entire Workforce
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Happiiz HR is purpose-built for security agencies, housekeeping companies, manpower suppliers, and facility management businesses. Standard generic HR applications fail to accommodate multi-site frontline workers, shift rotations, and statutory post mandates.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Our multi-tenant SaaS architecture provisions every registered business with an isolated database workspace, secure tenant credentials, and automated administrative controls.
              </p>

              <div className="pt-2 grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xl font-black text-slate-900">100% Isolated</div>
                  <div className="text-xs text-slate-500 mt-0.5">Physical Tenant Partitioning</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xl font-black text-blue-600">1–500+ Staff</div>
                  <div className="text-xs text-slate-500 mt-0.5">Engineered to Scale Seamlessly</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-slate-900 p-8 rounded-3xl text-white shadow-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-sky-400 font-mono mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Zero-Trust Tenancy Matrix</span>
              </div>
              <h3 className="text-xl font-extrabold text-white">
                Independent Portals & Protected Data
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Every tenant registered in Happiiz HR receives a unique Tenant ID, dedicated Firestore sub-tree, and encrypted audit trails. Company A can never inspect, query, or enumerate Company B's personnel or billing records.
              </p>

              <div className="mt-6 space-y-3 font-mono text-[11px] text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-emerald-400">// Isolated Tenant Paths</div>
                <div>/companies/TEN-SEC-8921/employees/*</div>
                <div>/companies/TEN-CLN-1044/employees/*</div>
                <div>/companies/TEN-MAN-5520/employees/*</div>
                <div className="text-sky-400 mt-2">// Authenticated Rule Enforcement</div>
                <div className="text-slate-400">allow read, write: if isCompanyAdmin(companyId);</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section (Informational in Phase 1) */}
      <section id="solutions" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Industry Verticals
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Specialized Solutions for Frontline Sectors
            </h2>
            <p className="mt-3 text-slate-600 text-sm">
              Discover how Happiiz HR is tailored for the operational realities of field security, facility maintenance, and labor outsourcing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutions.map((sol, idx) => {
              const Icon = sol.icon;
              return (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900">{sol.title}</h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{sol.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {sol.phase}
                    </span>
                    <span className="text-[10px] text-slate-400">Informational Overview</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Overview Section */}
      <section id="features" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Platform Modules
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Comprehensive Platform Capabilities
            </h2>
            <p className="mt-3 text-slate-600 text-sm">
              Clearly distinguishing operational Phase 1 foundation features from upcoming advanced modules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresOverview.map((f, idx) => {
              const Icon = f.icon;
              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border transition-all ${
                    f.isPhase1
                      ? 'bg-blue-50/50 border-blue-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        f.isPhase1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        f.isPhase1
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {f.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900">{f.name}</h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Transparent SaaS Pricing
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Scaled to Your Workforce Size
            </h2>
            <p className="mt-3 text-slate-600 text-sm">
              Every tier provides an isolated tenant database, verified admin portal, and enterprise security.
            </p>
            {/* Required exact note */}
            <p className="mt-4 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-xl inline-block">
              Illustrative pricing. Final subscription plans and prices will be configured by the platform administrator.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {pricingTiers.map((p, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl bg-white border flex flex-col justify-between transition-all ${
                  p.popular
                    ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-lg relative'
                    : 'border-slate-200 shadow-xs'
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase">
                    Most Popular
                  </span>
                )}

                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{p.name}</h3>
                  <div className="text-[11px] font-bold text-blue-600 mt-0.5">{p.scale}</div>

                  <div className="mt-4 mb-3">
                    <span className="text-2xl font-black text-slate-950">{p.price}</span>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                      {p.period}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mb-4 leading-snug">{p.desc}</p>

                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    {p.features.map((feat, fi) => (
                      <div key={fi} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={onGoToRegister}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      p.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    Select Plan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Direct Inquiries
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-950 tracking-tight">
              Contact Happiiz HR Enterprise Team
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              Have questions regarding custom workforce scaling or agency deployment? Send our solutions team a message.
            </p>
          </div>

          <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            {contactSuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Message Transmitted Successfully</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out. Your consultation request has been recorded in the platform database. A representative will contact you within one business day.
                </p>
                <button
                  onClick={() => setContactSuccess(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                {contactError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{contactError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Vikramaditya Rathore"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={contactCompany}
                      onChange={(e) => setContactCompany(e.target.value)}
                      placeholder="e.g. Shield Guard Services Ltd."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Work Email Address *</label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="admin@yourcompany.com"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone Number</label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 98000 00000"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Operational Inquiry / Message *</label>
                  <textarea
                    rows={4}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Describe your workforce size, required deployment posts, or general inquiries..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>{contactSubmitting ? 'Transmitting...' : 'Submit Inquiry'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4 text-sky-300" />
                </div>
                <span className="font-extrabold text-white text-lg">Happiiz HR</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Enterprise multi-tenant workforce management operating system for security, housekeeping, manpower, and IFM providers.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2 text-xs uppercase tracking-wider">Solutions</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li>Security Agency Platform</li>
                <li>Housekeeping & Sanitation</li>
                <li>Manpower Supply Staffing</li>
                <li>Facility Management IFM</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2 text-xs uppercase tracking-wider">Platform Links</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <button onClick={onGoToLogin} className="hover:text-white transition-colors">
                    Login Portal
                  </button>
                </li>
                <li>
                  <button onClick={onGoToRegister} className="hover:text-white transition-colors">
                    Register Company
                  </button>
                </li>
                <li>
                  <button onClick={onOpenDocs} className="hover:text-white transition-colors">
                    Architecture Docs
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2 text-xs uppercase tracking-wider">Compliance & Governance</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <button onClick={onOpenPrivacy} className="hover:text-white transition-colors underline">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button onClick={onOpenTerms} className="hover:text-white transition-colors underline">
                    Terms & Conditions
                  </button>
                </li>
                <li className="text-slate-500">Zero-Trust Tenant Isolation</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} Happiiz HR. All rights reserved. Phase 1 Production Foundation.</p>
            <p>Cloud Run & Firebase Enterprise Certified.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
