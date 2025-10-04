const mongoose = require("mongoose");
const CachedNews = require("./models/cachedNews");

// Conectar a MongoDB
async function connectToMongoDB() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI || "mongodb://localhost:27017/ns-news";
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log("✅ Conectado a MongoDB");
    return true;
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error);
    return false;
  }
}

// Limpiar todo el caché
async function clearAllCache() {
  try {
    const result = await CachedNews.deleteMany({});
    console.log(`🧹 Cache completamente limpiado: ${result.deletedCount} entradas eliminadas`);
    return result.deletedCount;
  } catch (error) {
    console.error("❌ Error limpiando cache:", error);
    return 0;
  }
}

// Limpiar solo caché de fallback
async function clearFallbackCache() {
  try {
    const result = await CachedNews.deleteMany({ isFromMeltwater: false });
    console.log(`🧹 Cache de fallback limpiado: ${result.deletedCount} entradas eliminadas`);
    return result.deletedCount;
  } catch (error) {
    console.error("❌ Error limpiando cache de fallback:", error);
    return 0;
  }
}

// Función principal
async function main() {
  console.log("🔧 Iniciando limpieza de caché...");
  
  const connected = await connectToMongoDB();
  if (!connected) {
    process.exit(1);
  }
  
  // Limpiar todo el caché
  const deletedCount = await clearAllCache();
  
  console.log(`✅ Proceso completado. ${deletedCount} entradas eliminadas del caché.`);
  console.log("📝 Las próximas peticiones intentarán obtener datos reales de Meltwater.");
  
  await mongoose.disconnect();
  console.log("🔌 Desconectado de MongoDB");
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { clearAllCache, clearFallbackCache };
