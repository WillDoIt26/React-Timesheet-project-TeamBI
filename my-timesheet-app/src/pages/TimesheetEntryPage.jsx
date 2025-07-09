  // src/pages/TimesheetEntryPage.jsx

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField,
  IconButton, Autocomplete, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Tooltip
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NotesIcon from '@mui/icons-material/Notes';
<<<<<<< HEAD
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'; // Import Remove Icon
import { startOfWeek, endOfWeek, addDays, format, getDay, subWeeks, addWeeks, parseISO } from 'date-fns';
=======
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
// *** MODIFICATION 1: Import the necessary date-fns functions ***
import { startOfWeek, endOfWeek, addDays, format, getDay, subWeeks, addWeeks, parseISO, isPast, endOfISOWeek } from 'date-fns';
>>>>>>> 7b16ed7172c92d528d4776800a592744004c55cd
import api from '../api/axiosConfig';

const weekStartsOn = 1; // Monday

const TimesheetEntryPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('edit');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [projects, setProjects] = useState([]);
  const [timesheetRows, setTimesheetRows] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [submitAction, setSubmitAction] = useState(null);
  
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [currentNotes, setCurrentNotes] = useState({ value: '', rowIndex: null });

  const weekStart = startOfWeek(currentDate, { weekStartsOn });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn });
  const weekDates = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
<<<<<<< HEAD
  
  const dailyTotals = Array(7).fill(0);
  timesheetRows.forEach(row => {
    row.daily_hours.forEach((hour, i) => { dailyTotals[i] += hour; });
  });

=======

  // *** MODIFICATION 2: Add the isEditable flag ***
  const isEditable = !isPast(endOfISOWeek(weekStart)) || !!editId;
  
  const dailyTotals = Array(7).fill(0);
  timesheetRows.forEach(row => {
    row.daily_hours.forEach((hour, i) => { dailyTotals[i] += parseFloat(hour) || 0; });
  });

>>>>>>> 7b16ed7172c92d528d4776800a592744004c55cd
  useEffect(() => {
    const loadTimesheetForEdit = async (id) => {
        try {
            const { data } = await api.get(`/timesheet/${id}`);
            const editDate = parseISO(data.week_start);
            setCurrentDate(editDate);

            const editWeekStart = startOfWeek(editDate, { weekStartsOn });
            const editWeekDates = Array.from({ length: 7 }).map((_, i) => addDays(editWeekStart, i));

            const transformedRows = data.projects.map(p => {
<<<<<<< HEAD
                const daily_hours = Array(7).fill(0);
=======
                const daily_hours = Array(7).fill(0);  
>>>>>>> 7b16ed7172c92d528d4776800a592744004c55cd
                p.entries.forEach(entry => {
                    const entryDate = format(parseISO(entry.date), 'yyyy-MM-dd');
                    const dayIndex = editWeekDates.findIndex(d => format(d, 'yyyy-MM-dd') === entryDate);
                    if (dayIndex !== -1) {
                        daily_hours[dayIndex] = entry.hours;
                    }
                });
                return {
                    project_id: p.project_id,
                    name: p.name,
                    notes: p.notes || '',
                    daily_hours,
                };
            });
            setTimesheetRows(transformedRows);
        } catch (error) {
            console.error("Failed to load timesheet for editing", error);
            navigate('/timesheet'); 
        }
    };

    if (editId) {
        loadTimesheetForEdit(editId);
    }
  }, [editId, navigate]);


  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects');
        setProjects(response.data);
      } catch (error) {
        console.error("Failed to fetch projects", error);
      }
    };
    fetchProjects();
  }, []);

  const handleAddRow = (project) => {
    if (project && !timesheetRows.some(row => row.project_id === project.project_id)) {
      setTimesheetRows([ ...timesheetRows, { project_id: project.project_id, name: project.name, daily_hours: Array(7).fill(0), notes: '' } ]);
    }
  };

<<<<<<< HEAD
  // NEW FUNCTION: To remove a project row
