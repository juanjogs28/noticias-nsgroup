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


// Función para generar ID único de un documento
function generateDocumentId(doc) {
  // Usar ID si existe, sino URL, sino título+fuente+fecha
  if (doc.id) return `id:${doc.id}`;
  if (doc.url) return `url:${doc.url}`;
  const title = doc.content?.title || doc.title || '';
  const source = doc.source?.name || '';
  const date = doc.published_date || '';
  return `hash:${title}_${source}_${date}`;
}

// Función principal para obtener resultados de búsqueda - Asegura mínimo 50 artículos únicos con paginación
async function getSearchResults(searchId, includeSocial = false) {
  let allDocuments = [];
  const seenIds = new Set(); // Para evitar duplicados
  const MIN_ARTICLES = 60; // Mínimo requerido de artículos únicos (aumentado para dar margen)

  try {
    console.log(`🔍 Intentando Meltwater para searchId: ${searchId} - Objetivo: mínimo ${MIN_ARTICLES} artículos únicos`);
    console.log(`🔍 DEBUG - MELTWATER_TOKEN configurado: ${MELTWATER_TOKEN ? 'Sí' : 'No'}`);
    console.log(`🔍 DEBUG - MELTWATER_API_URL: ${MELTWATER_API_URL}`);
    console.log(`🔍 DEBUG - Include Social: ${includeSocial ? 'SÍ' : 'NO'}`);
    
    allDocuments = [];
    const now = new Date();
    const end = now.toISOString().slice(0, 19);
    
    // Estrategia optimizada: usar ventanas más grandes con paginación
    const windowSize = 30; // 30 días por ventana (aumentado desde 7)
    const totalDays = 150; // 5 meses en total
    const numberOfWindows = 5; // 5 ventanas de 30 días
    
    const dateWindows = [];
    for (let i = 0; i < numberOfWindows; i++) {
      const daysEnd = windowSize * (i + 1);
      const daysStart = windowSize * i;
      dateWindows.push({
        name: `ventana ${i + 1} (días ${daysStart}-${daysEnd})`,
        startDays: daysStart,
        endDays: daysEnd
      });
    }
    
    // Solo usar relevance
    const sortBy = "relevance";
    
    console.log(`\n📅 Usando ${dateWindows.length} ventanas de tiempo de ${windowSize} días cada una con paginación`);
    
    for (const window of dateWindows) {
      // Si ya tenemos suficientes artículos, no continuar
      if (allDocuments.length >= MIN_ARTICLES) {
        console.log(`🎯 Ya tenemos ${allDocuments.length} artículos, suficiente para continuar`);
        break;
      }
      
      const startDate = new Date(now.getTime() - window.endDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 19);
      const endDate = new Date(now.getTime() - window.startDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 19);
      
      console.log(`\n📅 Ventana: ${window.name} (${startDate} a ${endDate})`);
      
      // Paginación dentro de cada ventana
      let offset = 0;
      let windowHasMore = true;
      const PAGE_SIZE = 50;
      const MAX_PAGES_PER_WINDOW = 5; // Máximo 5 páginas por ventana (250 artículos)
      let pageCount = 0;
      
      while (windowHasMore && allDocuments.length < MIN_ARTICLES && pageCount < MAX_PAGES_PER_WINDOW) {
        pageCount++;
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          
          console.log(`   🔍 Petición página ${pageCount}: offset=${offset}, limit=${PAGE_SIZE}`);
          
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
              end: endDate,
              limit: PAGE_SIZE,
              offset: offset,
              language: "es",
              content_type: includeSocial ? undefined : "news",
              sort: sortBy,
              include_social: includeSocial,
              include_blog: includeSocial,
              include_forum: includeSocial
            }),
          });

          clearTimeout(timeoutId);
          
          if (res.ok) {
            const data = await res.json();
            const documents = data.result?.documents || [];
            
            if (documents.length === 0) {
              console.log(`   ⚠️  Sin más resultados en esta ventana`);
              windowHasMore = false;
              break;
            }
            
            // Si recibimos menos de PAGE_SIZE, no hay más en esta ventana
            if (documents.length < PAGE_SIZE) {
              console.log(`   ℹ️  Última página de esta ventana (${documents.length} artículos)`);
              windowHasMore = false;
            }
            
            // Filtrar duplicados usando ID mejorado
            const newDocuments = documents.filter(doc => {
              const docId = generateDocumentId(doc);
              if (seenIds.has(docId)) {
                return false;
              }
              seenIds.add(docId);
              return true;
            });
            
            allDocuments.push(...newDocuments);
            
            console.log(`   ✅ ${documents.length} recibidos, ${newDocuments.length} nuevos únicos, ${allDocuments.length} total acumulado`);
            
            // Si ya tenemos suficientes, detener
            if (allDocuments.length >= MIN_ARTICLES) {
              console.log(`   🎯 Objetivo alcanzado! ${allDocuments.length} artículos únicos obtenidos`);
              break;
            }
            
            // Incrementar offset para siguiente página
            offset += PAGE_SIZE;
            
            // Delay entre peticiones (2 segundos para evitar rate limits)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
          } else {
            const errorText = await res.text().catch(() => 'No error text');
            console.error(`   ⚠️  Error ${res.status}: ${errorText}`);
            
            if (res.status === 429) {
              const retryAfter = res.headers.get('retry-after');
              const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
              console.log(`   ⏳ Rate limit, esperando ${waitTime/1000}s...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            } else if (res.status >= 400 && res.status < 500) {
              // Error del cliente, saltar esta página
              console.log(`   🔄 Error del cliente, saltando página...`);
              windowHasMore = false;
              break;
            } else {
              // Error del servidor, esperar y continuar
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        } catch (error) {
          console.error(`   ⚠️  Error en petición: ${error.name} - ${error.message}`);
          if (error.name === 'AbortError') {
            console.log(`   ⏳ Timeout, esperando 5s...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          // No romper el loop, intentar siguiente página
        }
      }
      
      // Si ya tenemos suficientes, no probar más ventanas
      if (allDocuments.length >= MIN_ARTICLES) {
        break;
      }
      
      // Delay entre ventanas
      if (allDocuments.length < MIN_ARTICLES) {
        console.log(`   ⏳ Esperando 1s antes de siguiente ventana...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (allDocuments.length > 0) {
      console.log(`\n✅ Meltwater: ${allDocuments.length} artículos únicos obtenidos`);
      
      // Si tenemos menos del mínimo, loguear advertencia pero devolver lo que tenemos
      if (allDocuments.length < MIN_ARTICLES) {
        console.warn(`⚠️  Advertencia: Solo se obtuvieron ${allDocuments.length} artículos, se solicitaban mínimo ${MIN_ARTICLES}`);
      }
      
      return { result: { documents: allDocuments } };
    } else {
      console.error(`⚠️  Todas las peticiones de Meltwater fallaron o devolvieron 0 artículos`);
    }
  } catch (error) {
    console.error(`⚠️  Error en Meltwater múltiple: ${error.message}`);
  }

    if (allDocuments.length === 0) {
      throw new Error(`No se pudieron obtener noticias de Meltwater para searchId: ${searchId}. API no disponible o sin resultados.`);
    }
    
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
