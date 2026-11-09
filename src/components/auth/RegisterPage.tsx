/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { IndustryType, SubscriptionPlan } from '../../types';
import {
  Shield,
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lock,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface RegisterPageProps {
  onSuccess: () => void;
  onGoToLogin: () => void;
  onGoToLanding: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSuccess,
  onGoToLogin,
  onGoToLanding,
  onOpenTerms,
  onOpenPrivacy,
}) => {
  const { registerWithEmail } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields per Section 8
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('Security Agency');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Successful confirmation state
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [createdTenantId, setCreatedTenantId] = useState('');

  const mapTypeToIndustry = (type: string): IndustryType => {
    switch (type) {
      case 'Security Agency':
        return 'security';
      case 'Housekeeping Company':
        return 'housekeeping';
      case 'Manpower Supply Company':
        return 'manpower';
      case 'Facility Management Company':
        return 'facility_management';
      default:
        return 'other';
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Validation
    if (!companyName.trim()) {
      setErrorMsg('Company Name is required.');
      return;
    }
    if (!ownerName.trim()) {
      setErrorMsg('Owner/Administrator Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('A valid administrative email address is required.');
      return;
    }
    if (!mobileNumber.trim()) {
      setErrorMsg('Mobile Number is required.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Password and Confirm Password do not match.');
      return;
    }
    if (!businessAddress.trim() || !city.trim() || !state.trim() || !pinCode.trim()) {
      setErrorMsg('Please complete all address fields (Address, City, State, PIN Code).');
      return;
    }
    if (!termsAccepted) {
      setErrorMsg('You must accept the Terms and Conditions to register.');
      return;
    }

    setIsSubmitting(true);

    try {
      const ind = mapTypeToIndustry(companyType);
      const prefix = ind === 'security' ? 'SEC' : ind === 'housekeeping' ? 'CLN' : ind === 'manpower' ? 'MAN' : 'IFM';
      const generatedTenantId = `TEN-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newCompany = await registerWithEmail(email, password, {
        tenantId: generatedTenantId,
        name: companyName,
        industry: ind,
        companyType,
        ownerName,
        adminName: ownerName,
        adminEmail: email,
        phone: mobileNumber,
        address: businessAddress,
        city,
        state,
        pinCode,
        country: 'India',
        currency: 'INR',
        subscriptionPlan: 'starter',
        subscriptionStatus: 'active',
        employeeCount: 0,
        maxEmployees: 100,
        monthlyFee: 2000,
      });

      setCreatedTenantId(newCompany.tenantId);
      setRegisteredSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Registration could not be completed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredSuccess) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Tenant Provisioned Successfully!
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed">
            Welcome to Happiiz HR. Your dedicated multi-tenant workspace for{' '}
            <span className="font-bold text-slate-900">{companyName}</span> has been initialized in Cloud Firestore with Tenant ID{' '}
            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {createdTenantId}
            </span>.
          </p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1">
            <div className="text-slate-500">Administrator: <span className="font-semibold text-slate-800">{ownerName}</span></div>
            <div className="text-slate-500">Authorized Email: <span className="font-semibold text-slate-800 font-mono">{email}</span></div>
            <div className="text-slate-500">Sector: <span className="font-semibold text-slate-800">{companyType}</span></div>
          </div>

          <div className="pt-4">
            <button
              onClick={onSuccess}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>Launch Company Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={onGoToLanding}
            className="inline-flex items-center gap-2.5 p-2 rounded-2xl hover:bg-slate-200 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-950 via-blue-900 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Shield className="w-5 h-5 text-sky-300" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xl font-black text-slate-900">Happiiz</span>
                <span className="text-xl font-black text-blue-600">HR</span>
              </div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Multi-Tenant Onboarding
              </p>
            </div>
          </button>

          <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">
            Register Your Company
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Create an isolated workforce management workspace for your security, cleaning, manpower, or facility firm.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {/* 1. Organization Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100">
                1. Organization Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Rexon Security & Manpower Solutions"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company Type *
                  </label>
                  <select
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Security Agency">Security Agency</option>
                    <option value="Housekeeping Company">Housekeeping Company</option>
                    <option value="Manpower Supply Company">Manpower Supply Company</option>
                    <option value="Facility Management Company">Facility Management Company</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Primary Administrator */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100">
                2. Owner / Administrator Credentials
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Owner / Administrator Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Administrative Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@rexonsecurity.io"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Business Address */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100">
                3. Business Address & Headquarters
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Business Address *
                </label>
                <input
                  type="text"
                  required
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder="Plot 104, Industrial Estate, Phase 1"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="New Delhi"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Delhi"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="110020"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5"
                />
                <span className="text-xs text-slate-600 leading-normal">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={onOpenTerms}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Terms and Conditions
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={onOpenPrivacy}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Privacy Policy
                  </button>
                  . I confirm that I am authorized to register this organization.
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onGoToLogin}
                className="text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Already have an account? Sign In
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Provisioning Instance...' : 'Create Company Workspace'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
