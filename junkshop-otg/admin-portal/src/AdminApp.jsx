import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './layout/AdminLayout';
import AdminLoginScreen from './components/AdminLoginScreen';
import OverviewPage from './pages/OverviewPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import UsersPage from './pages/UsersPage';
import ContactPage from './pages/ContactPage';
import DeletedRecordsPage from './pages/DeletedRecordsPage';
import LogsPage from './pages/LogsPage';

export default function AdminApp({ user, onLogout }) {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout user={user} onLogout={onLogout} />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="applications/:id" element={<ApplicationDetailPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="deleted-records" element={<DeletedRecordsPage />} />
          <Route path="contact" element={<ContactPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
