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

// Función de diagnóstico de variables de entorno
function diagnoseEnvironment() {
  console.log("\n🔍 DIAGNÓSTICO DE ENTORNO:");
  console.log("NODE_ENV:", process.env.NODE_ENV || "undefined");
  console.log("MONGODB_URI:", process.env.MONGODB_URI ? "✅ Configurada" : "❌ No configurada");
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✅ Configurada" : "❌ No configurada");
  console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ Configurada" : "❌ No configurada");

  // Listar variables relacionadas con DB
  const dbVars = Object.keys(process.env).filter(key =>
    key.includes('MONGO') || key.includes('DATABASE') || key.includes('DB')
  );
  if (dbVars.length > 0) {
    console.log("Variables DB disponibles:", dbVars);
  }
  console.log("-".repeat(50));
}

diagnoseEnvironment();

// Conectar a MongoDB - Usar variable de entorno o fallback
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI || "mongodb://localhost:27017/ns-news";

console.log('🔧 Configuración MongoDB:', {
  uri: MONGODB_URI.replace(/\/\/.*@/, '//***:***@'), // Ocultar credenciales en logs
  isProduction: process.env.NODE_ENV === 'production',
  isLocalhost: MONGODB_URI.includes('localhost'),
  hasCredentials: MONGODB_URI.includes('@'),
  protocol: MONGODB_URI.split('://')[0]
});

// Si estamos en producción pero usando localhost, advertir
if (process.env.NODE_ENV === 'production' && MONGODB_URI.includes('localhost')) {
  console.error("🚨 ERROR CRÍTICO: Estás en producción pero usando MongoDB localhost!");
  console.error("   Configura la variable MONGODB_URI en Railway con tu URL de MongoDB externa");
  console.error("   Ejemplo: mongodb://usuario:password@containers-us-west-1.railway.app:1234/ns-news");
}

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 15000, // Aumentar timeout para Railway
    socketTimeoutMS: 45000,
    bufferCommands: false, // Deshabilitar buffering para evitar timeouts
    maxPoolSize: 5, // Reducir pool de conexiones para Railway
    minPoolSize: 1, // Mínimo 1 conexión
    maxIdleTimeMS: 30000, // Cerrar conexiones inactivas después de 30s
  })
  .then(() => {
    console.log("✅ Conectado a MongoDB exitosamente");
    console.log("📊 Estado de conexión:", mongoose.connection.readyState);
  })
  .catch((err) => {
    console.error("❌ Error MongoDB:", err.message);
    console.error("🔍 Detalles de conexión:");
    console.error("   URI usada:", MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
    console.error("   NODE_ENV:", process.env.NODE_ENV);
    console.error("   Puerto del servidor:", PORT);

    // Mostrar todas las variables de entorno relacionadas con DB
    const dbVars = Object.keys(process.env).filter(key =>
      key.includes('MONGO') || key.includes('DATABASE') || key.includes('DB')
    );
    console.error("   Variables DB disponibles:", dbVars.length > 0 ? dbVars : "Ninguna");

    // Si no hay variables configuradas, mostrar instrucciones
    if (!process.env.MONGODB_URI && !process.env.DATABASE_URL) {
      console.error("\n🚨 INSTRUCCIONES PARA CONFIGURAR:");
      console.error("   1. Ve a Railway > Tu proyecto > Variables");
      console.error("   2. Agrega: MONGODB_URI=mongodb://usuario:password@tu-mongodb-url/ns-news");
      console.error("   3. Reinicia el servicio");
    }
  });

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
  const finalUri = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI || "mongodb://localhost:27017/ns-news";
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    mongodb: {
      configured: !!(process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI),
      uri: finalUri.replace(/\/\/.*@/, '//***:***@'),
      isLocalhost: finalUri.includes('localhost'),
      isAtlas: finalUri.includes('mongodb.net'),
      connectionState: mongoose.connection.readyState
    },
    environment: process.env.NODE_ENV
  });
});

// Endpoint de diagnóstico (solo para debugging)
app.get("/api/diagnose", (req, res) => {
  const finalUri = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI || "mongodb://localhost:27017/ns-news";
  res.json({
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI ? 'CONFIGURADA' : 'NO CONFIGURADA',
      DATABASE_URL: process.env.DATABASE_URL ? 'CONFIGURADA' : 'NO CONFIGURADA',
      MONGO_URI: process.env.MONGO_URI ? 'CONFIGURADA' : 'NO CONFIGURADA'
    },
    mongodb: {
      uri: finalUri.replace(/\/\/.*@/, '//***:***@'),
      isLocalhost: finalUri.includes('localhost'),
      isRailway: finalUri.includes('railway.app'),
      isAtlas: finalUri.includes('mongodb.net'),
      connectionState: mongoose.connection.readyState
    },
    instructions: !process.env.MONGODB_URI && !process.env.DATABASE_URL && !process.env.MONGO_URI ? [
      "1. Ve a Railway > Tu proyecto > Variables",
      "2. Agrega MONGODB_URI=mongodb://usuario:password@tu-url/ns-news",
      "3. Reinicia el servicio"
    ] : []
  });
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
