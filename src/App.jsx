import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import AdminDashboard from './components/AdminDashboard';
import InterviewerDashboard from './components/InterviewerDashboard';
import CandidateDashboard from './components/CandidateDashboard';

export default function App() {
  // Keep user session strictly in memory (no localStorage/sessionStorage persistence)
  // so leaving the site, closing the tab/browser, or navigating away auto-logs out.
  const [currentUser, setCurrentUser] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [refreshKey, setRefreshKey] = useState(0);

  // Clear any old saved session and auto-logout whenever the user exits/leaves the page
  useEffect(() => {
    const clearStoredSession = () => {
      try {
        localStorage.removeItem('kevalon_current_user');
        sessionStorage.removeItem('kevalon_current_user');
      } catch {
        // Ignore storage access errors
      }
    };

    clearStoredSession();

    const handleExitLogout = () => {
      clearStoredSession();
      setCurrentUser(null);
      setAuthView('login');
    };

    const handlePageShow = (event) => {
      // If browser restores the page from back/forward cache (bfcache), force logout
      if (event.persisted) {
        handleExitLogout();
      }
    };

    window.addEventListener('pagehide', handleExitLogout);
    window.addEventListener('beforeunload', handleExitLogout);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pagehide', handleExitLogout);
      window.removeEventListener('beforeunload', handleExitLogout);
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
