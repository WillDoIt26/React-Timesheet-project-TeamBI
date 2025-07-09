// src/pages/ProjectsPage.jsx
import { useState, useEffect } from 'react';
import { Box, Typography, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Checkbox, FormControlLabel, Paper, Tooltip, IconButton, Snackbar, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import useAuth from '../hooks/useAuth';
import api from '../api/axiosConfig';

const ProjectsPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState({ name: '', billable: true, project_owner: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error("Failed to fetch projects", error);
      setProjects([]);
    }
  };

  useEffect(() => { fetchProjects(); }, []);
  
  const handleOpen = (project = null) => {
    if (project) {
        setIsEditing(true);
        setCurrentProject({ id: project.project_id, name: project.name, billable: project.billable, project_owner: project.project_owner });
    } else {
        setIsEditing(false);
        setCurrentProject({ name: '', billable: true, project_owner: '' });
    }
    setOpen(true);
  };
  
  const handleClose = () => setOpen(false);

  const handleSave = async () => {
    try {
        const payload = {name: currentProject.name, billable: currentProject.billable, project_owner: currentProject.project_owner}
        if (isEditing) {
            await api.put(`/projects/${currentProject.id}`, payload);
            setSnackbar({open: true, message: "Project updated successfully!", severity: 'success'});
        } else {
            await api.post('/projects', payload);
            setSnackbar({open: true, message: "Project created successfully!", severity: 'success'});
        }
        fetchProjects();
        handleClose();
    } catch (error) {
        setSnackbar({open: true, message: error.response?.data?.error || "Failed to save project.", severity: 'error'});
    }
  };
  
  const openDeleteDialog = (project) => {
    setProjectToDelete(project);
    setDeleteConfirmOpen(true);
  };
  
  const handleDelete = async () => {
    try {
        await api.delete(`/projects/${projectToDelete.project_id}`);
        setSnackbar({ open: true, message: 'Project deleted successfully!', severity: 'success' });
        fetchProjects();
    } catch (error) {
        setSnackbar({ open: true, message: 'Failed to delete project.', severity: 'error' });
    } finally {
        setDeleteConfirmOpen(false);
        setProjectToDelete(null);
    }
  };
  
  const columns = [
    { field: 'project_id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Project Name', flex: 1 },
    { field: 'project_owner', headerName: 'Project Owner', flex: 1 },
    { field: 'billable', headerName: 'Billable', width: 120, type: 'boolean' },
  ];
  
  if (canManage) {
      columns.push({
        field: 'actions', headerName: 'Actions', width: 150, sortable: false,
        renderCell: (params) => (
            <Box>
                <Tooltip title="Edit Project"><IconButton onClick={() => handleOpen(params.row)}><EditIcon /></IconButton></Tooltip>
                <Tooltip title="Delete Project"><IconButton onClick={() => openDeleteDialog(params.row)} color="error"><DeleteIcon /></IconButton></Tooltip>
            </Box>
        ),
      });
  }

  return (
    <Paper sx={{ p: 2, height: '85vh', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Projects</Typography>
        {canManage && (<Button variant="contained" onClick={() => handleOpen()}>Add Project</Button>)}
      </Box>
      <DataGrid rows={projects} columns={columns} getRowId={(row) => row.project_id} autoHeight initialState={{ pagination: { paginationModel: { pageSize: 10 } }}} pageSizeOptions={[10, 25, 50]}/>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{isEditing ? 'Edit Project' : 'Add New Project'}</DialogTitle>
        <DialogContent>
            <TextField autoFocus margin="dense" name="name" label="Project Name" type="text" fullWidth variant="standard" value={currentProject.name} onChange={(e) => setCurrentProject({...currentProject, name: e.target.value})} />
            <TextField margin="dense" name="project_owner" label="Project Owner" type="text" fullWidth variant="standard" value={currentProject.project_owner} onChange={(e) => setCurrentProject({...currentProject, project_owner: e.target.value})} />
            <FormControlLabel control={<Checkbox checked={currentProject.billable} onChange={(e) => setCurrentProject({...currentProject, billable: e.target.checked})} />} name="billable" label="Billable" />
        </DialogContent>
        <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent><DialogContentText>Are you sure you want to delete the project "{projectToDelete?.name}"?</DialogContentText></DialogContent>
        <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({...snackbar, open: false})}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Paper>
  );
};
export default ProjectsPage;