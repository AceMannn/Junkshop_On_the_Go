import { useEffect, useState } from 'react';
import SuperAdminApp from './SuperAdminApp';
import SuperAdminLoginScreen from './components/SuperAdminLoginScreen';
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
        if (currentUser?.role !== 'super_admin') {
          clearSession();
          setUser(null);
          setSessionExpiredMessage('This session is not authorized for the super admin portal.');
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
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9ff] text-zinc-500">
        Loading super admin portal...
      </div>
    );
  }

  if (user?.role === 'super_admin') {
    return <SuperAdminApp user={user} onLogout={handleLogout} />;
  }

  return (
    <SuperAdminLoginScreen
      onLoginSuccess={handleLoginSuccess}
      sessionExpiredMessage={sessionExpiredMessage}
    />
  );
}
