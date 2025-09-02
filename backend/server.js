require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = 3001;

// Configuración CORS - Permitir todos los orígenes (*)
const corsOptions = {
  origin: "*", // Permitir todos los orígenes como solicitaste
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
console.log('🌐 CORS configurado para permitir todos los orígenes (*)');
app.use(express.json());

// Conectar a MongoDB
mongoose
  .connect("mongodb://localhost:27017/ns-news", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error MongoDB:", err));

// Manejar eventos de conexión
mongoose.connection.on('error', (err) => {
  console.error('❌ Error de conexión MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Conexión MongoDB desconectada');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ Conexión MongoDB reconectada');
});

// Rutas
const adminSubscribersRouter = require("./routes/adminSubscribers");
app.use("/api/admin/subscribers", adminSubscribersRouter);

const newsRouter = require("./routes/news");
app.use("/api/news", newsRouter);

const scheduleTimesRouter = require("./routes/scheduleTimes");
app.use("/api/admin/schedule-times", scheduleTimesRouter);

const manualNewsletterRouter = require("./routes/manualNewsletter");
app.use("/api/admin/manual-newsletter", manualNewsletterRouter);

const defaultConfigRouter = require("./routes/defaultConfig");
app.use("/api/admin/default-config", defaultConfigRouter);

// Ruta de admin principal (protegida)
const { requireAuth } = require("./middleware/auth.js");
app.get("/api/admin", requireAuth, (req, res) => {
  res.json({ 
    message: "Acceso admin autorizado", 
    timestamp: new Date().toISOString(),
    endpoints: {
      subscribers: "/api/admin/subscribers",
      news: "/api/news"
    }
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 CORS: Permitidos todos los orígenes (*)`);
  console.log(`🔗 URLs permitidas:`);
  console.log(`   - Desarrollo: http://localhost:${PORT}`);
  console.log(`   - Frontend: http://localhost:5173`);
  console.log(`   - Vercel: https://noticias-nsgroup-newsroom.vercel.app`);
  console.log(`   - Railway: https://noticias-nsgroup-production.up.railway.app`);
});
