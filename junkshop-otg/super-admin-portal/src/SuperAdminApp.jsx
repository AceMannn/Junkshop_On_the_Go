import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import SuperAdminLayout from './layout/SuperAdminLayout';
import OverviewPage from './pages/OverviewPage';
import ApplicationsPage from './pages/ApplicationsPage';
import UsersPage from './pages/UsersPage';
import ContactPage from './pages/ContactPage';
import LogsPage from './pages/LogsPage';
import DeletedRecordsPage from './pages/DeletedRecordsPage';
import AdminManagementPage from './pages/AdminManagementPage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import DataExportPage from './pages/DataExportPage';
import PermanentDeletePage from './pages/PermanentDeletePage';

export default function SuperAdminApp({ user, onLogout }) {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SuperAdminLayout user={user} onLogout={onLogout} />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="deleted-records" element={<DeletedRecordsPage />} />
          <Route path="admin-management" element={<AdminManagementPage />} />
          <Route path="system-settings" element={<SystemSettingsPage />} />
          <Route path="data-export" element={<DataExportPage />} />
          <Route path="permanent-delete" element={<PermanentDeletePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
