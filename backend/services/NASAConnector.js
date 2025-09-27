const axios = require('axios');
const PollutionSource = require('../models/PollutionSource');
const { v4: uuidv4 } = require('uuid');

class NASAConnector {
  constructor() {
    this.baseURL = 'https://firms.modaps.eosdis.nasa.gov/api/';
    this.apiKey = process.env.NASA_API_KEY || 'demo_key';
    this.delhiBounds = {
      north: 28.8,
      south: 28.4,
      east: 77.3,
      west: 76.8
    };
  }

  async fetchFireData() {
    try {
      console.log('Fetching NASA FIRMS fire data...');
      
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      const response = await axios.get(`${this.baseURL}area/csv/${this.apiKey}/VIIRS_SNPP_NRT/${this.delhiBounds.west},${this.delhiBounds.south},${this.delhiBounds.east},${this.delhiBounds.north}/1/${yesterday.toISOString().split('T')[0]}`, {
        timeout: 15000
      });
      
      if (response.data) {
        const fireData = this.parseFireCSV(response.data);
        await this.processSatelliteData(fireData);
        console.log(`Processed ${fireData.length} fire detections from NASA`);
        return fireData;
      } else {
        console.log('No NASA fire data available, generating simulated data');
        return this.generateSimulatedSatelliteData();
      }
    } catch (error) {
      console.error('NASA data fetch error:', error.message);
      return this.generateSimulatedSatelliteData();
    }
  }

  parseFireCSV(csvData) {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    const firePoints = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const firePoint = {};
      
      headers.forEach((header, index) => {
        firePoint[header.trim()] = values[index]?.trim();
      });

      if (firePoint.latitude && firePoint.longitude && firePoint.confidence) {
        firePoints.push({
          latitude: parseFloat(firePoint.latitude),
          longitude: parseFloat(firePoint.longitude),
          brightness: parseFloat(firePoint.bright_ti4) || 0,
          confidence: parseFloat(firePoint.confidence) || 0,
          frp: parseFloat(firePoint.frp) || 0, // Fire Radiative Power
          acq_date: firePoint.acq_date,
          acq_time: firePoint.acq_time
        });
      }
    }