=======
>>>>>>> 7b16ed7172c92d528d4776800a592744004c55cd
  const handleRemoveRow = (rowIndex) => {
    const newRows = timesheetRows.filter((_, index) => index !== rowIndex);
    setTimesheetRows(newRows);
  };

  const handleHourChange = (rowIndex, dayIndex, value) => {
    const newRows = [...timesheetRows];
    newRows[rowIndex].daily_hours[dayIndex] = parseFloat(value) || 0;
    setTimesheetRows(newRows);
  };
  
  const handleNoteChange = (rowIndex, value) => {
    const newRows = [...timesheetRows];
    newRows[rowIndex].notes = value;
    setTimesheetRows(newRows);
  };

  const openNotesDialog = (rowIndex) => {
      setCurrentNotes({ value: timesheetRows[rowIndex].notes, rowIndex });
      setNotesDialogOpen(true);
  };
  
  const saveNotes = () => {
      handleNoteChange(currentNotes.rowIndex, currentNotes.value);
      setNotesDialogOpen(false);
  };

  const handleConfirmSubmit = (status) => {
<<<<<<< HEAD
    if (timesheetRows.length > 0 && timesheetRows.flatMap(r => r.daily_hours).reduce((a, b) => a + b, 0) === 0) {
       setSnackbar({ open: true, message: 'Timesheet has projects but no hours. Please enter hours or save as a draft.', severity: 'warning' });
       return;
=======
    if (timesheetRows.length === 0) {
      setSnackbar({ open: true, message: 'Please add at least one project.', severity: 'warning' });
      return;
    }
    if (timesheetRows.length > 0 && timesheetRows.flatMap(r => r.daily_hours).reduce((a, b) => a + b, 0) === 0 && status === 'submitted') {
      setSnackbar({ open: true, message: 'Cannot submit a timesheet with zero hours.', severity: 'warning' });
      return;
>>>>>>> 7b16ed7172c92d528d4776800a592744004c55cd
    }
    setSubmitAction(status);
    setConfirmDialogOpen(true);
  };

  const handleSubmit = async () => {
    setConfirmDialogOpen(false);
    const payload = {
      week_start: format(weekStart, 'yyyy-MM-dd'),
      status: submitAction,
      projects: timesheetRows.map(row => ({
        project_id: row.project_id,
        daily_hours: row.daily_hours,
        dates: weekDates.map(d => format(d, 'yyyy-MM-dd')),
        notes: row.notes,
      }))
    };
    
    try {
        if (editId) {
            await api.put(`/timesheet/${editId}`, payload);
        } else {
            await api.post('/timesheet', payload);
        }
        setSnackbar({ open: true, message: `Timesheet ${submitAction} successfully!`, severity: 'success' });
        navigate('/history');
    } catch (error) {
<<<<<<< HEAD
       setSnackbar({ open: true, message: 'Failed to save timesheet.', severity: 'error' });
       console.error("Failed to save timesheet", error);
=======
      setSnackbar({ open: true, message: 'Failed to save timesheet.', severity: 'error' });
      console.error("Failed to save timesheet", error);
>>>>>>> 7b16ed7172c92d528d4776800a592744004c55cd
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">{editId ? 'Edit Timesheet' : 'Timesheet Entry'}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => setCurrentDate(subWeeks(currentDate, 1))} disabled={!!editId}> <NavigateBeforeIcon /> </IconButton>
          <Typography variant="h6">{format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}</Typography>
          <IconButton onClick={() => setCurrentDate(addWeeks(currentDate, 1))} disabled={!!editId}> <NavigateNextIcon /> </IconButton>
        </Box>
      </Box>
<<<<<<< HEAD
=======

      {/* *** MODIFICATION 3: Add the warning Alert based on the isEditable flag *** */}
      {!isEditable && !editId && (
        <Alert severity="warning" sx={{mb: 2}}>
            You can only enter or modify time for the current or future weeks. Past weeks are view-only.
        </Alert>
      )}

>>>>>>> 7b16ed7172c92d528d4776800a592744004c55cd
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Notes</TableCell>
              {weekDates.map((date) => (
<<<<<<< HEAD
                <TableCell key={format(date, 'T')} align="center" sx={{ fontWeight: 'bold', backgroundColor: [0,6].includes(getDay(date)) ? '#fafafa' : 'inherit' }}>
=======
                <TableCell key={format(date, 'T')} align="center" sx={{ fontWeight: 'bold', backgroundColor: [0,6].includes(getDay(date)) ? 'action.hover' : 'inherit' }}>
>>>>>>> 7b16ed7172c92d528d4776800a592744004c55cd
                  {format(date, 'EEE')} <br /> {format(date, 'd')}
                </TableCell>
              ))}
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total</TableCell>
<<<<<<< HEAD
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell> {/* NEW: Actions column header */}
            </TableRow>
          </TableHead>
          <TableBody>
            {timesheetRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell>{row.name}</TableCell>
                <TableCell><IconButton onClick={() => openNotesDialog(rowIndex)} color={row.notes ? 'primary' : 'default'}><NotesIcon /></IconButton></TableCell>
                {row.daily_hours.map((hours, dayIndex) => (
                  <TableCell key={dayIndex}>
                    <TextField type="number" size="small" inputProps={{ step: 0.25, min: 0, style: { textAlign: 'center' } }} sx={{ width: '80px' }} value={hours || ''} onChange={(e) => handleHourChange(rowIndex, dayIndex, e.target.value)} />
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>{row.daily_hours.reduce((a, h) => a + h, 0).toFixed(2)}</TableCell>
                {/* NEW: Remove button cell */}
                <TableCell align="center">
                  <Tooltip title="Remove Project">
                    <IconButton onClick={() => handleRemoveRow(rowIndex)} color="error" size="small">
                      <RemoveCircleOutlineIcon />
                    </IconButton>
=======
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* *** MODIFICATION 4: Add `disabled={!isEditable}` to all interactive elements *** */}
            {timesheetRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell>{row.name}</TableCell>
                <TableCell><IconButton onClick={() => openNotesDialog(rowIndex)} color={row.notes ? 'primary' : 'default'} disabled={!isEditable}><NotesIcon /></IconButton></TableCell>
                {row.daily_hours.map((hours, dayIndex) => (
                  <TableCell key={dayIndex}>
                    <TextField
                        type="number"
                        size="small"
                        inputProps={{ step: 0.25, min: 0, max: 24, style: { textAlign: 'center' } }}
                        sx={{ width: '80px' }}
                        value={hours || ''}
                        onChange={(e) => handleHourChange(rowIndex, dayIndex, e.target.value)}
                        disabled={!isEditable}
                      />
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>{row.daily_hours.reduce((a, h) => a + (parseFloat(h) || 0), 0).toFixed(2)}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Remove Project">
                    <span>
                      <IconButton onClick={() => handleRemoveRow(rowIndex)} color="error" size="small" disabled={!isEditable}>
                        <RemoveCircleOutlineIcon />
                      </IconButton>
                    </span>
>>>>>>> 7b16ed7172c92d528d4776800a592744004c55cd
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
<<<<<<< HEAD
            <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
              <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Daily Total</TableCell>
              {dailyTotals.map((total, index) => (<TableCell key={index} align="center" sx={{ fontWeight: 'bold' }}>{total.toFixed(2)}</TableCell>))}
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'primary.main' }}>{dailyTotals.reduce((a, b) => a + b, 0).toFixed(2)}</TableCell>
              <TableCell></TableCell> {/* Empty cell for alignment */}
=======
            <TableRow sx={{ backgroundColor: 'action.hover' }}>
              <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Daily Total</TableCell>
              {dailyTotals.map((total, index) => <TableCell key={index} align="center" sx={{ fontWeight: 'bold' }}>{total.toFixed(2)}</TableCell>)}
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'primary.main' }}>{dailyTotals.reduce((a, b) => a + b, 0).toFixed(2)}</TableCell>
              <TableCell></TableCell>
>>>>>>> 7b16ed7172c92d528d4776800a592744004c55cd
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
<<<<<<< HEAD
        <Autocomplete options={projects.filter(p => !timesheetRows.some(tr => tr.project_id === p.project_id))} getOptionLabel={(option) => option.name} sx={{ width: 300 }} value={null} onChange={(event, newValue) => { if (newValue) handleAddRow(newValue); }} renderInput={(params) => <TextField {...params} label="Add Project to Timesheet" />} />
      </Box>
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={() => handleConfirmSubmit('draft')}>Save as Draft</Button>
        <Button variant="contained" color="primary" onClick={() => handleConfirmSubmit('submitted')}>Submit for Approval</Button>
=======
        <Autocomplete
          disabled={!isEditable}
          options={projects.filter(p => !timesheetRows.some(tr => tr.project_id === p.project_id))}
          getOptionLabel={(option) => option.name} sx={{ width: 300 }} value={null}
          onChange={(event, newValue) => { if (newValue) handleAddRow(newValue); }}
          renderInput={(params) => <TextField {...params} label="Add Project to Timesheet" />}
        />
      </Box>
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={() => handleConfirmSubmit('draft')} disabled={!isEditable}>Save as Draft</Button>
        <Button variant="contained" color="primary" onClick={() => handleConfirmSubmit('submitted')} disabled={!isEditable}>Submit for Approval</Button>
>>>>>>> 7b16ed7172c92d528d4776800a592744004c55cd
      </Box>
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent><DialogContentText>Are you sure you want to {submitAction === 'draft' ? 'save this draft' : 'submit this timesheet'}?</DialogContentText></DialogContent>
        <DialogActions><Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmit} color="primary" variant="contained">Confirm</Button></DialogActions>
      </Dialog>
      <Dialog open={notesDialogOpen} onClose={() => setNotesDialogOpen(false)} fullWidth>
<<<<<<< HEAD
          <DialogTitle>Project Notes</DialogTitle>
          <DialogContent>
              <TextField autoFocus multiline rows={4} fullWidth value={currentNotes.value} onChange={(e) => setCurrentNotes({...currentNotes, value: e.target.value})} />
          </DialogContent>
          <DialogActions><Button onClick={() => setNotesDialogOpen(false)}>Cancel</Button><Button onClick={saveNotes}>Save Notes</Button></DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({...snackbar, open: false})}><Alert onClose={() => setSnackbar({...snackbar, open: false})} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert></Snackbar>
=======
          <DialogTitle>Project Notes for {timesheetRows[currentNotes.rowIndex]?.name}</DialogTitle>
          <DialogContent>
              <TextField autoFocus multiline rows={4} fullWidth value={currentNotes.value || ''} onChange={(e) => setCurrentNotes({...currentNotes, value: e.target.value})} />
          </DialogContent>
          <DialogActions><Button onClick={() => setNotesDialogOpen(false)}>Cancel</Button><Button onClick={saveNotes}>Save Notes</Button></DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({...snackbar, open: false})}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
>>>>>>> 7b16ed7172c92d528d4776800a592744004c55cd
    </Paper>
  );
};

export default TimesheetEntryPage;