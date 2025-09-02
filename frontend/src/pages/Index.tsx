import { useEffect, useState } from "react";
import axios from "axios";
import NewsList from "../components/ui/newsList";
import SectionSkeleton from "../components/ui/SectionSkeleton";

interface MeltwaterArticle {
  title: string;
  url: string;
  urlToImage: string;
  description: string;
  publishedAt: string;
  source: {
    name: string;
    metrics?: {
      reach: number;
      ave: number;
    };
  };
  engagementScore?: number;
  socialEchoScore?: number;
  location?: {
    country_code: string;
  };
  enrichments?: {
    sentiment: string;
    keyphrases: string[];
  };
  metrics?: {
    views: number;
  };
}

interface NewsResponse {
  success: boolean;
  pais: any[];
  sector: any[];
}

function adaptResults(raw: any[]): MeltwaterArticle[] {
  return raw.map((doc) => ({
    title: doc.content?.title || "Sin título",
    url: doc.url,
    urlToImage: doc.content?.image || "/placeholder.svg",
    description: doc.content?.opening_text || "",
    publishedAt: doc.published_date,
    source: {
      name: doc.source?.name || "Fuente desconocida",
      metrics: doc.source?.metrics ? {
        reach: doc.source.metrics.reach || 0,
        ave: doc.source.metrics.ave || 0
      } : undefined
    },
    engagementScore: doc.metrics?.engagement?.total ?? 0,
    socialEchoScore: doc.metrics?.social_echo?.total ?? 0,
    location: doc.location ? {
      country_code: doc.location.country_code
    } : undefined,
    enrichments: doc.enrichments ? {
      sentiment: doc.enrichments.sentiment || 'neutral',
      keyphrases: doc.enrichments.keyphrases || []
    } : undefined,
    metrics: doc.metrics ? {
      views: doc.metrics.views || 0
    } : undefined,
  }));
}

// Funciones auxiliares para normalización
function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 0.5; // Evitar división por cero
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// Función para calcular el ContentScore compuesto
function calculateContentScore(article: MeltwaterArticle, allArticles: MeltwaterArticle[]): number {
  // Extraer métricas del artículo
  const reach = article.source?.metrics?.reach || 0;
  const engagement = article.engagementScore || 0;
  const ave = article.source?.metrics?.ave || 0;
  const views = article.metrics?.views || (engagement * 1.5); // Usar views reales si están disponibles

  // Calcular valores mínimos y máximos de todas las noticias para normalización
  const allReach = allArticles.map(a => a.source?.metrics?.reach || 0).filter(r => r > 0);
  const allEngagement = allArticles.map(a => a.engagementScore || 0).filter(e => e > 0);
  const allAve = allArticles.map(a => a.source?.metrics?.ave || 0).filter(a => a > 0);
  const allViews = allArticles.map(a => a.metrics?.views || (a.engagementScore || 0) * 1.5).filter(v => v > 0);

  const minReach = Math.min(...allReach, 0);
  const maxReach = Math.max(...allReach, 1);
  const minEngagement = Math.min(...allEngagement, 0);
  const maxEngagement = Math.max(...allEngagement, 1);
  const minAve = Math.min(...allAve, 0);
  const maxAve = Math.max(...allAve, 1);
  const minViews = Math.min(...allViews, 0);
  const maxViews = Math.max(...allViews, 1);

  // Normalizar valores
  const reachNorm = normalizeValue(reach, minReach, maxReach);
  const engagementNorm = normalizeValue(engagement, minEngagement, maxEngagement);
  const aveNorm = normalizeValue(ave, minAve, maxAve);
  const viewsNorm = normalizeValue(views, minViews, maxViews);

  // Pesos ajustables según estrategia
  // Estrategia: 40% Visibilidad (Reach), 30% Engagement, 20% Impacto (AVE), 10% Views
  const w1 = 0.4; // Reach - Visibilidad
  const w2 = 0.3; // Engagement - Relevancia para usuario
  const w3 = 0.2; // AVE - Impacto mediático
  const w4 = 0.1; // Views - Consumo real

  // Calcular ContentScore compuesto
  const contentScore = w1 * reachNorm + w2 * engagementNorm + w3 * aveNorm + w4 * viewsNorm;

  // LOG detallado del cálculo
  console.log(`🔍 ContentScore para "${article.title}":`);
  console.log(`   📊 Métricas crudas: Reach=${reach}, Engagement=${engagement}, AVE=${ave}, Views=${views}`);
  console.log(`   📈 Rangos globales: Reach[${minReach}-${maxReach}], Engagement[${minEngagement}-${maxEngagement}]`);
  console.log(`   🔧 Valores normalizados: Reach=${reachNorm.toFixed(3)}, Engagement=${engagementNorm.toFixed(3)}, AVE=${aveNorm.toFixed(3)}, Views=${viewsNorm.toFixed(3)}`);
  console.log(`   ⚖️ Pesos aplicados: Reach=${(w1 * reachNorm).toFixed(3)}, Engagement=${(w2 * engagementNorm).toFixed(3)}, AVE=${(w3 * aveNorm).toFixed(3)}, Views=${(w4 * viewsNorm).toFixed(3)}`);
  console.log(`   🎯 ContentScore FINAL: ${(contentScore * 100).toFixed(1)}%`);
  console.log('   ─────────────────────────────────────────────────');

  return contentScore;
}

