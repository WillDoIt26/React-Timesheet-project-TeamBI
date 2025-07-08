// src/pages/TimesheetHistoryPage.jsx
import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Paper, Chip, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { format } from 'date-fns';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

const getStatusChip = (status) => {
    const statusMap = {
        draft: { label: 'Draft', color: 'default' },
        submitted: { label: 'Pending', color: 'warning' },
        approved: { label: 'Approved', color: 'success' },
        rejected: { label: 'Declined', color: 'error' },
    };
    const { label, color } = statusMap[status] || { label: status, color: 'default' };
    return <Chip label={label} color={color} size="small" />;
};

const TimesheetHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/timesheet/history');
      setHistory(response.data.map(item => ({ ...item, id: item.timesheet_id })));
    } catch (error) {
      console.error("Failed to fetch timesheet history", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleEdit = (id) => {
    navigate(`/timesheet?edit=${id}`);
  };

  const handleSubmitDraft = async (id) => {
    // We can re-use the update route to just change the status
    try {
        await api.put(`/timesheet/${id}`, { status: 'submitted', projects: [] }); // projects can be empty as backend logic for status update is simple
        fetchHistory(); // Refresh the list
    } catch(error) {
        console.error("Failed to submit draft", error);
    }
  };

  const columns = [
    { field: 'timesheet_id', headerName: 'ID', width: 90 },
    {
      field: 'week_start', headerName: 'Week Starting', width: 180,
      renderCell: (params) => format(new Date(params.value), 'MMM d, yyyy'),
    },
    { field: 'total_hours', headerName: 'Total Hours', width: 150, type: 'number' },
    {
      field: 'status', headerName: 'Status', width: 150,
      renderCell: (params) => getStatusChip(params.value),
    },
    {
        field: 'actions', headerName: 'Actions', flex: 1, sortable: false,
        renderCell: (params) => {
            if (params.row.status === 'draft' || params.row.status === 'rejected') {
                return (
                    <Box>
                        <Button variant="outlined" size="small" onClick={() => handleEdit(params.row.id)} sx={{ mr: 1 }}>Edit</Button>
                        <Button variant="contained" size="small" onClick={() => handleSubmitDraft(params.row.id)}>Submit</Button>
                    </Box>
                )
            }
            return null;
        }
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, height: '85vh', width: '100%' }}>
      <Typography variant="h4" gutterBottom>My Timesheet History</Typography>
      <DataGrid
        rows={history}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10]}
        disableSelectionOnClick
        autoHeight
      />
    </Paper>
  );
};

export default TimesheetHistoryPage;