const express = require("express");
const router = express.Router();
const Subscriber = require("../models/subscribers.js");
const fetch = require("node-fetch");
const MELTWATER_API_URL = "https://api.meltwater.com";
const MELTWATER_TOKEN = process.env.MELTWATER_API_TOKEN;

// Función para traer resultados de Meltwater dado un searchId
async function getSearchResults(searchId) {
  const now = new Date();
  const end = now.toISOString().slice(0, 19);
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const start = startDate.toISOString().slice(0, 19);

  const res = await fetch(`${MELTWATER_API_URL}/v3/search/${searchId}`, {
    method: "POST",
    headers: {
      apikey: MELTWATER_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tz: "America/Montevideo",
      start,
      end,
      limit: 10,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error Meltwater: ${res.status} - ${errorText}`);
  }

  return res.json();
}

// POST /api/news/personalized
router.post("/personalized", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email requerido" });

    const subscriber = await Subscriber.findOne({ email: email.toLowerCase() });
    if (!subscriber) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

    const resultsPais = subscriber.countrySearchId
      ? await getSearchResults(subscriber.countrySearchId)
      : { result: { documents: [] } };
    const resultsSector = subscriber.sectorSearchId
      ? await getSearchResults(subscriber.sectorSearchId)
      : { result: { documents: [] } };

    res.json({
      success: true,
      pais: resultsPais.result?.documents || [],
      sector: resultsSector.result?.documents || [],
    });
  } catch (error) {
    console.error("❌ Error en /api/news/personalized:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
