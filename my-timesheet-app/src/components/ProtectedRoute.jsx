// src/components/ProtectedRoute.jsx

import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { Box, CircularProgress } from '@mui/material';

const ProtectedRoute = ({ children, roles }) => {
  const { user, isAuthenticated, verifyAuth } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      await verifyAuth();
      setIsVerified(true); // Mark the check as complete
    };

    checkSession();
  }, [verifyAuth, location.pathname]); // Re-verify on route change

  // While the session is being verified, show a full-page loader.
  // This PREVENTS child components (like MyTeamPage) from rendering and fetching data too early.
  if (!isVerified) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // After verification, if not authenticated, redirect to login.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // After verification, if the role doesn't match, redirect to the dashboard.
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // If all checks pass, render the requested page.
  return children;
};

export default ProtectedRoute;