// Función para ordenar artículos por ContentScore
function sortArticlesByContentScore(articles: MeltwaterArticle[]): MeltwaterArticle[] {
  console.log(`\n🏆 ORDENANDO ${articles.length} ARTÍCULOS POR CONTENTSCORE`);
  console.log('='.repeat(80));

  const sortedArticles = [...articles].sort((a, b) => {
    const scoreA = calculateContentScore(a, articles);
    const scoreB = calculateContentScore(b, articles);
    return scoreB - scoreA; // Orden descendente (mayor score primero)
  });

  // Mostrar ranking final
  console.log('\n📋 RANKING FINAL DE NOTICIAS:');
  console.log('='.repeat(80));
  sortedArticles.slice(0, 10).forEach((article, index) => {
    const score = calculateContentScore(article, articles);
    const position = index + 1;
    const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : ` ${position}.`;
    console.log(`${medal} ${(score * 100).toFixed(1)}% - "${article.title}"`);
    console.log(`   📊 Fuente: ${article.source?.name}, Engagement: ${article.engagementScore}`);
    console.log(`   📈 Reach: ${article.source?.metrics?.reach || 'N/A'}, AVE: ${article.source?.metrics?.ave || 'N/A'}`);
  });

  if (articles.length > 10) {
    console.log(`   ... y ${articles.length - 10} noticias más`);
  }

  console.log('='.repeat(80));
  console.log(`✅ TOP 5 NOTICIAS SELECCIONADAS PARA MOSTRAR:`);
  sortedArticles.slice(0, 5).forEach((article, index) => {
    const score = calculateContentScore(article, articles);
    console.log(`   ${index + 1}. ${(score * 100).toFixed(1)}% - "${article.title.substring(0, 60)}${article.title.length > 60 ? '...' : ''}"`);
  });
  console.log('='.repeat(80));

  return sortedArticles;
}

// Función para asignar ContentScore a cada artículo
function assignContentScores(articles: MeltwaterArticle[]): MeltwaterArticle[] {
  return articles.map(article => ({
    ...article,
    contentScore: calculateContentScore(article, articles)
  }));
}

// Función para generar un identificador único para cada artículo
function generateArticleId(article: MeltwaterArticle): string {
  // Usar URL como ID principal, si no está disponible usar título + fuente
  if (article.url && article.url !== '#') {
    return article.url;
  }
  return `${article.source?.name || 'unknown'}_${article.title}`.replace(/\s+/g, '_').toLowerCase();
}

