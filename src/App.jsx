import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import AdminDashboard from './components/AdminDashboard';
import InterviewerDashboard from './components/InterviewerDashboard';
import CandidateDashboard from './components/CandidateDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('kevalon_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('kevalon_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('kevalon_current_user');
    }
  }, [currentUser]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
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
