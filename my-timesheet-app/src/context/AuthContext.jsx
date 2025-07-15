// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // This loading state is crucial for the ProtectedRoute
  const [loading, setLoading] = useState(true);

  // This effect runs only once when the application loads
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const { data } = await api.get('/user');
        if (data && data.id) {
          setUser(data);
          setIsAuthenticated(true);
        }
      } catch (error) {
        // This is expected if the user is not logged in, so we just log a debug message
        console.log('AuthContext: Verification failed, no active session.');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        // We are done with the initial check
        setLoading(false);
      }
    };
    verifyAuth();
  }, []);

  const login = async (credentials) => {
    // Set loading to true during the login process
    setLoading(true);
    try {
      const response = await api.post('/login', credentials);
      setUser(response.data.user);
      setIsAuthenticated(true);
      setLoading(false); // Done loading
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false); // Done loading (with an error)
      throw error; // Re-throw the error so the login page can catch it
    }
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear the frontend state
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = { user, isAuthenticated, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {/* Don't render children until the initial auth check is complete */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;