// src/pages/UserManagementPage.jsx
import { useState, useEffect } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Paper, Snackbar, Alert, Select, MenuItem, InputLabel, FormControl, IconButton, Tooltip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import api from '../api/axiosConfig';
import useAuth from '../hooks/useAuth';

const UserManagementPage = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState({ id: null, username: '', email: '', password: '', role: 'employee', assigned_manager_id: '' });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        if (user && user.role === 'admin') {
            const fetchAllData = async () => {
                setLoading(true);
                try {
                    const [usersResponse, managersResponse] = await Promise.all([
                        api.get('/management/users'),
                        api.get('/management/managers')
                    ]);
                    setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
                    setManagers(Array.isArray(managersResponse.data) ? managersResponse.data : []);
                } catch (error) {
                    console.error("Failed to fetch user management data", error);
                    setSnackbar({ open: true, message: 'Could not load user data.', severity: 'error' });
                    setUsers([]);
                    setManagers([]);
                } finally { setLoading(false); }
            };
            fetchAllData();
        }
    }, [user]);

    const handleOpen = (userData = null) => {
        if (userData) {
            setIsEditing(true);
            setFormData({ id: userData.id, username: userData.username, email: userData.email, password: '', role: userData.role, assigned_manager_id: userData.assigned_manager_id || '' });
        } else {
            setIsEditing(false);
            setFormData({ id: null, username: '', email: '', password: '', role: 'employee', assigned_manager_id: '' });
        }
        setOpen(true);
    };
    const handleClose = () => setOpen(false);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value, ...(name === 'role' && value !== 'employee' && { assigned_manager_id: '' }) }));
    };
    const handleSave = async () => {
        try {
            if (isEditing) {
                await api.put(`/management/users/${formData.id}`, { role: formData.role, assigned_manager_id: formData.assigned_manager_id });
                setSnackbar({ open: true, message: 'User updated successfully!', severity: 'success' });
            } else {
                if (!formData.password) { setSnackbar({ open: true, message: 'Password is required for new users.', severity: 'error' }); return; }
                await api.post('/create-user', formData);
                setSnackbar({ open: true, message: 'User created successfully!', severity: 'success' });
            }
            fetchAllData();
            handleClose();
        } catch (error) {
            setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to save user.', severity: 'error' });
        }
    };

    const filteredUsers = Array.isArray(users) ? users.filter(u => 
        (u.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    ) : [];

    const columns = [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'username', headerName: 'Username', flex: 1 },
        { field: 'email', headerName: 'Email', flex: 1.5 },
        { field: 'role', headerName: 'Role', flex: 1 },
        { field: 'manager_name', headerName: 'Assigned Manager', flex: 1 },
        { field: 'actions', headerName: 'Actions', width: 100, sortable: false, renderCell: (params) => (<Tooltip title="Edit User"><IconButton onClick={() => handleOpen(params.row)}><EditIcon /></IconButton></Tooltip>), }
    ];

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    return (
        <Paper sx={{ p: 2, height: '85vh', width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">User Management</Typography>
                <Button variant="contained" onClick={() => handleOpen()}>Create User</Button>
            </Box>
            <TextField label="Search..." variant="outlined" fullWidth sx={{ mb: 2 }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <DataGrid rows={filteredUsers} columns={columns} getRowId={(row) => row.id} autoHeight initialState={{ pagination: { paginationModel: { pageSize: 10 } }}} pageSizeOptions={[10, 25, 50]} />
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>{isEditing ? 'Edit User' : 'Create New User'}</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" name="username" label="Username" fullWidth variant="standard" value={formData.username} onChange={handleChange} disabled={isEditing} />
                    <TextField margin="dense" name="email" label="Email" fullWidth variant="standard" value={formData.email} onChange={handleChange} disabled={isEditing} />
                    {!isEditing && (<TextField margin="dense" name="password" label="Password" type="password" fullWidth variant="standard" value={formData.password} onChange={handleChange} required />)}
                    <FormControl fullWidth margin="dense" variant="standard">
                        <InputLabel>Role</InputLabel>
                        <Select name="role" value={formData.role} onChange={handleChange}><MenuItem value="employee">Employee</MenuItem><MenuItem value="manager">Manager</MenuItem><MenuItem value="admin">Admin</MenuItem></Select>
                    </FormControl>
                    {formData.role === 'employee' && (
                        <FormControl fullWidth margin="dense" variant="standard">
                            <InputLabel>Assigned Manager</InputLabel>
                            <Select name="assigned_manager_id" value={formData.assigned_manager_id} onChange={handleChange}><MenuItem value=""><em>None</em></MenuItem>{managers.map(m => (<MenuItem key={m.id} value={m.id}>{m.username}</MenuItem>))}</Select>
                        </FormControl>
                    )}
                </DialogContent>
                <DialogActions><Button onClick={handleClose}>Cancel</Button><Button onClick={handleSave} variant="contained">Save</Button></DialogActions>
            </Dialog>
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({...snackbar, open: false})}>
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Paper>
    );
};
export default UserManagementPage;