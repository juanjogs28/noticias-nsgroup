require("dotenv").config();
const mongoose = require("mongoose");
const DefaultConfig = require("./models/defaultConfig.js");

// Conectar a MongoDB
mongoose
  .connect("mongodb://localhost:27017/ns-news")
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error MongoDB:", err));

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
