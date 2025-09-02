require("dotenv").config();
const mongoose = require("mongoose");
const DefaultConfig = require("./models/defaultConfig.js");

// Conectar a MongoDB - Usar variable de entorno
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI || "mongodb://localhost:27017/ns-news";

console.log('🔧 Configuración MongoDB initDefaultConfig:', {
  uri: MONGODB_URI.replace(/\/\/.*@/, '//***:***@'),
  isProduction: process.env.NODE_ENV === 'production',
  hasMongodbUri: !!process.env.MONGODB_URI,
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  hasMongoUri: !!process.env.MONGO_URI
});

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  })
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => {
    console.error("❌ Error MongoDB:", err);
    console.error("🔍 Detalles de conexión:", {
      uri: MONGODB_URI.replace(/\/\/.*@/, '//***:***@'),
      nodeEnv: process.env.NODE_ENV
    });
  });

async function initializeDefaultConfig() {
  try {
    console.log("🔧 Inicializando configuración por defecto...");
    
    // Verificar si ya existe configuración
    const existingConfig = await DefaultConfig.findOne();
    
    if (existingConfig) {
      console.log("ℹ️ La configuración por defecto ya existe:");
      console.log(`   País: ${existingConfig.defaultCountrySearchId || 'No configurado'}`);
      console.log(`   Sector: ${existingConfig.defaultSectorSearchId || 'No configurado'}`);
      console.log(`   Última actualización: ${existingConfig.updatedAt}`);
    } else {
      // Crear configuración por defecto
      const defaultConfig = new DefaultConfig({
        defaultCountrySearchId: "",
        defaultSectorSearchId: "",
        updatedBy: "system"
      });
      
      await defaultConfig.save();
      console.log("✅ Configuración por defecto creada exitosamente");
      console.log("   País: No configurado");
      console.log("   Sector: No configurado");
    }
    
  } catch (error) {
    console.error("❌ Error inicializando configuración:", error);
  } finally {
    mongoose.connection.close();
    console.log("🔌 Conexión a MongoDB cerrada");
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initializeDefaultConfig();
}

module.exports = { initializeDefaultConfig };
