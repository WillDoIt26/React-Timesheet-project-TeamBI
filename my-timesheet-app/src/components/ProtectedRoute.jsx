import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // 1. Not authenticated: Go to login page.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Authenticated, but profile is not complete.
  // Redirect to the profile page unless they are already there.
  if (user && !user.profileCompleted && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />;
  }

  // 3. Authenticated and has the wrong role for a specific page.
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // 4. All checks pass: Render the requested page.
  return children;
};

export default ProtectedRoute;