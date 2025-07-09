// src/context/AuthContext.jsx

import { createContext, useState } from 'react';
import api from '../api/axiosConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // The loading state now ONLY tracks the initial check.
  const [loading, setLoading] = useState(true);

  // This will be called by our ProtectedRoute to verify the session
  const verifyAuth = async () => {
    // If we've already loaded and are authenticated, we don't need to check again.
    if (isAuthenticated) {
        setLoading(false);
        return true;
    }
    try {
      const { data } = await api.get('/user');
      if (data && data.id) {
        setUser(data);
        setIsAuthenticated(true);
        setLoading(false);
        return true;
      }
    } catch (error) {
      console.log('Verification failed, no active session.');
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return false;
    }
  };

  const login = async (credentials) => {
    try {
      const response = await api.post('/login', credentials);
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = { user, isAuthenticated, loading, login, logout, verifyAuth };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;