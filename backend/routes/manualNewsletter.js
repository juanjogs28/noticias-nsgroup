const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth.js");
const { sendDailyNewsletter } = require("../dailyNewsletter.js");

// Aplicar autenticación a todas las rutas
router.use(requireAuth);

// POST enviar newsletter manualmente
router.post("/send", async (req, res) => {
  try {
    console.log("🚀 Iniciando envío manual de newsletter...");
    
    // Ejecutar el envío del newsletter
    await sendDailyNewsletter();
    
    console.log("✅ Newsletter manual enviado exitosamente");
    res.json({ 
      success: true, 
      message: "Newsletter enviado manualmente",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error en envío manual:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Error enviando newsletter manualmente",
      error: error.message
    });
  }
});

module.exports = router;
