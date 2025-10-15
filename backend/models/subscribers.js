// Modelo de datos para suscriptores del newsletter
const mongoose = require("mongoose");

// Esquema que define la estructura de un suscriptor
const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }, // Email único del suscriptor
  subscribedAt: { type: Date, default: Date.now }, // Fecha de suscripción automática
  isActive: { type: Boolean, default: true } // Estado activo/inactivo del suscriptor
});

// Exportar el modelo para uso en otras partes de la aplicación
module.exports = mongoose.model("Subscriber", subscriberSchema);
