// Router para gestión de noticias con integración a Meltwater API
const express = require("express");
const router = express.Router();
const Subscriber = require("../models/subscribers.js");
const Subscription = require("../models/subscriptions.js");
const DefaultConfig = require("../models/defaultConfig.js");
const fetch = require("node-fetch");
const MELTWATER_API_URL = "https://api.meltwater.com";
const MELTWATER_TOKEN = process.env.MELTWATER_API_TOKEN;

// Endpoint de diagnóstico para verificar el estado de las variables de entorno críticas
router.get("/debug/env", (req, res) => {
  const envStatus = {
    MELTWATER_API_TOKEN: process.env.MELTWATER_API_TOKEN ? 'Configurada' : 'NO CONFIGURADA',
    MONGODB_URI: process.env.MONGODB_URI ? 'Configurada' : 'NO CONFIGURADA',
    RESEND_API_KEY: process.env.RESEND_API_KEY ? 'Configurada' : 'NO CONFIGURADA',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? 'Configurada' : 'NO CONFIGURADA',
    NODE_ENV: process.env.NODE_ENV || 'undefined'
  };
  
  console.log("🔍 DIAGNÓSTICO DE VARIABLES EN PRODUCCIÓN:");
  console.log(envStatus);
  
  res.json({
    success: true,
    environment: envStatus,
    timestamp: new Date().toISOString()
  });
});

