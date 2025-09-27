import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Avatar
} from '@mui/material';
import {
  Air,
  Visibility,
  Warning,
  CheckCircle,
  LocalFireDepartment,
  DirectionsCar
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const MetricCard = ({ title, value, unit, color, icon: Icon, progress, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    whileHover={{ scale: 1.02 }}
  >
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
        border: `1px solid ${color}30`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Avatar sx={{ bgcolor: `${color}30`, color: color }}>
            <Icon />
          </Avatar>
          <Chip
            label={trend > 0 ? `+${trend}%` : `${trend}%`}
            size="small"
            color={trend > 0 ? "error" : "success"}
            sx={{ fontSize: '0.7rem' }}
          />
        </Box>
        
        <Typography variant="h3" component="div" sx={{ color: color, fontWeight: 700 }}>
          {value}
          <Typography component="span" variant="body2" sx={{ ml: 1, opacity: 0.7 }}>
            {unit}
          </Typography>
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        
        {progress !== undefined && (
          <Box mt={2}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: `${color}20`,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: color,
                  borderRadius: 3,
                }
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {progress}% of safe limit
            </Typography>
          </Box>
        )}
      </CardContent>
      
      {/* Animated background pattern */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100px',
          height: '100px',
          background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
          borderRadius: '50%',
          transform: 'translate(30px, -30px)'
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </Card>
  </motion.div>
);

export default function PollutionMetrics({ metricsData }) {
  const metrics = [
    {
      title: 'Air Quality Index',
      value: metricsData?.aqi || 156,
      unit: 'AQI',
      color: '#ff5722',
      icon: Air,
      progress: ((metricsData?.aqi || 156) / 300) * 100,
      trend: -8
    },
    {
      title: 'PM2.5 Level',
      value: metricsData?.pm25 || 89,
      unit: 'µg/m³',
      color: '#ff9800',
      icon: Visibility,
      progress: ((metricsData?.pm25 || 89) / 150) * 100,
      trend: -12
    },
    {
      title: 'PM10 Level',
      value: metricsData?.pm10 || 145,
      unit: 'µg/m³',
      color: '#f44336',
      icon: Warning,
      progress: ((metricsData?.pm10 || 145) / 250) * 100,
      trend: 5
    },
    {
      title: 'Active Sources',
      value: metricsData?.activeSources || 23,
      unit: 'sources',
      color: '#2196f3',
      icon: LocalFireDepartment,
      progress: 76,
      trend: -3
    }
  ];

  return (
    <Grid container spacing={3}>
      {metrics.map((metric, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <MetricCard {...metric} />
        </Grid>
      ))}
    </Grid>
  );
}
