const mongoose = require('mongoose');

const pollutionSourceSchema = new mongoose.Schema({
  source_id: {
    type: String,
    required: true,
    unique: true
  },
  source_type: {
    type: String,
    enum: ['vehicular', 'industrial', 'stubble_burning', 'construction', 'domestic', 'power_plant', 'waste_burning', 'dust_storm'],
    required: true,
    index: true
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
  intensity_score: {
    type: Number,
    required: true,
    min: 0,
    max: 500
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  detected_at: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  satellite_data: {
    modis_aod: { type: Number, min: 0 }, // Aerosol Optical Depth
    fire_pixels: { type: Number, min: 0 },
    thermal_anomaly: { type: Boolean, default: false },
    cloud_cover: { type: Number, min: 0, max: 100 }
  },
  ground_data: {
    nearby_stations: [{
      station_id: String,
      distance_km: Number,
      correlation: Number
    }],
    traffic_density: { type: Number, min: 0, max: 10 },
    industrial_activity: { type: Number, min: 0, max: 10 }
  },
  meteorological: {
    wind_speed: { type: Number, min: 0 },
    wind_direction: { type: Number, min: 0, max: 360 },
    boundary_layer_height: { type: Number },
    stability_class: { 
      type: String,
      enum: ['A', 'B', 'C', 'D', 'E', 'F'] // Atmospheric stability
    }
  },
  impact_radius: {
    type: Number,
    default: 5 // kilometers
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'resolved'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true,
  collection: 'pollution_sources'
});

// Geospatial index
pollutionSourceSchema.index({ location: '2dsphere' });

// Compound indexes for efficient queries
pollutionSourceSchema.index({ source_type: 1, detected_at: -1 });
pollutionSourceSchema.index({ status: 1, intensity_score: -1 });

module.exports = mongoose.model('PollutionSource', pollutionSourceSchema);
