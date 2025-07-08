// src/pages/LoginPage.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import hook here
import {
  Container, Box, TextField, Button, Typography, Alert, Avatar,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate(); // Initialize hook here

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login({ username, password });
      navigate('/timesheet'); // Navigate on success
    } catch (err) {
      setError('Invalid username or password. Please try again.');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 3,
          borderRadius: 2,
          boxShadow: 3,
          backgroundColor: 'background.paper'
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
            <img src="/logo.svg" alt="logo" style={{ width: '60%', height: '60%' }} />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign in to TimeTrack
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
            sx={{ mt: 3, mb: 2, py: 1.5 }}
          >
            Sign In
          </Button>
          <Typography variant="body2" align="center">
            Don't have an account?{' '}
            <RouterLink to="/register" style={{ textDecoration: 'none' }}>
              <Button>Sign Up</Button>
            </RouterLink>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;