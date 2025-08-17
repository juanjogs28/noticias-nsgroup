// Configuración centralizada del backend
const config = {
  // Configuración del servidor
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost'
  },

  // Configuración de la base de datos
  database: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/ns-news',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },

  // Configuración de CORS
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
  },

  // Configuración de la API
  api: {
    version: '1.0.0',
    prefix: '/api',
    endpoints: {
      health: '/health',
      subscribe: '/subscribe',
      subscribers: '/subscribers'
    }
  },

  // Configuración de validaciones
  validation: {
    email: {
      regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    categories: ['all', 'redes-sociales', 'tecnologia', 'finanzas', 'medicina', 'ciencia', 'medio-ambiente', 'general'],
    regions: ['us', 'mx', 'es', 'ar', 'co', 'pe', 'cl', 'br', 'global']
  },

  // Configuración de logs
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: true
  }
};

module.exports = config;
