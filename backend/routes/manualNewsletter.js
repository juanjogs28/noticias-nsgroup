
// Router para envío manual de newsletters con autenticación requerida
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth.js");
const { sendDailyNewsletter, sendDailyNewsletterWithResults } = require("../dailyNewsletter.js");

// Aplicar middleware de autenticación a todas las rutas de administración
router.use(requireAuth);

// Enviar newsletter manualmente con captura de resultados detallados
router.post("/send", async (req, res) => {
  try {
    console.log("🚀 Iniciando envío manual de newsletter...");
    
    // Ejecutar el envío del newsletter y capturar resultados detallados
    const result = await sendDailyNewsletterWithResults();
    
    console.log("✅ Newsletter manual enviado exitosamente");
    res.json({ 
      success: true, 
      message: "Newsletter enviado manualmente",
      timestamp: new Date().toISOString(),
      results: result
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
