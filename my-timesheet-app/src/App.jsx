// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import MyTeamPage from './pages/MyTeamPage';
import TimesheetEntryPage from './pages/TimesheetEntryPage';
import TimesheetHistoryPage from './pages/TimesheetHistoryPage';
import ProjectsPage from './pages/ProjectsPage';
import PendingApprovalsPage from './pages/PendingApprovalsPage';
import ReportsPage from './pages/ReportsPage';
import UserManagementPage from './pages/UserManagementPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="my-team" element={<ProtectedRoute roles={['manager']}><MyTeamPage /></ProtectedRoute>} />
            <Route path="timesheet" element={<TimesheetEntryPage />} />
            <Route path="history" element={<TimesheetHistoryPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="pending-approvals" element={<ProtectedRoute roles={['manager']}><PendingApprovalsPage /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute roles={['manager', 'admin']}><ReportsPage /></ProtectedRoute>} />
            <Route path="user-management" element={<ProtectedRoute roles={['admin']}><UserManagementPage /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
export default App;