// src/pages/MyTeamPage.jsx
import { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api/axiosConfig';
import useAuth from '../hooks/useAuth';

const MyTeamPage = () => {
    const { user } = useAuth();
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user && user.role === 'manager') {
            const fetchTeam = async () => {
                setLoading(true);
                setError('');
                try {
                    const response = await api.get('/management/my-team');
                    console.log("Team API Response:", response.data);

                    if (response?.data && Array.isArray(response.data)) {
                        setTeam(response.data);
                    } else if (response?.data?.error) {
                        throw new Error(response.data.error);
                    } else {
                        throw new Error("Unexpected data format from server.");
                    }
                } catch (err) {
                    console.error("Failed to fetch team data:", err);
                    setError('Could not load your team data. Please ensure you are logged in correctly and have employees assigned to you.');
                    setTeam([]);
                } finally {
                    setLoading(false);
                }
            };
            fetchTeam();
        } else {
            setLoading(false);
        }
    }, [user]);

    const columns = [
        { field: 'id', headerName: 'Employee ID', width: 120 },
        { field: 'username', headerName: 'Username', flex: 1 },
        { field: 'email', headerName: 'Email', flex: 1.5 },
    ];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Paper sx={{ p: 3, height: '85vh', width: '100%' }}>
            <Typography variant="h4" gutterBottom>My Team</Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                These are the employees assigned to you. Their submitted timesheets appear in your approval queue.
            </Typography>
            {error && !loading && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}
            <Box sx={{ height: 'calc(100% - 120px)', width: '100%' }}>
                <DataGrid
                    rows={team}
                    columns={columns}
                    getRowId={(row) => row.id}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                    pageSizeOptions={[10, 25, 50]}
                    disableRowSelectionOnClick
                />
            </Box>
        </Paper>
    );
};

export default MyTeamPage;
