// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If roles are specified, check if the user has one of the allowed roles
  if (roles && !roles.includes(user.role)) {
    // Redirect to a more appropriate page, like the main dashboard or an "unauthorized" page
    return <Navigate to="/timesheet" />;
  }

  return children;
};

export default ProtectedRoute;