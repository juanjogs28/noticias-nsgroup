// Configuración inicial del servidor Express
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
// Configuración del puerto: Railway asigna automáticamente un puerto, pero si no está disponible, usar 3001
const PORT = process.env.PORT || process.env.RAILWAY_STATIC_PORT || 3001;
console.log('🔧 Puerto configurado:', PORT);
console.log('🔧 Variables de entorno PORT:', process.env.PORT);
console.log('🔧 Variables de entorno RAILWAY_STATIC_PORT:', process.env.RAILWAY_STATIC_PORT);
console.log('🔧 Todas las variables de entorno relacionadas con puerto:', 
  Object.keys(process.env).filter(key => key.includes('PORT')));

// Configuración CORS - Permite todas las conexiones desde cualquier origen
const corsOptions = {
  origin: "*", // Permitir todos los orígenes para máxima compatibilidad
  credentials: true, // Permitir cookies y credenciales
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Métodos HTTP permitidos
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'] // Headers permitidos
};

app.use(cors(corsOptions));
console.log('🌐 CORS configurado para permitir todos los orígenes (*)');
app.use(express.json());

// Función de diagnóstico que verifica el estado de las variables de entorno críticas
function diagnoseEnvironment() {
  console.log("\n🔍 DIAGNÓSTICO DE ENTORNO:");
  console.log("NODE_ENV:", process.env.NODE_ENV || "undefined");
  console.log("MONGODB_URI:", process.env.MONGODB_URI ? "✅ Configurada" : "❌ No configurada");
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✅ Configurada" : "❌ No configurada");
  console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ Configurada" : "❌ No configurada");

  // Busca y lista todas las variables de entorno relacionadas con base de datos
  const dbVars = Object.keys(process.env).filter(key =>
    key.includes('MONGO') || key.includes('DATABASE') || key.includes('DB')
  );
  if (dbVars.length > 0) {
    console.log("Variables DB disponibles:", dbVars);
  }
  console.log("-".repeat(50));
}

diagnoseEnvironment();

// Configuración de conexión a MongoDB con múltiples opciones de fallback
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
  console.error("   Ejemplo: mongodb://usuario:CONTRASEÑA@containers-us-west-1.railway.app:1234/ns-news");
}

// Establecer conexión a MongoDB con configuración optimizada para Railway
mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000, // Timeout aumentado para Railway
    socketTimeoutMS: 45000, // Timeout de socket para operaciones largas
    bufferCommands: false, // Deshabilitar buffering para evitar timeouts
    maxPoolSize: 5, // Pool de conexiones reducido para Railway
    minPoolSize: 1, // Mínimo 1 conexión activa
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

// Manejadores de eventos para monitorear el estado de la conexión a MongoDB
mongoose.connection.on('error', (err) => {
  console.error('❌ Error de conexión MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Conexión MongoDB desconectada');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ Conexión MongoDB reconectada');
});

// Configuración de rutas de la API
const adminSubscribersRouter = require("./routes/adminSubscribers");
app.use("/api/admin/subscribers", adminSubscribersRouter);

const searchesRouter = require("./routes/searches");
app.use("/api/admin/searches", searchesRouter);
// Ruta pública para obtener búsquedas por nombre (sin autenticación)
app.use("/api/searches", searchesRouter);

const subscriptionsRouter = require("./routes/subscriptions");
app.use("/api/admin/subscriptions", subscriptionsRouter);

const newsRouter = require("./routes/news");
app.use("/api/news", newsRouter);

const scheduleTimesRouter = require("./routes/scheduleTimes");
app.use("/api/admin/schedule-times", scheduleTimesRouter);

const manualNewsletterRouter = require("./routes/manualNewsletter");
app.use("/api/admin/manual-newsletter", manualNewsletterRouter);

const defaultConfigRouter = require("./routes/defaultConfig");
app.use("/api/admin/default-config", defaultConfigRouter);
// Ruta pública para defaultConfig (sin autenticación)
app.use("/api/defaultConfig", defaultConfigRouter);

// Ruta de administración principal protegida por autenticación
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

// Endpoint raíz que confirma que el servidor está funcionando
app.get("/", (req, res) => {
  res.json({
    message: "NS News Group Backend funcionando",
    timestamp: new Date().toISOString(),
    status: "OK",
    port: PORT,
    host: "0.0.0.0"
  });
});

// Endpoint de prueba adicional para debugging
app.get("/test", (req, res) => {
  res.json({
    message: "Test endpoint funcionando",
    timestamp: new Date().toISOString(),
    headers: req.headers,
    port: PORT
  });
});

// Endpoint de health check que verifica el estado del sistema y la base de datos
app.get("/api/health", (req, res) => {
  const finalUri = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI || "mongodb://localhost:27017/ns-news";
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    mongodb: {
      configured: !!(process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI),
      uri: finalUri.replace(/\/\/.*@/, '//***:***@'), // Ocultar credenciales en la respuesta
      isLocalhost: finalUri.includes('localhost'),
      isAtlas: finalUri.includes('mongodb.net'),
      connectionState: mongoose.connection.readyState
    },
    environment: process.env.NODE_ENV
  });
});

