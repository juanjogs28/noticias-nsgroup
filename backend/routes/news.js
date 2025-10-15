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
    
    // Importar el modelo de caché para operaciones de limpieza
    const CachedNews = require("../models/cachedNews.js");
    
    // Limpiar todo el caché almacenado
    const result = await CachedNews.deleteMany({});
    
    console.log(`✅ Cache limpiado desde Railway: ${result.deletedCount} entradas eliminadas`);
    
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
async function getSearchResults(searchId) {
  // Usar servicio de caché para obtener artículos
  const CacheService = require("../services/cacheService");
  
  // Declarar fuera del try para evitar referencia no definida en catch/fallback
  let allDocuments = [];

  try {
    // Usar caché más agresivo para evitar peticiones repetidas a Meltwater
    console.log(`🔍 Verificando caché para searchId: ${searchId}`);
    
    // Verificar si el caché tiene datos de Meltwater reales y suficientes (24 horas de caché)
    const cachedArticles = await CacheService.getCachedArticles(searchId, 24); // 24 horas de caché
    if (cachedArticles && cachedArticles.length > 0) {
      // Verificar si son datos reales de Meltwater
      const isFromMeltwater = cachedArticles.some(article => 
        article.id && !article.id.startsWith('fallback_') && !article.id.startsWith('social_')
      );
      
      // Usar caché si tiene artículos reales (mínimo 10 para ser más permisivo)
      if (isFromMeltwater && cachedArticles.length >= 10) {
        console.log(`📦 Usando cache REAL de Meltwater para searchId: ${searchId} (${cachedArticles.length} artículos)`);
        return { result: { documents: cachedArticles } };
      } else {
        console.log(`⚠️  Cache insuficiente (${cachedArticles.length} < 10 artículos), forzando nuevas peticiones`);
        // Limpiar caché insuficiente
        await CacheService.clearCacheForSearchId(searchId);
      }
    }

    // Si no hay cache, hacer múltiples peticiones con diferentes rangos de fechas
    console.log(`🔍 Intentando Meltwater para searchId: ${searchId} (sin cache) - estrategia múltiple`);
    console.log(`🔍 DEBUG - MELTWATER_TOKEN configurado: ${MELTWATER_TOKEN ? 'Sí' : 'No'}`);
    console.log(`🔍 DEBUG - MELTWATER_API_URL: ${MELTWATER_API_URL}`);
    
    allDocuments = [];
    const now = new Date();
    const end = now.toISOString().slice(0, 19);
    
    // Definir rangos de fechas más amplios para obtener más noticias reales
    // Estrategia híbrida: 10 peticiones con rangos diferentes para obtener más artículos
    const dateRanges = [
      { name: "última semana", days: 7 },
      { name: "últimos 14 días", days: 14 },
      { name: "último mes", days: 30 },
      { name: "últimos 45 días", days: 45 },
      { name: "últimos 60 días", days: 60 },
      { name: "últimos 3 meses", days: 90 },
      { name: "últimos 4 meses", days: 120 },
      { name: "últimos 6 meses", days: 180 },
      { name: "últimos 9 meses", days: 270 },
      { name: "último año", days: 365 }
    ];
    
    for (let i = 0; i < dateRanges.length; i++) {
      const range = dateRanges[i];
      
      // Backoff inteligente: más rápido al inicio, más lento al final
      if (i > 0) {
        const delay = i < 5 ? 1000 : 2000; // 1s para primeras 5, 2s para el resto
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
            limit: 2000, // Límite máximo para obtener más artículos
            // Agregar parámetros adicionales para obtener más resultados
            language: "es", // Idioma español
            content_type: "news", // Tipo de contenido
            sort: "relevance", // Ordenar por relevancia
            include_social: true, // Incluir redes sociales
            include_blog: true, // Incluir blogs
            include_forum: true // Incluir foros
          }),
        });

        clearTimeout(timeoutId);
        
        if (res.ok) {
          const data = await res.json();
          const documents = data.result?.documents || [];
          
          // Debug detallado de la respuesta de Meltwater
          // Logs reducidos para evitar rate limit de Railway
          console.log(`✅ Petición ${i + 1} exitosa: ${documents.length} artículos (${range.name})`);
          
          // Agregar documentos únicos (evitar duplicados)
          const newDocuments = documents.filter(doc => 
            !allDocuments.some(existing => existing.id === doc.id)
          );
          
          allDocuments.push(...newDocuments);
          
          // Si ya tenemos suficientes artículos, no hacer más peticiones
          if (allDocuments.length >= 300) {
            console.log(`🎯 Objetivo alcanzado (${allDocuments.length} artículos), deteniendo peticiones`);
            break;
          }
        } else {
          // Logs reducidos para errores
          console.log(`⚠️  Error ${res.status} en petición ${i + 1}`);
          
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
        console.log(`⚠️  Error en petición ${i + 1}: ${error.name}`);
        
        // Si es timeout, esperar más tiempo antes de continuar
        if (error.name === 'AbortError') {
          console.log(`⏳ Timeout, esperando 5s...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }

    if (allDocuments.length > 0) {
      console.log(`✅ Meltwater: ${allDocuments.length} artículos obtenidos`);
      
      // Si tenemos pocos artículos, intentar peticiones adicionales con diferentes parámetros
      if (allDocuments.length < 50) {
        console.log(`🔄 Pocos artículos obtenidos (${allDocuments.length}), intentando peticiones adicionales...`);
        
        // Petición adicional con rango más amplio
        try {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const extendedStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19);
          console.log(`🔍 Petición adicional: últimos 90 días`);
          
          const controller2 = new AbortController();
          const timeoutId2 = setTimeout(() => controller2.abort(), 30000); // 30 segundos timeout
          
          const res = await fetch(`${MELTWATER_API_URL}/v3/search/${searchId}`, {
            method: "POST",
            headers: {
              apikey: MELTWATER_TOKEN,
              "Content-Type": "application/json",
            },
            signal: controller2.signal,
            body: JSON.stringify({
              tz: "America/Montevideo",
              start: extendedStart,
              end: end,
              limit: 2000,
            }),
          });

          clearTimeout(timeoutId2);
          
          if (res.ok) {
            const data = await res.json();
            const documents = data.result?.documents || [];
            
            console.log(`✅ Petición adicional exitosa: ${documents.length} artículos obtenidos`);
            
            const newDocuments = documents.filter(doc => 
              !allDocuments.some(existing => existing.id === doc.id)
            );
            
            allDocuments.push(...newDocuments);
            console.log(`📊 Total final: ${allDocuments.length} artículos únicos`);
          }
        } catch (error) {
          clearTimeout(timeoutId2);
          console.log(`⚠️  Error en petición adicional: ${error.message}`);
        }
      }
      
      // Guardar en cache
      await CacheService.saveCachedArticles(searchId, allDocuments, true);
      return { result: { documents: allDocuments } };
    } else {
      console.log(`⚠️  Todas las peticiones de Meltwater fallaron o devolvieron 0 artículos`);
    }
  } catch (error) {
    console.log(`⚠️  Error en Meltwater múltiple: ${error.message}`);
  }

    // Si no hay artículos de Meltwater, lanzar error
    if (allDocuments.length === 0) {
      throw new Error(`No se pudieron obtener noticias de Meltwater para searchId: ${searchId}. API no disponible o sin resultados.`);
    }
    
    // Usar solo noticias reales de Meltwater
    console.log(`✅ Usando ${allDocuments.length} artículos reales de Meltwater`);
    
    // Guardar artículos reales en cache
    await CacheService.saveCachedArticles(searchId, allDocuments, true);
    
    return { result: { documents: allDocuments } };
}

// Endpoint principal para obtener noticias personalizadas según suscriptor o configuración por defecto
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
          
          const results = await getSearchResults(search.countrySearchId || search.sectorSearchId);
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
        ? await getSearchResults(defaultConfig.defaultCountrySearchId)
        : { result: { documents: [] } };
      console.log(`🔍 DEBUG SECTOR - Llamando getSearchResults con ID: ${defaultConfig.defaultSectorSearchId}`);
      const resultsSector = defaultConfig.defaultSectorSearchId
        ? await getSearchResults(defaultConfig.defaultSectorSearchId)
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

// Endpoint para limpiar caché y forzar nuevas peticiones a Meltwater
router.get("/clear-cache", async (req, res) => {
  try {
    await ensureConnection();
    
    const CacheService = require("../services/cacheService");
    
    // Limpiar todo el caché
    const deletedCount = await CacheService.clearAllCache();
    
    console.log(`🧹 Cache limpiado: ${deletedCount} entradas eliminadas`);
    
    res.json({
      success: true,
      message: `Cache limpiado exitosamente. ${deletedCount} entradas eliminadas.`,
      deletedCount: deletedCount,
      note: "Las próximas peticiones intentarán obtener datos reales de Meltwater"
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
