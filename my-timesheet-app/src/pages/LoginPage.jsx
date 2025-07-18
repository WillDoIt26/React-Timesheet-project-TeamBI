// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, TextField, Button, Typography, Alert, Paper, Link as MuiLink, CssBaseline
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          // The gradient background
          background: 'linear-gradient(to right top, #65dfc9, #6cdbeb)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Container component="main" maxWidth="xs">
          <Paper
            elevation={12} // A stronger shadow to make the card "pop"
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 4, // Softer corners
            }}
          >
            <img src="/logoo.png" alt="logo" style={{ width: '60px', height: '60px', marginBottom: '16px' }} />
            <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
              Sign In
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Enter your credentials to access to Timesheet App
            </Typography>
            
            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ width: '100%' }}>
              {error && <Alert severity="error" sx={{ my: 2, width: '100%' }}>{error}</Alert>}
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
              >
                Sign In
              </Button>
              
              <Typography variant="body2" align="center">
                Don't have an account?{' '}
                <MuiLink component={RouterLink} to="/register" variant="body2" sx={{ fontWeight: 'bold' }}>
                  Sign Up
                </MuiLink>
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
};

export default LoginPage;