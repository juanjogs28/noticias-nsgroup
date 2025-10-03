const mongoose = require("mongoose");

const cachedNewsSchema = new mongoose.Schema({
  searchId: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: ['país', 'sector']
  },
  articles: [{
    id: String,
    url: String,
    published_date: String,
    source: {
      name: String
    },
    content: {
      title: String,
      summary: String,
      image: String
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isFromMeltwater: {
    type: Boolean,
    default: false
  },
  totalArticles: {
    type: Number,
    default: 0
  }
});

// Índice para búsquedas rápidas
cachedNewsSchema.index({ searchId: 1 });
cachedNewsSchema.index({ lastUpdated: 1 });

module.exports = mongoose.model("CachedNews", cachedNewsSchema);
