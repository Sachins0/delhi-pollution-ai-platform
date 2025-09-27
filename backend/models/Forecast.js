const mongoose = require('mongoose');

const forecastSchema = new mongoose.Schema({
  forecast_id: {
    type: String,
    required: true,
    unique: true
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
  forecast_time: {
    type: Date,
    required: true,
    index: true
  },
  valid_time: {
    type: Date,
    required: true,
    index: true
  },
  forecast_horizon: {
    type: Number, // hours
    required: true,
    min: 1,
    max: 168 // 7 days max
  },
  predicted_aqi: {
    type: Number,
    required: true,
    min: 0,
    max: 500
  },
  confidence_interval: {
    lower: { type: Number, min: 0 },
    upper: { type: Number, max: 500 },
    confidence_level: { type: Number, default: 0.95 }
  },
  predicted_pollutants: {
    pm25: { type: Number, min: 0 },
    pm10: { type: Number, min: 0 },
    co: { type: Number, min: 0 },
    no2: { type: Number, min: 0 },
    so2: { type: Number, min: 0 },
    o3: { type: Number, min: 0 }
  },
  contributing_factors: [{
    factor: {
      type: String,
      enum: ['vehicular', 'industrial', 'stubble_burning', 'meteorological', 'seasonal']
    },
    contribution_percentage: { type: Number, min: 0, max: 100 },
    confidence: { type: Number, min: 0, max: 1 }
  }],
  meteorological_inputs: {
    temperature: Number,
    humidity: Number,
    wind_speed: Number,
    wind_direction: Number,
    pressure: Number,
    boundary_layer_height: Number
  },
  model_version: {
    type: String,
    required: true
  },
  accuracy_metrics: {
    mape: Number, // Mean Absolute Percentage Error
    rmse: Number, // Root Mean Square Error
    mae: Number   // Mean Absolute Error
  }
}, {
  timestamps: true,
  collection: 'forecasts'
});

// Indexes
forecastSchema.index({ location: '2dsphere' });
forecastSchema.index({ forecast_time: -1 });
forecastSchema.index({ valid_time: 1 });
forecastSchema.index({ forecast_horizon: 1 });

module.exports = mongoose.model('Forecast', forecastSchema);
