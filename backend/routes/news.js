const express = require("express");
const router = express.Router();
const Subscriber = require("../models/subscribers.js");
const DefaultConfig = require("../models/defaultConfig.js");
const fetch = require("node-fetch");
const MELTWATER_API_URL = "https://api.meltwater.com";
const MELTWATER_TOKEN = process.env.MELTWATER_API_TOKEN;

// Función para asegurar conexión a MongoDB
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

// Función para traer resultados de Meltwater dado un searchId con múltiples requests
async function getSearchResults(searchId) {
  const now = new Date();
  const end = now.toISOString().slice(0, 19);
  
  console.log(`🔍 Obteniendo datos de Meltwater para searchId: ${searchId}`);
  console.log(`📊 Estrategia: Múltiples requests para obtener más noticias`);
  
  const allDocuments = [];
  const dateRanges = [
    // Últimos 3 días
    {
      start: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19),
      end: end,
      name: "Últimos 3 días"
    },
    // Semana anterior
    {
      start: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19),
      end: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19),
      name: "Semana anterior"
    },
    // Mes anterior
    {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 19),
      end: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 19),
      name: "Mes anterior"
    }
  ];

  for (const range of dateRanges) {
    try {
      console.log(`📅 Consultando: ${range.name} (${range.start} a ${range.end})`);
      
      const res = await fetch(`${MELTWATER_API_URL}/v3/search/${searchId}`, {
        method: "POST",
        headers: {
          apikey: MELTWATER_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tz: "America/Montevideo",
          start: range.start,
          end: range.end,
          limit: 100, // Límite por request
        }),
      });

      if (!res.ok) {
        console.log(`⚠️  Error en ${range.name}: ${res.status}`);
        continue;
      }

      const data = await res.json();
      const documents = data.result?.documents || [];
      
      console.log(`   ✅ ${range.name}: ${documents.length} artículos`);
      
      // Agregar documentos únicos
      for (const doc of documents) {
        if (!allDocuments.find(existing => existing.id === doc.id)) {
          allDocuments.push(doc);
        }
      }
      
      // Pequeña pausa entre requests para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`⚠️  Error en ${range.name}: ${error.message}`);
      continue;
    }
  }

  console.log(`📈 Resultados totales obtenidos para ${searchId}:`);
  console.log(`   - Total documentos únicos: ${allDocuments.length}`);
  console.log(`   - Estrategia: Múltiples rangos de fechas`);
  
  if (allDocuments.length < 20) {
    console.log(`⚠️  ADVERTENCIA: Solo se obtuvieron ${allDocuments.length} artículos únicos`);
    console.log(`   Esto podría indicar un límite de la API de Meltwater o falta de contenido`);
  }

  return { result: { documents: allDocuments } };
}

