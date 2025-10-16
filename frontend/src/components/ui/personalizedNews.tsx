import { useEffect, useState } from "react";
import axios from "axios";
import NewsList from "./newsList";
import SectionSkeleton from "./SectionSkeleton";
import { buildApiUrl, API_CONFIG } from "../../config/api";
import { usePagination } from "../../hooks/usePagination";
import LoadMoreButton from "./LoadMoreButton";

interface RawMeltwaterDocument {
  content: string | { title?: string; summary?: string; image?: string };
  url: string;
  published_date: string;
  source?: { name?: string };
  metrics?: {
    engagement?: { total?: number | null };
  };
}

interface Article {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: { name: string };
  contentScore?: number;
}

interface PersonalizedNewsResponse {
  success: boolean;
  pais: RawMeltwaterDocument[];
  sector: RawMeltwaterDocument[];
}

// Función simplificada para calcular ContentScore
function calculateSimpleContentScore(article: Article, allArticles: Article[]): number {
  const engagement = article.source?.name ? Math.random() * 100 : 0; // Simulación simple
  const reach = engagement * 5;
  const views = engagement * 2;

  // Bonus para fuentes de noticias tradicionales reconocidas
  const sourceName = article.source?.name?.toLowerCase() || '';
  const traditionalNewsSources = [
    'bbc', 'cnn', 'reuters', 'ap', 'associated press', 'bloomberg', 'wall street journal', 'new york times',
    'washington post', 'guardian', 'telegraph', 'independent', 'times', 'financial times', 'economist',
    'el país', 'el mundo', 'abc', 'la vanguardia', 'el periódico', 'el confidencial', 'público', 'eldiario',
    'infolibre', 'el diario', '20minutos', 'el correo', 'la voz de galicia', 'el norte de castilla',
    'la nueva españa', 'diario de sevilla', 'hoy', 'extremadura', 'la opinión', 'la verdad', 'la provincia',
    'diario de mallorca', 'el día', 'canarias7', 'la opinión de murcia', 'la voz de cádiz', 'diario de cádiz',
    'ideal', 'granada hoy', 'málaga hoy', 'sevilla', 'cordópolis', 'europapress', 'efe', 'agencia efe'
  ];
  
  const isTraditionalSource = traditionalNewsSources.some(source => 
    sourceName.includes(source) || source.includes(sourceName)
  );
  
  // Bonus más inclusivo para fuentes de noticias tradicionales
  const sourceBonus = isTraditionalSource ? 15 : 5; // Reducir bonus pero dar algo a todas las fuentes

  // Factor de frescura: artículos más recientes tienen bonus
  const articleDate = new Date(article.publishedAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60);
  const freshnessBonus = Math.max(0, 10 * (1 - hoursDiff / 168)); // Bonus decreciente en 7 días

  return (reach * 0.30) + (engagement * 0.30) + (views * 0.20) + (sourceBonus * 0.10) + freshnessBonus;
}

// Función para ordenar artículos por ContentScore
function sortArticlesByScore(articles: Article[]): Article[] {
  return [...articles].map(article => ({
    ...article,
    contentScore: calculateSimpleContentScore(article, articles)
  })).sort((a, b) => (b.contentScore || 0) - (a.contentScore || 0));
}

// Función para generar ID único de artículo
function generateArticleId(article: Article): string {
  if (article.url && article.url !== '#') {
    return article.url;
  }
  return `${article.source?.name || 'unknown'}_${article.title}`.replace(/\s+/g, '_').toLowerCase();
}

// Función para filtrar artículos únicos
function filterUniqueArticles(articles: Article[], shownArticles: Set<string>): Article[] {
  const uniqueArticles: Article[] = [];

  for (const article of articles) {
    const articleId = generateArticleId(article);

    if (!shownArticles.has(articleId)) {
      uniqueArticles.push(article);
      shownArticles.add(articleId);
    }
  }

  return uniqueArticles;
}

// Función para obtener artículos únicos ordenados por ContentScore
function getUniqueTopArticles(articles: Article[], shownArticles: Set<string>, limit: number = 500): Article[] {
  // Primero ordenar por ContentScore
  const sortedArticles = sortArticlesByScore(articles);

  // Luego filtrar duplicados
  const uniqueArticles = filterUniqueArticles(sortedArticles, shownArticles);

  // Tomar el límite solicitado
  return uniqueArticles.slice(0, limit);
}

// Función para detectar si es red social
function isSocialMedia(sourceName: string): boolean {
  const socialMediaSources = [
    'facebook', 'twitter', 'instagram', 'tiktok', 'youtube', 'linkedin',
    'snapchat', 'pinterest', 'reddit', 'telegram', 'whatsapp', 'discord',
    'twitch', 'vimeo', 'flickr', 'tumblr', 'medium', 'quora'
  ];
  
  const lowerSource = sourceName.toLowerCase();
  return socialMediaSources.some(social => lowerSource.includes(social));
}

