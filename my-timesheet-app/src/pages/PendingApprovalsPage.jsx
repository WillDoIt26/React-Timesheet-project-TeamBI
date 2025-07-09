// src/pages/PendingApprovalsPage.jsx

import { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    CircularProgress, Paper, Snackbar, Alert, TableContainer, Table, TableHead, TableBody,
    TableRow, TableCell
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api/axiosConfig';
import { format, parseISO } from 'date-fns';
import VisibilityIcon from '@mui/icons-material/Visibility';

const PendingApprovalsPage = () => {
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [currentTimesheet, setCurrentTimesheet] = useState(null);
    const [action, setAction] = useState('');
    const [managerComment, setManagerComment] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [viewData, setViewData] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const response = await api.get('/timesheet/pending');
            // Ensure every row has a unique 'id' prop for the DataGrid
            setPending(response.data.map(item => ({ ...item, id: item.timesheet_id })));
        } catch (error) {
            console.error("Failed to fetch pending approvals", error);
            setPending([]); // Set to empty array on error to prevent crashes
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const openActionDialog = (timesheet, act) => {
        setCurrentTimesheet(timesheet);
        setAction(act);
        setManagerComment('');
        setActionDialogOpen(true);
    };

    const closeActionDialog = () => {
        setActionDialogOpen(false);
        setCurrentTimesheet(null);
    };

    const handleActionSubmit = async () => {
        if (!currentTimesheet) return;
        try {
            await api.post(`/timesheet/action/${currentTimesheet.id}`, { action, manager_comment: managerComment });
            setSnackbar({ open: true, message: `Timesheet ${action}d successfully.`, severity: 'success' });
            fetchPending(); // Refresh the list of pending items
            closeActionDialog();
        } catch (error) {
            setSnackbar({ open: true, message: `Failed to ${action} timesheet. Please try again.`, severity: 'error' });
        }
    };

    const handleView = async (timesheet) => {
        setViewDialogOpen(true);
        setViewLoading(true);
        try {
            const { data } = await api.get(`/timesheet/${timesheet.id}`);
            setViewData({ ...data, employee_name: timesheet.employee_name });
        } catch (error) {
            console.error("Could not fetch timesheet details", error);
            setSnackbar({ open: true, message: 'Could not load timesheet details.', severity: 'error' });
            setViewDialogOpen(false);
        } finally {
            setViewLoading(false);
        }
    };

    const columns = [
        { field: 'employee_name', headerName: 'Employee', flex: 1 },
        { field: 'week_start', headerName: 'Week Starting', flex: 1, renderCell: (params) => format(new Date(params.value), 'MMM d, yyyy') },
        { field: 'total_hours', headerName: 'Total Hours', width: 130, type: 'number', renderCell: (params) => (params.value || 0).toFixed(2) },
        {
            field: 'actions', headerName: 'Actions', width: 300, sortable: false,
            renderCell: (params) => (
                <Box>
                    <Button variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => handleView(params.row)} sx={{ mr: 1 }}>View</Button>
                    <Button variant="contained" color="success" size="small" onClick={() => openActionDialog(params.row, 'approve')} sx={{ mr: 1 }}>Approve</Button>
                    <Button variant="contained" color="error" size="small" onClick={() => openActionDialog(params.row, 'reject')}>Reject</Button>
                </Box>
            ),
        },
    ];

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
    }

    return (
        <Paper sx={{ p: 2, height: '85vh', width: '100%' }}>
            <Typography variant="h4" gutterBottom>Pending Timesheet Approvals</Typography>
            <DataGrid
                rows={pending}
                columns={columns}
                autoHeight
                initialState={{
                    pagination: { paginationModel: { pageSize: 10 } },
                }}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
            />
            
            <Dialog open={actionDialogOpen} onClose={closeActionDialog} fullWidth maxWidth="sm">
                <DialogTitle sx={{ textTransform: 'capitalize' }}>{action} Timesheet</DialogTitle>
                <DialogContent>
                    <Typography>You are about to {action} the timesheet for {currentTimesheet?.employee_name}.</Typography>
                    <TextField
                        label="Manager Comment (Recommended for Reject)"
                        fullWidth
                        multiline
                        rows={3}
                        value={managerComment}
                        onChange={(e) => setManagerComment(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeActionDialog}>Cancel</Button>
                    <Button onClick={handleActionSubmit} variant="contained" color={action === 'approve' ? 'success' : 'error'}>
                        Confirm {action}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>Timesheet Details: {viewData?.employee_name} - Week of {viewData ? format(parseISO(viewData.week_start), 'MMM d, yyyy') : ''}</DialogTitle>
                <DialogContent>
                    {viewLoading ? <CircularProgress /> : viewData ? (
                        <TableContainer component={Paper} sx={{ mt: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Project</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell align="right">Hours</TableCell>
                                        <TableCell>Notes</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {viewData.projects.length > 0 ? viewData.projects.flatMap(p =>
                                        p.entries.map((e, idx) => (
                                            <TableRow key={`${p.project_id}-${e.date}-${idx}`}>
                                                <TableCell>{p.name}</TableCell>
                                                <TableCell>{format(parseISO(e.date), 'EEE, MMM d')}</TableCell>
                                                <TableCell align="right">{(e.hours || 0).toFixed(2)}</TableCell>
                                                <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{p.notes}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">No time entries found for this timesheet.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : <Typography>No details found.</Typography>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
            
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Paper>
    );
};

export default PendingApprovalsPage;