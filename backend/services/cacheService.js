// Servicio de caché para gestión inteligente de noticias almacenadas
const CachedNews = require("../models/cachedNews");

class CacheService {
  // Obtener artículos del caché con estrategia balanceada de tiempo
  static async getCachedArticles(searchId, maxAgeHours = 6) {
    try {
      const cached = await CachedNews.findOne({ searchId });
      
      if (!cached) {
        console.log(`📦 No hay cache para searchId: ${searchId}`);
        return null;
      }

      // Calcular la antigüedad del caché en horas
      const ageHours = (Date.now() - cached.lastUpdated) / (1000 * 60 * 60);
      
      // Estrategia balanceada: usar caché por 6 horas para obtener datos frescos
      if (ageHours > maxAgeHours) {
        console.log(`📦 Cache expirado para ${searchId} (${ageHours.toFixed(1)} horas)`);
        return null;
      }

      console.log(`📦 Cache válido para ${searchId} (${ageHours.toFixed(1)} horas, ${cached.totalArticles} artículos)`);
      return cached.articles;
    } catch (error) {
      console.error("Error obteniendo cache:", error);
      return null;
    }
  }

  // Guardar artículos en caché con información de origen
  static async saveCachedArticles(searchId, articles, isFromMeltwater = false) {
    try {
      // Determinar categoría basada en el searchId
      const category = searchId === "27551367" ? "país" : "sector";
      
      // Actualizar o crear entrada en caché
      await CachedNews.findOneAndUpdate(
        { searchId },
        {
          searchId,
          category,
          articles,
          lastUpdated: new Date(),
          isFromMeltwater,
          totalArticles: articles.length
        },
        { upsert: true, new: true }
      );

      console.log(`💾 Cache guardado para ${category}: ${articles.length} artículos (Meltwater: ${isFromMeltwater})`);
    } catch (error) {
      console.error("Error guardando cache:", error);
    }
  }


  // Obtener artículos con límite aumentado para garantizar contenido suficiente
  static async getCachedArticlesWithLimit(searchId, maxAgeHours = 72, minArticles = 50) {
    try {
      const cached = await CachedNews.findOne({ searchId });
      
      if (!cached) {
        console.log(`📦 No hay cache para searchId: ${searchId}`);
        return null;
      }

      // Calcular antigüedad del caché
      const ageHours = (Date.now() - cached.lastUpdated) / (1000 * 60 * 60);
      
      if (ageHours > maxAgeHours) {
        console.log(`📦 Cache expirado para ${searchId} (${ageHours.toFixed(1)} horas)`);
        return null;
      }

      // Si tenemos suficientes artículos en caché, devolverlos
      if (cached.articles && cached.articles.length >= minArticles) {
        console.log(`📦 Cache válido para ${searchId} (${ageHours.toFixed(1)} horas, ${cached.totalArticles} artículos)`);
        return cached.articles;
      }

      // Si no hay suficientes artículos, devolver null para forzar actualización
      console.log(`📦 Cache insuficiente para ${searchId} (${cached.totalArticles} < ${minArticles} artículos)`);
      return null;
    } catch (error) {
      console.error("Error obteniendo cache:", error);
      return null;
    }
  }

  // Limpiar caché expirado basado en antigüedad
  static async cleanExpiredCache(maxAgeHours = 48) {
    try {
      const cutoffDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
      const result = await CachedNews.deleteMany({ lastUpdated: { $lt: cutoffDate } });
      console.log(`🧹 Cache limpiado: ${result.deletedCount} entradas expiradas eliminadas`);
    } catch (error) {
      console.error("Error limpiando cache:", error);
    }
  }


  // Limpiar todo el caché para forzar nuevas peticiones a Meltwater
  static async clearAllCache() {
    try {
      const result = await CachedNews.deleteMany({});
      console.log(`🧹 Cache completamente limpiado: ${result.deletedCount} entradas eliminadas`);
      return result.deletedCount;
    } catch (error) {
      console.error("Error limpiando todo el cache:", error);
      return 0;
    }
  }


  // Limpiar caché para un searchId específico
  static async clearCacheForSearchId(searchId) {
    try {
      const result = await CachedNews.deleteOne({ searchId });
      console.log(`🧹 Cache limpiado para searchId: ${searchId} (${result.deletedCount} entradas eliminadas)`);
      return result.deletedCount;
    } catch (error) {
      console.error("Error limpiando cache para searchId:", error);
      return 0;
    }
  }
}

module.exports = CacheService;
