// src/pages/Dashboard.jsx (NO CHANGES NEEDED)

import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Avatar } from '@mui/material';
import { CheckCircleOutline, PendingActions, Drafts, HighlightOff, Group } from '@mui/icons-material';
import useAuth from '../hooks/useAuth';
import api from '../api/axiosConfig';

const StatCard = ({ title, value, icon, color }) => (
    <Paper elevation={3} sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
        <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 56, height: 56 }}>
            {icon}
        </Avatar>
        <Box>
            <Typography variant="h6" color="text.secondary">{title}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{value}</Typography>
        </Box>
    </Paper>
);


const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/timesheet/stats/dashboard');
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.username}!
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Here's a quick overview of your activity.
      </Typography>

      <Grid container spacing={3}>
        {/* Manager/Admin Specific Card */}
        {(user.role === 'manager' || user.role === 'admin') && stats?.pendingApprovals !== undefined && (
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Pending My Approval"
              value={stats.pendingApprovals}
              icon={<Group fontSize="large" />}
              color="warning"
            />
          </Grid>
        )}

        {/* User-specific cards */}
        {stats?.myStats && (
            <>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard
                        title="My Approved"
                        value={stats.myStats.approved || 0}
                        icon={<CheckCircleOutline fontSize="large" />}
                        color="success"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard
                        title="My Pending"
                        value={stats.myStats.submitted || 0}
                        icon={<PendingActions fontSize="large" />}
                        color="info"
                    />
                </Grid>
                 <Grid item xs={12} sm={6} md={4}>
                    <StatCard
                        title="My Drafts"
                        value={stats.myStats.draft || 0}
                        icon={<Drafts fontSize="large" />}
                        color="default"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard
                        title="My Declined"
                        value={stats.myStats.rejected || 0}
                        icon={<HighlightOff fontSize="large" />}
                        color="error"
                    />
                </Grid>
            </>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;