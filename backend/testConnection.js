require("dotenv").config();
const mongoose = require("mongoose");
const DefaultConfig = require("./models/defaultConfig.js");
const ScheduleTime = require("./models/scheduleTimes.js");
const Subscriber = require("./models/subscribers.js");

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

async function testConnections() {
  try {
    console.log("🧪 Probando conexiones y operaciones...");
    
    // Probar DefaultConfig
    console.log("\n📋 Probando DefaultConfig...");
    const defaultConfig = await DefaultConfig.findOne();
    console.log("✅ DefaultConfig:", defaultConfig ? "Existe" : "No existe");
    
    // Probar ScheduleTime
    console.log("\n⏰ Probando ScheduleTime...");
    const scheduleTimes = await ScheduleTime.find();
    console.log(`✅ ScheduleTimes: ${scheduleTimes.length} encontrados`);
    
    // Probar Subscriber
    console.log("\n👥 Probando Subscriber...");
    const subscribers = await Subscriber.find();
    console.log(`✅ Subscribers: ${subscribers.length} encontrados`);
    
    console.log("\n🎉 Todas las pruebas pasaron exitosamente!");
    
  } catch (error) {
    console.error("❌ Error en las pruebas:", error);
  } finally {
    // No cerrar la conexión aquí
    console.log("🔌 Conexión mantenida abierta");
  }
}

// Ejecutar pruebas
testConnections();

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

// Mantener el proceso activo por un tiempo para probar
setTimeout(() => {
  console.log("⏰ Prueba completada, manteniendo conexión...");
}, 5000);
