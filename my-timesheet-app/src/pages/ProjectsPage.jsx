// src/pages/ProjectsPage.jsx
import { useState, useEffect } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, FormControlLabel, Paper } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api/axiosConfig';
import useAuth from '../hooks/useAuth';

const ProjectsPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState({ name: '', billable: true });

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.map(p => ({ ...p, id: p.project_id })));
    } catch (error) {
      console.error("Failed to fetch projects", error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);
  
  const handleOpen = (project = null) => {
    if (project) {
        setIsEditing(true);
        setCurrentProject({ ...project, project_id: project.id });
    } else {
        setIsEditing(false);
        setCurrentProject({ name: '', billable: true });
    }
    setOpen(true);
  };
  
  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = async () => {
    try {
        if (isEditing) {
            await api.put(`/projects/${currentProject.project_id}`, { name: currentProject.name, billable: currentProject.billable });
        } else {
            await api.post('/projects', { name: currentProject.name, billable: currentProject.billable });
        }
        fetchProjects();
        handleClose();
    } catch (error) {
        console.error("Failed to save project", error);
    }
  };
  
  const columns = [
    { field: 'project_id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Project Name', flex: 1 },
    { field: 'billable', headerName: 'Billable', width: 120, type: 'boolean' },
  ];
  
  if (user?.role === 'admin') {
      columns.push({
        field: 'actions',
        headerName: 'Actions',
        width: 150,
        sortable: false,
        renderCell: (params) => (
            <Button variant="outlined" size="small" onClick={() => handleOpen(params.row)}>Edit</Button>
        ),
      });
  }


  return (
    <Paper sx={{ p: 2, height: '85vh', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Projects</Typography>
        {user?.role === 'admin' && (
          <Button variant="contained" onClick={() => handleOpen()}>Add Project</Button>
        )}
      </Box>
      <DataGrid
        rows={projects}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10]}
        disableSelectionOnClick
        autoHeight
      />

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{isEditing ? 'Edit Project' : 'Add New Project'}</DialogTitle>
        <DialogContent>
            <TextField autoFocus margin="dense" id="name" label="Project Name" type="text" fullWidth variant="standard" value={currentProject.name} onChange={(e) => setCurrentProject({...currentProject, name: e.target.value})} />
            <FormControlLabel control={<Checkbox checked={currentProject.billable} onChange={(e) => setCurrentProject({...currentProject, billable: e.target.checked})} />} label="Billable" />
        </DialogContent>
        <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ProjectsPage;