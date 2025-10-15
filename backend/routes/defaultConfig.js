// Router para gestión de configuración por defecto con rutas públicas y protegidas
const express = require("express");
const router = express.Router();
const DefaultConfig = require("../models/defaultConfig.js");
const { requireAuth } = require("../middleware/auth.js");

// Función para asegurar conexión a MongoDB con diagnóstico detallado
async function ensureConnection() {
  const mongoose = require("mongoose");
  if (mongoose.connection.readyState === 0) {
    const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI || "mongodb://localhost:27017/ns-news";

    console.log('🔧 defaultConfig.js - Conectando a MongoDB:', {
      uri: MONGODB_URI.replace(/\/\/.*@/, '//***:***@'), // Ocultar credenciales en logs
      isLocalhost: MONGODB_URI.includes('localhost'),
      nodeEnv: process.env.NODE_ENV,
      hasMongodbUri: !!process.env.MONGODB_URI,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasMongoUri: !!process.env.MONGO_URI
    });

    // Advertencia crítica si estamos en producción usando localhost
    if (process.env.NODE_ENV === 'production' && MONGODB_URI.includes('localhost')) {
      console.error('🚨 CRÍTICO: Intentando conectar a localhost en PRODUCCIÓN!');
      console.error('   Tu MONGO_URI está configurada pero usando localhost como fallback');
      console.error('   Verifica que MONGO_URI tenga la URL correcta de MongoDB Atlas');
      console.error('   URL actual:', process.env.MONGO_URI);
    }

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }
}

// Las rutas GET no requieren autenticación para uso público
// Las rutas PATCH requieren autenticación para modificaciones

// Obtener configuración por defecto (ruta pública)
router.get("/", async (req, res) => {
  try {
    await ensureConnection();
    
    // Obtener la configuración existente o crear una nueva si no existe
    let config = await DefaultConfig.findOne();
    
    if (!config) {
      // Crear configuración por defecto si no existe
      config = new DefaultConfig({
        defaultCountrySearchId: "",
        defaultSectorSearchId: ""
      });
      await config.save();
    }
    
    res.json({ success: true, config });
  } catch (error) {
    console.error("Error obteniendo configuración por defecto:", error);
    res.status(500).json({ message: "Error obteniendo configuración por defecto" });
  }
});

// Actualizar configuración por defecto (ruta protegida con autenticación)
router.patch("/", requireAuth, async (req, res) => {
  try {
    await ensureConnection();
    
    const { defaultCountrySearchId, defaultSectorSearchId } = req.body;
    
    // Obtener la configuración existente o crear una nueva
    let config = await DefaultConfig.findOne();
    
    if (!config) {
      config = new DefaultConfig();
    }
    
    // Actualizar solo los campos proporcionados
    if (defaultCountrySearchId !== undefined) {
      config.defaultCountrySearchId = defaultCountrySearchId;
    }
    if (defaultSectorSearchId !== undefined) {
      config.defaultSectorSearchId = defaultSectorSearchId;
    }
    
    // Guardar información de quién actualizó la configuración
    config.updatedBy = req.user?.email || "admin";
    
    const updated = await config.save();
    res.json({ success: true, config: updated });
    
  } catch (error) {
    console.error("Error actualizando configuración por defecto:", error);
    res.status(500).json({ message: "Error actualizando configuración por defecto" });
  }
});

module.exports = router;