// Función para filtrar artículos duplicados
function filterUniqueArticles(articles: MeltwaterArticle[], shownArticles: Set<string>): MeltwaterArticle[] {
  const uniqueArticles: MeltwaterArticle[] = [];
  const newShownArticles = new Set<string>();

  for (const article of articles) {
    const articleId = generateArticleId(article);

    // Si el artículo ya fue mostrado, lo saltamos
    if (shownArticles.has(articleId)) {
      console.log(`🔄 DUPLICADO SALTADO: "${article.title}" (ID: ${articleId})`);
      continue;
    }

    // Si es un artículo nuevo, lo agregamos
    if (!newShownArticles.has(articleId)) {
      uniqueArticles.push(article);
      newShownArticles.add(articleId);
      console.log(`✅ ARTÍCULO ÚNICO AGREGADO: "${article.title}" (ID: ${articleId})`);
    }
  }

  return uniqueArticles;
}

// Función para obtener artículos únicos ordenados por ContentScore
function getUniqueTopArticles(articles: MeltwaterArticle[], shownArticles: Set<string>, limit: number = 5): MeltwaterArticle[] {
  console.log(`\n🔍 FILTRANDO ARTÍCULOS ÚNICOS (${articles.length} candidatos, límite: ${limit})`);
  console.log(`📈 Artículos ya mostrados: ${shownArticles.size}`);

  // Primero ordenar por ContentScore
  const sortedArticles = sortArticlesByContentScore(articles);

  // Luego filtrar duplicados
  const uniqueArticles = filterUniqueArticles(sortedArticles, shownArticles);

  // Tomar el límite solicitado
  const result = uniqueArticles.slice(0, limit);

  console.log(`📊 RESULTADO: ${result.length} artículos únicos seleccionados de ${articles.length} candidatos`);
  console.log(`🎯 Artículos totales mostrados ahora: ${shownArticles.size}`);
  console.log(`✅ Artículos disponibles para futuras secciones: ${uniqueArticles.length - result.length}`);

  if (result.length > 0) {
    console.log('📋 TOP ARTÍCULOS SELECCIONADOS:');
    result.forEach((article, index) => {
      const score = calculateContentScore(article, articles);
      console.log(`   ${index + 1}. ${(score * 100).toFixed(1)}% - "${article.title.substring(0, 40)}..."`);
    });
  }

  console.log('─'.repeat(60));

  return assignContentScores(result);
}

