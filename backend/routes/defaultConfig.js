const express = require("express");
const router = express.Router();
const DefaultConfig = require("../models/defaultConfig.js");
const { requireAuth } = require("../middleware/auth.js");

// Función para asegurar conexión a MongoDB
async function ensureConnection() {
  const mongoose = require("mongoose");
  if (mongoose.connection.readyState === 0) {
    const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI || "mongodb://localhost:27017/ns-news";

    console.log('🔧 defaultConfig.js - Conectando a MongoDB:', {
      uri: MONGODB_URI.replace(/\/\/.*@/, '//***:***@'),
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

// Aplicar autenticación a todas las rutas
router.use(requireAuth);

// GET obtener configuración por defecto
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

// PATCH actualizar configuración por defecto
router.patch("/", async (req, res) => {
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
    
    // Guardar quién actualizó la configuración
    config.updatedBy = req.user?.email || "admin";
    
    const updated = await config.save();
    res.json({ success: true, config: updated });
    
  } catch (error) {
    console.error("Error actualizando configuración por defecto:", error);
    res.status(500).json({ message: "Error actualizando configuración por defecto" });
  }
});

module.exports = router;
