const { app, PORT } = require('./app');
const config = require('./config/config');

// Iniciar servidor
app.listen(PORT, config.server.host, () => {
  console.log(`🚀 Servidor corriendo en http://${config.server.host}:${PORT}`);
  console.log(`📧 Endpoint: http://${config.server.host}:${PORT}${config.api.prefix}/subscribe`);
  console.log(`🔍 Health check: http://${config.server.host}:${PORT}${config.api.prefix}/health`);
  console.log(`👥 Suscriptores: http://${config.server.host}:${PORT}${config.api.prefix}/subscribers`);
  console.log(`🌐 Frontend permitido: ${config.cors.origin}`);
});
