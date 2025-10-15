// Sistema de programación automática de newsletters con horarios configurables
require("dotenv").config();
const cron = require("node-cron");
const { sendDailyNewsletter } = require("./dailyNewsletter.js");
const ScheduleTime = require("./models/scheduleTimes.js");
const mongoose = require("mongoose");

console.log("⏰ Iniciando programador de newsletters...");

// Función para asegurar conexión a MongoDB solo si no hay conexión activa
async function ensureConnection() {
  if (mongoose.connection.readyState === 0) {
    const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI || "mongodb://localhost:27017/ns-news";
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Conectado a MongoDB para scheduler");
  }
}

// Función para crear jobs de cron dinámicamente basados en horarios configurados
function createCronJob(time) {
  const [hour, minute] = time.split(':').map(Number);
  const cronExpression = `${minute} ${hour} * * *`;
  
  return cron.schedule(cronExpression, async () => {
    console.log(`📅 Ejecutando newsletter programado a las ${time}...`);
    await sendDailyNewsletter();
  }, {
    scheduled: true,
    timezone: "America/Montevideo"
  });
}

// Función para inicializar todos los horarios configurados desde la base de datos
async function initializeScheduledJobs() {
  try {
    await ensureConnection();
    
    // Esperar a que la conexión esté completamente establecida
    if (mongoose.connection.readyState !== 1) {
      console.log('⏳ Esperando conexión completa a MongoDB...');
      await new Promise((resolve) => {
        if (mongoose.connection.readyState === 1) {
          resolve();
        } else {
          mongoose.connection.once('open', resolve);
        }
      });
    }
    
    const scheduleTimes = await ScheduleTime.find({ isActive: true });
    console.log(`📋 Inicializando ${scheduleTimes.length} horarios programados...`);
    
    const jobs = new Map();
    
    for (const scheduleTime of scheduleTimes) {
      const job = createCronJob(scheduleTime.time);
      jobs.set(scheduleTime._id.toString(), job);
      console.log(`   ⏰ ${scheduleTime.time} - ${scheduleTime.description || 'Sin descripción'}`);
    }
    
    return jobs;
  } catch (error) {
    console.error("❌ Error inicializando horarios:", error);
    return new Map();
  }
}

// Almacenar jobs programados en un Map para gestión dinámica
let scheduledJobs = new Map();

// Función para actualizar horarios dinámicamente sin reiniciar el servidor
async function updateScheduledJobs() {
  try {
    await ensureConnection();
    
    // Detener todos los jobs existentes
    for (const job of scheduledJobs.values()) {
      job.stop();
    }
    
    // Reinicializar con los nuevos horarios
    scheduledJobs = await initializeScheduledJobs();
    console.log(`✅ Horarios actualizados: ${scheduledJobs.size} jobs activos`);
  } catch (error) {
    console.error("❌ Error actualizando horarios:", error);
  }
}

// Inicializar scheduler al arrancar la aplicación
ensureConnection().then(() => {
  initializeScheduledJobs().then(jobs => {
    scheduledJobs = jobs;
    console.log(`✅ Scheduler iniciado con ${scheduledJobs.size} horarios programados`);
  });
});

// Exportar función para actualizar horarios desde otras partes del código
module.exports = { updateScheduledJobs };

// Job de desarrollo para testing (solo en modo desarrollo)
const manualNewsletterJob = cron.schedule("*/5 * * * *", async () => {
  // Solo para desarrollo - ejecutar cada 5 minutos
  if (process.env.NODE_ENV === "development") {
    console.log("🧪 Modo desarrollo: ejecutando newsletter cada 5 minutos...");
    await sendDailyNewsletter();
  }
}, {
  scheduled: process.env.NODE_ENV === "development",
  timezone: "America/Montevideo"
});

console.log("✅ Programador iniciado:");
console.log("   📅 Newsletter diario: Todos los días a las 8:00 AM (Uruguay)");
if (process.env.NODE_ENV === "development") {
  console.log("   🧪 Modo desarrollo: Cada 5 minutos");
}

// Manejador de señales para limpieza al cerrar el proceso
process.on("SIGINT", () => {
  console.log("🛑 Deteniendo programador...");
  dailyNewsletterJob.stop();
  manualNewsletterJob.stop();
  process.exit(0);
});

// Ejecutar newsletter manualmente si se llama directamente
if (require.main === module) {
  console.log("🚀 Ejecutando newsletter manualmente...");
  sendDailyNewsletter().then(() => {
    console.log("✅ Newsletter manual completado");
    process.exit(0);
  }).catch((error) => {
    console.error("❌ Error en newsletter manual:", error);
    process.exit(1);
  });
}
