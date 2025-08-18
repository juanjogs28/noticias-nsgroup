const mongoose = require("mongoose");

const defaultConfigSchema = new mongoose.Schema({
  defaultCountrySearchId: { type: String, default: "" },
  defaultSectorSearchId: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: String, default: "system" } // Email del admin que lo actualizó
});

// Actualizar timestamp automáticamente
defaultConfigSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("DefaultConfig", defaultConfigSchema);
