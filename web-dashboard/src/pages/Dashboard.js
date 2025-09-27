import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Tab,
  Tabs,
  Switch,
  FormControlLabel,
  Fab,
  Zoom
} from '@mui/material';
import { Timeline, Map, Settings } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import PollutionMetrics from '../components/dashboard/PollutionMetrics';
import PollutionGlobe from '../components/3d/PollutionGlobe';
import PollutionChart3D from '../components/3d/PollutionChart3D';
import InteractiveMap from '../components/maps/InteractiveMap';
import ForecastPanel from '../components/dashboard/ForecastPanel';
import SourceAnalysis from '../components/dashboard/SourceAnalysis';
import { useSocket } from '../services/SocketContext';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Dashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [view3D, setView3D] = useState(true);
  const [metricsData, setMetricsData] = useState(null);
  const { aqiData, pollutionSources, forecasts, connected } = useSocket();

  // Mock data for demonstration
  const mockPollutionData = [
    { latitude: 28.6139, longitude: 77.2090, intensity: 187, sourceType: 'vehicular' },
    { latitude: 28.5355, longitude: 77.3910, intensity: 234, sourceType: 'industrial' },
    { latitude: 28.7041, longitude: 77.1025, intensity: 298, sourceType: 'stubble_burning' },
    { latitude: 28.4595, longitude: 77.0266, intensity: 156, sourceType: 'construction' },
    { latitude: 28.6692, longitude: 77.4538, intensity: 201, sourceType: 'vehicular' }
  ];

  const chartData = [
    { label: 'Vehicular', value: 187 },
    { label: 'Industrial', value: 234 },
    { label: 'Stubble Burning', value: 298 },
    { label: 'Construction', value: 156 },
    { label: 'Others', value: 123 }
  ];

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setMetricsData({
        aqi: 150 + Math.random() * 100,
        pm25: 80 + Math.random() * 40,
        pm10: 120 + Math.random() * 60,
        activeSources: 20 + Math.floor(Math.random() * 10)
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h1" gutterBottom>
              Delhi-NCR Pollution Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Real-time AI-powered pollution monitoring and forecasting
            </Typography>
            <Box display="flex" alignItems="center" mt={1}>
              <Box
                width={8}
                height={8}
                borderRadius="50%"
                bgcolor={connected ? 'success.main' : 'error.main'}
                mr={1}
              />
              <Typography variant="caption">
                {connected ? 'Live Data Connected' : 'Connecting...'}
              </Typography>
            </Box>
          </Box>
          
          <FormControlLabel
            control={
              <Switch
                checked={view3D}
                onChange={(e) => setView3D(e.target.checked)}
                color="primary"
              />
            }
            label="3D View"
          />
        </Box>

        {/* Metrics */}
        <Box mb={4}>
          <PollutionMetrics metricsData={metricsData} />
        </Box>

        {/* Main Content Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
              <Tab label="3D Visualization" />
              <Tab icon={<Map />} label="Interactive Map" />
              <Tab icon={<Timeline />} label="Forecasting" />
              <Tab icon={<Settings />} label="Source Analysis" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      Real-time Pollution Globe
                    </Typography>
                    <PollutionGlobe pollutionData={mockPollutionData} />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} lg={4}>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Source Distribution
                    </Typography>
                    <PollutionChart3D data={chartData} />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <InteractiveMap pollutionData={mockPollutionData} />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <ForecastPanel forecasts={forecasts} />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <SourceAnalysis sources={pollutionSources} />
          </TabPanel>
        </Card>
      </motion.div>

      {/* Floating Action Button for Settings */}
      <Zoom in={true}>
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
        >
          <Settings />
        </Fab>
      </Zoom>
    </Container>
  );
}
