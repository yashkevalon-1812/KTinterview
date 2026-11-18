import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import AdminDashboard from './components/AdminDashboard';
import InterviewerDashboard from './components/InterviewerDashboard';
import CandidateDashboard from './components/CandidateDashboard';

export default function App() {
  // Store active user in sessionStorage (NOT localStorage):
  // - Page refresh (F5 / Reload) keeps the user logged in.
  // - Closing the tab/browser, opening a new tab, or navigating away & returning auto-logs out.
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      // Remove any legacy localStorage session
      localStorage.removeItem('kevalon_current_user');

      // If user navigated away to another website and returned via Back/Forward, force logout
      const navEntries = typeof performance !== 'undefined' && performance.getEntriesByType
        ? performance.getEntriesByType('navigation')
        : [];
      const navType = navEntries[0]?.type;
      if (navType === 'back_forward') {
        sessionStorage.removeItem('kevalon_current_user');
        return null;
      }

      const saved = sessionStorage.getItem('kevalon_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync currentUser with sessionStorage (auto-clears when tab/browser is closed)
  useEffect(() => {
    try {
      if (currentUser) {
        sessionStorage.setItem('kevalon_current_user', JSON.stringify(currentUser));
      } else {
        sessionStorage.removeItem('kevalon_current_user');
      }
    } catch {
      // Ignore storage access errors
    }
  }, [currentUser]);

  // If browser restores the page from back/forward cache (bfcache) after leaving the site, log out
  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        try {
          localStorage.removeItem('kevalon_current_user');
          sessionStorage.removeItem('kevalon_current_user');
        } catch {
          // Ignore storage access errors
        }
        setCurrentUser(null);
        setAuthView('login');
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('kevalon_current_user');
      sessionStorage.removeItem('kevalon_current_user');
    } catch {
      // Ignore storage access errors
    }
    setCurrentUser(null);
    setAuthView('login');
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const isFixedPage = !currentUser && (authView === 'login' || authView === 'register');

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col text-slate-800 ${isFixedPage ? 'h-screen overflow-hidden' : ''}`}>
      
      {/* Top Navbar with Kevalon Logo and #034665 branding */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onRefresh={currentUser ? handleRefresh : null}
      />

      {/* Main Content Area */}
      <main className={`flex-grow ${isFixedPage ? 'overflow-hidden' : ''}`}>
        {!currentUser ? (
          authView === 'register' ? (
            <RegisterView 
              onRegisterSuccess={handleLoginSuccess}
              onSwitchToLogin={() => setAuthView('login')}
            />
          ) : (
            <LoginView 
              onLoginSuccess={handleLoginSuccess} 
              onSwitchToRegister={() => setAuthView('register')}
            />
          )
        ) : currentUser.role === 'admin' ? (
          <AdminDashboard key={refreshKey} currentUser={currentUser} />
        ) : currentUser.role === 'interviewer' ? (
          <InterviewerDashboard key={refreshKey} currentUser={currentUser} />
        ) : currentUser.role === 'candidate' ? (
          <CandidateDashboard key={refreshKey} currentUser={currentUser} />
        ) : (
          <LoginView 
            onLoginSuccess={handleLoginSuccess} 
            onSwitchToRegister={() => setAuthView('register')}
          />
        )}
      </main>

    </div>
  );
}
