/**
 * Utility functions for AQI calculations and geospatial operations
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Get AQI category based on AQI value
 */
function getAQICategory(aqi) {
  if (aqi <= 50) {
    return {
      level: 'Good',
      color: '#00e400',
      description: 'Air quality is satisfactory, and air pollution poses little or no risk.'
    };
  } else if (aqi <= 100) {
    return {
      level: 'Moderate',
      color: '#ffff00',
      description: 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.'
    };
  } else if (aqi <= 150) {
    return {
      level: 'Unhealthy for Sensitive Groups',
      color: '#ff7e00',
      description: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.'
    };
  } else if (aqi <= 200) {
    return {
      level: 'Unhealthy',
      color: '#ff0000',
      description: 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.'
    };
  } else if (aqi <= 300) {
    return {
      level: 'Very Unhealthy',
      color: '#8f3f97',
      description: 'Health alert: The risk of health effects is increased for everyone.'
    };
  } else {
    return {
      level: 'Hazardous',
      color: '#7e0023',
      description: 'Health warning of emergency conditions: everyone is more likely to be affected.'
    };
  }
}

/**
 * Calculate AQI from pollutant concentrations
 */
function calculateAQI(pollutants) {
  // Simplified AQI calculation - normally uses EPA breakpoints
  const { pm25, pm10, co, no2, so2, o3 } = pollutants;
  
  // Convert concentrations to AQI using simplified linear relationships
  const pm25_aqi = pm25 ? (pm25 / 35.4) * 50 : 0;
  const pm10_aqi = pm10 ? (pm10 / 54) * 50 : 0;
  const co_aqi = co ? (co / 9.4) * 50 : 0;
  const no2_aqi = no2 ? (no2 / 53) * 50 : 0;
  const so2_aqi = so2 ? (so2 / 35) * 50 : 0;
  const o3_aqi = o3 ? (o3 / 70) * 50 : 0;
  
  // Return the maximum AQI (worst pollutant determines overall AQI)
  return Math.max(pm25_aqi, pm10_aqi, co_aqi, no2_aqi, so2_aqi, o3_aqi, 50);
}

/**
 * Generate health advice based on AQI level
 */
function generateHealthAdvice(aqi) {
  const category = getAQICategory(aqi);
  
  let advice = {
    general: '',
    sensitive: '',
    activities: [],
    precautions: []
  };
  
  if (aqi <= 50) {
    advice.general = 'Air quality is good. Enjoy outdoor activities.';
    advice.sensitive = 'No health concerns for sensitive individuals.';
    advice.activities = ['Outdoor exercise recommended', 'Windows can be opened'];
    advice.precautions = ['None required'];
  } else if (aqi <= 100) {
    advice.general = 'Air quality is acceptable for most people.';
    advice.sensitive = 'Sensitive individuals should consider limiting prolonged outdoor exertion.';
    advice.activities = ['Normal outdoor activities OK', 'Sensitive groups use caution'];
    advice.precautions = ['Monitor symptoms if sensitive'];
  } else if (aqi <= 150) {
    advice.general = 'General public should limit prolonged outdoor exertion.';
    advice.sensitive = 'Sensitive groups should avoid outdoor activities.';
    advice.activities = ['Limit outdoor exercise', 'Choose indoor activities'];
    advice.precautions = ['Keep windows closed', 'Use air purifiers if available'];
  } else if (aqi <= 200) {
    advice.general = 'Everyone should limit outdoor activities.';
    advice.sensitive = 'Sensitive groups should avoid all outdoor activities.';
    advice.activities = ['Avoid outdoor exercise', 'Stay indoors when possible'];
    advice.precautions = ['Wear N95 masks outdoors', 'Keep medications handy if asthmatic'];
  } else if (aqi <= 300) {
    advice.general = 'Everyone should avoid outdoor activities.';
    advice.sensitive = 'Sensitive groups should remain indoors and keep activity levels low.';
    advice.activities = ['Stay indoors', 'Avoid all outdoor exercise'];
    advice.precautions = ['Seal windows and doors', 'Use air purifiers', 'Wear masks if going outside'];
  } else {
    advice.general = 'Everyone should remain indoors and avoid physical activities.';
    advice.sensitive = 'Emergency conditions. Sensitive groups at severe risk.';
    advice.activities = ['Stay indoors at all times', 'Avoid any physical exertion'];
    advice.precautions = ['Emergency health alert', 'Consider relocating temporarily', 'Seek medical attention if experiencing symptoms'];
  }
  
  return {
    category: category.level,
    color: category.color,
    ...advice
  };
}

