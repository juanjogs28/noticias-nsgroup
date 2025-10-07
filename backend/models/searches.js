const mongoose = require("mongoose");

const searchSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  countrySearchId: { 
    type: String, 
    required: true,
    trim: true
  },
  sectorSearchId: { 
    type: String, 
    required: true,
    trim: true
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("Search", searchSchema);
