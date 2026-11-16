import { useEffect, useState } from 'react';
import HeaderBar from './components/HeaderBar.jsx';
import LandingPage from './components/LandingPage.jsx';
import AuthModal from './components/AuthModal.jsx';
import PatientPortalPage from './components/PatientPortalPage.jsx';
import DoctorPortalPage from './components/DoctorPortalPage.jsx';
import TriageAlert from './components/TriageAlert.jsx';
import { getCurrentUser, structureCaseSheet } from './services/api.js';

export default function App() {
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [triageReason, setTriageReason] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('viora_token')) return;
    getCurrentUser()
      .then(({ user: currentUser }) => {
        if (currentUser?.role === 'doctor') {
          setUser(currentUser);
          setView('doctor');
        }
      })
      .catch(() => {
        localStorage.removeItem('viora_token');
      });
  }, []);

  const handleAuthSuccess = (signedInUser) => {
    setUser(signedInUser);
    setView('doctor');
    setIsAuthOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('viora_token');
    setUser(null);
    setView('landing');
  };

  const handleStructureCase = async (payload) => {
    const result = await structureCaseSheet(payload);
    return result;
  };

  return (
    <div className="app-shell min-h-screen flex flex-col font-sans">
      <HeaderBar
        user={user}
        language={language}
        onLanguageChange={setLanguage}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-grow py-4 sm:py-6">
        {view === 'landing' && (
          <LandingPage
            language={language}
            onStartIntake={() => setView('patient')}
            onDoctorLogin={() => setIsAuthOpen(true)}
          />
        )}
        {view === 'patient' && (
          <PatientPortalPage
            language={language}
            onStructureComplete={handleStructureCase}
            onRedFlagDetected={setTriageReason}
          />
        )}
        {view === 'doctor' && user && (
          <DoctorPortalPage user={user} language={language} />
        )}
      </main>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        language={language}
      />
      <TriageAlert
        isOpen={Boolean(triageReason)}
        reason={triageReason}
        language={language}
        onClose={() => setTriageReason('')}
      />
    </div>
  );
}
