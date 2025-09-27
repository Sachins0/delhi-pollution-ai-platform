const mongoose = require('mongoose');

const policyRecommendationSchema = new mongoose.Schema({
  recommendation_id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['transportation', 'industrial', 'agricultural', 'construction', 'emergency_action'],
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    default: 'medium',
    index: true
  },
  target_sources: [{
    source_type: {
      type: String,
      enum: ['vehicular', 'industrial', 'stubble_burning', 'construction', 'domestic']
    },
    expected_reduction: { type: Number, min: 0, max: 100 } // percentage
  }],
  implementation: {
    timeline: {
      type: String,
      enum: ['immediate', 'short_term', 'medium_term', 'long_term'],
      required: true
    },
    cost_estimate: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'INR' }
    },
    resources_required: [String],
    stakeholders: [String]
  },
  predicted_impact: {
    aqi_reduction: { type: Number, min: 0 },
    pollutant_reduction: {
      pm25: { type: Number, min: 0 },
      pm10: { type: Number, min: 0 },
      co: { type: Number, min: 0 },
      no2: { type: Number, min: 0 }
    },
    population_affected: Number,
    health_benefits: String
  },
  evidence_base: {
    data_sources: [String],
    confidence_score: { type: Number, min: 0, max: 1 },
    similar_implementations: [{
      location: String,
      outcome: String,
      effectiveness: Number
    }]
  },
  status: {
    type: String,
    enum: ['draft', 'proposed', 'under_review', 'approved', 'implemented', 'completed'],
    default: 'draft',
    index: true
  },
  created_by: {
    type: String,
    default: 'AI_System'
  }
}, {
  timestamps: true,
  collection: 'policy_recommendations'
});

// Indexes
policyRecommendationSchema.index({ category: 1, priority: -1 });
policyRecommendationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PolicyRecommendation', policyRecommendationSchema);
