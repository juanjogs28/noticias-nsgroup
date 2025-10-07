const express = require("express");
const router = express.Router();
const Subscription = require("../models/subscriptions.js");
const Subscriber = require("../models/subscribers.js");
const Search = require("../models/searches.js");
const { requireAuth } = require("../middleware/auth.js");

// Aplicar autenticación a todas las rutas de admin
router.use(requireAuth);

// GET todas las suscripciones con información completa
router.get("/", async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate('subscriberId', 'email isActive')
      .populate('searchId', 'name countrySearchId sectorSearchId isActive')
      .sort({ subscribedAt: -1 });
    
    res.json({ subscriptions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error obteniendo suscripciones" });
  }
});

// GET suscripciones de un suscriptor específico
router.get("/subscriber/:subscriberId", async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ subscriberId: req.params.subscriberId })
      .populate('searchId', 'name countrySearchId sectorSearchId isActive')
      .sort({ subscribedAt: -1 });
    
    res.json({ subscriptions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error obteniendo suscripciones del suscriptor" });
  }
});

// GET suscriptores de una búsqueda específica
router.get("/search/:searchId", async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ searchId: req.params.searchId })
      .populate('subscriberId', 'email isActive')
      .sort({ subscribedAt: -1 });
    
    res.json({ subscriptions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error obteniendo suscriptores de la búsqueda" });
  }
});

// POST crear suscripción
router.post("/", async (req, res) => {
  try {
    const { subscriberId, searchId } = req.body;
    
    if (!subscriberId || !searchId) {
      return res.status(400).json({ message: "subscriberId y searchId son requeridos" });
    }

    // Verificar que el suscriptor existe
    const subscriber = await Subscriber.findById(subscriberId);
    if (!subscriber) {
      return res.status(404).json({ message: "Suscriptor no encontrado" });
    }

    // Verificar que la búsqueda existe
    const search = await Search.findById(searchId);
    if (!search) {
      return res.status(404).json({ message: "Búsqueda no encontrada" });
    }

    // Verificar que no existe ya esta suscripción
    const existingSubscription = await Subscription.findOne({ subscriberId, searchId });
    if (existingSubscription) {
      return res.status(400).json({ message: "El suscriptor ya está suscrito a esta búsqueda" });
    }

    const subscription = new Subscription({
      subscriberId,
      searchId,
    });
    
    const saved = await subscription.save();
    
    // Poblar la respuesta con información completa
    const populatedSubscription = await Subscription.findById(saved._id)
      .populate('subscriberId', 'email isActive')
      .populate('searchId', 'name countrySearchId sectorSearchId isActive');
    
    res.json({ success: true, subscription: populatedSubscription });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creando suscripción" });
  }
});

// PATCH actualizar suscripción
router.patch("/:id", async (req, res) => {
  try {
    const { isActive } = req.body;
    
    // Verificar que la suscripción existe
    const existingSubscription = await Subscription.findById(req.params.id);
    if (!existingSubscription) {
      return res.status(404).json({ message: "Suscripción no encontrada" });
    }
    
    // Actualizar suscripción
    const updated = await Subscription.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).populate('subscriberId', 'email isActive')
     .populate('searchId', 'name countrySearchId sectorSearchId isActive');
    
    res.json({ success: true, subscription: updated });
  } catch (err) {
    console.error("Error actualizando suscripción:", err);
    res.status(500).json({ message: "Error actualizando suscripción" });
  }
});

// DELETE suscripción
router.delete("/:id", async (req, res) => {
  try {
    await Subscription.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error borrando suscripción" });
  }
});

// DELETE suscripción por subscriberId y searchId
router.delete("/subscriber/:subscriberId/search/:searchId", async (req, res) => {
  try {
    const result = await Subscription.findOneAndDelete({
      subscriberId: req.params.subscriberId,
      searchId: req.params.searchId
    });
    
    if (!result) {
      return res.status(404).json({ message: "Suscripción no encontrada" });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error borrando suscripción" });
  }
});

module.exports = router;
