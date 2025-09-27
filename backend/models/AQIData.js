const mongoose = require('mongoose');

const aqiDataSchema = new mongoose.Schema({
  station_id: {
    type: String,
    required: true,
    index: true
  },
  station_name: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  aqi_value: {
    type: Number,
    required: true,
    min: 0,
    max: 500
  },
  aqi_category: {
    type: String,
    enum: ['Good', 'Moderate', 'Unhealthy for Sensitive', 'Unhealthy', 'Very Unhealthy', 'Hazardous'],
    required: true
  },
  pollutants: {
    pm25: { type: Number, default: 0, min: 0 },
    pm10: { type: Number, default: 0, min: 0 },
    co: { type: Number, default: 0, min: 0 },
    no2: { type: Number, default: 0, min: 0 },
    so2: { type: Number, default: 0, min: 0 },
    o3: { type: Number, default: 0, min: 0 },
    nh3: { type: Number, default: 0, min: 0 }
  },
  weather: {
    temperature: { type: Number },
    humidity: { type: Number, min: 0, max: 100 },
    wind_speed: { type: Number, min: 0 },
    wind_direction: { type: Number, min: 0, max: 360 },
    pressure: { type: Number }
  },
  data_source: {
    type: String,
    enum: ['CPCB', 'DPCC', 'HARYANA_PCB', 'UPPCB', 'SIMULATED'],
    default: 'SIMULATED'
  },
  quality_score: {
    type: Number,
    min: 0,
    max: 1,
    default: 1
  }
}, {
  timestamps: true,
  collection: 'aqi_data'
});

// Create geospatial index for location queries
aqiDataSchema.index({ location: '2dsphere' });

// Create compound index for efficient time-series queries
aqiDataSchema.index({ timestamp: -1, station_id: 1 });

// Calculate AQI category based on value
aqiDataSchema.pre('save', function(next) {
  if (this.aqi_value <= 50) {
    this.aqi_category = 'Good';
  } else if (this.aqi_value <= 100) {
    this.aqi_category = 'Moderate';
  } else if (this.aqi_value <= 150) {
    this.aqi_category = 'Unhealthy for Sensitive';
  } else if (this.aqi_value <= 200) {
    this.aqi_category = 'Unhealthy';
  } else if (this.aqi_value <= 300) {
    this.aqi_category = 'Very Unhealthy';
  } else {
    this.aqi_category = 'Hazardous';
  }
  next();
});

module.exports = mongoose.model('AQIData', aqiDataSchema);