// Función para calcular métricas relevantes basadas en la API de Meltwater
function calculateRelevantMetrics(articles: MeltwaterArticle[]) {
  console.log(`\n🚀 INICIANDO ANÁLISIS DE ${articles.length} ARTÍCULOS`);
  console.log(`📊 ESTRATEGIA DE SCORING: 40% Reach + 30% Engagement + 20% AVE + 10% Views`);
  console.log(`🔄 SISTEMA ANTI-DUPLICADOS: ACTIVADO`);
  console.log('─'.repeat(80));

  // Ordenar artículos por ContentScore para priorizar los más importantes
  const sortedArticles = sortArticlesByContentScore(articles);

  // 1. ENGAGEMENT TOTAL - La métrica más importante para medir interacción
  const totalEngagement = articles.reduce((sum, article) => sum + (article.engagementScore || 0), 0);

  // 2. ALCANCE TOTAL - Cuántas personas ven el contenido
  const totalReach = articles.reduce((sum, article) => {
    // Usar el reach del source si está disponible, sino aproximar con engagement
    const sourceReach = article.source?.metrics?.reach || 0;
    return sum + (sourceReach > 0 ? sourceReach : (article.engagementScore || 0) * 10);
  }, 0);

  // 3. NÚMERO DE ARTÍCULOS - Cantidad total de contenido monitoreado
  const totalArticles = articles.length;

  // 4. SENTIMIENTO PROMEDIO - Análisis de opinión pública
  const sentimentData = articles.reduce((acc, article) => {
    const sentiment = article.enrichments?.sentiment;
    if (sentiment) {
      acc.count++;
      acc.score += sentiment === 'positive' ? 1 : sentiment === 'negative' ? -1 : 0;
    }
    return acc;
  }, { count: 0, score: 0 });

  const avgSentiment = sentimentData.count > 0 ? (sentimentData.score / sentimentData.count) : 0;

  // 5. FUENTES MONITOREADAS - Diversidad de cobertura
  const uniqueSources = new Set(articles.map(article => article.source.name)).size;

  // 6. TEMAS PRINCIPALES - Keywords más frecuentes
  const topKeywords = articles
    .flatMap(article => article.enrichments?.keyphrases || [])
    .reduce((acc, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const mostFrequentKeyword = Object.keys(topKeywords).reduce((a, b) =>
    topKeywords[a] > topKeywords[b] ? a : b, 'Sin datos'
  );

  return {
    totalEngagement: Math.max(totalEngagement, 0),
    totalReach: Math.max(totalReach, 0),
    totalArticles: Math.max(totalArticles, 0),
    avgSentiment,
    uniqueSources: Math.max(uniqueSources, 0),
    topTopic: mostFrequentKeyword,
    sortedArticles: sortedArticles.slice(0, 5) // Top 5 artículos por ContentScore
  };
}

// Funciones auxiliares para formatear métricas
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function getSentimentColor(sentiment: number): string {
  if (sentiment > 0.1) return 'text-green-400';
  if (sentiment < -0.1) return 'text-red-400';
  return 'text-yellow-400';
}

function getSentimentLabel(sentiment: number): string {
  if (sentiment > 0.1) return 'Positivo';
  if (sentiment < -0.1) return 'Negativo';
  return 'Neutral';
}

// Función para obtener el país desde la configuración
async function getCountryName(articles: MeltwaterArticle[] = []): Promise<string> {
  try {
    const response = await axios.get("http://localhost:3001/api/defaultConfig");
    if (response.data.success && response.data.config.defaultCountrySearchId) {
      // Intentar inferir el país desde los artículos si están disponibles
      if (articles.length > 0) {
        const countries = articles
          .map(article => article.location?.country_code)
          .filter(code => code && code !== 'zz') // Filtrar códigos válidos
          .reduce((acc, code) => {
            acc[code] = (acc[code] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

        const mostCommonCountry = Object.keys(countries).reduce((a, b) =>
          countries[a] > countries[b] ? a : b, ''
        );

        if (mostCommonCountry) {
          // Mapear códigos de país a nombres
          const countryNames: Record<string, string> = {
            'es': 'España',
            'mx': 'México',
            'ar': 'Argentina',
            'co': 'Colombia',
            'ec': 'Ecuador',
            'pe': 'Perú',
            'cl': 'Chile',
            'uy': 'Uruguay',
            'py': 'Paraguay',
            'bo': 'Bolivia'
          };
          return countryNames[mostCommonCountry] || "País Hispanoamericano";
        }
      }
      return "País Configurado";
    }
  } catch (error) {
    console.error("Error obteniendo configuración del país:", error);
  }
  return "País"; // Valor por defecto
}

export default function Index() {
  const [paisArticles, setPaisArticles] = useState<MeltwaterArticle[]>([]);
  const [sectorArticles, setSectorArticles] = useState<MeltwaterArticle[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalEngagement: 0,
    totalReach: 0,
    totalArticles: 0,
    avgSentiment: 0,
    uniqueSources: 0,
    topTopic: 'Sin datos'
  });
  const [countryName, setCountryName] = useState("País");
  const [shownArticles, setShownArticles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true);
        const urlParams = new URLSearchParams(window.location.search);
        const emailParam = urlParams.get("email");
        const countryId = urlParams.get("countryId");
        const sectorId = urlParams.get("sectorId");

        // Si hay parámetros de URL, usarlos directamente
        if (countryId || sectorId) {
          const response = await axios.post<NewsResponse>("http://localhost:3001/api/news/personalized", {
            countryId,
            sectorId
          });

          if (response.data.success) {
            const sectorData = adaptResults(response.data.sector);
            const paisData = adaptResults(response.data.pais);
            setSectorArticles(sectorData);
            setPaisArticles(paisData);

            // Resetear artículos mostrados para nueva carga
            setShownArticles(new Set());

            // Calcular métricas relevantes basadas en todos los artículos
            const allArticles = [...sectorData, ...paisData];
            const calculatedMetrics = calculateRelevantMetrics(allArticles);
            setMetrics(calculatedMetrics);

            // Obtener nombre del país
            const country = await getCountryName([...sectorData, ...paisData]);
            setCountryName(country);
          } else {
            setError(true);
          }
          return;
        }

        // Si hay email en URL o localStorage, usarlo
        if (emailParam) localStorage.setItem("userEmail", emailParam);
        const email = emailParam || localStorage.getItem("userEmail");
        
        if (email) {
          const response = await axios.post<NewsResponse>("http://localhost:3001/api/news/personalized", { email });
          if (response.data.success) {
            const sectorData = adaptResults(response.data.sector);
            const paisData = adaptResults(response.data.pais);
            setSectorArticles(sectorData);
            setPaisArticles(paisData);

            // Resetear artículos mostrados para nueva carga
            setShownArticles(new Set());

            // Calcular métricas relevantes basadas en todos los artículos
            const allArticles = [...sectorData, ...paisData];
            const calculatedMetrics = calculateRelevantMetrics(allArticles);
            setMetrics(calculatedMetrics);

            // Obtener nombre del país
            const country = await getCountryName([...sectorData, ...paisData]);
            setCountryName(country);
          } else {
            setError(true);
          }
          return;
        }

        // Si no hay nada, cargar noticias por defecto
        const response = await axios.post<NewsResponse>("http://localhost:3001/api/news/personalized", { 
          email: "default" 
        });
        
        if (response.data.success) {
          const sectorData = adaptResults(response.data.sector);
          const paisData = adaptResults(response.data.pais);
          setSectorArticles(sectorData);
          setPaisArticles(paisData);

          // Calcular métricas relevantes basadas en todos los artículos
          const allArticles = [...sectorData, ...paisData];
          const calculatedMetrics = calculateRelevantMetrics(allArticles);
          setMetrics(calculatedMetrics);

          // Obtener nombre del país
          const country = await getCountryName();
          setCountryName(country);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error cargando noticias:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen tech-background network-pattern">
        {/* Partículas flotantes */}
        <div className="particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>

        {/* Header tecnológico */}
        <header className="tech-header">
          <div className="container-spacing section-spacing relative z-10">
            <div className="text-center">
              <h1 className="tech-title text-5xl mb-4">
                NEWSROOM
              </h1>
              <p className="tech-subtitle text-xl mb-4">
                Media & Social Dynamics Suite
              </p>
            </div>
          </div>
        </header>

        <main className="container-spacing section-spacing">
          {/* Skeleton para Sector */}
          <SectionSkeleton 
            title="Noticias del Sector"
            showDescription={true}
            articleCount={6}
          />

          {/* Skeleton para País */}
          <SectionSkeleton 
            title="Noticias del País"
            showDescription={true}
            articleCount={6}
          />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen tech-background network-pattern flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6 relative z-10">
          <div className="w-16 h-16 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">Error al cargar noticias</h2>
          <p className="text-gray-300 mb-6">Intenta recargar la página o verifica tu conexión a internet</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }
    
  if (!paisArticles.length && !sectorArticles.length)
    return (
      <div className="min-h-screen tech-background network-pattern flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6 relative z-10">
          <div className="w-16 h-16 bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">No hay noticias disponibles</h2>
          <p className="text-gray-300">En este momento no hay contenido disponible para mostrar</p>
        </div>
      </div>
    );

  const paisEngagement = paisArticles.filter((a) => a.engagementScore !== undefined);
  const paisEcoSocial = paisArticles.filter((a) => a.socialEchoScore !== undefined);

  return (
    <div className="min-h-screen tech-background network-pattern">
      {/* Partículas flotantes */}
      <div className="particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      {/* Header Dashboard */}
      <header className="dashboard-header">
        <div className="dashboard-container">
          <h1 className="dashboard-title">
            NEWSROOM
          </h1>
          <p className="dashboard-subtitle">
            Media & Social Dynamics Suite
          </p>
        </div>
      </header>

      <main className="dashboard-container">
        {/* Sección de Métricas Estratégicas */}
        <div className="metrics-section">
          <h2 className="metrics-title">Métricas Estratégicas de Contenido</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="metric-value">{formatNumber(metrics.totalEngagement)}</div>
              <div className="metric-label">Engagement Total</div>
              <div className="metric-subtitle">Interacciones totales</div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
              </div>
              <div className="metric-value">{formatNumber(metrics.totalReach)}</div>
              <div className="metric-label">Alcance Total</div>
              <div className="metric-subtitle">Personas alcanzadas</div>
            </div>
           {/*  <div className="metric-card">
              <div className="metric-icon">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="metric-value">{formatNumber(metrics.totalArticles)}</div>
              <div className="metric-label">Artículos</div>
              <div className="metric-subtitle">Contenido monitoreado</div>
            </div> */}
            <div className="metric-card">
              <div className="metric-icon">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className={`metric-value ${getSentimentColor(metrics.avgSentiment)}`}>
                {getSentimentLabel(metrics.avgSentiment)}
              </div>
              <div className="metric-label">Sentimiento</div>
              <div className="metric-subtitle">Opinión pública</div>
            </div>

            {/* FUENTES ACTIVAS */}
            <div className="metric-card">
              <div className="metric-icon">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <div className="metric-value">{formatNumber(metrics.uniqueSources)}</div>
              <div className="metric-label">Fuentes Activas</div>
              <div className="metric-subtitle">Medios monitoreados</div>
            </div>

            {/* TEMA PRINCIPAL */}
            <div className="metric-card">
              <div className="metric-icon">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div className="metric-value text-sm leading-tight">
                {metrics.topTopic.length > 15 ? `${metrics.topTopic.substring(0, 15)}...` : metrics.topTopic}
              </div>
              <div className="metric-label">Tema Principal</div>
              <div className="metric-subtitle">Más mencionado</div>
            </div>
          </div>
        </div>
        {/* TOP 5 Temas - Sector */}
        {sectorArticles.length > 0 && (
          <div className="news-section">
            <div className="section-header-dashboard">
              <div className="section-icon-dashboard">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="section-title-dashboard">TOP 5 Contenido - Sector</h2>
                <p className="section-description">
                  Las noticias más relevantes ordenadas por ContentScore (alcance, engagement, impacto)
                </p>
              </div>
            </div>
            <NewsList articles={getUniqueTopArticles(sectorArticles, shownArticles, 5)} title="Noticias Sectoriales" />
          </div>
        )}

        {/* TOP 5 Contenido - País */}
        {paisArticles.length > 0 && (
          <div className="news-section">
            <div className="section-header-dashboard">
              <div className="section-icon-dashboard">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="section-title-dashboard">TOP 5 Contenido - {countryName}</h2>
                <p className="section-description">
                  Las noticias más impactantes ordenadas por ContentScore (alcance, engagement, relevancia)
                </p>
              </div>
            </div>
            <NewsList articles={getUniqueTopArticles(paisArticles, shownArticles, 5)} title="Noticias del País" />
            </div>
          )}

        {/* Contenido Más Relevante */}
        {(paisEngagement.length > 0 || paisEcoSocial.length > 0) && (
          <div className="news-section">
            <div className="section-header-dashboard">
              <div className="section-icon-dashboard">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            <div>
                <h2 className="section-title-dashboard">Contenido Más Relevante</h2>
                <p className="section-description">
                  Las noticias con mayor impacto y engagement, ordenadas por ContentScore para identificar oportunidades de HOT NEWS
                </p>
              </div>
            </div>
            <div className="news-grid-dashboard">
              {getUniqueTopArticles([...paisEngagement, ...paisEcoSocial], shownArticles, 6).map((article, index) => (
                <a
                  key={`${article.url}-${index}`}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="news-card-dashboard"
                >
                  <img
                    src={article.urlToImage || '/placeholder.svg'}
                    alt={article.title}
                    className="news-image-dashboard"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  <div className="news-content-dashboard">
                    <h3 className="news-title-dashboard">{article.title}</h3>
                    <p className="news-description-dashboard">{article.description}</p>
                    <div className="news-meta-dashboard">
                      <span className="news-source-dashboard">{article.source.name}</span>
                      <span>{new Date(article.publishedAt).toLocaleDateString('es-ES')}</span>
                    </div>
                    {index < 2 && <span className="news-tag">Actualidad</span>}
                  </div>
                </a>
              ))}
            </div>
            </div>
          )}
      </main>
    </div>
  );
}
