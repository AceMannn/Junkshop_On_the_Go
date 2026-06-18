import { useState, useEffect } from 'react';
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
        // Only clear session when the token is actually invalid — not on Render cold start / network blips
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

  // Show provider dashboard if logged in as provider
  if (isAuthenticated && isProviderMode) {
    return (
      <ProviderDashboard
        onLogout={handleLogout}
        user={user}
        onUserUpdate={(updatedUser) => {
          setUser(updatedUser);
          setStoredUser(updatedUser);
        }}
      />
    );
  }

  // Show customer dashboard if logged in as customer
  if (isAuthenticated && !isProviderMode) {
    return (
      <CustomerDashboard
        onLogout={handleLogout}
        user={user}
        onUserUpdate={(updatedUser) => {
          setUser(updatedUser);
          setStoredUser(updatedUser);
        }}
      />
    );
  }

  // Customer view with header and footer
  const renderPage = () => {
    switch (activeSection) {
      case 'home':
        return <HomePage />;
      case 'about':
        return <AboutPage onNavigate={handleNavigate} />;
      case 'contact':
        return <ContactPage />;
      default:
        return <HomePage />;
    }
  };

  return (
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
        {renderPage()}
      </main>
      <Footer onNavigate={handleNavigate} />

      {/* Login Modal */}
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

      {/* Sign Up Modal */}
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

    </div>
  );
}
