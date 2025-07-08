// src/components/Sidebar.jsx

import {
  Drawer, Box, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Divider, Typography, Avatar, Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon, AccessTime as AccessTimeIcon, History as HistoryIcon,
  Work as WorkIcon, PendingActions as PendingActionsIcon, GroupAdd as GroupAddIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['employee', 'manager', 'admin'] },
  { text: 'Timesheet Entry', icon: <AccessTimeIcon />, path: '/timesheet', roles: ['employee', 'manager', 'admin'] },
  { text: 'My History', icon: <HistoryIcon />, path: '/history', roles: ['employee', 'manager', 'admin'] },
  { text: 'Projects', icon: <WorkIcon />, path: '/projects', roles: ['employee', 'manager', 'admin'] }, // CHANGED
  { text: 'Pending Approvals', icon: <PendingActionsIcon />, path: '/pending-approvals', roles: ['manager', 'admin'] },
  { text: 'User Management', icon: <GroupAddIcon />, path: '/user-management', roles: ['admin'] },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <img src="/logo.svg" alt="logo" style={{ width: 40, height: 40, color: 'primary.main' }} />
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          TimeTrack
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) =>
          user?.role && item.roles.includes(user.role) && (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={RouterLink}
                to={item.path}
                selected={location.pathname === item.path || (item.path === '/timesheet' && location.pathname.startsWith('/timesheet'))}
                sx={{
                    borderRadius: 2,
                    mx: 1,
                    '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        '& .MuiListItemIcon-root': {
                            color: 'primary.contrastText',
                        },
                        '&:hover': {
                            backgroundColor: 'primary.dark',
                        }
                    }
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          )
        )}
      </List>
      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2 }}/>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
                {user?.username?.[0].toUpperCase()}
            </Avatar>
            <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                    {user?.username}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{textTransform: 'capitalize'}}>
                    {user?.role}
                </Typography>
            </Box>
        </Box>
         <Tooltip title="End Session">
             <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, mx: 1, mt: 2 }}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
         </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', borderRight: 'none' },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;