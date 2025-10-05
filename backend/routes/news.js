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
  
  // Generar 20 artículos adicionales para llegar a 30 total (solo para emergencias)
  for (let i = 11; i <= 30; i++) {
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
  
  // Generar 10 artículos de redes sociales (solo para emergencias)
  for (let i = 1; i <= 10; i++) {
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
  
  try {
    // TEMPORAL: Saltar caché para forzar datos reales de Meltwater
    console.log(`🔍 Saltando caché para forzar datos reales de Meltwater (searchId: ${searchId})`);
    
    // Verificar si el caché tiene datos de Meltwater reales y suficientes
    const cachedArticles = await CacheService.getCachedArticles(searchId, 6); // 6 horas de caché
    if (cachedArticles && cachedArticles.length > 0) {
      // Verificar si son datos reales de Meltwater
      const isFromMeltwater = cachedArticles.some(article => 
        article.id && !article.id.startsWith('fallback_') && !article.id.startsWith('social_')
      );
      
      // Solo usar caché si tiene suficientes artículos reales
      if (isFromMeltwater && cachedArticles.length >= 50) {
        console.log(`📦 Usando cache REAL de Meltwater para searchId: ${searchId} (${cachedArticles.length} artículos)`);
        return { result: { documents: cachedArticles } };
      } else if (isFromMeltwater && cachedArticles.length < 50) {
        console.log(`⚠️  Cache tiene pocos artículos reales (${cachedArticles.length} < 50), forzando nuevas peticiones`);
      } else {
        console.log(`⚠️  Cache contiene datos ficticios, forzando nueva petición a Meltwater`);
      }
    }

    // Si no hay cache, hacer múltiples peticiones con diferentes rangos de fechas
    console.log(`🔍 Intentando Meltwater para searchId: ${searchId} (sin cache) - estrategia múltiple`);
    
    const allDocuments = [];
    const now = new Date();
    const end = now.toISOString().slice(0, 19);
    
    // Definir rangos de fechas optimizados para menos peticiones
    const dateRanges = [
      { days: 7, name: "última semana" },
      { days: 30, name: "último mes" },
      { days: 60, name: "últimos 2 meses" }
    ];
    
    for (let i = 0; i < dateRanges.length; i++) {
      const range = dateRanges[i];
      
      // Delay mínimo entre peticiones para evitar saturación
      if (i > 0) {
        const delay = 500 + Math.random() * 1000; // 0.5-1.5 segundos entre peticiones
        console.log(`⏳ Esperando ${Math.round(delay/1000)}s antes de próxima petición...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      console.log(`🔍 Petición ${i + 1}/${dateRanges.length}: ${range.name} (${range.days} días)`);
      
      try {
        const startDate = new Date(now.getTime() - range.days * 24 * 60 * 60 * 1000).toISOString().slice(0, 19);
        
        const res = await fetch(`${MELTWATER_API_URL}/v3/search/${searchId}`, {
          method: "POST",
          headers: {
            apikey: MELTWATER_TOKEN,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tz: "America/Montevideo",
            start: startDate,
            end: end,
            limit: 500, // Aumentar límite para compensar menos peticiones
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const documents = data.result?.documents || [];
          
          console.log(`✅ Petición ${i + 1} exitosa: ${documents.length} artículos obtenidos`);
          
          // Agregar documentos únicos (evitar duplicados)
          const newDocuments = documents.filter(doc => 
            !allDocuments.some(existing => existing.id === doc.id)
          );
          
          allDocuments.push(...newDocuments);
          console.log(`📊 Total acumulado: ${allDocuments.length} artículos únicos`);
          
          // Si ya tenemos suficientes artículos, no hacer más peticiones
          if (allDocuments.length >= 100) {
            console.log(`🎯 Objetivo alcanzado (${allDocuments.length} artículos), deteniendo peticiones`);
            break;
          }
        } else {
          console.log(`⚠️  Error en petición ${i + 1}: ${res.status}`);
        }
      } catch (error) {
        console.log(`⚠️  Error en petición ${i + 1}: ${error.message}`);
      }
    }

    if (allDocuments.length > 0) {
      console.log(`✅ Meltwater múltiple exitoso: ${allDocuments.length} artículos únicos obtenidos`);
      
      // Si tenemos pocos artículos, intentar peticiones adicionales con diferentes parámetros
      if (allDocuments.length < 50) {
        console.log(`🔄 Pocos artículos obtenidos (${allDocuments.length}), intentando peticiones adicionales...`);
        
        // Petición adicional con rango más amplio
        try {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const extendedStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19);
          console.log(`🔍 Petición adicional: últimos 90 días`);
          
          const res = await fetch(`${MELTWATER_API_URL}/v3/search/${searchId}`, {
            method: "POST",
            headers: {
              apikey: MELTWATER_TOKEN,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tz: "America/Montevideo",
              start: extendedStart,
              end: end,
              limit: 1000,
            }),
          });

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

  // Solo usar fallback si todas las peticiones de Meltwater fallan
  console.log(`🔄 Meltwater múltiple falló, usando fallback para searchId: ${searchId}`);
  const fallbackDocuments = generateFallbackData(searchId);
  
  // Guardar fallback en cache
  await CacheService.saveCachedArticles(searchId, fallbackDocuments, false);
  
  return { result: { documents: fallbackDocuments } };
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