// POST /api/news/personalized
router.post("/personalized", async (req, res) => {
  try {
    await ensureConnection();
    
    const { email, countryId, sectorId } = req.body;
    
    // Caso 1: Si se proporcionan IDs directos, usarlos (prioridad más alta)
    if (countryId || sectorId) {
      console.log(`🔍 Buscando noticias con IDs directos: countryId=${countryId}, sectorId=${sectorId}`);
      
      const resultsPais = countryId
        ? await getSearchResults(countryId)
        : { result: { documents: [] } };
      const resultsSector = sectorId
        ? await getSearchResults(sectorId)
        : { result: { documents: [] } };

      const paisDocs = resultsPais.result?.documents || [];
      const sectorDocs = resultsSector.result?.documents || [];
      
      console.log(`📊 RESUMEN DE DATOS OBTENIDOS (IDs directos):`);
      console.log(`   - Noticias del país: ${paisDocs.length}`);
      console.log(`   - Noticias del sector: ${sectorDocs.length}`);
      console.log(`   - Total noticias: ${paisDocs.length + sectorDocs.length}`);

      return res.json({
        success: true,
        pais: paisDocs,
        sector: sectorDocs,
        source: "direct_ids"
      });
    }

    // Caso 2: Si hay email específico, buscar suscriptor
    if (email && email !== "default") {
      console.log(`🔍 Buscando suscriptor con email: ${email}`);
      
      const subscriber = await Subscriber.findOne({ email: email.toLowerCase() });
      if (!subscriber) {
        return res.status(404).json({ 
          success: false, 
          message: "Usuario no encontrado",
          suggestion: "Verifica el email o usa 'default' para noticias generales"
        });
      }

      const resultsPais = subscriber.countrySearchId
        ? await getSearchResults(subscriber.countrySearchId)
        : { result: { documents: [] } };
      const resultsSector = subscriber.sectorSearchId
        ? await getSearchResults(subscriber.sectorSearchId)
        : { result: { documents: [] } };

      const paisDocs = resultsPais.result?.documents || [];
      const sectorDocs = resultsSector.result?.documents || [];
      
      console.log(`📊 RESUMEN DE DATOS OBTENIDOS (email suscriptor):`);
      console.log(`   - Noticias del país: ${paisDocs.length}`);
      console.log(`   - Noticias del sector: ${sectorDocs.length}`);
      console.log(`   - Total noticias: ${paisDocs.length + sectorDocs.length}`);

      return res.json({
        success: true,
        pais: paisDocs,
        sector: sectorDocs,
        source: "subscriber_email"
      });
    }

    // Caso 3: Email "default" o sin email - usar noticias por defecto
    console.log(`🔍 Cargando noticias por defecto`);
    
    // Obtener configuración por defecto del sistema
    const defaultConfig = await DefaultConfig.findOne();
    
    if (defaultConfig && (defaultConfig.defaultCountrySearchId || defaultConfig.defaultSectorSearchId)) {
      console.log(`📰 Usando configuración por defecto del sistema: país=${defaultConfig.defaultCountrySearchId || 'ninguno'}, sector=${defaultConfig.defaultSectorSearchId || 'ninguno'}`);
      
      const resultsPais = defaultConfig.defaultCountrySearchId
        ? await getSearchResults(defaultConfig.defaultCountrySearchId)
        : { result: { documents: [] } };
      const resultsSector = defaultConfig.defaultSectorSearchId
        ? await getSearchResults(defaultConfig.defaultSectorSearchId)
        : { result: { documents: [] } };

      const paisDocs = resultsPais.result?.documents || [];
      const sectorDocs = resultsSector.result?.documents || [];
      
      console.log(`📊 RESUMEN DE DATOS OBTENIDOS (configuración por defecto):`);
      console.log(`   - Noticias del país: ${paisDocs.length}`);
      console.log(`   - Noticias del sector: ${sectorDocs.length}`);
      console.log(`   - Total noticias: ${paisDocs.length + sectorDocs.length}`);

      return res.json({
        success: true,
        pais: paisDocs,
        sector: sectorDocs,
        source: "system_default_config",
        defaults: {
          country: defaultConfig.defaultCountrySearchId || null,
          sector: defaultConfig.defaultSectorSearchId || null
        }
      });
    } else {
      // Si no hay configuración por defecto, usar cualquier suscriptor activo como fallback
      const fallbackSubscriber = await Subscriber.findOne({ isActive: true });
      
      if (fallbackSubscriber) {
        console.log(`⚠️ No hay configuración por defecto, usando fallback: ${fallbackSubscriber.email}`);
        
        const resultsPais = fallbackSubscriber.countrySearchId
          ? await getSearchResults(fallbackSubscriber.countrySearchId)
          : { result: { documents: [] } };
        const resultsSector = fallbackSubscriber.sectorSearchId
          ? await getSearchResults(fallbackSubscriber.sectorSearchId)
          : { result: { documents: [] } };

        return res.json({
          success: true,
          pais: resultsPais.result?.documents || [],
          sector: resultsSector.result?.documents || [],
          source: "fallback_subscriber",
          defaults: {
            country: null,
            sector: null
          }
        });
      } else {
        // Si no hay suscriptores, devolver arrays vacíos pero éxito
        console.log(`⚠️ No hay suscriptores disponibles, devolviendo arrays vacíos`);
        
        return res.json({
          success: true,
          pais: [],
          sector: [],
          source: "no_subscribers",
          message: "No hay suscriptores configurados",
          defaults: {
            country: null,
            sector: null
          }
        });
      }
    }
  } catch (error) {
    console.error("❌ Error en /api/news/personalized:", error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      details: "Error interno del servidor"
    });
  }
});

module.exports = router;
