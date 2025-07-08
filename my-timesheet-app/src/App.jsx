// src/App.jsx

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import TimesheetEntryPage from './pages/TimesheetEntryPage';
import TimesheetHistoryPage from './pages/TimesheetHistoryPage';
import ProjectsPage from './pages/ProjectsPage';
import PendingApprovalsPage from './pages/PendingApprovalsPage';
import UserManagementPage from './pages/UserManagementPage';

function App() {
  return (
    // The Router component is now the top-level wrapper
    <Router>
      {/* AuthProvider is inside Router, so all components can use routing hooks */}
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes are nested inside a parent route */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Default child route for "/" */}
            <Route index element={<Navigate to="/timesheet" replace />} />
            
            {/* Standard user routes */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="timesheet" element={<TimesheetEntryPage />} />
            <Route path="history" element={<TimesheetHistoryPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            
            {/* Manager & Admin Routes */}
            <Route 
              path="pending-approvals" 
              element={
                <ProtectedRoute roles={['manager', 'admin']}>
                  <PendingApprovalsPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Only Routes */}
            <Route 
              path="user-management" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <UserManagementPage />
                </ProtectedRoute>
              } 
            />
          </Route>
          
          {/* A catch-all for any unknown paths */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;