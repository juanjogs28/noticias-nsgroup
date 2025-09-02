const mongoose = require("mongoose");

const scheduleTimeSchema = new mongoose.Schema({
  time: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        // Validar formato HH:MM (24 horas)
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'El formato debe ser HH:MM (ej: 08:00, 13:00, 20:00)'
    }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  description: { type: String, default: "" } // Descripción opcional del horario
});

module.exports = mongoose.model("ScheduleTime", scheduleTimeSchema);
