// src/pages/UserManagementPage.jsx
import { useState, useEffect } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Paper, Snackbar, Alert, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api/axiosConfig';

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'employee' });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
            setSnackbar({ open: true, message: 'Could not load users.', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpen = () => {
        setFormData({ username: '', email: '', password: '', role: 'employee' });
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            await api.post('/create-user', formData);
            setSnackbar({ open: true, message: 'User created successfully!', severity: 'success' });
            fetchUsers();
            handleClose();
        } catch (error) {
            console.error("Failed to create user", error);
            setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to create user.', severity: 'error' });
        }
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'username', headerName: 'Username', flex: 1 },
        { field: 'email', headerName: 'Email', flex: 1.5 },
        { field: 'role', headerName: 'Role', flex: 1 },
    ];

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Paper sx={{ p: 2, height: '85vh', width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">User Management</Typography>
                <Button variant="contained" onClick={handleOpen}>Create User</Button>
            </Box>
            <DataGrid
                rows={users}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10]}
                disableSelectionOnClick
                autoHeight
            />

            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Create New User</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" name="username" label="Username" type="text" fullWidth variant="standard" value={formData.username} onChange={handleChange} />
                    <TextField margin="dense" name="email" label="Email" type="email" fullWidth variant="standard" value={formData.email} onChange={handleChange} />
                    <TextField margin="dense" name="password" label="Password" type="password" fullWidth variant="standard" value={formData.password} onChange={handleChange} />
                    <FormControl fullWidth margin="dense" variant="standard">
                        <InputLabel id="role-select-label">Role</InputLabel>
                        <Select
                            labelId="role-select-label"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            label="Role"
                        >
                            <MenuItem value="employee">Employee</MenuItem>
                            <MenuItem value="manager">Manager</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">Create</Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({...snackbar, open: false})}>
                <Alert onClose={() => setSnackbar({...snackbar, open: false})} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Paper>
    );
};

export default UserManagementPage;