require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors({ origin: "http://localhost:8080" }));
app.use(express.json());

// Conectar a MongoDB
mongoose
  .connect("mongodb://localhost:27017/ns-news")
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error MongoDB:", err));

// Rutas
const adminSubscribersRouter = require("./routes/adminSubscribers");
app.use("/api/admin/subscribers", adminSubscribersRouter);

const newsRouter = require("./routes/news");
app.use("/api/news", newsRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
