const mongoose = require('mongoose');

const AqiSchema = new mongoose.Schema({
  city: { type: String, default: 'Unknown' },
  latitude: Number,
  longitude: Number,
  aqi: Number,
  pm25: Number,
  pm10: Number,
  sourceType: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Aqi', AqiSchema);
