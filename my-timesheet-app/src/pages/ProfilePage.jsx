// src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  AccountCircle,
  BadgeOutlined,
  CakeOutlined,
  PhoneOutlined,
  HomeOutlined
} from '@mui/icons-material';
import api from '../api/axiosConfig';

const defaultProfile = {
    full_name: '',
    designation: '',
    age: '',
    phone_number: '',
    address: ''
};

const ProfilePage = () => {
    const [profile, setProfile] = useState(defaultProfile);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/profile');
                setProfile(data || defaultProfile); 
            } catch (error) {
                console.error("Failed to fetch profile", error);
                setSnackbar({ open: true, message: 'Could not load your profile data. Please try again.', severity: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.post('/profile', profile);
            setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to update profile.', severity: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <Box sx={{ maxWidth: 800, margin: 'auto' }}>
                <Card elevation={3}>
                    <CardHeader
                        avatar={ <Avatar sx={{ bgcolor: 'primary.main' }}><AccountCircle /></Avatar> }
                        title={<Typography variant="h4">My Profile</Typography>}
                        subheader="This information helps your manager and admins connect with you."
                    />
                    <Divider />
                    <CardContent>
                        <Box component="form" onSubmit={handleSubmit}>
                            {/* CORRECTED: Grid v2 Syntax */}
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom>Personal Information</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField name="full_name" label="Full Name" value={profile.full_name || ''} onChange={handleChange} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><BadgeOutlined /></InputAdornment> }} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField name="designation" label="Designation" value={profile.designation || ''} onChange={handleChange} fullWidth />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField name="age" label="Age" type="number" value={profile.age || ''} onChange={handleChange} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><CakeOutlined /></InputAdornment> }} />
                                </Grid>
                                <Grid item xs={12}><Box sx={{ my: 2 }}><Divider /></Box><Typography variant="h6" gutterBottom>Contact Information</Typography></Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField name="phone_number" label="Phone Number" value={profile.phone_number || ''} onChange={handleChange} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><PhoneOutlined /></InputAdornment> }} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField name="address" label="Address" value={profile.address || ''} onChange={handleChange} fullWidth multiline rows={3} InputProps={{ startAdornment: <InputAdornment position="start"><HomeOutlined /></InputAdornment> }} />
                                </Grid>
                                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button type="submit" variant="contained" disabled={isSaving} startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}>
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }} elevation={6} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ProfilePage;