// Función para detectar medios tradicionales
function isTraditionalMedia(sourceName: string): boolean {
  const traditionalSources = [
    'bbc', 'cnn', 'reuters', 'ap', 'associated press', 'bloomberg', 'wall street journal', 
    'new york times', 'washington post', 'guardian', 'telegraph', 'independent', 'times', 
    'financial times', 'economist', 'el país', 'el mundo', 'abc', 'la vanguardia', 
    'el periódico', 'el confidencial', 'público', 'eldiario', 'infolibre', 'el diario', 
    '20minutos', 'el correo', 'la voz de galicia', 'el norte de castilla', 'la nueva españa', 
    'diario de sevilla', 'hoy', 'extremadura', 'la opinión', 'la verdad', 'la provincia', 
    'diario de mallorca', 'el día', 'canarias7', 'la opinión de murcia', 'la voz de cádiz', 
    'diario de cádiz', 'ideal', 'granada hoy', 'málaga hoy', 'sevilla', 'cordópolis', 
    'europapress', 'efe', 'agencia efe', 'monte carlo', 'el observador', 'el país', 
    'brecha', 'la diaria', 'busqueda', 'el espectador', 'ovación', 'el telégrafo'
  ];
  
  const lowerSource = sourceName.toLowerCase();
  return traditionalSources.some(traditional => lowerSource.includes(traditional));
}

// Convierte los documentos raw a objetos Article con filtrado de redes sociales
function adaptResults(raw: RawMeltwaterDocument[]): Article[] {
  return raw
    .map((doc) => {
      let title = "Sin título";
      if (typeof doc.content === "object" && doc.content) title = doc.content.title ?? title;

      let description = "";
      if (typeof doc.content === "string") description = doc.content;
      else if (typeof doc.content === "object" && doc.content) description = doc.content.summary || "";

      return {
        title,
        url: doc.url,
        urlToImage: typeof doc.content === "object" && doc.content?.image ? doc.content.image : "/placeholder.svg",
        description,
        publishedAt: doc.published_date,
        source: { name: doc.source?.name || "Fuente desconocida" },
      };
    })
    .filter(article => {
      const sourceName = article.source?.name || '';
      const isSocial = isSocialMedia(sourceName);
      const isTraditional = isTraditionalMedia(sourceName);
      
      // Incluir medios tradicionales Y redes sociales (menos restrictivo)
      const shouldInclude = isTraditional || !isSocial;
      
      if (isSocial && !isTraditional) {
        console.log(`  ⚠️ Red social incluida: ${article.title} | Fuente: ${article.source?.name}`);
      } else if (isTraditional) {
        console.log(`  ✅ Medio tradicional: ${article.title} | Fuente: ${article.source?.name}`);
      } else {
        console.log(`  ✅ Fuente incluida: ${article.title} | Fuente: ${article.source?.name}`);
      }
      
      return shouldInclude;
    });
}

