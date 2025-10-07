const express = require("express");
const router = express.Router();
const Subscriber = require("../models/subscribers.js");
const { requireAuth } = require("../middleware/auth.js");

// Aplicar autenticación a todas las rutas de admin
router.use(requireAuth);

// GET todos los suscriptores
router.get("/", async (req, res) => {
  try {
    const subs = await Subscriber.find().sort({ subscribedAt: -1 });
    res.json({ subscribers: subs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error obteniendo suscriptores" });
  }
});

// POST crear suscriptor
router.post("/", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requerido" });

    const existing = await Subscriber.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: "El suscriptor ya existe" });

    const subscriber = new Subscriber({
      email: email.toLowerCase(),
    });
    const saved = await subscriber.save();
    res.json({ success: true, subscriber: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creando suscriptor" });
  }
});

// PATCH actualizar suscriptor
router.patch("/:id", async (req, res) => {
  try {
    const { email, isActive } = req.body;
    
    // Verificar que el suscriptor existe
    const existingSubscriber = await Subscriber.findById(req.params.id);
    if (!existingSubscriber) {
      return res.status(404).json({ message: "Suscriptor no encontrado" });
    }
    
    // Si se está cambiando el email, verificar que no exista otro con el mismo email
    if (email && email !== existingSubscriber.email) {
      const emailExists = await Subscriber.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: req.params.id } 
      });
      if (emailExists) {
        return res.status(400).json({ message: "Ya existe otro suscriptor con ese email" });
      }
    }
    
    // Preparar datos de actualización
    const updateData = {};
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Actualizar suscriptor
    const updated = await Subscriber.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({ success: true, subscriber: updated });
  } catch (err) {
    console.error("Error actualizando suscriptor:", err);
    res.status(500).json({ message: "Error actualizando suscriptor" });
  }
});

// DELETE suscriptor
router.delete("/:id", async (req, res) => {
  try {
    await Subscriber.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error borrando suscriptor" });
  }
});

module.exports = router;
