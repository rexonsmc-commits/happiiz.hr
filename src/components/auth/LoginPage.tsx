/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  Shield,
  Building2,
  Lock,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface LoginPageProps {
  onSuccess: () => void;
  onGoToRegister: () => void;
  onGoToLanding: () => void;
  onGoToForgotPassword: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onGoToRegister,
  onGoToLanding,
  onGoToForgotPassword,
}) => {
  const { loginWithGoogle, loginWithEmail, loginAsRole, availableCompanies, isLoading } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    try {
      await loginWithGoogle();
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Google sign-in could not be completed. Please try again.');
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMsg('Please enter your work email address.');
      return;
    }
    if (!passwordInput.trim()) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    setErrorMsg(null);
    try {
      await loginWithEmail(emailInput, passwordInput);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Invalid credentials or unauthorized account. Please check your credentials.');
    }
  };

  const handleQuickLogin = (role: UserRole, compId?: string) => {
    loginAsRole(role, compId);
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center">
          <button
            onClick={onGoToLanding}
            className="flex items-center gap-2.5 p-2 rounded-2xl hover:bg-slate-200 transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-950 via-blue-900 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/30">
              <Shield className="w-7 h-7 text-sky-300" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-2xl font-black text-slate-900">Happiiz</span>
                <span className="text-2xl font-black text-blue-600">HR</span>
              </div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Enterprise Workforce SaaS
              </p>
            </div>
          </button>
        </div>

        <h2 className="mt-6 text-center text-2xl font-extrabold text-slate-900 tracking-tight">
          Enterprise Portal Sign In
        </h2>
        <p className="mt-2 text-center text-xs text-slate-600">
          Or{' '}
          <button
            onClick={onGoToRegister}
            className="font-bold text-blue-600 hover:text-blue-500 underline"
          >
            register your security, cleaning or manpower agency
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200 sm:px-10">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Standard Form Login */}
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={onGoToForgotPassword}
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all pr-10"
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-600">Remember Me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              {isLoading ? 'Authorizing Session...' : 'Sign In to Workspace'}
            </button>
          </form>

          {/* Primary: Google Enterprise Single Sign-On */}
          <div className="mt-6">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs transition-all cursor-pointer hover:border-slate-400"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google SSO</span>
            </button>
          </div>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-500 font-bold tracking-wider">
                Or Quick Persona Switcher
              </span>
            </div>
          </div>

          {/* Quick Access Roles for Evaluators & Testing */}
          <div className="mt-5 space-y-2.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('super_admin')}
              className="w-full p-3 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100/70 text-left flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                    <span>Master Super Admin (Sandeep Rana)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-200 text-purple-800 font-mono">
                      superadmin@happiizhr.com
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-700">Platform Owner • UID: myHfxnY2nnVBsbwrg3vgu6PhNSR2</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('company_admin', availableCompanies[0]?.id)}
              className="w-full p-3 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-left flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <span>Apex Security Shield (Tenant Admin)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-200 text-blue-800 font-mono">
                      TEN-SEC-8921
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-700">450 Guards • 24 Client Sites • Roster</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Security Guarantee Banner */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>TLS 1.3 & AES-256 Multi-Tenant Encryption</span>
            </div>
            <button
              onClick={onGoToLanding}
              className="text-blue-600 hover:underline font-semibold"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