/**
 * Parse location string to coordinates
 */
function parseLocationString(locationStr) {
  // Handle common location string formats
  if (!locationStr) return null;
  
  // Try to extract numbers (latitude, longitude)
  const matches = locationStr.match(/-?\d+\.?\d*/g);
  if (matches && matches.length >= 2) {
    return {
      latitude: parseFloat(matches[0]),
      longitude: parseFloat(matches[1])
    };
  }
  
  return null;
}

/**
 * Validate coordinates
 */
function validateCoordinates(lat, lng) {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Calculate air quality trend
 */
function calculateTrend(currentData, previousData) {
  if (!currentData || !previousData || currentData.length === 0 || previousData.length === 0) {
    return { trend: 'unknown', change: 0 };
  }
  
  const currentAvg = currentData.reduce((sum, item) => sum + item.aqi_value, 0) / currentData.length;
  const previousAvg = previousData.reduce((sum, item) => sum + item.aqi_value, 0) / previousData.length;
  
  const change = currentAvg - previousAvg;
  const changePercent = (change / previousAvg) * 100;
  
  let trend = 'stable';
  if (changePercent > 10) trend = 'worsening';
  else if (changePercent < -10) trend = 'improving';
  
  return {
    trend,
    change: Math.round(change),
    changePercent: Math.round(changePercent)
  };
}

/**
 * Generate mock AQI data for testing
 */
function generateMockAQIData(count = 10) {
  const stations = [
    { name: 'Anand Vihar', lat: 28.6469, lng: 77.3152 },
    { name: 'Punjabi Bagh', lat: 28.6742, lng: 77.1339 },
    { name: 'R K Puram', lat: 28.5631, lng: 77.1722 },
    { name: 'Dwarka', lat: 28.5921, lng: 77.0460 },
    { name: 'Rohini', lat: 28.7041, lng: 77.1025 },
    { name: 'Gurugram', lat: 28.4595, lng: 77.0266 },
    { name: 'Faridabad', lat: 28.4089, lng: 77.3178 },
    { name: 'Noida', lat: 28.5355, lng: 77.3910 },
    { name: 'Ghaziabad', lat: 28.6692, lng: 77.4538 }
  ];
  
  const mockData = [];
  const now = new Date();
  
  for (let i = 0; i < Math.min(count, stations.length); i++) {
    const station = stations[i];
    const baseAQI = 100 + Math.random() * 200; // Random AQI between 100-300
    
    mockData.push({
      station_id: `mock_${station.name.toLowerCase().replace(/\s+/g, '_')}`,
      station_name: station.name,
      location: {
        type: 'Point',
        coordinates: [station.lng, station.lat]
      },
      timestamp: new Date(now.getTime() - Math.random() * 60 * 60 * 1000), // Random within last hour
      aqi_value: Math.round(baseAQI),
      aqi_category: getAQICategory(baseAQI).level,
      pollutants: {
        pm25: Math.round(baseAQI * 0.6),
        pm10: Math.round(baseAQI * 0.8),
        co: Math.round(baseAQI * 0.1),
        no2: Math.round(baseAQI * 0.4),
        so2: Math.round(baseAQI * 0.2),
        o3: Math.round(baseAQI * 0.3)
      },
      weather: {
        temperature: 25 + Math.random() * 15,
        humidity: 40 + Math.random() * 40,
        wind_speed: 2 + Math.random() * 8,
        wind_direction: Math.random() * 360,
        pressure: 1000 + Math.random() * 30
      },
      data_source: 'MOCK',
      quality_score: 0.8 + Math.random() * 0.2
    });
  }
  
  return mockData;
}

module.exports = {
  calculateDistance,
  getAQICategory,
  calculateAQI,
  generateHealthAdvice,
  parseLocationString,
  validateCoordinates,
  calculateTrend,
  generateMockAQIData,
  toRadians
};
