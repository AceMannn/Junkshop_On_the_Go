import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LoginScreen from './components/LoginScreen';
import SignUpModal from './components/SignUpModal';
import ProviderDashboard from './components/ProviderDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import { authApi } from './services/api';
import {
  clearSession,
  getStoredUser,
  getToken,
  persistSession as saveSession,
  setStoredUser,
} from './utils/authStorage';
import { setAuthHandlers } from './utils/authEvents';

export default function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [user, setUser] = useState(() => getStoredUser());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [loginPrefill, setLoginPrefill] = useState({
    email: '',
    role: 'customer',
    message: '',
  });


  const handleNavigate = (section) => {
    const publicSections = ['home', 'about', 'contact'];
    const nextSection = publicSections.includes(section) ? section : 'home';

    setActiveSection(nextSection);
    window.history.pushState(null, '', `#${nextSection}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const persistSession = ({ token, user: sessionUser }) => {
    saveSession({ token, user: sessionUser });
    setUser(sessionUser);
    setShowLoginModal(false);
    setShowSignUpModal(false);
  };

  const handleAuthSuccess = (session) => {
    persistSession(session);
    setLoginPrefill({ email: '', role: 'customer', message: '' });
  };

  const handleSignUpComplete = ({ email, role }) => {
    setShowSignUpModal(false);
    setLoginPrefill({
      email,
      role,
      message: 'Account created! Please log in.',
    });
    setShowLoginModal(true);
  };

  const handleCloseLogin = () => {
    setShowLoginModal(false);
    setLoginPrefill({ email: '', role: 'customer', message: '' });
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setActiveSection('home');
  };

  const handleSessionExpired = useCallback((message) => {
    setUser(null);
    setActiveSection('home');
    setLoginPrefill({
      email: '',
      role: 'customer',
      message: message || 'Session expired. Please log in again.',
    });
    setShowLoginModal(true);
  }, []);

  const handleAccountSuspended = useCallback((message) => {
    setUser(null);
    setActiveSection('home');
    setLoginPrefill({
      email: '',
      role: 'customer',
      message: message || 'Your account is not active. Please contact support if you need help.',
    });
    setShowLoginModal(true);
  }, []);

  useLayoutEffect(() => {
    setAuthHandlers({
      onSessionExpired: handleSessionExpired,
      onAccountSuspended: handleAccountSuspended,
    });

    return () => setAuthHandlers({});
  }, [handleSessionExpired, handleAccountSuspended]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.slice(1) || 'home';
      setActiveSection(hash);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const token = getToken();

    if (!token) return;

    authApi.me()
      .then(({ user: currentUser }) => {
        setUser(currentUser);
        setStoredUser(currentUser);
      })
      .catch((error) => {
        if (error.sessionExpired || error.accountSuspended) return;
        if (error.status === 401) {
          clearSession();
          setUser(null);
        }
      });
  }, []);

  const isAuthenticated = Boolean(user);
  const isProviderMode = user?.role === 'provider';

  // Disable body scroll when login modal is open
  useEffect(() => {
    if (showLoginModal || showSignUpModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showLoginModal, showSignUpModal]);

  let mainContent;

  if (isAuthenticated && isProviderMode) {
    mainContent = (
      <ProviderDashboard
        onLogout={handleLogout}
        user={user}
        onUserUpdate={(updatedUser) => {
          setUser(updatedUser);
          setStoredUser(updatedUser);
        }}
      />
    );
  } else if (isAuthenticated && !isProviderMode) {
    mainContent = (
      <CustomerDashboard
        onLogout={handleLogout}
        user={user}
        onUserUpdate={(updatedUser) => {
          setUser(updatedUser);
          setStoredUser(updatedUser);
        }}
      />
    );
  } else {
    mainContent = (
      <div className="min-h-screen bg-white">
        <Header
          activeSection={activeSection}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          isAuthenticated={isAuthenticated}
          onShowLogin={() => {
            setLoginPrefill({ email: '', role: 'customer', message: '' });
            setShowLoginModal(true);
          }}
          onShowSignUp={() => setShowSignUpModal(true)}
        />
        <main>
          {activeSection === 'home' && <HomePage />}
          {activeSection === 'about' && <AboutPage onNavigate={handleNavigate} />}
          {activeSection === 'contact' && <ContactPage />}
          {activeSection !== 'home' && activeSection !== 'about' && activeSection !== 'contact' && (
            <HomePage />
          )}
        </main>
        <Footer onNavigate={handleNavigate} />
      </div>
    );
  }

  return (
    <>
      {mainContent}

      {showLoginModal && (
        <LoginScreen
          onLoginSuccess={handleAuthSuccess}
          onClose={handleCloseLogin}
          initialEmail={loginPrefill.email}
          initialRole={loginPrefill.role}
          successMessage={loginPrefill.message}
          onShowSignUp={() => {
            setShowLoginModal(false);
            setLoginPrefill({ email: '', role: 'customer', message: '' });
            setShowSignUpModal(true);
          }}
        />
      )}

      {showSignUpModal && (
        <SignUpModal
          isOpen={showSignUpModal}
          onClose={() => setShowSignUpModal(false)}
          onSignUpComplete={handleSignUpComplete}
          onShowLogin={() => {
            setShowSignUpModal(false);
            setLoginPrefill({ email: '', role: 'customer', message: '' });
            setShowLoginModal(true);
          }}
        />
      )}
    </>
  );
}
