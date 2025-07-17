// src/components/Sidebar.jsx
import {
  Drawer, Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Typography,
  Avatar, Tooltip, Switch
} from '@mui/material';
import {
  Dashboard as DashboardIcon, AccessTime as AccessTimeIcon, History as HistoryIcon,
  Work as WorkIcon, PendingActions as PendingActionsIcon, GroupAdd as GroupAddIcon,
  Logout as LogoutIcon, AccountCircle as AccountCircleIcon, Brightness4, Brightness7,
  Groups as MyTeamIcon
} from '@mui/icons-material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useThemeMode } from '../context/ThemeContext';
import { useTheme } from '@mui/material/styles';
import { serverBaseUrl } from '../api/axiosConfig'; // Import server base URL
import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['employee', 'manager', 'admin'] },
  { text: 'Profile', icon: <AccountCircleIcon />, path: '/profile', roles: ['employee', 'manager', 'admin'] },
  { text: 'My Team', icon: <MyTeamIcon />, path: '/my-team', roles: ['manager'] },
  { text: 'Timesheet Entry', icon: <AccessTimeIcon />, path: '/timesheet', roles: ['employee', 'manager', 'admin'] },
  { text: 'My History', icon: <HistoryIcon />, path: '/history', roles: ['employee', 'manager', 'admin'] },
  { text: 'Projects', icon: <WorkIcon />, path: '/projects', roles: ['employee', 'manager', 'admin'] },
  { text: 'Pending Approvals', icon: <PendingActionsIcon />, path: '/pending-approvals', roles: ['manager'] },
  { text: 'User Management', icon: <GroupAddIcon />, path: '/user-management', roles: ['admin'] },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const colorMode = useThemeMode();
  const theme = useTheme();
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    const fetchAvatar = async () => {
        if(user?.id) {
            try {
                // Fetch fresh profile data specifically for the avatar
                const { data } = await api.get('/profile');
                if (data.avatar_url) {
                    setAvatarUrl(`${serverBaseUrl}${data.avatar_url}`);
                }
            } catch (error) {
                console.error("Could not fetch avatar for sidebar");
            }
        }
    };
    fetchAvatar();
    // Re-fetch avatar if the path becomes /profile, indicating a potential change
  }, [user, location.pathname]);


  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 68, gap: 1.5 }}>
          <img
            src={theme.palette.mode === 'dark' ? '/logo.png' : '/logoo.png'}
            alt="Cozentus Logo"
            style={{ height: '40px' }}
          />
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Cozentus
          </Typography>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) =>
          user?.role && item.roles.includes(user.role) && (
            <ListItem key={item.text} disablePadding sx={{ my: 0.5 }}>
              <ListItemButton
                component={RouterLink}
                to={item.path}
                selected={location.pathname === item.path || (item.path === '/timesheet' && location.pathname.startsWith('/timesheet'))}
                sx={{ borderRadius: 2, mx: 1, '&.Mui-selected': { backgroundColor: 'action.selected', fontWeight: 'fontWeightBold', '&:hover': { backgroundColor: 'action.hover' } } }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          )
        )}
      </List>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 1 }}>
            <Typography variant="body2" sx={{display: 'flex', alignItems: 'center'}}>
              {theme.palette.mode === 'dark' ? <Brightness7 sx={{mr: 1}} /> : <Brightness4 sx={{mr: 1}} />}
              Theme
            </Typography>
            <Switch edge="end" checked={theme.palette.mode === 'dark'} onChange={colorMode.toggleColorMode} />
        </Box>
        <Divider sx={{ my: 2 }}/>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={avatarUrl} sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>{user?.username?.[0].toUpperCase()}</Avatar>
            <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>{user?.username}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{textTransform: 'capitalize'}}>{user?.role}</Typography>
            </Box>
        </Box>
         <Tooltip title="End Session">
             <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, mx: 1, mt: 2, '&:hover': {backgroundColor: 'error.lighter'} }}>
              <ListItemIcon><LogoutIcon color="error"/></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
         </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', borderRight: 'none' }, }}>
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;