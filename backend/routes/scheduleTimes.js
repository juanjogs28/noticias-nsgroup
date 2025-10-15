// Router para gestión de horarios de envío de newsletters con autenticación requerida
const express = require("express");
const router = express.Router();
const ScheduleTime = require("../models/scheduleTimes.js");
const { requireAuth } = require("../middleware/auth.js");
const { updateScheduledJobs } = require("../scheduler.js");

// Función para asegurar conexión a MongoDB antes de operaciones de base de datos
async function ensureConnection() {
  const mongoose = require("mongoose");
  if (mongoose.connection.readyState === 0) {
    const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI || "mongodb://localhost:27017/ns-news";
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }
}

// Aplicar middleware de autenticación a todas las rutas de administración
router.use(requireAuth);

// Obtener todos los horarios de envío ordenados por hora
router.get("/", async (req, res) => {
  try {
    await ensureConnection();
    const scheduleTimes = await ScheduleTime.find().sort({ time: 1 });
    res.json({ scheduleTimes });
  } catch (err) {
    console.error("Error obteniendo horarios:", err);
    res.status(500).json({ message: "Error obteniendo horarios de envío" });
  }
});

// Crear un nuevo horario de envío con validación de unicidad
router.post("/", async (req, res) => {
  try {
    await ensureConnection();
    
    const { time, description } = req.body;
    
    // Validar que el horario sea proporcionado
    if (!time) {
      return res.status(400).json({ message: "El horario es requerido" });
    }

    // Verificar que no exista ya un horario con esa hora
    const existing = await ScheduleTime.findOne({ time });
    if (existing) {
      return res.status(400).json({ message: "Ya existe un horario configurado para esa hora" });
    }

    // Crear nuevo horario de envío
    const scheduleTime = new ScheduleTime({
      time,
      description: description || ""
    });

    const saved = await scheduleTime.save();
    
    // Actualizar el scheduler con el nuevo horario
    await updateScheduledJobs();
    
    res.json({ success: true, scheduleTime: saved });
  } catch (err) {
    console.error("Error creando horario:", err);
    if (err.name === 'ValidationError') {
      res.status(400).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Error creando horario de envío" });
    }
  }
});

// Actualizar un horario existente con validación
router.patch("/:id", async (req, res) => {
  try {
    const { time, description, isActive } = req.body;
    
    // Preparar datos de actualización solo con los campos proporcionados
    const updateData = {};
    if (time !== undefined) updateData.time = time;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Actualizar horario con validación
    const updated = await ScheduleTime.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Horario no encontrado" });
    }

    // Actualizar el scheduler con el horario modificado
    await updateScheduledJobs();
    
    res.json({ success: true, scheduleTime: updated });
  } catch (err) {
    console.error("Error actualizando horario:", err);
    if (err.name === 'ValidationError') {
      res.status(400).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Error actualizando horario de envío" });
    }
  }
});

// Eliminar un horario de envío y actualizar el scheduler
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await ScheduleTime.findByIdAndDelete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Horario no encontrado" });
    }

    // Actualizar el scheduler después de eliminar el horario
    await updateScheduledJobs();
    
    res.json({ success: true, message: "Horario eliminado correctamente" });
  } catch (err) {
    console.error("Error eliminando horario:", err);
    res.status(500).json({ message: "Error eliminando horario de envío" });
  }
});

module.exports = router;
