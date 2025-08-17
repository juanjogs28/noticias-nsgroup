const express = require('express');
const cors = require('./middleware/cors');
const connectDB = require('./config/database');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const config = require('./config/config');

const app = express();
const PORT = config.server.port;

// Middlewares
app.use(cors);
app.use(express.json());

// Conectar a MongoDB
connectDB();

// Rutas
app.use(config.api.prefix, subscriptionRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de NS Group Newsletter',
    version: config.api.version,
    endpoints: {
      health: `${config.api.prefix}${config.api.endpoints.health}`,
      subscribe: `${config.api.prefix}${config.api.endpoints.subscribe}`,
      subscribers: `${config.api.prefix}${config.api.endpoints.subscribers}`
    }
  });
});

module.exports = { app, PORT };
