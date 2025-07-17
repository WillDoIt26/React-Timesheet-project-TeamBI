// src/pages/ReportsPage.jsx
import { useState, useEffect } from 'react';
import { Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem, Button, CircularProgress, Alert } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import api from '../api/axiosConfig';

const ReportsPage = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [format, setFormat] = useState('csv');
    const [loading, setLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                // We can fetch all users as managers/admins can run reports for anyone.
                const { data } = await api.get('/management/users');
                // Filter for employees, but you could allow reporting on managers too.
                setUsers(data.filter(u => u.role === 'employee'));
            } catch (err) {
                console.error("Failed to fetch users for reporting", err);
                setError('Could not load list of employees.');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleDownload = async () => {
        if (!selectedUser || !format) {
            setError('Please select an employee and a format.');
            return;
        }
        setError('');
        setIsDownloading(true);

        try {
            // Use axios directly to handle blob response type
            const response = await api.get(`/reports/employee-timesheet`, {
                params: {
                    employeeId: selectedUser,
                    format: format,
                },
                responseType: 'blob', // This is crucial for file downloads
            });

            // Create a link to trigger the download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            // Extract filename from response headers if available, otherwise create one
            const contentDisposition = response.headers['content-disposition'];
            let filename = `report.${format}`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (filenameMatch.length > 1) {
                    filename = filenameMatch[1];
                }
            }
            
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error("Download failed:", err);
            setError(err.response?.data?.error || 'Failed to download report. The employee may have no entries.');
        } finally {
            setIsDownloading(false);
        }
    };

    if (loading) {
        return <CircularProgress />;
    }

    return (
        <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>
                Generate Employee Report
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
                Select an employee and a format to download their complete timesheet history.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <FormControl fullWidth>
                    <InputLabel id="employee-select-label">Select Employee</InputLabel>
                    <Select
                        labelId="employee-select-label"
                        value={selectedUser}
                        label="Select Employee"
                        onChange={(e) => setSelectedUser(e.target.value)}
                    >
                        {users.map((user) => (
                            <MenuItem key={user.id} value={user.id}>
                                {user.username} ({user.email})
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel id="format-select-label">Select Format</InputLabel>
                    <Select
                        labelId="format-select-label"
                        value={format}
                        label="Select Format"
                        onChange={(e) => setFormat(e.target.value)}
                    >
                        <MenuItem value="csv">CSV (Spreadsheet)</MenuItem>
                        <MenuItem value="pdf">PDF (Document)</MenuItem>
                    </Select>
                </FormControl>

                <Button
                    variant="contained"
                    size="large"
                    startIcon={isDownloading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                    onClick={handleDownload}
                    disabled={isDownloading || !selectedUser}
                    sx={{ mt: 2, py: 1.5 }}
                >
                    {isDownloading ? 'Generating...' : 'Download Report'}
                </Button>
            </Box>
        </Paper>
    );
};

export default ReportsPage;