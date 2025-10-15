// Modelo de datos para búsquedas de noticias configuradas
const mongoose = require("mongoose");

// Esquema que define la estructura de una búsqueda
const searchSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, // Nombre descriptivo de la búsqueda
    trim: true // Eliminar espacios en blanco
  },
  countrySearchId: { 
    type: String, 
    required: true, // ID técnico de búsqueda de país en Meltwater
    trim: true 
  },
  sectorSearchId: { 
    type: String, 
    required: true, // ID técnico de búsqueda de sector en Meltwater
    trim: true 
  },
  isActive: { 
    type: Boolean, 
    default: true // Estado activo/inactivo de la búsqueda
  },
  createdAt: { 
    type: Date, 
    default: Date.now // Fecha de creación automática
  }
});

// Exportar el modelo para uso en otras partes de la aplicación
module.exports = mongoose.model("Search", searchSchema);
