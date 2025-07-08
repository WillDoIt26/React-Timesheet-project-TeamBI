// src/context/AuthContext.jsx

import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // This function checks if a session is already active on the server
  const checkAuthStatus = useCallback(async () => {
    try {
      // The backend /user route should return the full user object if a session exists
      const { data } = await api.get('/user');
      setUser(data);
      setIsAuthenticated(true);
    } catch (e) {
      console.log('No active session found.');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (credentials) => {
    try {
        const response = await api.post('/login', credentials);
        setUser(response.data.user);
        setIsAuthenticated(true);
        // We no longer navigate here. The component that calls login will navigate.
    } catch (error) {
        // Let the calling component handle the error message
        console.error('Login failed in AuthContext:', error);
        throw error;
    }
  };

  const logout = async () => {
    try {
        await api.post('/logout');
        setUser(null);
        setIsAuthenticated(false);
        // We no longer navigate here. The component that calls logout will navigate.
    } catch (error) {
        console.error('Logout failed in AuthContext:', error);
        throw error;
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  // Render children only after the initial auth check is complete
  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export default AuthContext;