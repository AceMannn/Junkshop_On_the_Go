import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useOutlet,
} from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LoginScreen from './components/LoginScreen';
import SignUpModal from './components/SignUpModal';
import ProviderDashboard from './components/ProviderDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import PhoneSetupModal from './components/auth/PhoneSetupModal';
import { authApi } from './services/api';
import {
  clearSession,
  getStoredUser,
  getToken,
  persistSession as saveSession,
  setStoredUser,
} from './utils/authStorage';
import { setAuthHandlers } from './utils/authEvents';
import { defaultDashboardPath } from './utils/dashboardRoutes';
import { clearSignUpDrafts } from './utils/authFormDraft';

const LEGACY_HASH_SECTIONS = {
  home: '/',
  about: '/about',
  contact: '/contact',
};

function LegacyHashRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (LEGACY_HASH_SECTIONS[hash]) {
      navigate(LEGACY_HASH_SECTIONS[hash], { replace: true });
      window.history.replaceState(null, '', LEGACY_HASH_SECTIONS[hash]);
    }
  }, [navigate]);

  return null;
}

function PublicShell({
  user,
  onLogout,
  isAuthenticated,
  onShowLogin,
  onShowSignUp,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const outlet = useOutlet();

  const activeSection =
    location.pathname === '/about'
      ? 'about'
      : location.pathname === '/contact'
        ? 'contact'
        : 'home';

  const handleNavigate = (section) => {
    if (section === 'home') navigate('/');
    else if (section === 'about') navigate('/about');
    else if (section === 'contact') navigate('/contact');
    else navigate('/');
  };

  useLayoutEffect(() => {
    if (user) return;
    window.scrollTo(0, 0);
  }, [location.pathname, user]);

  return (
    <div className="min-h-screen site-page-bg">
      <Header
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        isAuthenticated={isAuthenticated}
        onShowLogin={onShowLogin}
        onShowSignUp={onShowSignUp}
      />
      <main>{outlet}</main>
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

function CustomerRoute({ user, children }) {
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/"
        replace
        state={{ showLogin: true, from: location.pathname }}
      />
    );
  }

  if (user.role === 'provider') {
    return <Navigate to="/provider/dashboard" replace />;
  }

  return children;
}

function ProviderRoute({ user, children }) {
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/"
        replace
        state={{ showLogin: true, from: location.pathname }}
      />
    );
  }

  if (user.role !== 'provider') {
    return <Navigate to="/customer/overview" replace />;
  }

  return children;
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => getStoredUser());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [loginPrefill, setLoginPrefill] = useState({
    email: '',
    role: 'customer',
    message: '',
  });
  const [needsPhoneSetup, setNeedsPhoneSetup] = useState(false);
  const [pickupWizardPrefill, setPickupWizardPrefill] = useState(null);
  const [pickupWizardSignal, setPickupWizardSignal] = useState(0);

  const persistSession = ({ token, user: sessionUser }) => {
    saveSession({ token, user: sessionUser });
    setUser(sessionUser);
    setShowLoginModal(false);
    setShowSignUpModal(false);
  };

  const adminPortalUrl =
    import.meta.env.VITE_ADMIN_PORTAL_URL || 'http://localhost:5175';

  const redirectAfterAuth = useCallback(
    (sessionUser) => {
      const from = location.state?.from;
      const fallback = defaultDashboardPath(sessionUser?.role);
      const target =
        typeof from === 'string' &&
        ((sessionUser?.role === 'provider' && from.startsWith('/provider')) ||
          (sessionUser?.role !== 'provider' && from.startsWith('/customer')))
          ? from
          : fallback;
      navigate(target, { replace: true });
    },
    [location.state?.from, navigate]
  );

  const handleAuthSuccess = (session) => {
    if (session?.user?.role === 'admin') {
      clearSession();
      setLoginPrefill({
        email: session.user.email || '',
        role: 'customer',
        message: `Admin accounts must sign in through the admin portal (${adminPortalUrl}).`,
      });
      setShowLoginModal(true);
      return;
    }

    const sessionWithSecurity = {
      ...session,
      user: {
        ...session.user,
        passwordNeedsUpdate: Boolean(session.passwordNeedsUpdate),
        passwordSecurityMessage: session.passwordSecurityMessage || '',
      },
    };

    persistSession(sessionWithSecurity);
    setLoginPrefill({ email: '', role: 'customer', message: '' });
    clearSignUpDrafts();
    if (sessionWithSecurity?.user?.requiresPhoneSetup) {
      setNeedsPhoneSetup(true);
    }
    redirectAfterAuth(sessionWithSecurity.user);
  };

  const handleSignUpComplete = (result) => {
    setShowSignUpModal(false);

    if (result?.token && result?.user) {
      handleAuthSuccess({ token: result.token, user: result.user });
      return;
    }

    if (result?.requiresEmailVerification) {
      setLoginPrefill({
        email: result.email || '',
        role: 'customer',
        message: result.message || 'Verify your email to finish signing up.',
      });
      setShowLoginModal(true);
      return;
    }

    setLoginPrefill({
      email: result?.email || '',
      role: result?.role || 'customer',
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
    navigate('/');
  };

  const handleSessionExpired = useCallback(
    (message) => {
      setUser(null);
      setLoginPrefill({
        email: '',
        role: 'customer',
        message: message || 'Session expired. Please log in again.',
      });
      setShowLoginModal(true);
      navigate('/', { replace: true });
    },
    [navigate]
  );

  const handleAccountSuspended = useCallback(
    (message) => {
      setUser(null);
      setLoginPrefill({
        email: '',
        role: 'customer',
        message:
          message ||
          'Your account is not active. Please contact support if you need help.',
      });
      setShowLoginModal(true);
      navigate('/', { replace: true });
    },
    [navigate]
  );

  useLayoutEffect(() => {
    setAuthHandlers({
      onSessionExpired: handleSessionExpired,
      onAccountSuspended: handleAccountSuspended,
    });

    return () => setAuthHandlers({});
  }, [handleSessionExpired, handleAccountSuspended]);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    if (location.state?.showLogin) {
      setShowLoginModal(true);
      if (location.state?.message) {
        setLoginPrefill((prev) => ({
          ...prev,
          message: location.state.message,
        }));
      }
    }
  }, [location.state?.showLogin, location.state?.message]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    authApi
      .me()
      .then(({ user: currentUser }) => {
        if (currentUser?.role === 'admin') {
          clearSession();
          setUser(null);
          return;
        }

        setUser(currentUser);
        setStoredUser(currentUser);
        if (currentUser?.requiresPhoneSetup) {
          setNeedsPhoneSetup(true);
        }
      })
      .catch((error) => {
        if (error.sessionExpired || error.accountSuspended) return;
        if (error.status === 401) {
          clearSession();
          setUser(null);
        }
      });
  }, []);

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

  useEffect(() => {
    if (!user) return;
    if (['/', '/about', '/contact'].includes(location.pathname)) {
      navigate(defaultDashboardPath(user.role), { replace: true });
    }
  }, [user, location.pathname, navigate]);

  const isAuthenticated = Boolean(user);
  const openLogin = () => {
    setLoginPrefill({ email: '', role: 'customer', message: '' });
    setShowLoginModal(true);
  };

  return (
    <>
      <LegacyHashRedirect />

      <Routes>
        <Route
          element={
            <PublicShell
              user={user}
              onLogout={handleLogout}
              isAuthenticated={isAuthenticated}
              onShowLogin={openLogin}
              onShowSignUp={() => setShowSignUpModal(true)}
            />
          }
        >
          <Route index element={<HomePage onSignInToSell={openLogin} />} />
          <Route path="about" element={<AboutPage onNavigate={(s) => {
            if (s === 'contact') navigate('/contact');
            else if (s === 'home') navigate('/');
            else navigate('/about');
          }} />} />
          <Route path="contact" element={<ContactPage />} />
        </Route>

        <Route
          path="/customer/*"
          element={
            <CustomerRoute user={user}>
              <>
                <CustomerDashboard
                  onLogout={handleLogout}
                  user={user}
                  onUserUpdate={(updatedUser) => {
                    setUser(updatedUser);
                    setStoredUser(updatedUser);
                    if (!updatedUser?.requiresPhoneSetup) {
                      setNeedsPhoneSetup(false);
                    }
                  }}
                  onBookMaterial={(material) => {
                    setPickupWizardPrefill(material);
                    setPickupWizardSignal((value) => value + 1);
                  }}
                  onOpenAllPrices={() => {}}
                  pickupWizardPrefill={pickupWizardPrefill}
                  pickupWizardSignal={pickupWizardSignal}
                />
                {needsPhoneSetup && user && (
                  <PhoneSetupModal
                    user={user}
                    onComplete={(updatedUser) => {
                      setUser(updatedUser);
                      setStoredUser(updatedUser);
                      setNeedsPhoneSetup(false);
                    }}
                  />
                )}
              </>
            </CustomerRoute>
          }
        />

        <Route
          path="/provider/*"
          element={
            <ProviderRoute user={user}>
              <ProviderDashboard
                onLogout={handleLogout}
                user={user}
                onUserUpdate={(updatedUser) => {
                  setUser(updatedUser);
                  setStoredUser(updatedUser);
                }}
              />
            </ProviderRoute>
          }
        />

        <Route
          path="*"
          element={
            user ? (
              <Navigate
                to={defaultDashboardPath(user.role)}
                replace
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>

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

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