// Endpoint de diagnóstico detallado para debugging y resolución de problemas
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
      uri: finalUri.replace(/\/\/.*@/, '//***:***@'), // Ocultar credenciales
      isLocalhost: finalUri.includes('localhost'),
      isRailway: finalUri.includes('railway.app'),
      isAtlas: finalUri.includes('mongodb.net'),
      connectionState: mongoose.connection.readyState
    },
    instructions: !process.env.MONGODB_URI && !process.env.DATABASE_URL && !process.env.MONGO_URI ? [
      "1. Ve a Railway > Tu proyecto > Variables",
      "2. Agrega MONGODB_URI=mongodb://usuario:CONTRASEÑA@tu-url/ns-news",
      "3. Reinicia el servicio"
    ] : []
  });
});

// Endpoint para verificar la configuración de variables de email
app.get("/api/check-email-env", (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    emailConfig: {
      RESEND_API_KEY: process.env.RESEND_API_KEY ? "CONFIGURADA" : "NO CONFIGURADA",
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || "NO CONFIGURADA",
      FRONTEND_URL: process.env.FRONTEND_URL || "NO CONFIGURADA",
      NODE_ENV: process.env.NODE_ENV || "undefined"
    },
    recommendations: !process.env.RESEND_FROM_EMAIL ? [
      "1. Ve a Railway > Tu proyecto > Variables",
      "2. Agrega RESEND_FROM_EMAIL=noticias@newsroom.eyewatch.me",
      "3. Agrega FRONTEND_URL=https://newsroom.eyewatch.me",
      "4. Reinicia el servicio"
    ] : []
  });
});

// Endpoint para probar el envío de emails sin autenticación (solo para testing)
app.post("/api/test-email", async (req, res) => {
  try {
    const { Resend } = require("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    console.log("🧪 Probando envío de email desde Railway...");
    console.log("FROM:", process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev');
    console.log("TO: juanjo28599@gmail.com");
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: ['juanjo28599@gmail.com'],
      subject: `🧪 Prueba Railway - ${new Date().toISOString()}`,
      html: `
        <h1>🧪 Email de Prueba desde Railway</h1>
        <p>Este email se envió desde Railway para verificar la configuración.</p>
        <hr>
        <p><strong>Configuración:</strong></p>
        <ul>
          <li><strong>FROM:</strong> ${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}</li>
          <li><strong>NODE_ENV:</strong> ${process.env.NODE_ENV || "undefined"}</li>
          <li><strong>FRONTEND_URL:</strong> ${process.env.FRONTEND_URL || "NO CONFIGURADA"}</li>
          <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
        </ul>
        <hr>
        <p><em>Si recibes este email, la configuración básica funciona.</em></p>
        <p><em>Si no lo recibes, revisa:</em></p>
        <ul>
          <li>Carpeta de spam</li>
          <li>Configuración de dominio en Resend</li>
          <li>Límites de rate limiting</li>
        </ul>
      `,
    });

    if (error) {
      console.error("❌ Error enviando email:", error);
      return res.status(500).json({
        success: false,
        error: error.message || error,
        details: error
      });
    }

    console.log("✅ Email enviado exitosamente:", data?.id);
    res.json({
      success: true,
      message: "Email de prueba enviado",
      emailId: data?.id,
      timestamp: new Date().toISOString(),
      config: {
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        nodeEnv: process.env.NODE_ENV || "undefined",
        frontendUrl: process.env.FRONTEND_URL || "NO CONFIGURADA"
      }
    });
    
  } catch (error) {
    console.error("❌ Error en prueba de email:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint que devuelve información de la versión actual del sistema
app.get("/api/version", (req, res) => {
  res.json({
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    changes: "Límite aumentado a 500 artículos - Logging mejorado",
    status: "ACTUALIZADO"
  });
});

// Inicializar el servidor y configurar limpieza automática de caché
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log("🔄 Cache limpiado - reiniciando para obtener datos frescos");
  
  // Limpiar caché automáticamente al iniciar el servidor
  setTimeout(async () => {
    try {
      console.log("🧹 Limpiando caché automáticamente...");
      const CachedNews = require("./models/cachedNews.js");
      const result = await CachedNews.deleteMany({});
      console.log(`✅ Cache limpiado automáticamente: ${result.deletedCount} entradas eliminadas`);
    } catch (error) {
      console.error("❌ Error limpiando caché automáticamente:", error);
    }
  }, 5000); // Esperar 5 segundos después del inicio
  console.log(`🌐 CORS: Permitidos todos los orígenes (*)`);
  console.log(`🔗 URLs permitidas:`);
  console.log(`   - Desarrollo: http://localhost:${PORT}`);
  console.log(`   - Frontend: http://localhost:5173`);
  console.log(`   - Vercel: https://noticias-nsgroup-newsroom.vercel.app`);
  console.log(`   - Railway: https://noticias-nsgroup-production.up.railway.app`);
  console.log(`📊 VERSIÓN: 2.1.0 - Límite de API optimizado a 1000 artículos por petición`);
  console.log(`🔧 Servidor escuchando en 0.0.0.0:${PORT} para Railway`);
});
