import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Tab,
  Tabs,
  Grid,
  LinearProgress,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Refresh,
  Settings
} from '@mui/icons-material';
import { Line, Area, Bar } from 'recharts';
import { ComposedChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`forecast-tabpanel-${index}`}
      aria-labelledby={`forecast-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function ForecastPanel({ forecasts = [], onRefresh }) {
  const [tabValue, setTabValue] = useState(0);
  const [showUncertainty, setShowUncertainty] = useState(true);
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Process forecast data for visualization
  useEffect(() => {
    if (forecasts && forecasts.length > 0) {
      const processedData = processForecastData(forecasts);
      setForecastData(processedData);
      setLastUpdated(new Date());
    } else {
      // Generate sample forecast data for demo
      generateSampleForecastData();
    }
  }, [forecasts]);

  const processForecastData = (rawForecasts) => {
    return rawForecasts.map((forecast, index) => ({
      hour: index + 1,
      time: new Date(Date.now() + (index + 1) * 60 * 60 * 1000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      fullTime: new Date(Date.now() + (index + 1) * 60 * 60 * 1000),
      aqi: Math.round(forecast.predicted_aqi || 150),
      confidence: Math.round((forecast.confidence || 0.8) * 100),
      category: forecast.aqi_category || 'Moderate',
      lowerBound: forecast.uncertainty?.lower_bound || forecast.predicted_aqi * 0.85,
      upperBound: forecast.uncertainty?.upper_bound || forecast.predicted_aqi * 1.15,
      pm25: Math.round((forecast.predicted_aqi || 150) * 0.6),
      pm10: Math.round((forecast.predicted_aqi || 150) * 0.8),
      no2: Math.round((forecast.predicted_aqi || 150) * 0.4)
    }));
  };

  const generateSampleForecastData = () => {
    const sampleData = [];
    const baseAQI = 180;
    
    for (let i = 0; i < 72; i++) {
      const time = new Date(Date.now() + i * 60 * 60 * 1000);
      const hour = time.getHours();
      
      // Simulate daily pattern with some randomness
      let aqi = baseAQI;
      if (hour >= 7 && hour <= 10) aqi += 30; // Morning rush
      if (hour >= 17 && hour <= 20) aqi += 40; // Evening rush
      if (hour >= 22 || hour <= 5) aqi -= 20; // Night time
      
      // Add seasonal and random variations
      aqi += Math.sin(i / 24 * Math.PI) * 20; // Daily cycle
      aqi += (Math.random() - 0.5) * 30; // Random variation
      aqi = Math.max(50, Math.min(400, aqi)); // Bounds

      const confidence = Math.max(30, 90 - i * 0.8); // Decreasing confidence

      sampleData.push({
        hour: i + 1,
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        fullTime: time,
        aqi: Math.round(aqi),
        confidence: Math.round(confidence),
        category: getAQICategory(aqi),
        lowerBound: Math.round(aqi * 0.85),
        upperBound: Math.round(aqi * 1.15),
        pm25: Math.round(aqi * 0.6),
        pm10: Math.round(aqi * 0.8),
        no2: Math.round(aqi * 0.4)
      });
    }
    
    setForecastData(sampleData);
  };

  const getAQICategory = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#00e400';
    if (aqi <= 100) return '#ffff00';
    if (aqi <= 150) return '#ff7e00';
    if (aqi <= 200) return '#ff0000';
    if (aqi <= 300) return '#8f3f97';
    return '#7e0023';
  };

  const getTrendIcon = () => {
    if (forecastData.length < 2) return <Timeline />;
    
    const current = forecastData[0]?.aqi || 0;
    const future = forecastData[11]?.aqi || 0; // 12 hours ahead
    
    if (future > current + 20) return <TrendingUp color="error" />;
    if (future < current - 20) return <TrendingDown color="success" />;
    return <Timeline color="info" />;
  };

  const getOverallTrend = () => {
    if (forecastData.length < 12) return { trend: 'stable', message: 'Insufficient data' };
    
    const current = forecastData[0]?.aqi || 0;
    const future = forecastData[11]?.aqi || 0;
    const diff = future - current;
    
    if (diff > 30) return { trend: 'worsening', message: `AQI expected to increase by ${Math.round(diff)} points` };
    if (diff < -30) return { trend: 'improving', message: `AQI expected to decrease by ${Math.round(Math.abs(diff))} points` };
    return { trend: 'stable', message: 'AQI levels expected to remain relatively stable' };
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        generateSampleForecastData();
      }
    } finally {
      setLoading(false);
    }
  };

  const trend = getOverallTrend();

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            {getTrendIcon()}
            <Typography variant="h5">AQI Forecast</Typography>
            <Chip 
              label={`${forecastData.length}h`} 
              size="small" 
              color="primary"
            />
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={showUncertainty}
                  onChange={(e) => setShowUncertainty(e.target.checked)}
                  size="small"
                />
              }
              label="Uncertainty"
              sx={{ fontSize: '0.8rem' }}
            />
            
            <Tooltip title="Refresh forecast">
              <IconButton 
                onClick={handleRefresh} 
                disabled={loading}
                size="small"
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Loading indicator */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Trend Alert */}
        <AnimatePresence>
          {trend.trend !== 'stable' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert 
                severity={trend.trend === 'improving' ? 'success' : 'warning'}
                icon={trend.trend === 'improving' ? <CheckCircle /> : <Warning />}
                sx={{ mb: 2 }}
              >
                <Typography variant="body2">
                  <strong>12-hour Trend:</strong> {trend.message}
                </Typography>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Forecast Tabs */}
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab label="24 Hours" />
          <Tab label="48 Hours" />
          <Tab label="72 Hours" />
        </Tabs>

        {/* 24 Hour Forecast */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecastData.slice(0, 24)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="time" 
                  stroke="#fff"
                  fontSize={10}
                  interval={3}
                />
                <YAxis stroke="#fff" fontSize={12} />
                
                {showUncertainty && (
                  <Area
                    type="monotone"
                    dataKey="upperBound"
                    stackId="1"
                    stroke="none"
                    fill="rgba(255,255,255,0.1)"
                  />
                )}
                
                {showUncertainty && (
                  <Area
                    type="monotone"
                    dataKey="lowerBound"
                    stackId="1"
                    stroke="none"
                    fill="rgba(255,255,255,0.05)"
                  />
                )}
                
                <Line
                  type="monotone"
                  dataKey="aqi"
                  stroke="#00e676"
                  strokeWidth={3}
                  dot={{ fill: '#00e676', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#00e676', strokeWidth: 2 }}
                />
                
                <Bar 
                  dataKey="confidence" 
                  fill="rgba(0,230,118,0.3)"
                  yAxisId="confidence"
                />
                
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>

          {/* Key Insights for 24h */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="h6" color="primary">
                    {Math.round(Math.max(...forecastData.slice(0, 24).map(d => d.aqi)))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Peak AQI (24h)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="h6" color="warning.main">
                    {Math.round(forecastData.slice(0, 24).reduce((sum, d) => sum + d.aqi, 0) / 24)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average AQI (24h)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="h6" color="info.main">
                    {Math.round(forecastData.slice(0, 24).reduce((sum, d) => sum + d.confidence, 0) / 24)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Confidence
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* 48 Hour Forecast */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecastData.slice(0, 48)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="hour" 
                  stroke="#fff"
                  fontSize={10}
                  interval={7}
                />
                <YAxis stroke="#fff" fontSize={12} />
                
                <Area
                  type="monotone"
                  dataKey="aqi"
                  stroke="#ff9800"
                  fill="rgba(255,152,0,0.2)"
                  strokeWidth={2}
                />
                
                <Line
                  type="monotone"
                  dataKey="pm25"
                  stroke="#f44336"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                
                <Line
                  type="monotone"
                  dataKey="pm10"
                  stroke="#9c27b0"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
                
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </TabPanel>

        {/* 72 Hour Forecast */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="hour" 
                  stroke="#fff"
                  fontSize={10}
                  interval={11}
                />
                <YAxis stroke="#fff" fontSize={12} />
                
                <Bar 
                  dataKey="aqi" 
                  fill="rgba(33,150,243,0.3)"
                  stroke="#2196f3"
                  strokeWidth={1}
                />
                
                <Line
                  type="monotone"
                  dataKey="aqi"
                  stroke="#2196f3"
                  strokeWidth={3}
                  dot={false}
                />
                
                <Legend />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>

          {/* Weekly Pattern Analysis */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Weekly Pattern Analysis
            </Typography>
            <Grid container spacing={1}>
              {forecastData.slice(0, 7).map((day, index) => (
                <Grid item key={index}>
                  <Card variant="outlined" sx={{ p: 1, minWidth: 80 }}>
                    <Typography variant="caption" align="center" display="block">
                      Day {index + 1}
                    </Typography>
                    <Typography 
                      variant="h6" 
                      align="center"
                      sx={{ color: getAQIColor(day.aqi) }}
                    >
                      {day.aqi}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>

        {/* Footer Info */}
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastUpdated.toLocaleString()} | 
            Model confidence decreases with forecast horizon | 
            Forecasts update every 15 minutes
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
