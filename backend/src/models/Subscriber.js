const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['all', 'redes-sociales', 'tecnologia', 'finanzas', 'medicina', 'ciencia', 'medio-ambiente', 'general'],
    default: 'all'
  },
  region: {
    type: String,
    required: true,
    enum: ['us', 'mx', 'es', 'ar', 'co', 'pe', 'cl', 'br', 'global'],
    default: 'us'
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('Subscriber', subscriberSchema);
