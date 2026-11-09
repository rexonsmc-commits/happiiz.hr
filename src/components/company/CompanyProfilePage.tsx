/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
  Globe,
  Mail,
  Phone,
  MapPin,
  FileText,
  Upload,
} from 'lucide-react';

export const CompanyProfilePage: React.FC = () => {
  const { currentCompany, updateCurrentCompany, role } = useAuth();

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [directorName, setDirectorName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [alternateNumber, setAlternateNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [cinNumber, setCinNumber] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentCompany) {
      setName(currentCompany.name || '');
      setDisplayName(currentCompany.displayName || currentCompany.name || '');
      setCompanyType(currentCompany.companyType || currentCompany.industry || 'Security Agency');
      setOwnerName(currentCompany.ownerName || currentCompany.adminName || '');
      setDirectorName(currentCompany.directorName || currentCompany.ownerName || '');
      setEmail(currentCompany.adminEmail || '');
      setPhone(currentCompany.phone || '');
      setAlternateNumber(currentCompany.alternateNumber || '');
      setWebsite(currentCompany.website || '');
      setAddress(currentCompany.address || '');
      setCity(currentCompany.city || '');
      setState(currentCompany.state || '');
      setPinCode(currentCompany.pinCode || '');
      setGstNumber(currentCompany.gstNumber || currentCompany.taxId || '');
      setPanNumber(currentCompany.panNumber || '');
      setCinNumber(currentCompany.cinNumber || '');
      setRegistrationDate(currentCompany.registrationDate || currentCompany.createdAt?.substring(0, 10) || '');
      setDescription(currentCompany.description || '');
      setLogoUrl(currentCompany.logoUrl || '');
    }
  }, [currentCompany]);

  if (!currentCompany) {
    return (
      <div className="p-8 text-center text-slate-500">
        No active company selected.
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Company Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('A valid administrative email is required.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await updateCurrentCompany({
        name,
        displayName,
        companyType,
        ownerName,
        directorName,
        adminName: ownerName,
        adminEmail: email,
        phone,
        alternateNumber,
        website,
        address,
        city,
        state,
        pinCode,
        gstNumber,
        panNumber,
        cinNumber,
        registrationDate,
        taxId: gstNumber,
        description,
        logoUrl,
      });

      setSuccessMsg('Company Profile successfully saved to Cloud Firestore.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Failed to update company profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isEditable = role === 'company_admin' || role === 'super_admin';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title & Status Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
              {currentCompany.tenantId}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
              {currentCompany.subscriptionStatus}
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Tenant Company Profile</h1>
          <p className="text-xs text-slate-500">
            Manage company legal entity details, primary contact, and agency branding.
          </p>
        </div>

        {/* Protected Identifier Pill */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 justify-end">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Immutable Tenant Root</span>
          </div>
          <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">
            /companies/{currentCompany.id}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-900 font-semibold animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {/* Section 1: Business Identity */}
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Organization Identity</span>
          </h3>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company Legal Name *
              </label>
              <input
                type="text"
                required
                disabled={!isEditable}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Display Brand Name
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Apex Security"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company Type *
              </label>
              <select
                disabled={!isEditable}
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-50"
              >
                <option value="Security Agency">Security Agency</option>
                <option value="Housekeeping Company">Housekeeping Company</option>
                <option value="Manpower Supply Company">Manpower Supply Company</option>
                <option value="Facility Management Company">Facility Management Company</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Owner Name *
              </label>
              <input
                type="text"
                required
                disabled={!isEditable}
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Managing Director Name
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={directorName}
                onChange={(e) => setDirectorName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company Logo URL
              </label>
              <input
                type="url"
                disabled={!isEditable}
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Section: Statutory & Tax Registration */}
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Statutory Tax & Regulatory Registration</span>
          </h3>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                GSTIN Number
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                placeholder="07AAACA4567M1ZX"
                className="w-full px-3.5 py-2 text-xs font-mono uppercase rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                PAN Number
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value)}
                placeholder="AAACA4567M"
                className="w-full px-3.5 py-2 text-xs font-mono uppercase rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                CIN Number (Optional)
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={cinNumber}
                onChange={(e) => setCinNumber(e.target.value)}
                placeholder="U74920HR2026PLC098765"
                className="w-full px-3.5 py-2 text-xs font-mono uppercase rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company Registration Date
              </label>
              <input
                type="date"
                disabled={!isEditable}
                value={registrationDate}
                onChange={(e) => setRegistrationDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact Details */}
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600" />
            <span>Contact & Online Presence</span>
          </h3>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Business Email *
              </label>
              <input
                type="email"
                required
                disabled={!isEditable}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Phone Number *
              </label>
              <input
                type="tel"
                required
                disabled={!isEditable}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alternate Phone Number
              </label>
              <input
                type="tel"
                disabled={!isEditable}
                value={alternateNumber}
                onChange={(e) => setAlternateNumber(e.target.value)}
                placeholder="+91 124 4567890"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Website URL
              </label>
              <input
                type="url"
                disabled={!isEditable}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://youragency.com"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Physical Address */}
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Registered Business Address</span>
          </h3>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Street Address / Premises
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  disabled={!isEditable}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State / Province</label>
                <input
                  type="text"
                  disabled={!isEditable}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">PIN / Postal Code</label>
                <input
                  type="text"
                  disabled={!isEditable}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Company Description & Operational Specialization
          </label>
          <textarea
            rows={3}
            disabled={!isEditable}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Specialized armed security squad, VIP escort, hospital housekeeping, industrial labor..."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-50"
          />
        </div>

        {/* Submit */}
        {isEditable && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
