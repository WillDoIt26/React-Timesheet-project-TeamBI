// src/pages/TimesheetHistoryPage.jsx
import { useState, useEffect } from 'react';
import {
    Box, Typography, CircularProgress, Paper, Chip, Button, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    IconButton
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import CommentIcon from '@mui/icons-material/Comment';
import api from '../api/axiosConfig';

const getStatusChip = (status) => {
    const statusMap = {
        draft: { label: 'Draft', color: 'default' },
        submitted: { label: 'Pending', color: 'warning' },
        approved: { label: 'Approved', color: 'success' },
        rejected: { label: 'Declined', color: 'error' },
    };
    const { label, color } = statusMap[status.toLowerCase()] || { label: status, color: 'default' };
    return <Chip label={label} color={color} size="small" />;
};

const TimesheetHistoryPage = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentOpen, setCommentOpen] = useState(false);
    const [currentComment, setCurrentComment] = useState('');
    const navigate = useNavigate();

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await api.get('/timesheet/history');
            const formattedData = response.data.map(item => ({
                ...item,
                id: item.timesheet_id // Ensure every row has a unique 'id' property
            }));
            setHistory(formattedData);
        } catch (error) {
            console.error("Failed to fetch timesheet history", error);
            setHistory([]); // Prevent crash on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleEdit = (id) => navigate(`/timesheet?edit=${id}`);

    const handleSubmitDraft = async (id) => {
        try {
            // CRITICAL FIX: Only update the status. Do NOT send the `projects` array.
            // Sending `projects: undefined` (by not including it) prevents the backend
            // PUT endpoint from clearing the existing time entries. This call now
            // correctly only changes the status from 'draft' to 'submitted'.
            await api.put(`/timesheet/${id}`, { status: 'submitted' });
            // Refresh the data to show the updated status
            fetchHistory();
        } catch (error) {
            console.error("Failed to submit draft", error);
            // Optionally, show a snackbar error to the user
        }
    };

    const handleViewComment = (comment) => {
        setCurrentComment(comment);
        setCommentOpen(true);
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'week_start', headerName: 'Week Starting', width: 180, renderCell: (params) => format(new Date(params.value), 'MMM d, yyyy') },
        { field: 'total_hours', headerName: 'Total Hours', width: 130, type: 'number', valueFormatter: (params) => (params.value || 0).toFixed(2) },
        { field: 'status', headerName: 'Status', width: 120, renderCell: (params) => getStatusChip(params.value) },
        {
            field: 'actions', headerName: 'Actions', flex: 1, sortable: false,
            renderCell: (params) => (
                <Box>
                    {(params.row.status === 'draft' || params.row.status === 'rejected') && (
                        <>
                            <Button variant="outlined" size="small" onClick={() => handleEdit(params.row.id)} sx={{ mr: 1 }}>Edit</Button>
                            <Button variant="contained" size="small" onClick={() => handleSubmitDraft(params.row.id)}>Submit</Button>
                        </>
                    )}
                    {params.row.manager_comment && (
                        <Tooltip title="View Manager Comment">
                            <IconButton onClick={() => handleViewComment(params.row.manager_comment)} color="info" sx={{ ml: 1 }}>
                                <CommentIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            )
        }
    ];

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

    return (
        <Paper sx={{ p: 2, height: '85vh', width: '100%' }}>
            <Typography variant="h4" gutterBottom>My Timesheet History</Typography>
            <DataGrid
                rows={history}
                columns={columns}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } }}}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                autoHeight
            />
            <Dialog open={commentOpen} onClose={() => setCommentOpen(false)}>
                <DialogTitle>Manager's Comment</DialogTitle>
                <DialogContent><DialogContentText sx={{whiteSpace: "pre-wrap"}}>{currentComment}</DialogContentText></DialogContent>
                <DialogActions><Button onClick={() => setCommentOpen(false)}>Close</Button></DialogActions>
            </Dialog>
        </Paper>
    );
};

export default TimesheetHistoryPage;