// Endpoint para limpiar caché desde Railway (forzar nuevas peticiones a Meltwater)
router.post("/clear-cache", async (req, res) => {
  try {
    console.log("🧹 Iniciando limpieza de caché desde Railway...");
    
    // CACHÉ COMPLETAMENTE ELIMINADO - No usar caché
    // const CachedNews = require("../models/cachedNews.js");
    // const result = await CachedNews.deleteMany({});
    const result = { deletedCount: 0 }; // Caché eliminado
    
    console.log(`✅ Caché completamente eliminado - No hay caché que limpiar`);
    
    res.json({
      success: true,
      message: `Cache limpiado exitosamente. ${result.deletedCount} entradas eliminadas.`,
      deletedCount: result.deletedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Error limpiando caché:", error);
    res.status(500).json({
      success: false,
      message: "Error limpiando caché",
      error: error.message
    });
  }
});

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


// Función principal para obtener resultados de búsqueda con estrategia de caché y fallback
async function getSearchResults(searchId, includeSocial = false) {
  let allDocuments = [];

  try {
    // Hacer múltiples peticiones con diferentes rangos de fechas
    console.log(`🔍 Intentando Meltwater para searchId: ${searchId} - estrategia múltiple`);
    console.log(`🔍 DEBUG - MELTWATER_TOKEN configurado: ${MELTWATER_TOKEN ? 'Sí' : 'No'}`);
    console.log(`🔍 DEBUG - MELTWATER_API_URL: ${MELTWATER_API_URL}`);
    console.log(`🔍 DEBUG - Include Social: ${includeSocial ? 'SÍ' : 'NO'}`);
    
    allDocuments = [];
    const now = new Date();
    const end = now.toISOString().slice(0, 19);
    

    // Estrategia: 3 peticiones con diferentes rangos de fechas
    const dateRanges = [
      { name: "última semana", days: 7 },
      { name: "último mes", days: 30 },
      { name: "últimos 3 meses", days: 90 }
    ];
    
    for (let i = 0; i < dateRanges.length; i++) {
      const range = dateRanges[i];
      
      // Delay aumentado entre peticiones para evitar rate limiting
      if (i > 0) {
        const delay = 2000; // 2 segundos entre peticiones
        console.log(`⏳ Esperando ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      console.log(`🔍 Petición ${i + 1}/${dateRanges.length}: ${range.name} (${range.days} días)`);
      
      try {
        const startDate = new Date(now.getTime() - range.days * 24 * 60 * 60 * 1000).toISOString().slice(0, 19);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
        
        const res = await fetch(`${MELTWATER_API_URL}/v3/search/${searchId}`, {
          method: "POST",
          headers: {
            apikey: MELTWATER_TOKEN,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            tz: "America/Montevideo",
            start: startDate,
            end: end,
            limit: 500, // Límite moderado para obtener más artículos
            // Parámetros optimizados según el tipo de contenido solicitado
            language: "es",
            content_type: includeSocial ? undefined : "news", // Si incluye sociales, no filtrar por content_type
            sort: "relevance",
            include_social: includeSocial, // Permitir redes sociales cuando se solicite
            include_blog: includeSocial, // Incluir blogs cuando se soliciten redes sociales
            include_forum: includeSocial // Incluir foros cuando se soliciten redes sociales
          }),
        });

        clearTimeout(timeoutId);
        
        if (res.ok) {
          const data = await res.json();
          const documents = data.result?.documents || [];
          
          // Debug detallado de la respuesta de Meltwater
          console.log(`✅ Petición ${i + 1} exitosa: ${documents.length} artículos (${range.name}) - Total acumulado: ${allDocuments.length}`);
          
          // Análisis básico de tipos de contenido
          const newsCount = documents.filter(doc => doc.content_type === 'news').length;
          const socialCount = documents.filter(doc => doc.content_type === 'social post').length;
          const otherCount = documents.length - newsCount - socialCount;
          
          console.log(`📊 Contenido obtenido: ${newsCount} noticias, ${socialCount} posts sociales, ${otherCount} otros tipos`);
          
          // Debug detallado de tipos de contenido
          if (includeSocial) {
            console.log(`🔍 DEBUG SOCIAL - Tipos de contenido devueltos:`);
            documents.forEach((doc, index) => {
              console.log(`  ${index + 1}. "${doc.content?.title || doc.title || 'Sin título'}" | Tipo: ${doc.content_type} | Fuente: ${doc.source?.name}`);
            });
          }
          
          console.log(`🔍 DEBUG - Estructura de respuesta:`);
          console.log(`   - documents.length: ${documents.length}`);
          console.log(`   - result.total: ${data.result?.total || 'No disponible'}`);
          console.log(`   - result.count: ${data.result?.count || 'No disponible'}`);
          console.log(`   - result.offset: ${data.result?.offset || 'No disponible'}`);
          console.log(`   - result.limit: ${data.result?.limit || 'No disponible'}`);
          console.log(`   - Parámetros enviados: limit=500, offset=${range.offset}`);
          

          // Los parámetros de la API ya filtran contenido no deseado
          // Solo agregar documentos directamente
          allDocuments.push(...documents);
          
          // Si ya tenemos suficientes artículos, no hacer más peticiones
      if (allDocuments.length >= 800) {
        console.log(`🎯 Objetivo alcanzado (${allDocuments.length} artículos), deteniendo peticiones`);
        break;
      }
        } else {
          console.error(`⚠️  Error ${res.status} en petición ${i + 1}`);
          
          // Si es error 429, esperar más tiempo antes de continuar
          if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after');
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
            console.log(`⏳ Esperando ${waitTime/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error(`⚠️  Error en petición ${i + 1}: ${error.name}`);
        
        // Si es timeout, esperar más tiempo antes de continuar
        if (error.name === 'AbortError') {
          console.error(`⏳ Timeout, esperando 5s...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }

    if (allDocuments.length > 0) {
      console.log(`✅ Meltwater: ${allDocuments.length} artículos obtenidos`);
      return { result: { documents: allDocuments } };
    } else {
      console.error(`⚠️  Todas las peticiones de Meltwater fallaron o devolvieron 0 artículos`);
    }
  } catch (error) {
    console.error(`⚠️  Error en Meltwater múltiple: ${error.message}`);
  }

    // Si no hay artículos de Meltwater, lanzar error
    if (allDocuments.length === 0) {
      throw new Error(`No se pudieron obtener noticias de Meltwater para searchId: ${searchId}. API no disponible o sin resultados.`);
    }
    
    // Usar solo noticias reales de Meltwater
    console.log(`✅ Usando ${allDocuments.length} artículos reales de Meltwater`);
    
    return { result: { documents: allDocuments } };
}

// Endpoint principal para obtener noticias personalizadas según suscriptor o configuración por defecto
router.post("/personalized", async (req, res) => {
  try {
    await ensureConnection();
    
    const { email, countryId, sectorId, includeSocial } = req.body;
    
    // Caso 1: Si se proporcionan IDs directos, usarlos (prioridad más alta)
    if (countryId || sectorId) {
      console.log(`🔍 Buscando noticias con IDs directos: countryId=${countryId}, sectorId=${sectorId}`);
      
      const resultsPais = countryId
        ? await getSearchResults(countryId, includeSocial)
        : { result: { documents: [] } };
      const resultsSector = sectorId
        ? await getSearchResults(sectorId, includeSocial)
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

    // Caso 2: Si hay email específico, buscar suscriptor y sus búsquedas
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

      // Buscar suscripciones activas del suscriptor
      const subscriptions = await Subscription.find({ 
        subscriberId: subscriber._id, 
        isActive: true 
      }).populate('searchId');

      if (subscriptions.length === 0) {
        return res.json({
          success: true,
          pais: [],
          sector: [],
          source: "subscriber_no_subscriptions",
          message: "El usuario no tiene búsquedas suscritas"
        });
      }

      // Obtener noticias de todas las búsquedas suscritas
      const allPaisDocs = [];
      const allSectorDocs = [];

      for (const subscription of subscriptions) {
        const search = subscription.searchId;
        if (search && search.isActive) {
          // Determinar si es búsqueda de país o sector basado en el nombre o configuración
          const isCountrySearch = search.name.toLowerCase().includes('país') || 
                                 search.name.toLowerCase().includes('country') ||
                                 search.countrySearchId;
          
          const results = await getSearchResults(search.countrySearchId || search.sectorSearchId, includeSocial);
          const docs = results.result?.documents || [];
          
          if (isCountrySearch) {
            allPaisDocs.push(...docs);
          } else {
            allSectorDocs.push(...docs);
          }
        }
      }

      console.log(`📊 RESUMEN DE DATOS OBTENIDOS (email suscriptor):`);
      console.log(`   - Noticias del país: ${allPaisDocs.length}`);
      console.log(`   - Noticias del sector: ${allSectorDocs.length}`);
      console.log(`   - Total noticias: ${allPaisDocs.length + allSectorDocs.length}`);

      return res.json({
        success: true,
        pais: allPaisDocs,
        sector: allSectorDocs,
        source: "subscriber_subscriptions"
      });
    }

    // Caso 3: Email "default" o sin email - usar noticias por defecto
    console.log(`🔍 Cargando noticias por defecto`);
    
    // Obtener configuración por defecto del sistema
    const defaultConfig = await DefaultConfig.findOne();
    
    if (defaultConfig && (defaultConfig.defaultCountrySearchId || defaultConfig.defaultSectorSearchId)) {
      console.log(`📰 Usando configuración por defecto del sistema: país=${defaultConfig.defaultCountrySearchId || 'ninguno'}, sector=${defaultConfig.defaultSectorSearchId || 'ninguno'}`);
      
      const resultsPais = defaultConfig.defaultCountrySearchId
        ? await getSearchResults(defaultConfig.defaultCountrySearchId, includeSocial)
        : { result: { documents: [] } };
      console.log(`🔍 DEBUG SECTOR - Llamando getSearchResults con ID: ${defaultConfig.defaultSectorSearchId}`);
      const resultsSector = defaultConfig.defaultSectorSearchId
        ? await getSearchResults(defaultConfig.defaultSectorSearchId, includeSocial)
        : { result: { documents: [] } };

      const paisDocs = resultsPais.result?.documents || [];
      const sectorDocs = resultsSector.result?.documents || [];
      
      console.log(`📊 RESUMEN DE DATOS OBTENIDOS (configuración por defecto):`);
      console.log(`   - Noticias del país: ${paisDocs.length}`);
      console.log(`   - Noticias del sector: ${sectorDocs.length}`);
      console.log(`   - Total noticias: ${paisDocs.length + sectorDocs.length}`);
      console.log(`🔍 DEBUG SECTOR - Primeros 3 artículos del sector:`);
      sectorDocs.slice(0, 3).forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.content?.title || doc.title || 'Sin título'}`);
        console.log(`      Fuente: ${doc.source?.name || 'Sin fuente'}`);
        console.log(`      ID: ${doc.id || 'Sin ID'}`);
      });

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
          ? await getSearchResults(fallbackSubscriber.countrySearchId, includeSocial)
          : { result: { documents: [] } };
        const resultsSector = fallbackSubscriber.sectorSearchId
          ? await getSearchResults(fallbackSubscriber.sectorSearchId, includeSocial)
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

// Endpoint para limpiar caché y forzar nuevas peticiones a Meltwater
router.get("/clear-cache", async (req, res) => {
  try {
    await ensureConnection();
    
    console.log(`🧹 Cache deshabilitado - No hay caché que limpiar`);
    
    res.json({
      success: true,
      message: `Cache deshabilitado - No hay caché que limpiar`,
      deletedCount: 0,
      note: "Caché deshabilitado temporalmente - Peticiones directas a Meltwater"
    });
  } catch (error) {
    console.error("❌ Error limpiando cache:", error);
    res.status(500).json({
      success: false,
      message: "Error limpiando cache",
      error: error.message
    });
  }
});


module.exports = router;
