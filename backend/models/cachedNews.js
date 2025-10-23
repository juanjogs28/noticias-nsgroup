// Modelo de datos para caché de noticias obtenidas de Meltwater
const mongoose = require("mongoose");

// Esquema que define la estructura de noticias en caché
const cachedNewsSchema = new mongoose.Schema({
  searchId: {
    type: String,
    required: true, // ID único de la búsqueda
    index: true
  },
  category: {
    type: String,
    required: true, // Categoría de la búsqueda (país o sector)
    enum: ['país', 'sector']
  },
  articles: [{ // Array de artículos almacenados en caché
    id: String, // ID único del artículo
    url: String, // URL del artículo original
    published_date: String, // Fecha de publicación
    source: {
      name: String // Nombre de la fuente
    },
    content: {
      title: String, // Título del artículo
      summary: String, // Resumen del artículo
      image: String // URL de la imagen
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now // Fecha de última actualización del caché
  },
  isFromMeltwater: {
    type: Boolean,
    default: false // Indica si los datos son reales de Meltwater o fallback
  },
  totalArticles: {
    type: Number,
    default: 0 // Contador total de artículos en caché
  }
});

// Índices para optimizar búsquedas rápidas
cachedNewsSchema.index({ lastUpdated: 1 }); // Índice por fecha de actualización

// Exportar el modelo para uso en otras partes de la aplicación
module.exports = mongoose.model("CachedNews", cachedNewsSchema);
