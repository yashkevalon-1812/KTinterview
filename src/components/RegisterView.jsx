import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  UserCheck, 
  Sparkles,
  LogIn
} from 'lucide-react';
import { api } from '../services/api';

export default function RegisterView({ onRegisterSuccess, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    appliedRole: 'Walk-in Candidate',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password || !formData.phone) {
      setErrorMsg('Please fill in your Full Name, Email, Password, and Mobile Number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.register(formData);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onRegisterSuccess(res.user);
        }, 1200);
      } else {
        setErrorMsg(res.message || 'Registration failed.');
      }
    } catch (err) {
      setErrorMsg('Error connecting to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] overflow-hidden flex flex-col items-center justify-center p-3 sm:p-4 bg-gradient-to-b from-[#f0f6fa] via-slate-100 to-slate-200 select-none">
      
      <div className="w-full max-w-sm sm:max-w-md">
        
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden backdrop-blur-md">
          
          {/* Header with Kevalon Logo & #034665 */}
          <div className="bg-[#034665] px-6 py-4 text-center relative overflow-hidden">
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
              Walk-in Interview Drive &bull; Account Registration
            </p>
          </div>

          {/* Form Body */}
          <div className="px-6 py-5">
            
            <div className="text-center mb-3">
              <h3 className="text-base font-black text-slate-900 brand-font">
                Create New Account
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Register with your details to access the walk-in portal
              </p>
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 shadow-xs">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3">
              
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-red-500 font-black ml-0.5">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#034665] text-xs text-slate-800"
                    placeholder="e.g. Divyesh Vaghasiya"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address <span className="text-red-500 font-black ml-0.5">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#034665] text-xs text-slate-800"
                    placeholder="e.g. yourname@gmail.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password <span className="text-red-500 font-black ml-0.5">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#034665] text-xs text-slate-800"
                    placeholder="Create a password"
                  />
                </div>
              </div>

              {/* Mobile Phone */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile Number <span className="text-red-500 font-black ml-0.5">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#034665] text-xs text-slate-800"
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-[#034665] hover:bg-[#022a3d] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Register Account'}
                <Sparkles className="w-3.5 h-3.5 text-sky-300" />
              </button>

            </form>

            {/* Back to Login */}
            <div className="mt-4 pt-3 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="font-bold text-[#034665] hover:underline inline-flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" /> Sign In here
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
