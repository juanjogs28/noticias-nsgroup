const CachedNews = require("../models/cachedNews");
const { generateFallbackData } = require("../routes/news");

class CacheService {
  // Obtener artículos del cache con estrategia balanceada
  static async getCachedArticles(searchId, maxAgeHours = 6) {
    try {
      const cached = await CachedNews.findOne({ searchId });
      
      if (!cached) {
        console.log(`📦 No hay cache para searchId: ${searchId}`);
        return null;
      }

      const ageHours = (Date.now() - cached.lastUpdated) / (1000 * 60 * 60);
      
      // Estrategia balanceada: usar cache por 6 horas para obtener datos frescos
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

  // Guardar artículos en cache
  static async saveCachedArticles(searchId, articles, isFromMeltwater = false) {
    try {
      const category = searchId === "27551367" ? "país" : "sector";
      
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

  // Obtener artículos con fallback inteligente
  static async getArticlesWithFallback(searchId) {
    // 1. Intentar obtener del cache
    const cachedArticles = await this.getCachedArticles(searchId);
    if (cachedArticles && cachedArticles.length > 0) {
      return cachedArticles;
    }

    // 2. Si no hay cache, generar fallback
    console.log(`🔄 Generando fallback para searchId: ${searchId}`);
    const fallbackArticles = generateFallbackData(searchId);
    
    // 3. Guardar fallback en cache
    await this.saveCachedArticles(searchId, fallbackArticles, false);
    
    return fallbackArticles;
  }

  // Obtener artículos con límite aumentado para más contenido
  static async getCachedArticlesWithLimit(searchId, maxAgeHours = 72, minArticles = 50) {
    try {
      const cached = await CachedNews.findOne({ searchId });
      
      if (!cached) {
        console.log(`📦 No hay cache para searchId: ${searchId}`);
        return null;
      }

      const ageHours = (Date.now() - cached.lastUpdated) / (1000 * 60 * 60);
      
      if (ageHours > maxAgeHours) {
        console.log(`📦 Cache expirado para ${searchId} (${ageHours.toFixed(1)} horas)`);
        return null;
      }

      // Si tenemos suficientes artículos en cache, devolverlos
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

  // Limpiar cache expirado
  static async cleanExpiredCache(maxAgeHours = 48) {
    try {
      const cutoffDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
      const result = await CachedNews.deleteMany({ lastUpdated: { $lt: cutoffDate } });
      console.log(`🧹 Cache limpiado: ${result.deletedCount} entradas expiradas eliminadas`);
    } catch (error) {
      console.error("Error limpiando cache:", error);
    }
  }

  // Forzar uso de fallback para evitar peticiones a la API
  static async forceFallbackForSearchId(searchId) {
    try {
      // Eliminar cache existente para este searchId
      await CachedNews.deleteOne({ searchId });
      console.log(`🔄 Cache eliminado para searchId: ${searchId} - forzando fallback`);
      return true;
    } catch (error) {
      console.error("Error forzando fallback:", error);
      return false;
    }
  }
}

module.exports = CacheService;
