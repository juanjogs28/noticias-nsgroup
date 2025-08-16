// server.js
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = 3001;
const newsRouter = require("./routes/news");
app.use("/api/news", newsRouter);

// Middlewares
app.use(cors({ origin: "http://localhost:8080" }));
app.use(express.json());

// Conectar a MongoDB
mongoose.connect("mongodb://localhost:27017/ns-news")
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error MongoDB:", err));

// Importar rutas de admin
const subscribersRouter = require("./routes/adminSubscribers.js");
app.use("/api/admin/subscribers", subscribersRouter);

// Endpoint de health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Servidor funcionando correctamente",
    timestamp: new Date().toISOString(),
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📧 Endpoint admin suscriptores: http://localhost:${PORT}/api/admin/subscribers`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});
