require("dotenv").config();
const mongoose = require("mongoose");
const DefaultConfig = require("./models/defaultConfig.js");

async function setupDefaultConfig() {
  try {
    // Conectar a MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI || "mongodb://localhost:27017/ns-news";
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Conectado a MongoDB");

    // Verificar configuración existente
    const existingConfig = await DefaultConfig.findOne();
    if (existingConfig) {
      console.log("📋 Configuración existente:");
      console.log(`   - País: ${existingConfig.defaultCountrySearchId || 'No configurado'}`);
      console.log(`   - Sector: ${existingConfig.defaultSectorSearchId || 'No configurado'}`);
      console.log(`   - Actualizado: ${existingConfig.updatedAt}`);
      console.log(`   - Por: ${existingConfig.updatedBy}`);
    } else {
      console.log("⚠️  No hay configuración por defecto");
    }

    // Crear/actualizar configuración con IDs de ejemplo
    // NOTA: Estos IDs deben ser reemplazados por IDs reales de Meltwater
    const defaultConfig = {
      defaultCountrySearchId: "27551367", // ID de ejemplo para país
      defaultSectorSearchId: "27817676", // ID de ejemplo para sector
      updatedBy: "setup-script"
    };

    const result = await DefaultConfig.findOneAndUpdate(
      {},
      defaultConfig,
      { upsert: true, new: true }
    );

    console.log("✅ Configuración por defecto actualizada:");
    console.log(`   - País: ${result.defaultCountrySearchId}`);
    console.log(`   - Sector: ${result.defaultSectorSearchId}`);
    console.log(`   - Actualizado: ${result.updatedAt}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado de MongoDB");
  }
}

setupDefaultConfig();
