const axios = require('axios');
const AQIData = require('../models/AQIData');
const { calculateAQI, parseLocationString } = require('../utils/calculations');

class CPCBConnector {
  constructor() {
    this.baseURL = 'https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69';
    this.apiKey = process.env.DATA_GOV_API_KEY || 'demo_key';
    this.retryCount = 3;
    this.retryDelay = 2000; // 2 seconds
  }

  async fetchRealTimeData() {
    try {
      console.log('Fetching CPCB real-time data...');
      
      const response = await this.makeRequest({
        'api-key': this.apiKey,
        format: 'json',
        limit: 1000,
        filters: {
          state: 'Delhi,Haryana,Uttar Pradesh'
        }
      });

      if (response && response.data && response.data.records) {
        const processedData = this.processRawData(response.data.records);
        await this.saveToDB(processedData);
        console.log(`Processed ${processedData.length} AQI records from CPCB`);
        return processedData;
      } else {
        console.log('No CPCB data available, using simulated data');
        return this.generateSimulatedData();
      }
    } catch (error) {
      console.error('CPCB Data fetch error:', error.message);
      console.log('Falling back to simulated data');
      return this.generateSimulatedData();
    }
  }

  async makeRequest(params, retryCount = 0) {
    try {
      const response = await axios.get(this.baseURL, {
        params,
        timeout: 10000,
        headers: {
          'User-Agent': 'Delhi-Pollution-AI-Platform/1.0'
        }
      });
      
      return response;
    } catch (error) {
      if (retryCount < this.retryCount) {
        console.log(`Retry ${retryCount + 1}/${this.retryCount} after ${this.retryDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.makeRequest(params, retryCount + 1);
      }
      throw error;
    }
  }

  processRawData(records) {
    const processedData = [];
    
    records.forEach(record => {
      try {
        // Parse location
        const location = this.parseLocation(record);
        if (!location) return;

        // Parse pollutant data
        const pollutants = this.parsePollutants(record);
        const aqiValue = this.calculateOverallAQI(pollutants);

        const processedRecord = {
          station_id: record.station || `unknown_${Math.random().toString(36).substr(2, 9)}`,
          station_name: record.location || 'Unknown Station',
          location: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
          },
          timestamp: new Date(record.last_update || new Date()),
          aqi_value: aqiValue,
          pollutants,
          weather: {
            temperature: parseFloat(record.temperature) || null,
            humidity: parseFloat(record.humidity) || null,
            wind_speed: parseFloat(record.wind_speed) || null,
            wind_direction: parseFloat(record.wind_direction) || null,
            pressure: parseFloat(record.pressure) || null
          },
          data_source: 'CPCB',
          quality_score: this.assessDataQuality(record)
        };

        processedData.push(processedRecord);
      } catch (error) {
        console.warn('Error processing record:', error.message);
      }
    });

    return processedData;
  }

  parseLocation(record) {
    try {
      // Try to get coordinates from record
      const lat = parseFloat(record.latitude);
      const lng = parseFloat(record.longitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return { latitude: lat, longitude: lng };
      }

      // Fallback: geocode location name
      return this.geocodeLocation(record.location || record.station);
    } catch (error) {
      console.warn('Location parsing error:', error.message);
      return null;
    }
  }

  geocodeLocation(locationName) {
    // Predefined coordinates for major Delhi-NCR stations
    const knownLocations = {
      'Anand Vihar': { latitude: 28.6469, longitude: 77.3152 },
      'Punjabi Bagh': { latitude: 28.6742, longitude: 77.1339 },
      'R K Puram': { latitude: 28.5631, longitude: 77.1722 },
      'Dwarka': { latitude: 28.5921, longitude: 77.0460 },
      'Rohini': { latitude: 28.7041, longitude: 77.1025 },
      'Gurugram': { latitude: 28.4595, longitude: 77.0266 },
      'Faridabad': { latitude: 28.4089, longitude: 77.3178 },
      'Noida': { latitude: 28.5355, longitude: 77.3910 },
      'Ghaziabad': { latitude: 28.6692, longitude: 77.4538 }
    };

    const location = Object.keys(knownLocations).find(key => 
      locationName && locationName.toLowerCase().includes(key.toLowerCase())
    );

    return location ? knownLocations[location] : 
           { latitude: 28.6139 + (Math.random() - 0.5) * 0.5, 
             longitude: 77.2090 + (Math.random() - 0.5) * 0.5 };
  }

  parsePollutants(record) {
    return {
      pm25: this.parseFloat(record.pm2_5),
      pm10: this.parseFloat(record.pm10),
      co: this.parseFloat(record.co),
      no2: this.parseFloat(record.no2),
      so2: this.parseFloat(record.so2),
      o3: this.parseFloat(record.o3),
      nh3: this.parseFloat(record.nh3)
    };
  }

  parseFloat(value) {
    const parsed = parseFloat(value);
    return !isNaN(parsed) && parsed >= 0 ? parsed : 0;
  }

  calculateOverallAQI(pollutants) {
    // Simplified AQI calculation (normally would use EPA/CPCB formula)
    const pm25_aqi = (pollutants.pm25 / 35) * 50; // Simplified calculation
    const pm10_aqi = (pollutants.pm10 / 50) * 50;
    const co_aqi = (pollutants.co / 9) * 50;
    const no2_aqi = (pollutants.no2 / 80) * 50;
    const so2_aqi = (pollutants.so2 / 80) * 50;
    const o3_aqi = (pollutants.o3 / 100) * 50;

    return Math.max(pm25_aqi, pm10_aqi, co_aqi, no2_aqi, so2_aqi, o3_aqi) || 50;
  }

  assessDataQuality(record) {
    let score = 1.0;
    
    // Penalize missing data
    const requiredFields = ['pm2_5', 'pm10', 'last_update'];
    requiredFields.forEach(field => {
      if (!record[field] || record[field] === '') {
        score -= 0.2;
      }
    });

    // Check for unrealistic values
    if (parseFloat(record.pm2_5) > 1000 || parseFloat(record.pm10) > 2000) {
      score -= 0.3;
    }

    return Math.max(0, Math.min(1, score));
  }

  generateSimulatedData() {
    const delhiNCRStations = [
      { name: 'Anand Vihar', lat: 28.6469, lng: 77.3152, baseAQI: 180 },
      { name: 'Punjabi Bagh', lat: 28.6742, lng: 77.1339, baseAQI: 150 },
      { name: 'R K Puram', lat: 28.5631, lng: 77.1722, baseAQI: 140 },
      { name: 'Dwarka', lat: 28.5921, lng: 77.0460, baseAQI: 130 },
      { name: 'Rohini', lat: 28.7041, lng: 77.1025, baseAQI: 160 },
      { name: 'Gurugram', lat: 28.4595, lng: 77.0266, baseAQI: 170 },
      { name: 'Faridabad', lat: 28.4089, lng: 77.3178, baseAQI: 185 },
      { name: 'Noida', lat: 28.5355, lng: 77.3910, baseAQI: 175 },
      { name: 'Ghaziabad', lat: 28.6692, lng: 77.4538, baseAQI: 190 }
    ];

    return delhiNCRStations.map(station => {
      const currentHour = new Date().getHours();
      const isRushHour = (currentHour >= 7 && currentHour <= 10) || (currentHour >= 17 && currentHour <= 20);
      const seasonalFactor = this.getSeasonalFactor();
      
      const variability = (Math.random() - 0.5) * 40; // ±20 AQI points
      const rushHourBonus = isRushHour ? 20 : 0;
      const finalAQI = Math.max(30, Math.min(500, 
        station.baseAQI * seasonalFactor + variability + rushHourBonus
      ));

      return {
        station_id: `sim_${station.name.toLowerCase().replace(/\s+/g, '_')}`,
        station_name: station.name,
        location: {
          type: 'Point',
          coordinates: [station.lng, station.lat]
        },
        timestamp: new Date(),
        aqi_value: Math.round(finalAQI),
        pollutants: {
          pm25: Math.round(finalAQI * 0.6 + Math.random() * 10),
          pm10: Math.round(finalAQI * 0.8 + Math.random() * 15),
          co: Math.round(finalAQI * 0.1 + Math.random() * 5),
          no2: Math.round(finalAQI * 0.4 + Math.random() * 8),
          so2: Math.round(finalAQI * 0.2 + Math.random() * 3),
          o3: Math.round(finalAQI * 0.3 + Math.random() * 6),
          nh3: Math.round(finalAQI * 0.15 + Math.random() * 2)
        },
        weather: {
          temperature: 25 + Math.sin(currentHour * Math.PI / 12) * 10 + Math.random() * 5,
          humidity: 50 + Math.random() * 30,
          wind_speed: 2 + Math.random() * 8,
          wind_direction: Math.random() * 360,
          pressure: 1013 + (Math.random() - 0.5) * 20
        },
        data_source: 'SIMULATED',
        quality_score: 0.95 + Math.random() * 0.05
      };
    });
  }

  getSeasonalFactor() {
    const month = new Date().getMonth(); // 0-11
    // Higher pollution in winter months (Oct-Feb)
    if (month >= 9 || month <= 1) return 1.3; // Oct-Feb
    if (month >= 2 && month <= 4) return 1.1;  // Mar-May
    if (month >= 5 && month <= 8) return 0.8;  // Jun-Sep (monsoon)
    return 1.0;
  }

  async saveToDB(dataArray) {
    try {
      const bulkOps = dataArray.map(data => ({
        updateOne: {
          filter: { 
            station_id: data.station_id,
            timestamp: {
              $gte: new Date(data.timestamp.getTime() - 30 * 60 * 1000), // 30 min window
              $lte: new Date(data.timestamp.getTime() + 30 * 60 * 1000)
            }
          },
          update: { $set: data },
          upsert: true
        }
      }));

      if (bulkOps.length > 0) {
        const result = await AQIData.bulkWrite(bulkOps);
        console.log(`Saved ${result.upsertedCount + result.modifiedCount} AQI records to DB`);
      }
    } catch (error) {
      console.error('Database save error:', error.message);
    }
  }

  async getLatestData(limit = 50) {
    try {
      return await AQIData.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      console.error('Error fetching latest data:', error.message);
      return [];
    }
  }
}

module.exports = CPCBConnector;
