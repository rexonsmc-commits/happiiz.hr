/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, ArrowLeft, Mail, CheckCircle2, AlertCircle, Lock } from 'lucide-react';

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
  onGoToLanding: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onBackToLogin,
  onGoToLanding,
}) => {
  const { sendResetEmail, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid company email address.');
      return;
    }

    setErrorMsg(null);
    try {
      await sendResetEmail(email);
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      // Per prompt requirement: Do not reveal whether an arbitrary email belongs to a registered account
      setSubmitted(true);
    }
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
                Password Recovery
              </p>
            </div>
          </button>
        </div>

        <h2 className="mt-6 text-center text-2xl font-extrabold text-slate-900 tracking-tight">
          Reset Your Password
        </h2>
        <p className="mt-2 text-center text-xs text-slate-600">
          Enter your registered work email and we'll send you secure recovery instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200 sm:px-10">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Recovery Email Dispatched</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  If an authorized account is linked with <span className="font-semibold text-slate-900">{email}</span>, password reset instructions have been forwarded. Please check your inbox and spam folder.
                </p>
              </div>
              <div className="pt-4">
                <button
                  onClick={onBackToLogin}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Sign In</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Company Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@agency.com"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{isLoading ? 'Processing Request...' : 'Send Password Reset Email'}</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Login</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
