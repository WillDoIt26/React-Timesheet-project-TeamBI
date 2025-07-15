// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();

  // If the user is not authenticated, redirect them to the login page.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If the route requires specific roles and the user's role doesn't match, redirect.
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />; // Or a dedicated "Access Denied" page
  }

  // If all checks pass, render the child component.
  return children;
};

export default ProtectedRoute;