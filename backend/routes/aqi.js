const express = require('express');
const AQIData = require('../models/AQIData');
const { calculateDistance, getAQICategory, generateHealthAdvice } = require('../utils/calculations');
const router = express.Router();

// Get real-time AQI data with advanced filtering
router.get('/realtime', async (req, res) => {
  try {
    const { 
      lat, 
      lng, 
      radius = 10, 
      limit = 50, 
      quality_threshold = 0.5,
      time_window = 60 // minutes
    } = req.query;
    
    let query = {
      quality_score: { $gte: parseFloat(quality_threshold) },
      timestamp: { 
        $gte: new Date(Date.now() - parseInt(time_window) * 60 * 1000) 
      }
    };

    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(radius) * 1000
        }
      };
    }
    
    const aqiData = await AQIData.find(query)
      .sort({ timestamp: -1, quality_score: -1 })
      .limit(parseInt(limit));
    
    // Calculate statistics
    const stats = calculateAQIStatistics(aqiData);
    
    res.json({
      success: true,
      data: aqiData,
      count: aqiData.length,
      statistics: stats,
      query_params: {
        center: lat && lng ? [parseFloat(lat), parseFloat(lng)] : null,
        radius: parseFloat(radius),
        quality_threshold: parseFloat(quality_threshold),
        time_window: parseInt(time_window)
      }
    });
  } catch (error) {
    console.error('Real-time AQI error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get hyperlocal AQI with advanced interpolation
router.get('/hyperlocal', async (req, res) => {
  try {
    const { lat, lng, accuracy = 'high' } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        success: false, 
        error: 'Latitude and longitude required' 
      });
    }

    const searchRadius = accuracy === 'high' ? 5000 : 10000; // meters
    
    const nearestStations = await AQIData.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: searchRadius
        }
      },
      timestamp: { 
        $gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
      },
      quality_score: { $gte: 0.7 }
    }).sort({ timestamp: -1 }).limit(8);

    if (nearestStations.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No recent AQI data available for this location'
      });
    }

    // Advanced weighted interpolation
    const interpolatedData = performSpatialInterpolation(
      parseFloat(lat), parseFloat(lng), nearestStations
    );
    
    // Generate personalized health recommendations
    const healthAdvice = generateAdvancedHealthAdvice(
      interpolatedData.aqi, interpolatedData.pollutants
    );

    // Get trend information
    const trend = await calculateAQITrend(parseFloat(lat), parseFloat(lng));
    
    res.json({
      success: true,
      data: {
        location: { 
          latitude: parseFloat(lat), 
          longitude: parseFloat(lng) 
        },
        aqi: interpolatedData.aqi,
        pollutants: interpolatedData.pollutants,
        category: getAQICategory(interpolatedData.aqi),
        health_advice: healthAdvice,
        trend: trend,
        confidence: interpolatedData.confidence,
        data_sources: {
          stations_used: nearestStations.length,
          max_distance_km: Math.max(...nearestStations.map(s => 
            calculateDistance(parseFloat(lat), parseFloat(lng), 
              s.location.coordinates[1], s.location.coordinates[0])
          )),
          data_quality: interpolatedData.quality_score
        },
        last_updated: nearestStations[0].timestamp
      }
    });
    
  } catch (error) {
    console.error('Hyperlocal AQI error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get AQI heatmap data
router.get('/heatmap', async (req, res) => {
  try {
    const { 
      bounds, // "minLat,minLng,maxLat,maxLng"
      resolution = 0.01, // degrees
      time_window = 60 // minutes
    } = req.query;

    if (!bounds) {
      return res.status(400).json({
        success: false,
        error: 'Bounds parameter required (minLat,minLng,maxLat,maxLng)'
      });
    }

    const [minLat, minLng, maxLat, maxLng] = bounds.split(',').map(parseFloat);
    
    const aqiData = await AQIData.find({
      location: {
        $geoWithin: {
          $geometry: {
            type: "Polygon",
            coordinates: [[
              [minLng, minLat],
              [maxLng, minLat],
              [maxLng, maxLat],
              [minLng, maxLat],
              [minLng, minLat]
            ]]
          }
        }
      },
      timestamp: { 
        $gte: new Date(Date.now() - parseInt(time_window) * 60 * 1000) 
      }
    });

    // Generate heatmap grid
    const heatmapData = generateHeatmapGrid(
      aqiData, minLat, minLng, maxLat, maxLng, parseFloat(resolution)
    );

    res.json({
      success: true,
      data: heatmapData,
      metadata: {
        bounds: { minLat, minLng, maxLat, maxLng },
        resolution: parseFloat(resolution),
        data_points: aqiData.length,
        grid_size: heatmapData.length,
        time_window: parseInt(time_window)
      }
    });

  } catch (error) {
    console.error('Heatmap data error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Utility functions
function calculateAQIStatistics(data) {
  if (data.length === 0) return null;

  const values = data.map(d => d.aqi_value);
  const pm25Values = data.map(d => d.pollutants.pm25);
  const pm10Values = data.map(d => d.pollutants.pm10);

  return {
    aqi: {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      median: calculateMedian(values)
    },
    pm25: {
      min: Math.min(...pm25Values),
      max: Math.max(...pm25Values),
      avg: Math.round(pm25Values.reduce((a, b) => a + b, 0) / pm25Values.length)
    },
    pm10: {
      min: Math.min(...pm10Values),
      max: Math.max(...pm10Values), 
      avg: Math.round(pm10Values.reduce((a, b) => a + b, 0) / pm10Values.length)
    },
    stations_count: data.length,
    quality_score_avg: (data.reduce((a, b) => a + b.quality_score, 0) / data.length).toFixed(2)
  };
}

function performSpatialInterpolation(lat, lng, stations) {
  let totalWeight = 0;
  let weightedAQI = 0;
  let weightedPollutants = { pm25: 0, pm10: 0, co: 0, no2: 0, so2: 0, o3: 0 };
  let weightedQuality = 0;

  stations.forEach(station => {
    const distance = calculateDistance(
      lat, lng,
      station.location.coordinates[1], station.location.coordinates[0]
    );
    
    // Inverse distance weighting with power of 2
    const weight = 1 / Math.pow(distance + 0.1, 2);
    
    totalWeight += weight;
    weightedAQI += station.aqi_value * weight;
    weightedQuality += station.quality_score * weight;
    
    Object.keys(weightedPollutants).forEach(pollutant => {
      if (station.pollutants[pollutant]) {
        weightedPollutants[pollutant] += station.pollutants[pollutant] * weight;
      }
    });
  });

  // Normalize by total weight
  const finalAQI = Math.round(weightedAQI / totalWeight);
  Object.keys(weightedPollutants).forEach(pollutant => {
    weightedPollutants[pollutant] = Math.round(weightedPollutants[pollutant] / totalWeight);
  });
  
  // Calculate confidence based on station distribution and quality
  const avgDistance = stations.reduce((sum, station) => {
    return sum + calculateDistance(lat, lng, 
      station.location.coordinates[1], station.location.coordinates[0]);
  }, 0) / stations.length;
  
  const confidence = Math.max(0.3, Math.min(1.0, 
    (weightedQuality / totalWeight) * (1 - avgDistance / 10)
  ));

  return {
    aqi: finalAQI,
    pollutants: weightedPollutants,
    confidence: parseFloat(confidence.toFixed(2)),
    quality_score: parseFloat((weightedQuality / totalWeight).toFixed(2))
  };
}

function generateAdvancedHealthAdvice(aqi, pollutants) {
  const baseAdvice = generateHealthAdvice(aqi);
  
  // Add pollutant-specific advice
  const pollutantAdvice = {};
  
  if (pollutants.pm25 > 65) {
    pollutantAdvice.pm25 = "PM2.5 levels are very high. Use N95/P2 masks outdoors.";
  }
  
  if (pollutants.pm10 > 100) {
    pollutantAdvice.pm10 = "PM10 levels are concerning. Limit dust-generating activities.";
  }
  
  if (pollutants.no2 > 80) {
    pollutantAdvice.no2 = "High NO2 levels detected. Avoid busy roads and traffic areas.";
  }

  return {
    ...baseAdvice,
    pollutant_specific: pollutantAdvice,
    severity: aqi > 200 ? 'severe' : aqi > 150 ? 'high' : aqi > 100 ? 'moderate' : 'low'
  };
}

async function calculateAQITrend(lat, lng) {
  try {
    const last24Hours = await AQIData.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat]
          },
          $maxDistance: 10000
        }
      },
      timestamp: { 
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    }).sort({ timestamp: 1 });

    if (last24Hours.length < 2) return null;

    const recent = last24Hours.slice(-6); // Last 6 readings
    const previous = last24Hours.slice(-12, -6); // Previous 6 readings

    const recentAvg = recent.reduce((sum, d) => sum + d.aqi_value, 0) / recent.length;
    const previousAvg = previous.reduce((sum, d) => sum + d.aqi_value, 0) / previous.length;
    
    const change = recentAvg - previousAvg;
    const changePercent = (change / previousAvg) * 100;

    return {
      direction: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
      change: Math.round(change),
      change_percent: Math.round(changePercent),
      data_points: last24Hours.length
    };
  } catch (error) {
    console.error('Trend calculation error:', error);
    return null;
  }
}

function generateHeatmapGrid(data, minLat, minLng, maxLat, maxLng, resolution) {
  const grid = [];
  
  for (let lat = minLat; lat <= maxLat; lat += resolution) {
    for (let lng = minLng; lng <= maxLng; lng += resolution) {
      // Find nearby data points
      const nearbyPoints = data.filter(point => {
        const distance = calculateDistance(
          lat, lng,
          point.location.coordinates[1], point.location.coordinates[0]
        );
        return distance <= 5; // 5km radius
      });

      if (nearbyPoints.length > 0) {
        const avgAQI = nearbyPoints.reduce((sum, p) => sum + p.aqi_value, 0) / nearbyPoints.length;
        
        grid.push({
          latitude: lat,
          longitude: lng,
          aqi: Math.round(avgAQI),
          intensity: Math.min(1, avgAQI / 300), // Normalized intensity
          data_points: nearbyPoints.length
        });
      }
    }
  }
  
  return grid;
}

function calculateMedian(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

module.exports = router;
