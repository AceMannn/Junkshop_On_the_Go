import { useEffect, useState } from 'react';
import AdminDashboard from './components/AdminDashboard';
import AdminLoginScreen from './components/AdminLoginScreen';
import { authApi } from './services/api';
import {
  clearSession,
  getStoredUser,
  getToken,
  persistSession,
  setStoredUser,
} from './utils/authStorage';

export default function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const [booting, setBooting] = useState(Boolean(getToken()));
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setBooting(false);
      return;
    }

    authApi
      .me()
      .then(({ user: currentUser }) => {
        if (currentUser?.role !== 'admin') {
          clearSession();
          setUser(null);
          setSessionExpiredMessage('This session is not authorized for the admin portal.');
          return;
        }

        setUser(currentUser);
        setStoredUser(currentUser);
      })
      .catch((error) => {
        if (error.sessionExpired) {
          setUser(null);
          setSessionExpiredMessage(error.message || 'Session expired. Please sign in again.');
          return;
        }

        if (error.status === 401) {
          clearSession();
          setUser(null);
        }
      })
      .finally(() => setBooting(false));
  }, []);

  const handleLoginSuccess = ({ token, user: sessionUser }) => {
    persistSession({ token, user: sessionUser });
    setUser(sessionUser);
    setSessionExpiredMessage('');
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
  };

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-500">
        Loading admin portal...
      </div>
    );
  }

  if (user?.role === 'admin') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <AdminLoginScreen
      onLoginSuccess={handleLoginSuccess}
      sessionExpiredMessage={sessionExpiredMessage}
    />
  );
}
