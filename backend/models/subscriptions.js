// Modelo de datos para suscripciones que relacionan suscriptores con búsquedas
const mongoose = require("mongoose");

// Esquema que define la estructura de una suscripción
const subscriptionSchema = new mongoose.Schema({
  subscriberId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Subscriber', // Referencia al modelo Subscriber
    required: true 
  },
  searchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Search', // Referencia al modelo Search
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true // Estado activo/inactivo de la suscripción
  },
  subscribedAt: { 
    type: Date, 
    default: Date.now // Fecha de suscripción automática
  }
});

// Índice compuesto único para evitar duplicados de suscripciones
subscriptionSchema.index({ subscriberId: 1, searchId: 1 }, { unique: true });

// Exportar el modelo para uso en otras partes de la aplicación
module.exports = mongoose.model("Subscription", subscriptionSchema);
