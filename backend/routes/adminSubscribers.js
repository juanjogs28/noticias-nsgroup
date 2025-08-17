const express = require("express");
const router = express.Router();
const Subscriber = require("../models/subscribers.js");

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
    const { email, countrySearchId, sectorSearchId } = req.body;
    if (!email) return res.status(400).json({ message: "Email requerido" });

    const existing = await Subscriber.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: "El suscriptor ya existe" });

    const subscriber = new Subscriber({
      email: email.toLowerCase(),
      countrySearchId,
      sectorSearchId,
    });
    const saved = await subscriber.save();
    res.json({ success: true, subscriber: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creando suscriptor" });
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
