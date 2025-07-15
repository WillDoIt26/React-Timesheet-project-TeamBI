// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const { data } = await api.get('/user');
        if (data && data.id) {
          setUser(data);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.log('AuthContext: Verification failed, no active session.');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await api.post('/login', credentials);
      setUser(response.data.user);
      setIsAuthenticated(true);
      setLoading(false);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
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

  const markProfileAsCompleted = () => {
    setUser(prevUser => ({...prevUser, profileCompleted: true}));
  }

  const value = { user, isAuthenticated, loading, login, logout, markProfileAsCompleted };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;