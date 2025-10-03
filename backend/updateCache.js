const mongoose = require("mongoose");
const CacheService = require("./services/cacheService");

// Configuración de MongoDB
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

async function updateCache() {
  try {
    console.log("🔄 Iniciando actualización de cache...");
    
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    
    console.log("✅ Conectado a MongoDB");
    
    // Limpiar cache expirado
    await CacheService.cleanExpiredCache(48); // 48 horas
    
    // Actualizar cache para país y sector
    const defaultConfig = {
      pais: "27551367",
      sector: "27817676",
    };
    
    console.log("📦 Actualizando cache para país...");
    const { getSearchResults } = require("./routes/news");
    await getSearchResults(defaultConfig.pais);
    
    // Esperar 2 minutos entre requests para evitar rate limiting
    console.log("⏳ Esperando 2 minutos antes del siguiente request...");
    await new Promise(resolve => setTimeout(resolve, 120000));
    
    console.log("📦 Actualizando cache para sector...");
    await getSearchResults(defaultConfig.sector);
    
    console.log("✅ Cache actualizado exitosamente");
    
  } catch (error) {
    console.error("❌ Error actualizando cache:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado de MongoDB");
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  updateCache();
}

module.exports = updateCache;
