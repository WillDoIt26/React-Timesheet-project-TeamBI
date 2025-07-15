// src/pages/ProfilePage.jsx
import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, TextField, Button, Grid, Snackbar, Alert, CircularProgress, Card, CardContent, CardHeader,
  CardActions, Avatar, InputAdornment, Divider, Chip, IconButton, Badge
} from '@mui/material';
import {
  BadgeOutlined, CakeOutlined, PhoneOutlined, HomeOutlined, PersonOutline, CameraAlt, Cancel, Edit
} from '@mui/icons-material';
import useAuth from '../hooks/useAuth';
import api, { serverBaseUrl } from '../api/axiosConfig';

const defaultProfile = {
    full_name: '', designation: '', age: '', phone_number: '', address: '', avatar_url: ''
};

// Component for Displaying Profile Info in View Mode
const InfoRow = ({ icon, label, value }) => (
    <Grid item xs={12} sm={6}>
        <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'action.hover', color: 'text.secondary' }}>{icon}</Avatar>
            <Box>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="subtitle1" fontWeight="medium">{value || 'Not set'}</Typography>
            </Box>
        </Box>
    </Grid>
);

const ProfilePage = () => {
    const { user, markProfileAsCompleted } = useAuth();
    const [profile, setProfile] = useState(defaultProfile);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [isEditMode, setIsEditMode] = useState(user ? !user.profileCompleted : false);

    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/profile');
                setProfile(data || defaultProfile);
                if (!data.profile_completed) {
                    setIsEditMode(true);
                }
            } catch (error) {
                setSnackbar({ open: true, message: 'Could not load profile data.', severity: 'error' });
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchProfile();
    }, [user]);

    const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleAvatarUpload = async () => {
        if (!selectedFile) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('avatar', selectedFile);
        try {
            const { data } = await api.post('/profile/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProfile(prev => ({ ...prev, avatar_url: data.avatarUrl }));
            setSnackbar({ open: true, message: 'Profile picture updated!', severity: 'success' });
            setSelectedFile(null);
            setPreviewUrl(null);
        } catch (error) {
            setSnackbar({ open: true, message: error.response?.data?.error || 'Upload failed.', severity: 'error' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.post('/profile', profile);
            setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
            markProfileAsCompleted();
            setIsEditMode(false);
        } catch (error) {
            setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to update profile.', severity: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;

    const avatarSrc = previewUrl || (profile.avatar_url ? `${serverBaseUrl}${profile.avatar_url}` : '');

    return (
        <>
            <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h4">My Account</Typography>
                    {!isEditMode && user.profileCompleted && (
                        <Button variant="contained" startIcon={<Edit />} onClick={() => setIsEditMode(true)}>Edit Profile</Button>
                    )}
                </Box>
                
                {isEditMode && !user.profileCompleted && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Welcome to Cozentus! Please complete your profile to access all features.
                    </Alert>
                )}

                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Card elevation={3}>
                            <CardContent>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                    <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept="image/*" />
                                    <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                        badgeContent={
                                            isEditMode && (
                                                <IconButton onClick={() => fileInputRef.current.click()} sx={{ bgcolor: 'background.paper', p: 0.5, border: '1px solid lightgray' }}>
                                                    <CameraAlt color="primary" />
                                                </IconButton>
                                            )
                                        }
                                    >
                                        <Avatar src={avatarSrc} sx={{ width: 100, height: 100, mb: 2, fontSize: '3rem' }}>{user?.username?.[0].toUpperCase()}</Avatar>
                                    </Badge>
                                    {previewUrl && (
                                        <Box sx={{ display: 'flex', gap: 1, my: 1 }}>
                                            <Button variant="contained" size="small" onClick={handleAvatarUpload} disabled={isUploading} startIcon={isUploading ? <CircularProgress size={16} color="inherit"/> : null}>{isUploading ? 'Uploading...' : 'Upload'}</Button>
                                            <Button variant="outlined" size="small" onClick={() => { setPreviewUrl(null); setSelectedFile(null); }} startIcon={<Cancel />}>Cancel</Button>
                                        </Box>
                                    )}
                                    <Typography variant="h5" gutterBottom>{user?.username}</Typography>
                                    <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>{user?.email}</Typography>
                                    <Chip label={user?.role} color="primary" sx={{textTransform: 'capitalize'}} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        {isEditMode ? (
                            <Card component="form" onSubmit={handleSubmit} elevation={3}>
                                <CardHeader title="Edit Profile Details" subheader="Make sure your information is up to date."/>
                                <Divider />
                                <CardContent>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}><TextField name="full_name" label="Full Name" value={profile.full_name || ''} onChange={handleChange} required fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><BadgeOutlined /></InputAdornment> }} /></Grid>
                                        <Grid item xs={12} sm={6}><TextField name="designation" label="Designation / Title" value={profile.designation || ''} onChange={handleChange} fullWidth /></Grid>
                                        <Grid item xs={12} sm={6}><TextField name="age" label="Age" type="number" value={profile.age || ''} onChange={handleChange} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><CakeOutlined /></InputAdornment> }} /></Grid>
                                        <Grid item xs={12} sm={6}><TextField name="phone_number" label="Phone Number" value={profile.phone_number || ''} onChange={handleChange} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><PhoneOutlined /></InputAdornment> }} /></Grid>
                                        <Grid item xs={12}><TextField name="address" label="Mailing Address" value={profile.address || ''} onChange={handleChange} fullWidth multiline rows={3} InputProps={{ startAdornment: <InputAdornment position="start"><HomeOutlined /></InputAdornment> }} /></Grid>
                                    </Grid>
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'flex-end', p: 2, gap: 1 }}>
                                    {user.profileCompleted && <Button variant="outlined" onClick={() => setIsEditMode(false)}>Cancel</Button>}
                                    <Button type="submit" variant="contained" disabled={isSaving} startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
                                </CardActions>
                            </Card>
                        ) : (
                            <Card elevation={3}>
                                <CardHeader title="Profile Information" />
                                <Divider/>
                                <CardContent>
                                    <Grid container spacing={3} rowSpacing={3}>
                                        <InfoRow icon={<BadgeOutlined/>} label="Full Name" value={profile.full_name} />
                                        <InfoRow icon={<PersonOutline/>} label="Designation" value={profile.designation} />
                                        <InfoRow icon={<CakeOutlined/>} label="Age" value={profile.age} />
                                        <InfoRow icon={<PhoneOutlined/>} label="Phone Number" value={profile.phone_number} />
                                        <Grid item xs={12}><InfoRow icon={<HomeOutlined/>} label="Address" value={profile.address} /></Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        )}
                    </Grid>
                </Grid>
            </Box>
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }} elevation={6} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </>
    );
};

export default ProfilePage;