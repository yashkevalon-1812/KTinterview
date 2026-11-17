import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  UserPlus, 
  ShieldCheck, 
  UserCheck, 
  User
} from 'lucide-react';
import { api } from '../services/api';

export default function LoginView({ onLoginSuccess, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle single unified login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both Email and Password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.login({ email, password });
      if (res.success) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.message || 'Login failed. Please check credentials or register first.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to the server. Please check backend.');
    } finally {
      setLoading(false);
    }
  };

  // Detect role badge based on entered email
  const getRoleHint = () => {
    const clean = email.toLowerCase().trim();
    if (!clean) return null;
    if (clean === 'harsh.kt@gamil.in' || clean === 'harsh.kt@gmail.in') {
      return {
        label: 'Admin',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: <ShieldCheck className="w-3 h-3 text-emerald-600" />
      };
    }
    if (clean.includes('.kevalon')) {
      return {
        label: 'Interviewer',
        color: 'bg-blue-100 text-[#034665] border-blue-300',
        icon: <UserCheck className="w-3 h-3 text-[#034665]" />
      };
    }
    return {
      label: 'Candidate',
      color: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: <User className="w-3 h-3 text-amber-600" />
    };
  };

  const roleHint = getRoleHint();

  return (
    <div className="h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] overflow-hidden flex flex-col items-center justify-center p-3 sm:p-4 bg-gradient-to-b from-[#f0f6fa] via-slate-100 to-slate-200 select-none">
      
      <div className="w-full max-w-sm sm:max-w-md">
        
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden backdrop-blur-md">
          
          {/* Header with Kevalon Logo & #034665 Brand Color */}
          <div className="bg-[#034665] px-6 py-4 text-center relative overflow-hidden">
            {/* Ambient gradients */}
            <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-sky-400/10 blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-teal-400/10 blur-2xl pointer-events-none"></div>

            {/* Logo container */}
            <div className="inline-flex items-center justify-center px-4 py-2 bg-white rounded-2xl shadow-lg ring-2 ring-white/20 mb-2 transition-transform hover:scale-105 duration-200">
              <img 
                src="/kevalon-logo-full.png" 
                alt="Kevalon Technology" 
                className="h-9 sm:h-10 w-auto object-contain"
              />
            </div>

            <h2 className="text-xl font-black text-white tracking-tight brand-font">
              KEVALON TECHNOLOGY
            </h2>
            <p className="text-sky-200 text-[11px] font-medium mt-0.5">
              Walk-in Interview Drive 2026 &bull; Single Access Portal
            </p>
          </div>

          {/* Form Body */}
          <div className="px-6 py-5">
            
            <div className="text-center mb-4">
              <h3 className="text-base font-black text-slate-900 brand-font">
                Sign In to Your Account
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Enter your registered ID (Admin, Interviewer, or Candidate)
              </p>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div className="mb-3.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 shadow-xs">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Single Login Form */}
            <form onSubmit={handleLogin} className="space-y-3.5">
              
              {/* Email */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Email Address
                  </label>
                  {roleHint && (
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${roleHint.color}`}>
                      {roleHint.icon} {roleHint.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#034665] text-xs text-slate-800"
                    placeholder="name@example.com or user.kevalon@gmail.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#034665] text-xs text-slate-800"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-[#034665] hover:bg-[#022a3d] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Verifying Account...' : 'Sign In'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

            </form>

            {/* Switch to Registration Link */}
            <div className="mt-4 pt-3.5 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-600">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="font-bold text-[#034665] hover:underline inline-flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Register here
                </button>
              </p>
            </div>

          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-400 mt-3">
          &copy; 2026 Kevalon Technology. All rights reserved.
        </p>

      </div>

    </div>
  );
}
