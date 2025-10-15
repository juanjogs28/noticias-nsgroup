// Modelo de datos para horarios de envío de newsletters
const mongoose = require("mongoose");

// Esquema que define la estructura de un horario de envío
const scheduleTimeSchema = new mongoose.Schema({
  time: { 
    type: String, 
    required: true, // Horario en formato HH:MM
    validate: {
      validator: function(v) {
        // Validar formato HH:MM (24 horas) con regex
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'El formato debe ser HH:MM (ej: 08:00, 13:00, 20:00)'
    }
  },
  isActive: { type: Boolean, default: true }, // Estado activo/inactivo del horario
  createdAt: { type: Date, default: Date.now }, // Fecha de creación automática
  description: { type: String, default: "" } // Descripción opcional del horario
});

// Exportar el modelo para uso en otras partes de la aplicación
module.exports = mongoose.model("ScheduleTime", scheduleTimeSchema);
