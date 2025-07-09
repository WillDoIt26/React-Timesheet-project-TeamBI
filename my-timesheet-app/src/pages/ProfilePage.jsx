// src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Grid, Snackbar, Alert, CircularProgress } from '@mui/material';
import api from '../api/axiosConfig';

const ProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/profile');
                setProfile(data);
            } catch (error) {
                console.error("Failed to fetch profile", error);
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
        try {
            await api.post('/profile', profile);
            setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to update profile.', severity: 'error' });
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Paper sx={{ p: 4, maxWidth: 800, margin: 'auto' }}>
            <Typography variant="h4" gutterBottom>My Profile</Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
                This information is private and helps your manager and admins connect with you.
            </Typography>
            <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <TextField name="full_name" label="Full Name" value={profile.full_name || ''} onChange={handleChange} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField name="designation" label="Designation (e.g., Software Engineer)" value={profile.designation || ''} onChange={handleChange} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField name="age" label="Age" type="number" value={profile.age || ''} onChange={handleChange} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField name="phone_number" label="Phone Number" value={profile.phone_number || ''} onChange={handleChange} fullWidth />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField name="address" label="Address" value={profile.address || ''} onChange={handleChange} fullWidth multiline rows={3} />
                    </Grid>
                    <Grid item xs={12} container justifyContent="flex-end">
                        <Button type="submit" variant="contained">Save Changes</Button>
                    </Grid>
                </Grid>
            </Box>
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({...snackbar, open: false})}>
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Paper>
    );
};
export default ProfilePage;