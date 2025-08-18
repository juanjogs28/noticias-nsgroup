const express = require("express");
const router = express.Router();
const DefaultConfig = require("../models/defaultConfig.js");
const { requireAuth } = require("../middleware/auth.js");

// Función para asegurar conexión a MongoDB
async function ensureConnection() {
  const mongoose = require("mongoose");
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect("mongodb://localhost:27017/ns-news");
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
