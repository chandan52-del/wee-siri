import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ShieldCheck, Lock, ArrowRight, ArrowLeft, KeyRound, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { loginAdmin, navigateTo, isAdmin, authError } = useStore();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (isAdmin) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const trimmed = password.trim();
    if (!trimmed) {
      setErrorMsg('Please enter your administrator password.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);
    try {
      const ok = await loginAdmin(trimmed);
      if (ok) {
        navigateTo('admin-dashboard');
      } else {
        setErrorMsg(
          authError ||
          'Invalid administrator password. Please check your credentials and try again.'
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login failed. Please check server connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-[#faf9f6]/60">
      <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200 shadow-md p-8 sm:p-10 space-y-6">
        <button
          onClick={() => navigateTo('home')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Storefront</span>
        </button>

        <div className="text-center space-y-2">
          {/* SIRI Wordmark */}
          <div className="inline-block tracking-[0.3em] font-serif text-3xl font-extrabold text-stone-950 pb-1 border-b border-stone-200">
            SIRI
          </div>
          <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center mx-auto border border-stone-200 shadow-2xs mt-3">
            <ShieldCheck className="w-5 h-5 stroke-[1.8]" />
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">
            Store Administrator Portal
          </h1>
          <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
            Authorized store owner sign-in to manage products, categories, media, and WhatsApp order settings.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 leading-snug">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Administrator Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm pl-10 pr-10 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-stone-900 focus:bg-white focus:outline-none transition-all placeholder:text-stone-400"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 bg-stone-950 hover:bg-stone-850 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 active:scale-99 disabled:opacity-50 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>{submitting ? 'Verifying Access...' : 'Sign In to Dashboard'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </form>

        <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 text-stone-500 text-[11px] leading-relaxed text-center">
          🔒 Protected with salted password hashing and backend authorization. Credentials are never exposed in browser scripts.
        </div>
      </div>
    </div>
  );
};
