import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  Box, 
  Typography, 
  Chip, 
  Fab, 
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Slider,
  FormControlLabel,
  Switch,
  Tooltip
} from '@mui/material';
import { 
  Layers, 
  FilterList, 
  MyLocation, 
  Close,
  Warning,
  Info,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSocket } from '../../services/SocketContext';
import HeatmapLayer from './HeatmapLayer'

// Custom marker icons
const createCustomIcon = (color, size = 25) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px; 
        height: ${size}px; 
        background: ${color}; 
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${size * 0.4}px;
        animation: pulse 2s infinite;
      ">
        !
      </div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
          50% { box-shadow: 0 2px 20px rgba(255,0,0,0.6); }
          100% { box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
        }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

// Map event handler component
function MapEventHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    }
  });
  return null;
}

export default function InteractiveMap({ pollutionData = [], className = "" }) {
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]); // Delhi center
  const [selectedLayer, setSelectedLayer] = useState('aqi');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [aqiThreshold, setAqiThreshold] = useState([0, 500]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showSources, setShowSources] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [realTimeData, setRealTimeData] = useState([]);
  const [pollutionSources, setPollutionSources] = useState([]);
  
  const mapRef = useRef();
  const { aqiData, pollutionSources: socketSources, connected } = useSocket();

  // Update real-time data from socket
  useEffect(() => {
    if (aqiData && aqiData.length > 0) {
      setRealTimeData(aqiData);
    }
  }, [aqiData]);

  useEffect(() => {
    if (socketSources && socketSources.length > 0) {
      setPollutionSources(socketSources);
    }
  }, [socketSources]);

  // Get user location
  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = [position.coords.latitude, position.coords.longitude];
          setUserLocation(location);
          setMapCenter(location);
          if (mapRef.current) {
            mapRef.current.setView(location, 13);
          }
        },
        (error) => {
          console.warn('Unable to get location:', error);
        }
      );
    }
  }, []);

  // Filter data based on current settings
  const filteredData = realTimeData.filter(point => {
    const aqi = point.aqi_value || point.aqi || 0;
    return aqi >= aqiThreshold[0] && aqi <= aqiThreshold[1];
  });

  // Get color based on AQI value
  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#00e400';
    if (aqi <= 100) return '#ffff00';
    if (aqi <= 150) return '#ff7e00';
    if (aqi <= 200) return '#ff0000';
    if (aqi <= 300) return '#8f3f97';
    return '#7e0023';
  };

  // Get pollution source color
  const getSourceColor = (sourceType) => {
    const colors = {
      vehicular: '#ff5722',
      industrial: '#9c27b0',
      stubble_burning: '#ff9800',
      construction: '#795548',
      domestic: '#607d8b',
      power_plant: '#e91e63',
      waste_burning: '#f44336',
      dust_storm: '#ffeb3b'
    };
    return colors[sourceType] || '#757575';
  };

  // Handle location selection
  const handleLocationSelect = async (latlng) => {
    setSelectedPoint(latlng);
    
    // Fetch hyperlocal data for selected point
    try {
      const response = await fetch(`/api/aqi/hyperlocal?lat=${latlng.lat}&lng=${latlng.lng}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedPoint({
          ...latlng,
          aqiData: data.data
        });
      }
    } catch (error) {
      console.error('Error fetching location data:', error);
    }
  };

  // Generate heatmap data
  const generateHeatmapData = () => {
    return filteredData.map(point => {
      const coords = point.location?.coordinates || [point.longitude || 77.2090, point.latitude || 28.6139];
      const aqi = point.aqi_value || point.aqi || 100;
      return [coords[1], coords[0], Math.min(1, aqi / 300)]; // [lat, lng, intensity]
    });
  };

  return (
    <Box className={className} sx={{ height: '100%', position: 'relative' }}>
      <Card sx={{ height: '100%', overflow: 'hidden' }}>
        <CardContent sx={{ p: 0, height: '100%', '&:last-child': { pb: 0 } }}>
          {/* Map Controls Header */}
          <Box sx={{ 
            p: 2, 
            background: 'rgba(22, 42, 71, 0.95)', 
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 1000
          }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6" color="primary">
                Real-time Pollution Map
              </Typography>
              <Chip 
                label={connected ? "Live" : "Offline"} 
                color={connected ? "success" : "error"}
                size="small"
                sx={{ fontSize: '0.7rem' }}
              />
              <Chip 
                label={`${filteredData.length} stations`} 
                color="info"
                size="small"
                sx={{ fontSize: '0.7rem' }}
              />
            </Box>

            <Box display="flex" gap={1}>
              <Tooltip title="Layers & Filters">
                <Fab 
                  size="small" 
                  color="primary" 
                  onClick={() => setFilterDialogOpen(true)}
                >
                  <Layers />
                </Fab>
              </Tooltip>
              
              <Tooltip title="My Location">
                <Fab 
                  size="small" 
                  color="secondary"
                  onClick={getUserLocation}
                >
                  <MyLocation />
                </Fab>
              </Tooltip>
            </Box>
          </Box>

          {/* Map Container */}
          <Box sx={{ height: 'calc(100% - 80px)', position: 'relative' }}>
            <MapContainer
              center={mapCenter}
              zoom={11}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />

              <MapEventHandler onLocationSelect={handleLocationSelect} />

              {/* Heatmap Layer */}
              {showHeatmap && filteredData.length > 0 && (
                <HeatmapLayer
                  points={generateHeatmapData()}
                  options={{
                    radius: 25,
                    blur: 15,
                    maxZoom: 18,
                    gradient: {
                      0.0: '#00e400',
                      0.2: '#ffff00',
                      0.4: '#ff7e00',
                      0.6: '#ff0000',
                      0.8: '#8f3f97',
                      1.0: '#7e0023'
                    }
                  }}
                />
              )}

              {/* AQI Station Markers */}
              {showMarkers && filteredData.map((point, index) => {
                const coords = point.location?.coordinates || [point.longitude || 77.2090, point.latitude || 28.6139];
                const aqi = point.aqi_value || point.aqi || 100;
                const position = [coords[1], coords[0]];

                return (
                  <Marker
                    key={`aqi-${index}`}
                    position={position}
                    icon={createCustomIcon(getAQIColor(aqi), 30)}
                  >
                    <Popup>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ minWidth: '200px' }}
                      >
                        <Typography variant="h6" gutterBottom>
                          {point.station_name || 'Monitoring Station'}
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <Chip 
                            label={`AQI: ${Math.round(aqi)}`}
                            sx={{ 
                              backgroundColor: getAQIColor(aqi),
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        </Box>

                        <Typography variant="body2" component="div">
                          <strong>Pollutants:</strong>
                          <br />• PM2.5: {Math.round(point.pollutants?.pm25 || aqi * 0.6)} µg/m³
                          <br />• PM10: {Math.round(point.pollutants?.pm10 || aqi * 0.8)} µg/m³
                          <br />• NO₂: {Math.round(point.pollutants?.no2 || aqi * 0.4)} µg/m³
                        </Typography>

                        {point.weather && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Weather:</strong>
                            <br />• Temp: {Math.round(point.weather.temperature || 25)}°C
                            <br />• Humidity: {Math.round(point.weather.humidity || 60)}%
                            <br />• Wind: {Math.round(point.weather.wind_speed || 3)} km/h
                          </Typography>
                        )}

                        <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.7 }}>
                          Updated: {new Date(point.timestamp).toLocaleTimeString()}
                        </Typography>
                      </motion.div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Pollution Source Markers */}
              {showSources && pollutionSources.map((source, index) => {
                const coords = source.location?.coordinates || [77.2090, 28.6139];
                const position = [coords[1], coords[0]];

                return (
                  <Marker
                    key={`source-${index}`}
                    position={position}
                    icon={createCustomIcon(getSourceColor(source.source_type), 20)}
                  >
                    <Popup>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ minWidth: '180px' }}
                      >
                        <Typography variant="h6" gutterBottom>
                          Pollution Source
                        </Typography>
                        
                        <Chip 
                          label={source.source_type?.replace('_', ' ').toUpperCase()}
                          sx={{ 
                            backgroundColor: getSourceColor(source.source_type),
                            color: 'white',
                            mb: 1
                          }}
                        />

                        <Typography variant="body2">
                          <strong>Intensity:</strong> {Math.round(source.intensity_score || 100)}
                          <br /><strong>Confidence:</strong> {Math.round((source.confidence || 0.8) * 100)}%
                          <br /><strong>Impact Radius:</strong> {source.impact_radius || 5} km
                        </Typography>

                        <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.7 }}>
                          Detected: {new Date(source.detected_at).toLocaleString()}
                        </Typography>
                      </motion.div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* User Location Marker */}
              {userLocation && (
                <Marker position={userLocation} icon={createCustomIcon('#2196f3', 25)}>
                  <Popup>
                    <Typography variant="body2" align="center">
                      📍 Your Location
                    </Typography>
                  </Popup>
                </Marker>
              )}

              {/* Selected Point Info */}
              {selectedPoint && selectedPoint.aqiData && (
                <Circle
                  center={[selectedPoint.lat, selectedPoint.lng]}
                  radius={1000}
                  pathOptions={{ 
                    color: getAQIColor(selectedPoint.aqiData.aqi),
                    fillOpacity: 0.2 
                  }}
                >
                  <Popup>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{ minWidth: '220px' }}
                    >
                      <Typography variant="h6" gutterBottom>
                        Hyperlocal Analysis
                      </Typography>
                      
                      <Chip 
                        label={`AQI: ${Math.round(selectedPoint.aqiData.aqi)}`}
                        sx={{ 
                          backgroundColor: getAQIColor(selectedPoint.aqiData.aqi),
                          color: 'white',
                          mb: 1
                        }}
                      />

                      <Typography variant="body2">
                        <strong>Category:</strong> {selectedPoint.aqiData.category.level}
                        <br /><strong>Confidence:</strong> {Math.round(selectedPoint.aqiData.confidence * 100)}%
                      </Typography>

                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Health Advice:</strong>
                        <br />{selectedPoint.aqiData.health_advice.general}
                      </Typography>
                    </motion.div>
                  </Popup>
                </Circle>
              )}
            </MapContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Layer Control Dialog */}
      <Dialog 
        open={filterDialogOpen} 
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Map Layers & Filters
          <IconButton
            onClick={() => setFilterDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Visible Layers
            </Typography>
            
            <FormControlLabel
              control={
                <Switch 
                  checked={showHeatmap} 
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  color="primary"
                />
              }
              label="Pollution Heatmap"
            />
            
            <FormControlLabel
              control={
                <Switch 
                  checked={showMarkers} 
                  onChange={(e) => setShowMarkers(e.target.checked)}
                  color="primary"
                />
              }
              label="AQI Monitoring Stations"
            />
            
            <FormControlLabel
              control={
                <Switch 
                  checked={showSources} 
                  onChange={(e) => setShowSources(e.target.checked)}
                  color="primary"
                />
              }
              label="Pollution Sources"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              AQI Range Filter
            </Typography>
            
            <Slider
              value={aqiThreshold}
              onChange={(e, newValue) => setAqiThreshold(newValue)}
              valueLabelDisplay="auto"
              min={0}
              max={500}
              marks={[
                { value: 0, label: '0' },
                { value: 50, label: '50' },
                { value: 100, label: '100' },
                { value: 150, label: '150' },
                { value: 200, label: '200' },
                { value: 300, label: '300' },
                { value: 500, label: '500' }
              ]}
              sx={{ mt: 2 }}
            />
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              📊 Currently showing {filteredData.length} monitoring stations
              <br />🎯 {pollutionSources.length} pollution sources detected
              <br />📡 Connection: {connected ? 'Live data' : 'Cached data'}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