    return firePoints;
  }

  async fetchAerosolData() {
    try {
      console.log('Fetching MODIS aerosol data...');
      
      // Note: This is a simplified simulation as MODIS API requires complex authentication
      return this.generateSimulatedAerosolData();
    } catch (error) {
      console.error('MODIS aerosol data error:', error.message);
      return this.generateSimulatedAerosolData();
    }
  }

  generateSimulatedSatelliteData() {
    const simulatedData = [];
    const hotspots = [
      { lat: 28.7, lng: 77.1, type: 'stubble_burning', intensity: 'high' },
      { lat: 28.55, lng: 77.25, type: 'industrial', intensity: 'medium' },
      { lat: 28.6, lng: 77.35, type: 'waste_burning', intensity: 'medium' },
      { lat: 28.65, lng: 77.0, type: 'dust_storm', intensity: 'low' }
    ];

    hotspots.forEach(hotspot => {
      // Generate multiple points around each hotspot
      for (let i = 0; i < (hotspot.intensity === 'high' ? 5 : 2); i++) {
        simulatedData.push({
          latitude: hotspot.lat + (Math.random() - 0.5) * 0.1,
          longitude: hotspot.lng + (Math.random() - 0.5) * 0.1,
          brightness: hotspot.intensity === 'high' ? 320 + Math.random() * 30 :
                     hotspot.intensity === 'medium' ? 300 + Math.random() * 20 : 290 + Math.random() * 10,
          confidence: 80 + Math.random() * 20,
          frp: hotspot.intensity === 'high' ? 50 + Math.random() * 100 : 20 + Math.random() * 30,
          source_type: hotspot.type,
          acq_date: new Date().toISOString().split('T')[0],
          acq_time: new Date().toTimeString().split(' ')[0]
        });
      }
    });

    return simulatedData;
  }

  generateSimulatedAerosolData() {
    const aerosolData = [];
    
    // Generate grid of AOD (Aerosol Optical Depth) values
    for (let lat = this.delhiBounds.south; lat <= this.delhiBounds.north; lat += 0.1) {
      for (let lng = this.delhiBounds.west; lng <= this.delhiBounds.east; lng += 0.1) {
        const distanceFromCenter = Math.sqrt(
          Math.pow(lat - 28.6139, 2) + Math.pow(lng - 77.2090, 2)
        );
        
        // Higher AOD values closer to city center
        const baseAOD = 0.6 - distanceFromCenter * 0.3;
        const seasonalFactor = this.getSeasonalAerosolFactor();
        const noise = (Math.random() - 0.5) * 0.2;
        
        const aod = Math.max(0.1, Math.min(2.0, baseAOD * seasonalFactor + noise));
        
        aerosolData.push({
          latitude: lat,
          longitude: lng,
          aod: aod,
          cloud_cover: Math.random() * 30,
          quality_flag: Math.random() > 0.1 ? 'good' : 'marginal'
        });
      }
    }
    
    return aerosolData;
  }

  getSeasonalAerosolFactor() {
    const month = new Date().getMonth();
    // Higher aerosol loading in winter months
    if (month >= 9 || month <= 1) return 1.5; // Oct-Feb
    if (month >= 2 && month <= 4) return 1.2;  // Mar-May
    return 0.8; // Monsoon months
  }

  async processSatelliteData(fireData, aerosolData = []) {
    const sources = [];
    
    // Process fire data
    fireData.forEach(fire => {
      if (fire.confidence > 50) { // Only high-confidence detections
        const sourceType = this.classifyFireSource(fire);
        const intensity = this.calculateFireIntensity(fire);
        
        sources.push({
          source_id: `fire_${uuidv4()}`,
          source_type: sourceType,
          location: {
            type: 'Point',
            coordinates: [fire.longitude, fire.latitude]
          },
          intensity_score: intensity,
          confidence: fire.confidence / 100,
          detected_at: new Date(),
          satellite_data: {
            modis_aod: Math.random() * 1.5 + 0.3, // Simulated AOD
            fire_pixels: 1,
            thermal_anomaly: true,
            cloud_cover: Math.random() * 20
          },
          meteorological: {
            wind_speed: 3 + Math.random() * 7,
            wind_direction: Math.random() * 360,
            boundary_layer_height: 500 + Math.random() * 1000,
            stability_class: ['D', 'E', 'F'][Math.floor(Math.random() * 3)]
          },
          impact_radius: Math.min(20, intensity / 10) // Max 20km radius
        });
      }
    });

    // Process aerosol data for non-fire sources
    aerosolData.forEach(aerosol => {
      if (aerosol.aod > 0.8) { // High aerosol loading
        const sourceType = this.classifyAerosolSource(aerosol);
        
        sources.push({
          source_id: `aerosol_${uuidv4()}`,
          source_type: sourceType,
          location: {
            type: 'Point',
            coordinates: [aerosol.longitude, aerosol.latitude]
          },
          intensity_score: Math.min(300, aerosol.aod * 150),
          confidence: aerosol.quality_flag === 'good' ? 0.8 : 0.6,
          detected_at: new Date(),
          satellite_data: {
            modis_aod: aerosol.aod,
            fire_pixels: 0,
            thermal_anomaly: false,
            cloud_cover: aerosol.cloud_cover
          },
          impact_radius: 10
        });
      }
    });

    // Save to database
    await this.saveSourcesToDB(sources);
    return sources;
  }

  classifyFireSource(fire) {
    const hour = parseInt(fire.acq_time.split(':')[0]);
    
    // Nighttime fires often indicate stubble burning
    if (hour < 6 || hour > 22) {
      return 'stubble_burning';
    }
    
    // High FRP suggests industrial activity
    if (fire.frp > 100) {
      return 'industrial';
    }
    
    // Medium FRP could be waste burning
    if (fire.frp > 30) {
      return 'waste_burning';
    }
    
    return 'stubble_burning'; // Default for agricultural areas
  }

  classifyAerosolSource(aerosol) {
    // Simple classification based on location and AOD characteristics
    const isUrbanArea = aerosol.latitude > 28.55 && aerosol.latitude < 28.68 &&
                       aerosol.longitude > 77.15 && aerosol.longitude < 77.25;
    
    if (isUrbanArea) {
      return aerosol.aod > 1.2 ? 'vehicular' : 'urban_background';
    } else {
      return aerosol.aod > 1.5 ? 'industrial' : 'dust_storm';
    }
  }

  calculateFireIntensity(fire) {
    // Intensity based on FRP (Fire Radiative Power) and confidence
    const frpScore = Math.min(200, fire.frp * 2);
    const confidenceScore = fire.confidence;
    const brightnessScore = (fire.brightness - 290) * 2;
    
    return Math.max(50, Math.min(400, frpScore + confidenceScore + brightnessScore));
  }

  async saveSourcesToDB(sources) {
    try {
      if (sources.length === 0) return;

      const bulkOps = sources.map(source => ({
        updateOne: {
          filter: {
            location: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: source.location.coordinates
                },
                $maxDistance: 1000 // 1km radius for deduplication
              }
            },
            source_type: source.source_type,
            detected_at: {
              $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) // Last 6 hours
            }
          },
          update: { $set: source },
          upsert: true
        }
      }));

      const result = await PollutionSource.bulkWrite(bulkOps);
      console.log(`Saved ${result.upsertedCount + result.modifiedCount} pollution sources to DB`);
    } catch (error) {
      console.error('Error saving pollution sources:', error.message);
    }
  }

  async getActiveSources() {
    try {
      return await PollutionSource.find({
        status: 'active',
        detected_at: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }).sort({ intensity_score: -1 });
    } catch (error) {
      console.error('Error fetching active sources:', error.message);
      return [];
    }
  }
}

module.exports = NASAConnector;
