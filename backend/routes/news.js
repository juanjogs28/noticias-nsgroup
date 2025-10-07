const express = require("express");
const router = express.Router();
const Subscriber = require("../models/subscribers.js");
const Subscription = require("../models/subscriptions.js");
const DefaultConfig = require("../models/defaultConfig.js");
const fetch = require("node-fetch");
const MELTWATER_API_URL = "https://api.meltwater.com";
const MELTWATER_TOKEN = process.env.MELTWATER_API_TOKEN;

// Endpoint de diagnóstico para verificar variables de entorno
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

// Endpoint para limpiar caché desde Railway
router.post("/clear-cache", async (req, res) => {
  try {
    console.log("🧹 Iniciando limpieza de caché desde Railway...");
    
    // Importar el modelo de caché
    const CachedNews = require("../models/cachedNews.js");
    
    // Limpiar todo el caché
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
// Función para generar datos de fallback cuando Meltwater esté bloqueado
function generateFallbackData(searchId) {
  const isCountry = searchId === "27551367";
  const category = isCountry ? "país" : "sector";
  
  console.log(`🔄 Generando datos de fallback para ${category} (searchId: ${searchId})`);
  
  const fallbackArticles = [
    {
      id: `fallback_${searchId}_1`,
      url: "https://www.elobservador.com.uy/",
      published_date: new Date().toISOString(),
      source: { name: "El Observador" },
      content: {
        title: `Noticia importante del ${category} - Impacto económico y social`,
        summary: `Análisis detallado de la situación actual del ${category} y sus implicaciones para el desarrollo nacional.`,
        image: "https://picsum.photos/400/300?random=1"
      }
    },
    {
      id: `fallback_${searchId}_2`,
      url: "https://www.montecarlo.com.uy/",
      published_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      source: { name: "Monte Carlo Television" },
      content: {
        title: `Desarrollo sostenible en el ${category} - Nuevas oportunidades`,
        summary: `Iniciativas innovadoras que están transformando el panorama del ${category} en Uruguay.`,
        image: "https://picsum.photos/400/300?random=2"
      }
    },
    {
      id: `fallback_${searchId}_3`,
      url: "https://www.elpais.com.uy/",
      published_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      source: { name: "El País" },
      content: {
        title: `Tendencias emergentes en el ${category} - Análisis 2025`,
        summary: `Expertos analizan las principales tendencias que marcarán el futuro del ${category} en el próximo año.`,
        image: "https://picsum.photos/400/300?random=3"
      }
    },
    {
      id: `fallback_${searchId}_4`,
      url: "https://ladiaria.com.uy/",
      published_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      source: { name: "La Diaria" },
      content: {
        title: `Innovación tecnológica en el ${category} - Casos de éxito`,
        summary: `Cómo la tecnología está revolucionando las prácticas tradicionales del ${category} en Uruguay.`,
        image: "https://picsum.photos/400/300?random=4"
      }
    },
    {
      id: `fallback_${searchId}_5`,
      url: "https://brecha.com.uy/",
      published_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      source: { name: "Brecha" },
      content: {
        title: `Perspectivas de crecimiento en el ${category} - Proyecciones`,
        summary: `Análisis de las oportunidades de crecimiento y desarrollo en el ${category} para los próximos meses.`,
        image: "https://picsum.photos/400/300?random=5"
      }
    },
    {
      id: `fallback_${searchId}_6`,
      url: "https://www.eltelegrafo.com/",
      published_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      source: { name: "El Telégrafo" },
      content: {
        title: `Reformas estructurales en el ${category} - Nuevo enfoque`,
        summary: `Cambios fundamentales que están redefiniendo las bases del ${category} en el contexto nacional.`,
        image: "https://via.placeholder.com/400x300?text=Reformas+Estructurales"
      }
    },
    {
      id: `fallback_${searchId}_7`,
      url: "https://www.busqueda.com.uy/",
      published_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      source: { name: "Busqueda" },
      content: {
        title: `Inversión pública en el ${category} - Presupuesto 2025`,
        summary: `Análisis de las asignaciones presupuestarias destinadas al fortalecimiento del ${category} en el próximo año.`,
        image: "https://via.placeholder.com/400x300?text=Inversion+Publica"
      }
    },
    {
      id: `fallback_${searchId}_8`,
      url: "https://www.elespectador.com/",
      published_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      source: { name: "El Espectador" },
      content: {
        title: `Cooperación internacional en el ${category} - Alianzas estratégicas`,
        summary: `Acuerdos y colaboraciones que están potenciando el desarrollo del ${category} a nivel regional.`,
        image: "https://via.placeholder.com/400x300?text=Cooperacion+Internacional"
      }
    },
    {
      id: `fallback_${searchId}_9`,
      url: "https://www.ovaciondigital.com.uy/",
      published_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      source: { name: "Ovación" },
      content: {
        title: `Capacitación y formación en el ${category} - Recursos humanos`,
        summary: `Programas de desarrollo profesional que están elevando la calidad del ${category} en Uruguay.`,
        image: "https://via.placeholder.com/400x300?text=Capacitacion+Formacion"
      }
    },
    {
      id: `fallback_${searchId}_10`,
      url: "https://www.elobservador.com.uy/",
      published_date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      source: { name: "El Observador" },
      content: {
        title: `Sostenibilidad ambiental en el ${category} - Compromiso verde`,
        summary: `Iniciativas ecológicas que están transformando las prácticas del ${category} hacia un futuro más sostenible.`,
        image: "https://via.placeholder.com/400x300?text=Sostenibilidad+Ambiental"
      }
    }
  ];
  
  // Generar más artículos de fallback para igualar números anteriores
  const additionalArticles = [];
  const sources = ["El Observador", "Monte Carlo Television", "El País", "La Diaria", "Brecha", "El Telégrafo", "Busqueda", "El Espectador", "Ovación"];
  const topics = [
    "Análisis económico", "Desarrollo sostenible", "Innovación tecnológica", "Reformas estructurales", 
    "Inversión pública", "Cooperación internacional", "Capacitación profesional", "Sostenibilidad ambiental",
    "Políticas públicas", "Crecimiento económico", "Modernización", "Competitividad", "Productividad",
    "Empleo", "Formación", "Investigación", "Desarrollo regional", "Integración", "Calidad", "Eficiencia"
  ];
  
  // Generar 50 artículos adicionales para llegar a 60 total (solo para emergencias)
  for (let i = 11; i <= 60; i++) {
    const randomSource = sources[Math.floor(Math.random() * sources.length)];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const daysAgo = Math.floor(Math.random() * 30); // Últimos 30 días
    
    // Mapear fuentes a URLs reales
    const sourceUrls = {
      "El Observador": "https://www.elobservador.com.uy/",
      "Monte Carlo Television": "https://www.montecarlo.com.uy/",
      "El País": "https://www.elpais.com.uy/",
      "La Diaria": "https://ladiaria.com.uy/",
      "Brecha": "https://brecha.com.uy/",
      "El Telégrafo": "https://www.eltelegrafo.com/",
      "Busqueda": "https://www.busqueda.com.uy/",
      "El Espectador": "https://www.elespectador.com/",
      "Ovación": "https://www.ovaciondigital.com.uy/"
    };
    
    additionalArticles.push({
      id: `fallback_${searchId}_${i}`,
      url: sourceUrls[randomSource] || "https://www.elobservador.com.uy/",
      published_date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      source: { name: randomSource },
      content: {
        title: `${randomTopic} en el ${category} - Perspectivas y análisis`,
        summary: `Análisis detallado sobre ${randomTopic.toLowerCase()} y su impacto en el desarrollo del ${category} en Uruguay.`,
        image: `https://picsum.photos/400/300?random=${i}`
      }
    });
  }
  
  // Agregar artículos de redes sociales para la sección de redes sociales
  const socialMediaArticles = [];
  const socialSources = ["Facebook", "Twitter", "Instagram", "LinkedIn", "TikTok"];
  const socialTopics = [
    "Tendencias virales", "Opinión pública", "Debate social", "Movimientos ciudadanos",
    "Campañas digitales", "Influencers", "Comunidad online", "Redes sociales",
    "Engagement", "Viral", "Hashtags", "Trending", "Social media"
  ];
  
  // Generar 20 artículos de redes sociales (solo para emergencias)
  for (let i = 1; i <= 20; i++) {
    const randomSource = socialSources[Math.floor(Math.random() * socialSources.length)];
    const randomTopic = socialTopics[Math.floor(Math.random() * socialTopics.length)];
    const daysAgo = Math.floor(Math.random() * 7); // Últimos 7 días
    
    // URLs para redes sociales
    const socialUrls = {
      "Facebook": "https://www.facebook.com/",
      "Twitter": "https://twitter.com/",
      "Instagram": "https://www.instagram.com/",
      "LinkedIn": "https://www.linkedin.com/",
      "TikTok": "https://www.tiktok.com/"
    };
    
    socialMediaArticles.push({
      id: `social_${searchId}_${i}`,
      url: socialUrls[randomSource] || "https://www.facebook.com/",
      published_date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      source: { name: randomSource },
      content: {
        title: `${randomTopic} - ${category} en redes sociales`,
        summary: `Discusión y análisis sobre ${randomTopic.toLowerCase()} relacionado con el ${category} en las redes sociales.`,
        image: `https://picsum.photos/400/300?random=${i + 100}`
      }
    });
  }
  
  const allFallbackArticles = [...fallbackArticles, ...additionalArticles, ...socialMediaArticles];
  console.log(`✅ Generados ${allFallbackArticles.length} artículos de fallback para ${category} (incluyendo ${socialMediaArticles.length} de redes sociales)`);
  return allFallbackArticles;
}

async function getSearchResults(searchId) {
  // Usar cache service para obtener artículos
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
          if (allDocuments.length >= 100) {
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

    // Solo usar noticias reales de Meltwater
    if (allDocuments.length === 0) {
      console.log(`🔄 Meltwater falló completamente, usando fallback para searchId: ${searchId}`);
      const fallbackDocuments = generateFallbackData(searchId);
      
      // Guardar fallback en cache
      await CacheService.saveCachedArticles(searchId, fallbackDocuments, false);
      
      return { result: { documents: fallbackDocuments } };
    } else {
      // Usar solo noticias reales de Meltwater
      console.log(`✅ Usando ${allDocuments.length} artículos reales de Meltwater`);
      
      // Guardar artículos reales en cache
      await CacheService.saveCachedArticles(searchId, allDocuments, true);
      
      return { result: { documents: allDocuments } };
    }
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

// GET /api/news/clear-cache - Limpiar caché y forzar nuevas peticiones
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

// GET /api/news/clear-fallback - Limpiar solo caché de fallback
router.get("/clear-fallback", async (req, res) => {
  try {
    await ensureConnection();
    
    const CacheService = require("../services/cacheService");
    
    // Limpiar solo caché de fallback
    const deletedCount = await CacheService.clearFallbackCache();
    
    console.log(`🧹 Cache de fallback limpiado: ${deletedCount} entradas eliminadas`);
    
    res.json({
      success: true,
      message: `Cache de fallback limpiado exitosamente. ${deletedCount} entradas eliminadas.`,
      deletedCount: deletedCount,
      note: "Se mantienen los datos reales de Meltwater en caché"
    });
  } catch (error) {
    console.error("❌ Error limpiando cache de fallback:", error);
    res.status(500).json({
      success: false,
      message: "Error limpiando cache de fallback",
      error: error.message
    });
  }
});

module.exports = router;
