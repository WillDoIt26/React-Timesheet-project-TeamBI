// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { Container, Box, TextField, Button, Typography, Alert, Paper, Link as MuiLink, CssBaseline } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/register', formData);
      setSuccess('Registration successful! You can now log in.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          // Consistent dark slate background
          background: '#1e293b',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4, // Add padding for smaller screens where the card might be tall
        }}
      >
        <Container component="main" maxWidth="xs">
          <Paper
            elevation={12}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 4,
              // Consistent card styling
              background: '#334155',
              color: '#f1f5f9',
            }}
          >
            <img src="/logoo.png" alt="logo" style={{ width: '60px', height: '60px', marginBottom: '16px' }} />
            
            <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
              Create Account
            </Typography>
            <Typography color="#94a3b8" sx={{ mb: 3 }}>
              Join us by filling out the form below.
            </Typography>
            
            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ width: '100%' }}>
              {error && <Alert severity="error" sx={{ my: 2, width: '100%' }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ my: 2, width: '100%' }}>{success}</Alert>}

              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={formData.username}
                onChange={handleChange}
                InputLabelProps={{ sx: { color: '#94a3b8' } }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#475569' },
                      '&:hover fieldset': { borderColor: '#5eead4' },
                      '&.Mui-focused fieldset': { borderColor: '#2dd4bf' },
                      color: '#f8fafc'
                    },
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                InputLabelProps={{ sx: { color: '#94a3b8' } }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#475569' },
                      '&:hover fieldset': { borderColor: '#5eead4' },
                      '&.Mui-focused fieldset': { borderColor: '#2dd4bf' },
                      color: '#f8fafc'
                    },
                }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                InputLabelProps={{ sx: { color: '#94a3b8' } }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#475569' },
                      '&:hover fieldset': { borderColor: '#5eead4' },
                      '&.Mui-focused fieldset': { borderColor: '#2dd4bf' },
                      color: '#f8fafc'
                    },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  color: '#1e293b',
                  // Consistent accent color from the logo
                  backgroundColor: '#2dd4bf',
                  '&:hover': {
                    backgroundColor: '#5eead4',
                  },
                }}
              >
                Sign Up
              </Button>
              
              <Typography variant="body2" align="center" color="#94a3b8">
                Already have an account?{' '}
                <MuiLink component={RouterLink} to="/login" variant="body2" sx={{
                  fontWeight: 'bold',
                  color: '#5eead4',
                }}>
                  Sign In
                </MuiLink>
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
};

export default RegisterPage;