export default function PersonalizedNews() {
  const [ecosocialArticles, setEcosocialArticles] = useState<Article[]>([]);
  const [engagementArticles, setEngagementArticles] = useState<Article[]>([]);
  const [sectorArticles, setSectorArticles] = useState<Article[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shownArticles, setShownArticles] = useState<Set<string>>(new Set());
  
  // Sets separados para cada sección
  const [shownSectorArticles, setShownSectorArticles] = useState<Set<string>>(new Set());
  const [shownEcosocialArticles, setShownEcosocialArticles] = useState<Set<string>>(new Set());
  const [shownEngagementArticles, setShownEngagementArticles] = useState<Set<string>>(new Set());

  // Paginación para cada sección (distribución proporcional para 500 total)

  const ecosocialPagination = usePagination({ initialPageSize: 100, maxPageSize: 500 });
  const engagementPagination = usePagination({ initialPageSize: 100, maxPageSize: 500 });
  const sectorPagination = usePagination({ initialPageSize: 100, maxPageSize: 500 });

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (!email) return;

    const fetchNews = async () => {
      try {
        const res = await axios.post<PersonalizedNewsResponse>(
          buildApiUrl(API_CONFIG.ENDPOINTS.NEWS_PERSONALIZED),
          { email }
        );

        // Mostrar todas las noticias del país en una sola sección
        const paisRaw = res.data.pais || [];
        
        // Dividir en dos grupos: mitad para ecosocial, mitad para engagement
        const mitad = Math.ceil(paisRaw.length / 2);

        // Resetear artículos mostrados para nueva carga
        setShownArticles(new Set());
        setShownSectorArticles(new Set());
        setShownEcosocialArticles(new Set());
        setShownEngagementArticles(new Set());
        
        // Resetear paginación
        ecosocialPagination.resetPagination();
        engagementPagination.resetPagination();
        sectorPagination.resetPagination();
        
        // Debug logging
        const sectorFiltered = adaptResults(res.data.sector || []);
        const paisFiltered = adaptResults(paisRaw);
        const ecosocialFiltered = paisFiltered.slice(0, mitad);
        const engagementFiltered = paisFiltered.slice(mitad);
        
        console.log('📊 Artículos cargados (DESPUÉS del filtrado):');
        console.log(`  🔹 Sector: ${sectorFiltered.length} artículos`);
        console.log(`  🔹 País total: ${paisFiltered.length} artículos`);
        console.log(`  🔹 Ecosocial: ${ecosocialFiltered.length} artículos`);
        console.log(`  🔹 Engagement: ${engagementFiltered.length} artículos`);
        console.log(`  🔹 Total: ${sectorFiltered.length + ecosocialFiltered.length + engagementFiltered.length} artículos`);
        
        // Actualizar con artículos filtrados
        setEcosocialArticles(ecosocialFiltered);
        setEngagementArticles(engagementFiltered);
        setSectorArticles(sectorFiltered);
      } catch (err) {
        console.error("Error cargando noticias:", err);
        setError(true);
      }
    };

    fetchNews();
  }, []);

  if (error)
    return (
      <div className="min-h-screen tech-background network-pattern flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6 relative z-10">
          <div className="w-16 h-16 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">Error al cargar noticias</h2>
          <p className="text-gray-300">Hubo un problema al cargar tu contenido personalizado</p>
        </div>
      </div>
    );

  if (!ecosocialArticles.length && !engagementArticles.length && !sectorArticles.length)
    return (
      <div className="min-h-screen tech-background network-pattern flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6 relative z-10">
          <div className="w-16 h-16 bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">No hay noticias disponibles</h2>
          <p className="text-gray-300">En este momento no hay contenido personalizado para mostrar</p>
        </div>
      </div>
    );

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
              Contenido Personalizado
            </p>
            <div className="text-sm text-gray-400 font-mono">
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="container-spacing section-spacing space-y-16">
        {/* Sección de Sector */}
        {sectorArticles.length > 0 && (
          <section>
            <div className="text-center mb-12 relative z-10">
              <div className="inline-flex items-center bg-black/20 backdrop-blur-sm border border-orange-500/30 rounded-lg px-6 py-3 mb-6">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">NOTICIAS DEL SECTOR</h2>
              </div>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Información especializada y análisis del sector empresarial
              </p>
            </div>
            <NewsList articles={getUniqueTopArticles(sectorPagination.getPaginatedItems(sectorArticles), shownSectorArticles, 50)} title="Noticias Sectoriales" />
            <LoadMoreButton 
              onClick={() => sectorPagination.increasePageSize()}
              loading={loading}
              hasMore={sectorPagination.hasMore(sectorArticles)}
            />
          </section>
        )}

        {/* Sección de País - Ecosocial */}
        {ecosocialArticles.length > 0 && (
          <section>
            <div className="text-center mb-12 relative z-10">
              <div className="inline-flex items-center bg-black/20 backdrop-blur-sm border border-orange-500/30 rounded-lg px-6 py-3 mb-6">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">IMPACTO SOCIAL</h2>
              </div>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Análisis y reportes de la situación económica y empresarial nacional
              </p>
            </div>
            <NewsList articles={getUniqueTopArticles(ecosocialPagination.getPaginatedItems(ecosocialArticles), shownEcosocialArticles, 50)} title="Impacto Social" />
            <LoadMoreButton 
              onClick={() => ecosocialPagination.increasePageSize()}
              loading={loading}
              hasMore={ecosocialPagination.hasMore(ecosocialArticles)}
            />
          </section>
        )}

        {/* Sección de País - Engagement */}
        {engagementArticles.length > 0 && (
          <section>
            <div className="text-center mb-12 relative z-10">
              <div className="inline-flex items-center bg-black/20 backdrop-blur-sm border border-orange-500/30 rounded-lg px-6 py-3 mb-6">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">ALTO ENGAGEMENT</h2>
              </div>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Contenido con mayor impacto y participación de la audiencia
              </p>
            </div>
            <NewsList articles={getUniqueTopArticles(engagementPagination.getPaginatedItems(engagementArticles), shownEngagementArticles, 50)} title="Alto Engagement" />
            <LoadMoreButton 
              onClick={() => engagementPagination.increasePageSize()}
              loading={loading}
              hasMore={engagementPagination.hasMore(engagementArticles)}
            />
          </section>
        )}
      </main>
    </div>
  );
}
