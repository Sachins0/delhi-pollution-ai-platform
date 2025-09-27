const cron = require('node-cron');
const CPCBConnector = require('./CPCBConnector');
const NASAConnector = require('./NASAConnector');
const AQIData = require('../models/AQIData');
const PollutionSource = require('../models/PollutionSource');

class DataCollectionService {
  constructor(io) {
    this.io = io; // Socket.io instance for real-time updates
    this.cpcbConnector = new CPCBConnector();
    this.nasaConnector = new NASAConnector();
    this.isRunning = false;
    this.dataCache = {
      aqi: [],
      sources: [],
      lastUpdate: null
    };
  }

  // ADD THIS NEW METHOD
  emitAQIUpdateToLocations(aqiData, eventName = 'realtime_update', additionalData = {}) {
    // Emit to specific location rooms
    aqiData.forEach((point) => {
      if (point.location && point.location.coordinates) {
        const lat = point.location.coordinates[1].toFixed(3); // latitude
        const lng = point.location.coordinates[0].toFixed(3); // longitude
        const room = `location_${lat}_${lng}`;

        this.io.to(room).emit(eventName, {
          aqi_data: [point],
          timestamp: new Date(),
          location: { lat: parseFloat(lat), lng: parseFloat(lng) },
          ...additionalData
        });
      }
    });

     // Also emit general broadcast for clients not subscribed to specific locations
    this.io.emit(eventName, {
      aqi_data: aqiData,
      timestamp: new Date(),
      ...additionalData
    });
  }


  startRealTimeCollection() {
    if (this.isRunning) {
      console.log('Data collection service already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting real-time data collection service...');

    // Initial data fetch
    this.collectAllData();

    // Schedule regular data collection
    this.scheduleDataCollection();
    
    // Real-time emission loop
    this.startRealTimeEmission();
  }

  scheduleDataCollection() {
    // Collect CPCB data every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      console.log('Scheduled CPCB data collection...');
      try {
        const aqiData = await this.cpcbConnector.fetchRealTimeData();
        this.dataCache.aqi = aqiData;
        this.dataCache.lastUpdate = new Date();
        
        // NEW CODE - Location-based emissions
        this.emitAQIUpdateToLocations(aqiData, 'aqi_update', {
          source: 'scheduled_cpcb'
        });
      } catch (error) {
        console.error('Scheduled CPCB collection error:', error.message);
      }
    });

    // Collect NASA satellite data every 2 hours
    cron.schedule('0 */2 * * *', async () => {
      console.log('Scheduled NASA satellite data collection...');
      try {
        const fireData = await this.nasaConnector.fetchFireData();
        const aerosolData = await this.nasaConnector.fetchAerosolData();
        const sources = await this.nasaConnector.processSatelliteData(fireData, aerosolData);
        
        this.dataCache.sources = sources;
        
        // Emit to connected clients
        this.io.emit('sources_update', {
          data: sources,
          timestamp: new Date(),
          source: 'scheduled_nasa'
        });
      } catch (error) {
        console.error('Scheduled NASA collection error:', error.message);
      }
    });

    // Database cleanup - remove old data daily at midnight
    cron.schedule('0 0 * * *', async () => {
      console.log('Running daily database cleanup...');
      await this.cleanupOldData();
    });

    // Data quality check every hour
    cron.schedule('0 * * * *', async () => {
      console.log('Running data quality check...');
      await this.performDataQualityCheck();
    });

