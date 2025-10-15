// Modelo de datos para configuración por defecto del sistema
const mongoose = require("mongoose");

// Esquema que define la estructura de la configuración por defecto
const defaultConfigSchema = new mongoose.Schema({
  defaultCountrySearchId: { type: String, default: "" }, // ID de búsqueda de país por defecto
  defaultSectorSearchId: { type: String, default: "" }, // ID de búsqueda de sector por defecto
  updatedAt: { type: Date, default: Date.now }, // Fecha de última actualización
  updatedBy: { type: String, default: "system" } // Email del admin que actualizó la configuración
});

// Middleware que actualiza automáticamente el timestamp al guardar
defaultConfigSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Exportar el modelo para uso en otras partes de la aplicación
module.exports = mongoose.model("DefaultConfig", defaultConfigSchema);
