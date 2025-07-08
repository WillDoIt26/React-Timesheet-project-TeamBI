// src/components/MainLayout.jsx
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const MainLayout = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: `calc(100% - 240px)` }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;