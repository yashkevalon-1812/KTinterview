import React, { useState, useEffect } from 'react';
import { LogOut, RefreshCw, UserCheck, ShieldCheck } from 'lucide-react';

export default function Navbar({ currentUser, onLogout, onRefresh }) {
  const [time, setTime] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> Admin
          </span>
        );
      case 'interviewer':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-200 border border-sky-400/30">
            <UserCheck className="w-3.5 h-3.5 text-sky-300" /> Interviewer
          </span>
        );
      case 'candidate':
        return null;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#034665] text-white shadow-lg border-b border-[#055d87]/80">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo - Kevalon Technology (Proper high-res logo, clearly visible) */}
          <div className="flex items-center">
            <div className="bg-white px-3.5 py-1.5 rounded-xl shadow-md border border-white/30 flex items-center transition-all hover:shadow-lg">
              <img 
                src="/kevalon-logo-full.png" 
                alt="Kevalon Technology" 
                className="h-8 sm:h-9 w-auto object-contain select-none"
              />
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Live Clock & Date */}
            <div className="hidden md:flex flex-col text-right pr-3 border-r border-sky-700/50">
              <span className="text-xs sm:text-sm font-semibold tracking-wider text-sky-100 font-mono">
                {time}
              </span>
              <span className="text-[10px] text-sky-200/70 font-medium">
                {today}
              </span>
            </div>

            {/* Refresh Button */}
            {currentUser && onRefresh && (
              <button
                onClick={onRefresh}
                title="Refresh Live Data"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-sky-100 transition-colors border border-white/15"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            {/* Current User Info & Logout */}
            {currentUser ? (
              <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-sky-700/50">
                
                {/* User Name & Role Badge */}
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-white tracking-tight hidden sm:inline">
                    {currentUser.name || currentUser.fullName}
                  </span>
                  {getRoleBadge(currentUser.role)}
                </div>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  title="Logout / Switch Account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : null}

          </div>

        </div>
      </div>
    </header>
  );
}