    console.log('Data collection schedules configured');
  }

  startRealTimeEmission() {
    // Emit updated data every 30 seconds for real-time feel
    setInterval(async () => {
      try {
        // Get latest data from database
        const latestAQI = await AQIData.find()
          .sort({ timestamp: -1 })
          .limit(50)
          .exec();

        const activeSources = await PollutionSource.find({
          status: 'active',
          detected_at: { $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) }
        }).sort({ intensity_score: -1 }).limit(20);

        // Add some real-time variability for demo
        const enhancedAQI = latestAQI.map(record => ({
          ...record.toObject(),
          aqi_value: Math.max(30, record.aqi_value + (Math.random() - 0.5) * 10),
          pollutants: {
            ...record.pollutants,
            pm25: Math.max(0, record.pollutants.pm25 + (Math.random() - 0.5) * 5),
            pm10: Math.max(0, record.pollutants.pm10 + (Math.random() - 0.5) * 8)
          }
        }));

         // NEW CODE - Location-based emissions
        this.emitAQIUpdateToLocations(enhancedAQI, 'realtime_update', {
          pollution_sources: activeSources,
          connected_clients: this.io.sockets.sockets.size
        });

        // Update cache
        this.dataCache.aqi = enhancedAQI;
        this.dataCache.sources = activeSources;
        this.dataCache.lastUpdate = new Date();

      } catch (error) {
        console.error('Real-time emission error:', error.message);
      }
    }, 30000); // 30 seconds
  }

  async collectAllData() {
    console.log('Collecting all data sources...');
    
    try {
      // Collect CPCB data
      const aqiData = await this.cpcbConnector.fetchRealTimeData();
      console.log(`Collected ${aqiData.length} AQI records`);

      // Collect NASA data
      const fireData = await this.nasaConnector.fetchFireData();
      const aerosolData = await this.nasaConnector.fetchAerosolData();
      const sources = await this.nasaConnector.processSatelliteData(fireData, aerosolData);
      console.log(`Identified ${sources.length} pollution sources`);

      // Update cache
      this.dataCache.aqi = aqiData;
      this.dataCache.sources = sources;
      this.dataCache.lastUpdate = new Date();

     // NEW CODE - Location-based emissions
      this.emitAQIUpdateToLocations(aqiData, 'initial_data_loaded', {
        pollution_sources: sources
      });

      console.log('Initial data collection completed');
    } catch (error) {
      console.error('Error in initial data collection:', error.message);
    }
  }

  async performDataQualityCheck() {
    try {
      // Check for stale data
      const staleThreshold = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours
      const staleRecords = await AQIData.countDocuments({
        timestamp: { $lt: staleThreshold },
        data_source: { $ne: 'SIMULATED' }
      });

      if (staleRecords > 0) {
        console.warn(`Found ${staleRecords} stale data records`);
      }

      // Check for anomalous values
      const anomalousRecords = await AQIData.find({
        $or: [
          { aqi_value: { $gt: 500 } },
          { aqi_value: { $lt: 0 } },
          { 'pollutants.pm25': { $gt: 500 } },
          { 'pollutants.pm10': { $gt: 1000 } }
        ],
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (anomalousRecords.length > 0) {
        console.warn(`Found ${anomalousRecords.length} anomalous data records`);
        
        // Mark anomalous records with lower quality score
        await AQIData.updateMany(
          { _id: { $in: anomalousRecords.map(r => r._id) } },
          { $set: { quality_score: 0.3 } }
        );
      }

      // Emit data quality status
      this.io.emit('data_quality_update', {
        stale_records: staleRecords,
        anomalous_records: anomalousRecords.length,
        last_check: new Date(),
        status: staleRecords === 0 && anomalousRecords.length === 0 ? 'good' : 'warning'
      });

    } catch (error) {
      console.error('Data quality check error:', error.message);
    }
  }

  async cleanupOldData() {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Remove very old AQI data (keep only 1 month)
      const deletedAQI = await AQIData.deleteMany({
        timestamp: { $lt: oneMonthAgo }
      });

      // Remove old pollution sources (keep only 1 week)
      const deletedSources = await PollutionSource.deleteMany({
        detected_at: { $lt: oneWeekAgo }
      });

      console.log(`Cleanup completed: ${deletedAQI.deletedCount} AQI records, ${deletedSources.deletedCount} source records deleted`);

    } catch (error) {
      console.error('Database cleanup error:', error.message);
    }
  }

  getStatus() {
    return {
      running: this.isRunning,
      last_update: this.dataCache.lastUpdate,
      cached_aqi_records: this.dataCache.aqi.length,
      cached_sources: this.dataCache.sources.length,
      connected_clients: this.io ? this.io.sockets.sockets.size : 0
    };
  }

  stop() {
    this.isRunning = false;
    console.log('Data collection service stopped');
  }
}

module.exports = DataCollectionService;
