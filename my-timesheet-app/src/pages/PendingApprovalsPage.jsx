// src/pages/PendingApprovalsPage.jsx
import { useState, useEffect } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Paper, Snackbar, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api/axiosConfig';
import { format } from 'date-fns';

const PendingApprovalsPage = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [currentTimesheet, setCurrentTimesheet] = useState(null);
  const [action, setAction] = useState(''); // 'approve' or 'reject'
  const [managerComment, setManagerComment] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchPending = async () => {
    setLoading(true);
    try {
      const response = await api.get('/timesheet/pending');
      setPending(response.data.map(item => ({ ...item, id: item.timesheet_id })));
    } catch (error) {
      console.error("Failed to fetch pending approvals", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleOpen = (timesheet, act) => {
    setCurrentTimesheet(timesheet);
    setAction(act);
    setManagerComment('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentTimesheet(null);
  };

  const handleAction = async () => {
    if (!currentTimesheet) return;
    try {
      await api.post(`/timesheet/action/${currentTimesheet.id}`, {
        action,
        manager_comment: managerComment,
      });
      setSnackbar({ open: true, message: `Timesheet ${action}d successfully.`, severity: 'success' });
      fetchPending(); // Refresh the list
      handleClose();
    } catch (error) {
      console.error(`Failed to ${action} timesheet`, error);
      setSnackbar({ open: true, message: `Failed to ${action} timesheet.`, severity: 'error' });
    }
  };

  const columns = [
    { field: 'timesheet_id', headerName: 'ID', width: 90 },
    { field: 'employee_name', headerName: 'Employee', flex: 1 },
    { field: 'week_start', headerName: 'Week Starting', flex: 1, renderCell: (params) => format(new Date(params.value), 'MMM d, yyyy') },
    { field: 'total_hours', headerName: 'Total Hours', width: 130, type: 'number' },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Button variant="contained" color="success" size="small" onClick={() => handleOpen(params.row, 'approve')} sx={{ mr: 1 }}>
            Approve
          </Button>
          <Button variant="contained" color="error" size="small" onClick={() => handleOpen(params.row, 'reject')}>
            Reject
          </Button>
        </Box>
      ),
    },
  ];

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Paper sx={{ p: 2, height: '85vh', width: '100%' }}>
      <Typography variant="h4" gutterBottom>Pending Timesheet Approvals</Typography>
      <DataGrid
        rows={pending}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10]}
        disableSelectionOnClick
        autoHeight
      />

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ textTransform: 'capitalize' }}>{action} Timesheet</DialogTitle>
        <DialogContent>
          <Typography>
            {`You are about to ${action} the timesheet for ${currentTimesheet?.employee_name} for the week of ${currentTimesheet ? format(new Date(currentTimesheet.week_start), 'MMM d, yyyy') : ''}.`}
          </Typography>
          <TextField
            label="Manager Comment (Optional)"
            fullWidth
            multiline
            rows={3}
            value={managerComment}
            onChange={(e) => setManagerComment(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAction} variant="contained" color={action === 'approve' ? 'success' : 'error'}>
            Confirm {action}
          </Button>
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

export default PendingApprovalsPage;