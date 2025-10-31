import { useEffect, useState } from "react";
import axios from "axios";
import { postWithRetry } from "../utils/axiosWithRetry";
import NewsList from "../components/ui/newsList";
import WordCloud, { WordFrequency } from "../components/ui/WordCloud";
import SectionSkeleton from "../components/ui/SectionSkeleton";
import { buildApiUrl, API_CONFIG } from "../config/api";

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
  contentScore?: number;
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

function adaptResults(
  raw: any[],
  includeSocial: boolean = false
): MeltwaterArticle[] {
  // FILTRAR POR TIPO DE CONTENIDO - Incluir redes sociales si se solicita
  const filteredRaw = raw.filter((doc) => {
    const contentType = doc.content_type;
    const isNews = contentType === "news";
    const isSocialPost = contentType === "social post";
    const isNotComment = contentType !== "comment" && contentType !== "reply";
    const isNotBlog = contentType !== "blog";
    
    // Si includeSocial es true, incluir posts sociales
    const shouldInclude =
      isNews ||
      (isNotComment && (includeSocial ? true : !isSocialPost) && isNotBlog);
    
    return shouldInclude;
  });
  
  console.log(
    `📊 Filtrado por tipo: ${raw.length} → ${filteredRaw.length} artículos`
  );
  
  const adapted = filteredRaw.map((doc, index) => {
    // Generar título basado en el tipo de contenido
    const isSocial = doc.content_type === "social post";
    const originalSocialTitle = isSocial 
      ? doc.content?.title ||
        doc.content?.text ||
        doc.content?.message ||
        doc.content?.caption ||
        doc.content?.headline ||
        doc.title
      : undefined;
    let title = originalSocialTitle || doc.content?.title;
    if (!title) {
      if (isSocial) {
        // Para posts de redes sociales, usar keyphrases o un título genérico
        if (
          doc.enrichments?.keyphrases &&
          doc.enrichments.keyphrases.length > 0
        ) {
          title = `Post sobre: ${doc.enrichments.keyphrases
            .slice(0, 2)
            .join(", ")}`;
        } else {
          title = `Post de ${doc.source?.name || "red social"}`;
        }
      } else {
        title = "Sin título";
      }
    }
    // Normalizar longitud para UI
    if (title && typeof title === "string") {
      title = title.replace(/\s+/g, " ").trim();
      if (title.length > 140) title = title.slice(0, 137) + "…";
    }

    // Generar descripción basada en el tipo de contenido
    let description =
      doc.content?.opening_text ||
      doc.content?.description ||
      (isSocial
        ? doc.content?.text || doc.content?.message || doc.content?.caption
        : undefined);
    if (!description) {
      if (doc.content_type === "social post") {
        // Para posts de redes sociales, usar keyphrases como descripción
        if (
          doc.enrichments?.keyphrases &&
          doc.enrichments.keyphrases.length > 0
        ) {
          description = `Temas: ${doc.enrichments.keyphrases.join(", ")}`;
        } else {
          description = `Contenido de ${doc.source?.name || "red social"}`;
        }
      } else {
        description = "";
      }
    }
    if (description && typeof description === "string") {
      description = description.replace(/\s+/g, " ").trim();
      if (description.length > 200)
        description = description.slice(0, 197) + "…";
    }

    // Generar URL si no existe (para posts de redes sociales)
    let url = doc.url;
    if (!url && doc.content_type === "social post") {
      // Crear una URL ficticia basada en el external_id o id
      const postId = doc.external_id || doc.id;
      if (postId) {
        url = `https://twitter.com/i/web/status/${postId}`;
      } else {
        url = "#";
      }
    }

    const adaptedDoc = {
      title,
      url: url || "#",
      urlToImage: doc.content?.image || "/placeholder.svg",
      description,
      publishedAt: doc.published_date,
      source: {
        name: doc.source?.name || "Fuente desconocida",
        metrics: doc.source?.metrics
          ? {
          reach: doc.source.metrics.reach || 0,
              ave: doc.source.metrics.ave || 0,
            }
          : undefined,
      },
      engagementScore:
        doc.metrics?.engagement?.total ??
        (doc.metrics?.engagement
          ? (doc.metrics.engagement.likes || 0) +
          (doc.metrics.engagement.replies || 0) + 
          (doc.metrics.engagement.reposts || 0) + 
          (doc.metrics.engagement.shares || 0) + 
          (doc.metrics.engagement.comments || 0) + 
          (doc.metrics.engagement.quotes || 0) + 
            (doc.metrics.engagement.reactions || 0)
          : 0),
      socialEchoScore:
        doc.metrics?.social_echo?.total ??
        (doc.metrics?.social_echo
          ? (doc.metrics.social_echo.x || 0) +
          (doc.metrics.social_echo.facebook || 0) + 
          (doc.metrics.social_echo.reddit || 0) + 
          (doc.metrics.social_echo.instagram || 0) + 
          (doc.metrics.social_echo.linkedin || 0) + 
          (doc.metrics.social_echo.tiktok || 0) + 
          (doc.metrics.social_echo.youtube || 0) + 
          (doc.metrics.social_echo.threads || 0) + 
          (doc.metrics.social_echo.snapchat || 0) + 
          (doc.metrics.social_echo.pinterest || 0) + 
          (doc.metrics.social_echo.telegram || 0) + 
          (doc.metrics.social_echo.whatsapp || 0) + 
          (doc.metrics.social_echo.discord || 0) + 
          (doc.metrics.social_echo.twitch || 0) + 
          (doc.metrics.social_echo.vimeo || 0) + 
          (doc.metrics.social_echo.flickr || 0) + 
          (doc.metrics.social_echo.tumblr || 0) + 
          (doc.metrics.social_echo.medium || 0) + 
            (doc.metrics.social_echo.quora || 0)
          : 0),
      location: doc.location
        ? {
            country_code: doc.location.country_code,
          }
        : undefined,
      enrichments: doc.enrichments
        ? {
            sentiment: doc.enrichments.sentiment || "neutral",
            keyphrases: doc.enrichments.keyphrases || [],
          }
        : undefined,
      metrics: doc.metrics
        ? {
            views: doc.metrics.views || 0,
          }
        : undefined,
    };
    
    // Documento adaptado
    
    return adaptedDoc;
  });
  
  return adapted;
}

// Funciones auxiliares para normalización
function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 0.5; // Evitar división por cero
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// Función para calcular el ContentScore compuesto
function calculateContentScore(article: MeltwaterArticle, allArticles: MeltwaterArticle[]): number {
  // FILTRO: Excluir redes sociales del ContentScore
  const sourceName = article.source?.name?.toLowerCase() || '';
  const raw: any = article as any;
  const contentType = raw?.content_type;
  
  // Excluir por content_type primero (más confiable)
  if (contentType === 'social post' || contentType === 'social') {
    return 0; // Score 0 para redes sociales
  }
  
  // Excluir redes sociales por nombre de fuente
  const excludedSocialSources = [
    'facebook', 'twitter', 'x', 'reddit', 'twitch', 'youtube', 'instagram', 'tiktok', 'threads', 'linkedin', 'snapchat', 'pinterest', 'telegram', 'whatsapp', 'discord', 'vimeo', 'flickr', 'tumblr', 'medium', 'quora',
    'mastodon', 'bluesky', 'truth social', 'parler', 'gab', 'rumble', 'odysee', 'bitchute', 'dailymotion', 'vkontakte', 'vk', 'odnoklassniki', 'ok', 'weibo', 'wechat', 'qq', 'line', 'kakao', 'naver',
    'mixi', 'ameba', 'hatena', 'note', 'qiita', 'zenn', 'dev.to', 'hashnode', 'substack', 'ghost', 'wordpress', 'blogger', 'livejournal', 'xanga', 'myspace', 'friendster', 'hi5', 'bebo', 'orkut',
    'spotify', 'apple music', 'soundcloud', 'bandcamp', 'mixcloud', 'audiomack', 'reverbnation', 'last.fm', 'pandora', 'iheartradio', 'tunein', 'radio.com', 'radio.net', 'radio.garden',
    'behance', 'dribbble', 'deviantart', 'artstation', '500px', 'unsplash', 'pexels', 'pixabay', 'shutterstock', 'getty', 'istock', 'hacker news', 'slashdot', 'digg', 'stumbleupon', 'delicious',
    'signal', 'wickr', 'threema', 'element', 'matrix', 'riot', 'slack', 'teams', 'zoom', 'skype', 'hangouts', 'meet', 'duo', 'wix', 'squarespace', 'weebly', 'jekyll', 'hugo', 'gatsby', 'next.js', 'nuxt', 'svelte', 'vue', 'react', 'angular',
    'etsy', 'ebay', 'amazon', 'mercado libre', 'mercadolibre', 'olx', 'gumtree', 'craigslist', 'marketplace', 'tinder', 'bumble', 'hinge', 'match', 'okcupid', 'plenty of fish', 'pof', 'zoosk', 'eharmony', 'elitesingles', 'silversingles', 'ourtime', 'seniorpeoplemeet',
    'steam', 'epic games', 'origin', 'uplay', 'gog', 'itch.io', 'gamejolt', 'indiedb', 'roblox', 'minecraft', 'fortnite', 'pubg', 'apex legends', 'valorant', 'league of legends', 'dota', 'csgo', 'overwatch', 'world of warcraft', 'final fantasy', 'call of duty',
    'coursera', 'udemy', 'edx', 'khan academy', 'skillshare', 'masterclass', 'linkedin learning', 'pluralsight', 'codecademy', 'freecodecamp', 'the odin project', 'scrimba', 'egghead', 'indeed', 'glassdoor', 'monster', 'careerbuilder', 'ziprecruiter', 'angel.co', 'crunchbase', 'pitchbook', 'cb insights', 'techcrunch', 'venturebeat', 'wired',
    'kickstarter', 'indiegogo', 'gofundme', 'patreon', 'ko-fi', 'buymeacoffee', 'paypal', 'venmo', 'cashapp', 'zelle', 'apple pay', 'google pay', 'samsung pay', 'bitcoin', 'ethereum', 'crypto', 'cryptocurrency', 'blockchain', 'nft', 'nfts', 'opensea', 'foundation', 'superrare', 'rarible', 'nifty gateway', 'makersplace',
    'strava', 'myfitnesspal', 'fitbit', 'apple watch', 'samsung health', 'google fit', 'nike run club', 'adidas running', 'under armour', 'garmin', 'polar', 'suunto', 'tripadvisor', 'booking', 'airbnb', 'vrbo', 'expedia', 'priceline', 'kayak', 'skyscanner', 'google flights', 'momondo', 'cheaptickets', 'hotels.com', 'marriott', 'hilton',
    'yelp', 'zomato', 'swiggy', 'ubereats', 'doordash', 'grubhub', 'postmates', 'caviar', 'seamless', 'chownow', 'toast', 'square', 'clover', 'shopify', 'woocommerce'
  ];
  
  const isExcludedSocial = excludedSocialSources.some(excluded => sourceName.includes(excluded));
  if (isExcludedSocial) {
    return 0; // Score 0 para redes sociales
  }
  
  // Extraer métricas del artículo (solo para medios tradicionales)
  const reach = article.source?.metrics?.reach || 0;
  const engagement = article.engagementScore || 0;
  const ave = article.source?.metrics?.ave || 0;
  const views = article.metrics?.views || engagement * 1.5; // Usar views reales si están disponibles

  // Calcular valores mínimos y máximos SOLO de medios tradicionales para normalización
  const traditionalArticles = allArticles.filter(a => {
    const aSourceName = a.source?.name?.toLowerCase() || '';
    const aRaw: any = a as any;
    const aContentType = aRaw?.content_type;
    
    // Excluir por content_type
    if (aContentType === 'social post' || aContentType === 'social') {
      return false;
    }
    
    // Excluir por nombre de fuente
    const aIsExcludedSocial = excludedSocialSources.some(excluded => aSourceName.includes(excluded));
    return !aIsExcludedSocial;
  });
  
  const allReach = traditionalArticles.map(a => a.source?.metrics?.reach || 0);
  const allEngagement = traditionalArticles.map(a => a.engagementScore || 0);
  const allAve = traditionalArticles.map(a => a.source?.metrics?.ave || 0);
  const allViews = traditionalArticles.map(a => a.metrics?.views || (a.engagementScore || 0) * 1.5);

  // Usar valores más inclusivos para evitar penalización
  const minReach = Math.min(...allReach);
  const maxReach = Math.max(...allReach, 1000); // Valor mínimo más alto
  const minEngagement = Math.min(...allEngagement);
  const maxEngagement = Math.max(...allEngagement, 100); // Valor mínimo más alto
  const minAve = Math.min(...allAve);
  const maxAve = Math.max(...allAve, 1000); // Valor mínimo más alto
  const minViews = Math.min(...allViews);
  const maxViews = Math.max(...allViews, 1000); // Valor mínimo más alto

  // Normalizar valores
  const reachNorm = normalizeValue(reach, minReach, maxReach);
  const engagementNorm = normalizeValue(
    engagement,
    minEngagement,
    maxEngagement
  );
  const aveNorm = normalizeValue(ave, minAve, maxAve);
  const viewsNorm = normalizeValue(views, minViews, maxViews);

  // Bonus para fuentes de noticias tradicionales reconocidas
  const traditionalNewsSources = [
    "bbc",
    "cnn",
    "reuters",
    "ap",
    "associated press",
    "bloomberg",
    "wall street journal",
    "new york times",
    "washington post",
    "guardian",
    "telegraph",
    "independent",
    "times",
    "financial times",
    "economist",
    "el país",
    "el mundo",
    "abc",
    "la vanguardia",
    "el periódico",
    "el confidencial",
    "público",
    "eldiario",
    "infolibre",
    "el diario",
    "20minutos",
    "el correo",
    "la voz de galicia",
    "el norte de castilla",
    "la nueva españa",
    "diario de sevilla",
    "hoy",
    "extremadura",
    "la opinión",
    "la verdad",
    "la provincia",
    "diario de mallorca",
    "el día",
    "canarias7",
    "la opinión de murcia",
    "la voz de cádiz",
    "diario de cádiz",
    "ideal",
    "granada hoy",
    "málaga hoy",
    "sevilla",
    "cordópolis",
    "europapress",
    "efe",
    "agencia efe",
  ];

  const isTraditionalSource = traditionalNewsSources.some(
    (source) => sourceName.includes(source) || source.includes(sourceName)
  );
  
  // Bonus más inclusivo para fuentes de noticias tradicionales
  const sourceBonus = isTraditionalSource ? 0.2 : 0.1; // Aumentar bonus para todas las fuentes

  // Pesos más balanceados para incluir más artículos
  // Estrategia: 25% Visibilidad (Reach), 25% Engagement, 20% Impacto (AVE), 15% Views, 15% Bonus de fuente
  const w1 = 0.25; // Reach - Visibilidad (reducido)
  const w2 = 0.25; // Engagement - Relevancia para usuario (reducido)
  const w3 = 0.2; // AVE - Impacto mediático
  const w4 = 0.15; // Views - Consumo real
  const w5 = 0.15; // Source Bonus - Fuentes tradicionales (aumentado)

  // Factor de frescura: artículos más recientes tienen bonus
  const articleDate = new Date(article.publishedAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60);
  const freshnessBonus = Math.max(0, 0.1 * (1 - hoursDiff / 168)); // Bonus decreciente en 7 días
  
  // Factor de completitud: artículos con más datos tienen bonus
  const completenessBonus =
    0.05 *
    ((article.title && article.title.length > 10 ? 1 : 0) +
    (article.description && article.description.length > 20 ? 1 : 0) +
      (article.urlToImage && article.urlToImage !== "/placeholder.svg"
        ? 1
        : 0) +
      (article.url && article.url.length > 10 ? 1 : 0));

  // Calcular ContentScore compuesto con bonus de fuente, frescura y completitud
  const contentScore =
    w1 * reachNorm +
    w2 * engagementNorm +
    w3 * aveNorm +
    w4 * viewsNorm +
    w5 * sourceBonus +
    freshnessBonus +
    completenessBonus;

  return Math.min(1, contentScore); // Limitar a 1.0 máximo
}

// Función para ordenar artículos por ContentScore
function sortArticlesByContentScore(
  articles: MeltwaterArticle[]
): MeltwaterArticle[] {
  const sortedArticles = [...articles].sort((a, b) => {
    const scoreA = calculateContentScore(a, articles);
    const scoreB = calculateContentScore(b, articles);
    return scoreB - scoreA; // Orden descendente (mayor score primero)
  });

  return sortedArticles;
}

// Función específica para ordenar artículos del país por socialEchoScore con fallback a engagement
function sortPaisArticlesBySocialEcho(
  articles: MeltwaterArticle[]
): MeltwaterArticle[] {
  const sortedArticles = [...articles].sort((a, b) => {
    // Priorizar socialEchoScore si está disponible
    const socialEchoA = a.socialEchoScore || 0;
    const socialEchoB = b.socialEchoScore || 0;
    
    // Si ambos tienen socialEchoScore, ordenar por ese valor
    if (socialEchoA > 0 && socialEchoB > 0) {
      return socialEchoB - socialEchoA;
    }
    
    // Si solo uno tiene socialEchoScore, priorizarlo
    if (socialEchoA > 0 && socialEchoB === 0) {
      return -1;
    }
    if (socialEchoA === 0 && socialEchoB > 0) {
      return 1;
    }
    
    // Si ninguno tiene socialEchoScore, usar ContentScore como fallback (no engagement para evitar redes sociales)
    const contentScoreA = calculateContentScore(a, articles);
    const contentScoreB = calculateContentScore(b, articles);
    return contentScoreB - contentScoreA;
  });

  return sortedArticles;
}

// Función para asignar ContentScore a cada artículo
function assignContentScores(articles: MeltwaterArticle[]): MeltwaterArticle[] {
  return articles.map((article) => ({
    ...article,
    contentScore: calculateContentScore(article, articles),
  }));
}

// Función para generar un identificador único para cada artículo
function generateArticleId(article: MeltwaterArticle): string {
  // Usar URL como ID principal, si no está disponible usar título + fuente
  if (article.url && article.url !== "#") {
    return article.url;
  }
  return `${article.source?.name || "unknown"}_${article.title}`
    .replace(/\s+/g, "_")
    .toLowerCase();
}

// Función para extraer palabras de texto para nubes de palabras
function extractWordsFromText(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(
      (word) =>
        word.length > 3 &&
        ![
          "para",
          "con",
          "del",
          "las",
          "los",
          "una",
          "uno",
          "que",
          "por",
          "sus",
          "son",
          "más",
          "como",
          "esta",
          "este",
          "pero",
          "también",
          "puede",
          "ser",
          "hacer",
          "tener",
          "hacer",
          "decir",
          "saber",
          "ver",
          "dar",
          "ir",
          "venir",
          "estar",
          "haber",
          "poder",
          "querer",
          "deber",
          "parecer",
          "quedar",
          "hablar",
          "llegar",
          "pasar",
          "seguir",
          "encontrar",
          "pensar",
          "vivir",
          "sentir",
          "tratar",
          "mirar",
          "ayudar",
          "trabajar",
          "jugar",
          "mover",
          "parar",
          "empezar",
          "acabar",
          "volver",
          "entrar",
          "salir",
          "subir",
          "bajar",
          "cambiar",
          "buscar",
          "encontrar",
          "perder",
          "ganar",
          "creer",
          "saber",
          "conocer",
          "entender",
          "aprender",
          "enseñar",
          "estudiar",
          "leer",
          "escribir",
          "hablar",
          "escuchar",
          "ver",
          "mirar",
          "sentir",
          "tocar",
          "oler",
          "gustar",
          "preferir",
          "elegir",
          "decidir",
          "aceptar",
          "rechazar",
          "permitir",
          "prohibir",
          "obligar",
          "forzar",
          "convencer",
          "persuadir",
          "intentar",
          "lograr",
          "conseguir",
          "obtener",
          "recibir",
          "dar",
          "ofrecer",
          "presentar",
          "mostrar",
          "explicar",
          "describir",
          "contar",
          "narrar",
          "relatar",
          "informar",
          "comunicar",
          "expresar",
          "manifestar",
          "declarar",
          "afirmar",
          "negar",
          "confirmar",
          "desmentir",
          "admitir",
          "reconocer",
          "confesar",
          "ocultar",
          "esconder",
          "mostrar",
          "revelar",
          "descubrir",
          "encontrar",
          "buscar",
          "investigar",
          "estudiar",
          "analizar",
          "examinar",
          "revisar",
          "verificar",
          "comprobar",
          "confirmar",
          "validar",
          "aprobar",
          "rechazar",
          "aceptar",
          "recibir",
          "tomar",
          "coger",
          "agarrar",
          "sostener",
          "mantener",
          "conservar",
          "guardar",
          "almacenar",
          "depositar",
          "colocar",
          "poner",
          "situar",
          "ubicar",
          "localizar",
          "encontrar",
          "buscar",
          "hallar",
          "descubrir",
          "encontrar",
          "detectar",
          "percibir",
          "notar",
          "observar",
          "ver",
          "mirar",
          "contemplar",
          "admirar",
          "apreciar",
          "valorar",
          "estimar",
          "considerar",
          "pensar",
          "reflexionar",
          "meditar",
          "contemplar",
          "considerar",
          "evaluar",
          "juzgar",
          "valorar",
          "apreciar",
          "estimar",
          "considerar",
          "tener",
          "poseer",
          "disponer",
          "contar",
          "disponer",
          "tener",
          "poseer",
          "ser",
          "estar",
          "haber",
          "existir",
          "vivir",
          "morir",
          "nacer",
          "crecer",
          "desarrollar",
          "evolucionar",
          "cambiar",
          "transformar",
          "convertir",
          "volver",
          "regresar",
          "retornar",
          "volver",
          "regresar",
          "retornar",
          "volver",
          "regresar",
          "retornar",
        ].includes(word)
    )
    .slice(0, 60); // Limitar a 60 palabras por artículo
}

// Normaliza el título para comparar artículos equivalentes entre fuentes distintas
function normalizeTitleForKey(title: string | undefined): string {
  if (!title) return "";
  // quitar acentos
  const noAccents = title.normalize("NFD").replace(/\p{Diacritic}+/gu, "");
  return noAccents
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "") // quitar URLs
    .replace(/[#@][\w-]+/g, " ") // quitar hashtags y menciones
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "") // quitar emojis
    .replace(/\([^)]*\)/g, " ") // quitar paréntesis y contenido
    .replace(/[^a-z0-9\s]/g, " ") // quitar signos/puntuación
    .replace(/\s+/g, " ") // colapsar espacios
    .trim();
}

// Canonicaliza URL: sin protocolo, sin www, sin query/fragment y sin slash final
function canonicalizeUrl(rawUrl: string | undefined): string {
  if (!rawUrl || rawUrl === "#") return "";
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const path = u.pathname.replace(/\/$/, "");
    return `${host}${path}`;
  } catch {
    return rawUrl.toLowerCase();
  }
}

// Heurística común para detectar si un artículo es de redes sociales
function isSocialMediaArticle(article: MeltwaterArticle): boolean {
  const sourceName = article.source?.name?.toLowerCase() || "";
  const url = article.url || "";
  
  // PRIMERO: Detectar redes sociales de forma MÁS AGRESIVA E INCLUSIVA
  const socialKeywords = [
    // Redes sociales principales
    "facebook",
    "fb",
    "instagram",
    "insta",
    "twitter",
    "tweet",
    "x.com",
    "reddit",
    "youtube",
    "youtu.be",
    "tiktok",
    "threads",
    "linkedin",
    "snapchat",
    "pinterest",
    "telegram",
    "whatsapp",
    "discord",
    "twitch",
    "vimeo",
    "flickr",
    "tumblr",
    "medium",
    "quora",
    "social",
    "post",
    "share",
    "like",
    
    // Redes sociales adicionales
    "mastodon",
    "bluesky",
    "truth social",
    "parler",
    "gab",
    "rumble",
    "odysee",
    "bitchute",
    "dailymotion",
    "vkontakte",
    "vk",
    "odnoklassniki",
    "ok",
    "weibo",
    "wechat",
    "qq",
    "line",
    "kakao",
    "naver",
    "mixi",
    "ameba",
    "hatena",
    "note",
    "qiita",
    "zenn",
    "dev.to",
    "hashnode",
    "substack",
    "ghost",
    "wordpress",
    "blogger",
    "tumblr",
    "livejournal",
    "xanga",
    "myspace",
    "friendster",
    "hi5",
    "bebo",
    "orkut",
    "google+",
    "google plus",
    "g+",
    "plus.google",
    "plus.google.com",
    
    // Plataformas de video
    "dailymotion",
    "vimeo",
    "twitch",
    "youtube",
    "youtu.be",
    "tiktok",
    "instagram",
    "reels",
    "shorts",
    "stories",
    "live",
    "streaming",
    "broadcast",
    "webcast",
    "podcast",
    "radio",
    
    // Plataformas de audio
    "spotify",
    "apple music",
    "soundcloud",
    "bandcamp",
    "mixcloud",
    "audiomack",
    "reverbnation",
    "last.fm",
    "pandora",
    "iheartradio",
    "tunein",
    "radio.com",
    "radio.net",
    "radio.garden",
    
    // Plataformas de imágenes
    "flickr",
    "instagram",
    "pinterest",
    "behance",
    "dribbble",
    "deviantart",
    "artstation",
    "500px",
    "unsplash",
    "pexels",
    "pixabay",
    "shutterstock",
    "getty",
    "istock",
    
    // Plataformas de noticias sociales
    "reddit",
    "hacker news",
    "hn",
    "news.ycombinator",
    "slashdot",
    "digg",
    "stumbleupon",
    "delicious",
    "bookmark",
    "favorite",
    "save",
    "pin",
    "bookmark",
    "tag",
    "hashtag",
    
    // Plataformas de mensajería
    "telegram",
    "whatsapp",
    "signal",
    "wickr",
    "threema",
    "element",
    "matrix",
    "riot",
    "discord",
    "slack",
    "teams",
    "zoom",
    "skype",
    "hangouts",
    "meet",
    "duo",
    
    // Plataformas de foros
    "forum",
    "forums",
    "board",
    "boards",
    "community",
    "communities",
    "group",
    "groups",
    "discussion",
    "discussions",
    "chat",
    "chats",
    "room",
    "rooms",
    "channel",
    "channels",
    
    // Plataformas de blogs
    "blog",
    "blogs",
    "blogger",
    "wordpress",
    "wix",
    "squarespace",
    "weebly",
    "ghost",
    "jekyll",
    "hugo",
    "gatsby",
    "next.js",
    "nuxt",
    "svelte",
    "vue",
    "react",
    "angular",
    
    // Plataformas de e-commerce social
    "etsy",
    "ebay",
    "amazon",
    "mercado libre",
    "mercadolibre",
    "olx",
    "gumtree",
    "craigslist",
    "facebook marketplace",
    "marketplace",
    "shop",
    "store",
    "storefront",
    
    // Plataformas de citas
    "tinder",
    "bumble",
    "hinge",
    "match",
    "okcupid",
    "plenty of fish",
    "pof",
    "zoosk",
    "eharmony",
    "elitesingles",
    "silversingles",
    "ourtime",
    "seniorpeoplemeet",
    
    // Plataformas de gaming
    "steam",
    "epic games",
    "origin",
    "uplay",
    "gog",
    "itch.io",
    "gamejolt",
    "indiedb",
    "roblox",
    "minecraft",
    "fortnite",
    "pubg",
    "apex legends",
    "valorant",
    "league of legends",
    "dota",
    "csgo",
    "overwatch",
    "world of warcraft",
    "final fantasy",
    "call of duty",
    
    // Plataformas de educación
    "coursera",
    "udemy",
    "edx",
    "khan academy",
    "skillshare",
    "masterclass",
    "linkedin learning",
    "pluralsight",
    "codecademy",
    "freecodecamp",
    "the odin project",
    "scrimba",
    "egghead",
    
    // Plataformas de trabajo
    "linkedin",
    "indeed",
    "glassdoor",
    "monster",
    "careerbuilder",
    "ziprecruiter",
    "angel.co",
    "crunchbase",
    "pitchbook",
    "cb insights",
    "techcrunch",
    "venturebeat",
    "wired",
    
    // Plataformas de crowdfunding
    "kickstarter",
    "indiegogo",
    "gofundme",
    "patreon",
    "ko-fi",
    "buymeacoffee",
    "paypal",
    "venmo",
    "cashapp",
    "zelle",
    "apple pay",
    "google pay",
    "samsung pay",
    
    // Plataformas de criptomonedas
    "bitcoin",
    "ethereum",
    "crypto",
    "cryptocurrency",
    "blockchain",
    "nft",
    "nfts",
    "opensea",
    "foundation",
    "superrare",
    "rarible",
    "nifty gateway",
    "makersplace",
    
    // Plataformas de fitness
    "strava",
    "myfitnesspal",
    "fitbit",
    "apple watch",
    "samsung health",
    "google fit",
    "nike run club",
    "adidas running",
    "under armour",
    "garmin",
    "polar",
    "suunto",
    
    // Plataformas de viajes
    "tripadvisor",
    "booking",
    "airbnb",
    "vrbo",
    "expedia",
    "priceline",
    "kayak",
    "skyscanner",
    "google flights",
    "momondo",
    "cheaptickets",
    "hotels.com",
    "marriott",
    "hilton",
    
    // Plataformas de comida
    "yelp",
    "zomato",
    "swiggy",
    "ubereats",
    "doordash",
    "grubhub",
    "postmates",
    "caviar",
    "seamless",
    "chownow",
    "toast",
    "square",
    "clover",
    "shopify",
    "woocommerce",
    
    // Palabras genéricas de redes sociales
    "social",
    "social media",
    "social network",
    "social networking",
    "social platform",
    "post",
    "posts",
    "posting",
    "share",
    "sharing",
    "like",
    "likes",
    "liking",
    "love",
    "loves",
    "loving",
    "heart",
    "hearts",
    "favorite",
    "favorites",
    "bookmark",
    "bookmarks",
    "save",
    "saves",
    "saving",
    "pin",
    "pins",
    "pinning",
    "tag",
    "tags",
    "tagging",
    "mention",
    "mentions",
    "mentioning",
    "reply",
    "replies",
    "replying",
    "comment",
    "comments",
    "commenting",
    "retweet",
    "retweets",
    "retweeting",
    "repost",
    "reposts",
    "reposting",
    "quote",
    "quotes",
    "quoting",
    "thread",
    "threads",
    "threading",
    "story",
    "stories",
    "stories",
    "reel",
    "reels",
    "reeling",
    "live",
    "lives",
    "living",
    "stream",
    "streams",
    "streaming",
    "broadcast",
    "broadcasts",
    "broadcasting",
    "webcast",
    "webcasts",
    "webcasting",
    "podcast",
    "podcasts",
    "podcasting",
    "radio",
    "radios",
    "radioing",
    "tv",
    "television",
    "televisions",
    "channel",
    "channels",
    "channeling",
    "show",
    "shows",
    "showing",
    "program",
    "programs",
    "programming",
    "episode",
    "episodes",
    "season",
    "seasons",
    "series",
    "seriess",
    "movie",
    "movies",
    "film",
    "films",
    "video",
    "videos",
    "audio",
    "audios",
    "image",
    "images",
    "picture",
    "pictures",
    "photo",
    "photos",
    "photograph",
    "photographs",
    "snapshot",
    "snapshots",
    "screenshot",
    "screenshots",
    "meme",
    "memes",
    "gif",
    "gifs",
    "emoji",
    "emojis",
    "sticker",
    "stickers",
    "animation",
    "animations",
    "cartoon",
    "cartoons",
    "comic",
    "comics",
    "manga",
    "mangas",
    "anime",
    "animes",
    "game",
    "games",
    "gaming",
    "gamer",
    "gamers",
    "player",
    "players",
    "playing",
    "play",
    "plays",
    "played",
    "playable",
    "playability",
    "score",
    "scores",
    "scoring",
    "scored",
    "high score",
    "high scores",
    "leaderboard",
    "leaderboards",
    "rank",
    "ranks",
    "ranking",
    "ranked",
    "level",
    "levels",
    "leveling",
    "leveled",
    "experience",
    "experiences",
    "exp",
    "xp",
    "points",
    "point",
    "pointing",
    "pointed",
    "achievement",
    "achievements",
    "trophy",
    "trophies",
    "badge",
    "badges",
    "medal",
    "medals",
    "award",
    "awards",
    "prize",
    "prizes",
    "reward",
    "rewards",
    "bonus",
    "bonuses",
    "bonus points",
    "bonus points",
    "bonus points",
    "bonus points",
    "bonus points",
    "bonus points",
  ];
  
  // Detectar por nombre de fuente
  if (socialKeywords.some((keyword) => sourceName.includes(keyword))) {
    return true;
  }
  
  // Detectar por URL (MUCHO MÁS INCLUSIVO)
  if (
    /facebook\.com|instagram\.com|twitter\.com|x\.com|reddit\.com|youtube\.com|youtu\.be|tiktok\.com|threads\.net|linkedin\.com|snapchat\.com|pinterest\.com|telegram\.org|whatsapp\.com|discord\.com|twitch\.tv|vimeo\.com|flickr\.com|tumblr\.com|medium\.com|quora\.com|mastodon\.|bluesky\.|truth\.social|parler\.|gab\.|rumble\.|odysee\.|bitchute\.|dailymotion\.|vkontakte\.|vk\.|odnoklassniki\.|ok\.|weibo\.|wechat\.|qq\.|line\.|kakao\.|naver\.|mixi\.|ameba\.|hatena\.|note\.|qiita\.|zenn\.|dev\.to|hashnode\.|substack\.|ghost\.|wordpress\.|blogger\.|livejournal\.|xanga\.|myspace\.|friendster\.|hi5\.|bebo\.|orkut\.|plus\.google|spotify\.|apple\.music|soundcloud\.|bandcamp\.|mixcloud\.|audiomack\.|reverbnation\.|last\.fm|pandora\.|iheartradio\.|tunein\.|radio\.com|radio\.net|radio\.garden|behance\.|dribbble\.|deviantart\.|artstation\.|500px\.|unsplash\.|pexels\.|pixabay\.|shutterstock\.|getty\.|istock\.|hacker\.news|news\.ycombinator|slashdot\.|digg\.|stumbleupon\.|delicious\.|signal\.|wickr\.|threema\.|element\.|matrix\.|riot\.|slack\.|teams\.|zoom\.|skype\.|hangouts\.|meet\.|duo\.|wix\.|squarespace\.|weebly\.|jekyll\.|hugo\.|gatsby\.|next\.js|nuxt\.|svelte\.|vue\.|react\.|angular\.|etsy\.|ebay\.|amazon\.|mercado\.libre|mercadolibre\.|olx\.|gumtree\.|craigslist\.|marketplace\.|tinder\.|bumble\.|hinge\.|match\.|okcupid\.|plenty\.of\.fish|pof\.|zoosk\.|eharmony\.|elitesingles\.|silversingles\.|ourtime\.|seniorpeoplemeet\.|steam\.|epic\.games|origin\.|uplay\.|gog\.|itch\.io|gamejolt\.|indiedb\.|roblox\.|minecraft\.|fortnite\.|pubg\.|apex\.legends|valorant\.|league\.of\.legends|dota\.|csgo\.|overwatch\.|world\.of\.warcraft|final\.fantasy|call\.of\.duty|coursera\.|udemy\.|edx\.|khan\.academy|skillshare\.|masterclass\.|linkedin\.learning|pluralsight\.|codecademy\.|freecodecamp\.|the\.odin\.project|scrimba\.|egghead\.|indeed\.|glassdoor\.|monster\.|careerbuilder\.|ziprecruiter\.|angel\.co|crunchbase\.|pitchbook\.|cb\.insights|techcrunch\.|venturebeat\.|wired\.|kickstarter\.|indiegogo\.|gofundme\.|patreon\.|ko-fi\.|buymeacoffee\.|paypal\.|venmo\.|cashapp\.|zelle\.|apple\.pay|google\.pay|samsung\.pay|bitcoin\.|ethereum\.|crypto\.|cryptocurrency\.|blockchain\.|nft\.|nfts\.|opensea\.|foundation\.|superrare\.|rarible\.|nifty\.gateway|makersplace\.|strava\.|myfitnesspal\.|fitbit\.|apple\.watch|samsung\.health|google\.fit|nike\.run\.club|adidas\.running|under\.armour|garmin\.|polar\.|suunto\.|tripadvisor\.|booking\.|airbnb\.|vrbo\.|expedia\.|priceline\.|kayak\.|skyscanner\.|google\.flights|momondo\.|cheaptickets\.|hotels\.com|marriott\.|hilton\.|yelp\.|zomato\.|swiggy\.|ubereats\.|doordash\.|grubhub\.|postmates\.|caviar\.|seamless\.|chownow\.|toast\.|square\.|clover\.|shopify\.|woocommerce\./i.test(
      url
    )
  ) {
    return true;
  }
  
  // Detectar por tipo de contenido
  const raw: any = article as any;
  if (
    raw?.content_type === "social post" ||
    raw?.content_type === "repost" ||
    raw?.content_type === "comment" ||
    raw?.content_type === "social"
  ) {
    return true;
  }
  
  // Detectar por campos de contenido social
  const hasSocialFields =
    raw?.content?.text ||
    raw?.content?.message ||
    raw?.content?.caption ||
    raw?.content?.post_text ||
    raw?.content?.status_text ||
    raw?.content?.tweet_text;
  const hasSocialMetrics =
    raw?.metrics?.likes ||
    raw?.metrics?.shares ||
    raw?.metrics?.comments ||
    raw?.metrics?.retweets ||
    raw?.metrics?.reactions ||
    raw?.metrics?.followers;
  if (hasSocialFields && hasSocialMetrics) {
    return true;
  }
  
  // SEGUNDO: Excluir medios tradicionales explícitamente
  const traditionalKeywords = [
    "diario",
    "newspaper",
    "news",
    "radio",
    "tv",
    "television",
    "magazine",
    "journal",
    "press",
    "media",
    "pais",
    "nacion",
    "clarin",
    "lanacion",
    "infobae",
    "pagina12",
    "ambito",
    "cronista",
    "perfil",
    "telesur",
    "rt",
    "bbc",
    "cnn",
    "reuters",
    "ap",
    "afp",
    "efe",
    "ansa",
    "dpa",
    "xinhua",
    "ria",
    "itar",
    "tass",
    "sputnik",
    "aljazeera",
    "dw",
    "france24",
    "euronews",
    "sky",
    "itv",
    "channel4",
    "abc",
    "cbs",
    "nbc",
    "fox",
    "msnbc",
    "cnbc",
    "bloomberg",
    "wsj",
    "nytimes",
    "washingtonpost",
    "usatoday",
    "latimes",
    "chicagotribune",
    "bostonglobe",
    "philly",
    "dallasnews",
    "seattletimes",
    "denverpost",
    "azcentral",
    "miamiherald",
    "orlandosentinel",
    "sun",
    "baltimoresun",
    "dailypress",
    "hamptonroads",
    "pilotonline",
    "virginian",
    "pilot",
    "elpais",
    "ovacion",
    "montevideo",
    "subrayado",
    "canal4",
    "canal10",
    "teledoce",
    "sai",
    "elobservador",
    "ladiaria",
    "brecha",
    "busqueda",
    "republica",
    "ultimasnoticias",
    "globo",
    "folha",
    "estadao",
    "g1",
    "uol",
    "ig",
    "terra",
    "r7",
    "band",
    "record",
    "sbt",
    "rede",
    "emol",
    "latercera",
    "mercurio",
    "cooperativa",
    "biobio",
    "mega",
    "chilevision",
    "canal13",
    "tvn",
    "eltiempo",
    "semana",
    "elespectador",
    "rcn",
    "caracol",
    "reforma",
    "jornada",
    "universal",
    "milenio",
    "proceso",
    "televisa",
    "azteca",
    "elmundo",
    "lavanguardia",
    "elperiodico",
    "publico",
    "eldiario",
    "elconfidencial",
    "libertaddigital",
    "okdiario",
    "vozpopuli",
    "elespanol",
  ];

  if (
    traditionalKeywords.some((traditional) => sourceName.includes(traditional))
  ) {
    return false; // Excluir medios tradicionales
  }
  
  // Si no cumple ninguna condición de red social, NO es red social
  return false;
}

// Normaliza descripción para key adicional
function normalizeDescription(desc: string | undefined): string {
  if (!desc) return "";
  const noAccents = desc.normalize("NFD").replace(/\p{Diacritic}+/gu, "");
  return noAccents
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140); // limitar para claves estables
}

// Función para filtrar artículos duplicados (MENOS RESTRICTIVA)
function filterUniqueArticles(
  articles: MeltwaterArticle[],
  shownArticles: Set<string>
): MeltwaterArticle[] {
  const uniqueArticles: MeltwaterArticle[] = [];
  const newShownArticles = new Set<string>();

  for (const article of articles) {
    const articleId = generateArticleId(article);
    const canonicalUrlKey = canonicalizeUrl(article.url);
    
    // SOLO verificar por ID (muy permisivo)
    const seenById =
      shownArticles.has(`id:${articleId}`) ||
      newShownArticles.has(`id:${articleId}`);

    // Si el artículo ya fue mostrado por ID, lo saltamos
    if (seenById) {
      continue;
    }

    // Si es un artículo nuevo, lo agregamos

    uniqueArticles.push(article);
    newShownArticles.add(`id:${articleId}`);
  }

  return uniqueArticles;
}

// Marca artículos como mostrados en un Set con claves por ID (MUY PERMISIVO)
function markShown(shown: Set<string>, articles: MeltwaterArticle[]): void {
  for (const article of articles) {
    const id = generateArticleId(article);
    // SOLO marcar por ID para permitir más artículos
    shown.add(`id:${id}`);
  }
}

// Función para calcular límite dinámico basado en artículos disponibles
function calculateDynamicLimit(
  availableArticles: number,
  defaultLimit: number = 500
): number {
  // Si hay pocos artículos, usar todos
  if (availableArticles <= 20) return availableArticles;
  
  // Si hay artículos suficientes, usar el límite por defecto
  if (availableArticles >= defaultLimit) return defaultLimit;
  
  // Si hay artículos intermedios, usar el 98% de los disponibles (MUY permisivo)
  return Math.floor(availableArticles * 0.98);
}

// Función específica para calcular límite dinámico para redes sociales (MÁS PERMISIVO)
function calculateSocialMediaLimit(
  availableArticles: number,
  defaultLimit: number = 500
): number {
  // Para redes sociales, ser MUCHO más permisivo
  if (availableArticles <= 10) return availableArticles;
  
  // Si hay artículos suficientes, usar el límite por defecto
  if (availableArticles >= defaultLimit) return defaultLimit;
  
  // Si hay artículos intermedios, usar el 99% de los disponibles (EXTREMADAMENTE permisivo)
  return Math.floor(availableArticles * 0.99);
}

// Función para obtener artículos únicos ordenados por ContentScore
function getUniqueTopArticles(
  articles: MeltwaterArticle[],
  shownArticles: Set<string>,
  limit: number = 500
): MeltwaterArticle[] {
  console.log(`🔍 getUniqueTopArticles - INICIANDO:`);
  console.log(`  📊 Total artículos de entrada: ${articles.length}`);
  console.log(`  📊 Artículos ya mostrados: ${shownArticles.size}`);
  console.log(`  📊 Límite solicitado: ${limit}`);
  
  // Primero ordenar por ContentScore
  const sortedArticles = sortArticlesByContentScore(articles);
  console.log(
    `  📊 Artículos ordenados por ContentScore: ${sortedArticles.length}`
  );

  // Filtrar duplicados
  const uniqueArticles = filterUniqueArticles(sortedArticles, shownArticles);
  console.log(
    `  📊 Artículos únicos después de filtrar duplicados: ${uniqueArticles.length}`
  );

  // Tomar el límite solicitado
  let result = uniqueArticles.slice(0, limit);
  console.log(`  📊 Resultado inicial: ${result.length} artículos`);
  
  // Rellenar hasta el límite si es necesario (solo con artículos reales)
  if (result.length < limit) {
    const selectedIds = new Set(result.map((a) => generateArticleId(a)));
    
    // Intentar con más artículos ordenados por ContentScore
    const contentScoreCandidates = articles.sort((a, b) => {
        const scoreA = calculateContentScore(a, articles);
        const scoreB = calculateContentScore(b, articles);
        return scoreB - scoreA;
      });

    for (const candidate of contentScoreCandidates) {
      if (result.length >= limit) break;
      const id = generateArticleId(candidate);
      if (!selectedIds.has(id) && !shownArticles.has(id)) {
        result.push(candidate);
        selectedIds.add(id);
      }
    }
  }
  
  console.log(`  📊 Resultado final: ${result.length} artículos`);
  
  // Log de artículos procesados (solo números)

  return assignContentScores(result);
}

// Función específica para obtener artículos del país ordenados por socialEchoScore
function getUniqueTopPaisArticles(
  articles: MeltwaterArticle[],
  shownArticles: Set<string>,
  limit: number = 500
): MeltwaterArticle[] {
  console.log(
    "🔍 DEBUG getUniqueTopPaisArticles - INICIANDO FUNCIÓN - VERSION FIXED"
  );
  console.log("  Total artículos de entrada:", articles.length);
  console.log("  Artículos ya mostrados:", shownArticles.size);
  
  // Fuentes de redes sociales a excluir (solo medios tradicionales para la sección país)
  const excludedSources = [
    "facebook",
    "twitter",
    "x",
    "reddit",
    "twitch",
    "youtube",
    "instagram",
    "tiktok",
    "threads",
    "linkedin",
    "snapchat",
    "pinterest",
    "telegram",
    "whatsapp",
    "discord",
    "vimeo",
    "flickr",
    "tumblr",
    "medium",
    "quora",
    "mastodon",
    "bluesky",
    "truth social",
    "parler",
    "gab",
    "rumble",
    "odysee",
    "bitchute",
    "dailymotion",
    "vkontakte",
    "vk",
    "odnoklassniki",
    "ok",
    "weibo",
    "wechat",
    "qq",
    "line",
    "kakao",
    "naver",
    "mixi",
    "ameba",
    "hatena",
    "note",
    "qiita",
    "zenn",
    "dev.to",
    "hashnode",
    "substack",
    "ghost",
    "wordpress",
    "blogger",
    "livejournal",
    "xanga",
    "myspace",
    "friendster",
    "hi5",
    "bebo",
    "orkut",
    "spotify",
    "apple music",
    "soundcloud",
    "bandcamp",
    "mixcloud",
    "audiomack",
    "reverbnation",
    "last.fm",
    "pandora",
    "iheartradio",
    "tunein",
    "radio.com",
    "radio.net",
    "radio.garden",
    "behance",
    "dribbble",
    "deviantart",
    "artstation",
    "500px",
    "unsplash",
    "pexels",
    "pixabay",
    "shutterstock",
    "getty",
    "istock",
    "hacker news",
    "slashdot",
    "digg",
    "stumbleupon",
    "delicious",
    "signal",
    "wickr",
    "threema",
    "element",
    "matrix",
    "riot",
    "slack",
    "teams",
    "zoom",
    "skype",
    "hangouts",
    "meet",
    "duo",
    "wix",
    "squarespace",
    "weebly",
    "jekyll",
    "hugo",
    "gatsby",
    "next.js",
    "nuxt",
    "svelte",
    "vue",
    "react",
    "angular",
    "etsy",
    "ebay",
    "amazon",
    "mercado libre",
    "mercadolibre",
    "olx",
    "gumtree",
    "craigslist",
    "marketplace",
    "tinder",
    "bumble",
    "hinge",
    "match",
    "okcupid",
    "plenty of fish",
    "pof",
    "zoosk",
    "eharmony",
    "elitesingles",
    "silversingles",
    "ourtime",
    "seniorpeoplemeet",
    "steam",
    "epic games",
    "origin",
    "uplay",
    "gog",
    "itch.io",
    "gamejolt",
    "indiedb",
    "roblox",
    "minecraft",
    "fortnite",
    "pubg",
    "apex legends",
    "valorant",
    "league of legends",
    "dota",
    "csgo",
    "overwatch",
    "world of warcraft",
    "final fantasy",
    "call of duty",
    "coursera",
    "udemy",
    "edx",
    "khan academy",
    "skillshare",
    "masterclass",
    "linkedin learning",
    "pluralsight",
    "codecademy",
    "freecodecamp",
    "the odin project",
    "scrimba",
    "egghead",
    "indeed",
    "glassdoor",
    "monster",
    "careerbuilder",
    "ziprecruiter",
    "angel.co",
    "crunchbase",
    "pitchbook",
    "cb insights",
    "techcrunch",
    "venturebeat",
    "wired",
    "kickstarter",
    "indiegogo",
    "gofundme",
    "patreon",
    "ko-fi",
    "buymeacoffee",
    "paypal",
    "venmo",
    "cashapp",
    "zelle",
    "apple pay",
    "google pay",
    "samsung pay",
    "bitcoin",
    "ethereum",
    "crypto",
    "cryptocurrency",
    "blockchain",
    "nft",
    "nfts",
    "opensea",
    "foundation",
    "superrare",
    "rarible",
    "nifty gateway",
    "makersplace",
    "strava",
    "myfitnesspal",
    "fitbit",
    "apple watch",
    "samsung health",
    "google fit",
    "nike run club",
    "adidas running",
    "under armour",
    "garmin",
    "polar",
    "suunto",
    "tripadvisor",
    "booking",
    "airbnb",
    "vrbo",
    "expedia",
    "priceline",
    "kayak",
    "skyscanner",
    "google flights",
    "momondo",
    "cheaptickets",
    "hotels.com",
    "marriott",
    "hilton",
    "yelp",
    "zomato",
    "swiggy",
    "ubereats",
    "doordash",
    "grubhub",
    "postmates",
    "caviar",
    "seamless",
    "chownow",
    "toast",
    "square",
    "clover",
    "shopify",
    "woocommerce",
  ];
  
  // Fuentes de medios tradicionales permitidas - Lista híbrida MUY INCLUSIVA
  const allowedTraditionalSources = [
    // === PALABRAS GENÉRICAS DE MEDIOS TRADICIONALES ===
    "diario",
    "newspaper",
    "radio",
    "tv",
    "television",
    "magazine",
    "journal",
    "press",
    "pais",
    "nacion",
    "periodico",
    "gaceta",
    "boletin",
    "revista",
    "publicacion",
    "comunicacion",
    "informe",
    "reporte",
    "cronica",
    "news",
    "noticias",
    "media",
    "prensa",
    "periodismo",
    "informacion",
    "actualidad",
    "hechos",
    "sucesos",
    "canal",
    "channel",
    "emisora",
    "estacion",
    "programa",
    "show",
    "especial",
    "documental",
    "reportaje",
    "editorial",
    "opinion",
    "columna",
    "articulo",
    "nota",
    "entrevista",
    "investigacion",
    "analisis",
    "digital",
    "online",
    "web",
    "portal",
    "sitio",
    "plataforma",
    "redaccion",
    "equipo",
    "staff",
    
    // === MEDIOS ARGENTINOS (EXPANDIDO) ===
    "clarin",
    "lanacion",
    "infobae",
    "pagina12",
    "ambito",
    "cronista",
    "perfil",
    "telesur",
    "telefe",
    "america",
    "canal13",
    "tn",
    "c5n",
    "a24",
    "tyc",
    "espn",
    "ole",
    "tycsports",
    "minutouno",
    "rosario3",
    "uno",
    "rionegro",
    "lavoz",
    "losandes",
    "rionegro",
    "neuquen",
    "patagonia",
    "santacruz",
    "tierradelfuego",
    "chubut",
    "rio",
    "cordoba",
    "tucuman",
    "salta",
    "jujuy",
    "santiago",
    "catamarca",
    "larioja",
    "sanluis",
    "mendoza",
    "san juan",
    "san juan",
    "entre rios",
    "corrientes",
    "misiones",
    "formosa",
    "chaco",
    "santa fe",
    "buenos aires",
    "capital",
    "conurbano",
    "zona norte",
    "zona sur",
    "zona oeste",
    "la plata",
    "mar del plata",
    "tandil",
    "olavarria",
    "azul",
    "tres arroyos",
    "bahia blanca",
    "necochea",
    "pinamar",
    "villa carlos paz",
    
    // === MEDIOS URUGUAYOS (EXPANDIDO) ===
    "elpais",
    "ovacion",
    "montevideo",
    "subrayado",
    "canal4",
    "canal10",
    "teledoce",
    "sai",
    "elobservador",
    "ladiaria",
    "brecha",
    "busqueda",
    "republica",
    "ultimasnoticias",
    "el pais",
    "la republica",
    "el observador",
    "la diaria",
    "brecha",
    "busqueda",
    "ultimas noticias",
    "ovacion",
    "subrayado",
    "canal 4",
    "canal 10",
    "tele doce",
    "sai",
    "el observador",
    "la diaria",
    "brecha",
    "busqueda",
    "republica",
    "ultimas noticias",
    
    // === MEDIOS BRASILEÑOS (EXPANDIDO) ===
    "globo",
    "folha",
    "estadao",
    "g1",
    "uol",
    "ig",
    "terra",
    "r7",
    "band",
    "record",
    "sbt",
    "rede",
    "veja",
    "istoe",
    "epoca",
    "exame",
    "valor",
    "o globo",
    "folha de sao paulo",
    "estado de sao paulo",
    "g1",
    "uol",
    "ig",
    "terra",
    "r7",
    "band",
    "record",
    "sbt",
    "rede globo",
    "veja",
    "istoe",
    "epoca",
    "exame",
    "valor",
    "jornal",
    "jornal",
    "noticias",
    "noticias",
    "informacao",
    "informacao",
    "atualidade",
    "atualidade",
    
    // === MEDIOS CHILENOS (EXPANDIDO) ===
    "emol",
    "latercera",
    "mercurio",
    "cooperativa",
    "biobio",
    "mega",
    "chilevision",
    "tvn",
    "canal 13",
    "chilevision",
    "mega",
    "tvn",
    "canal 13",
    "cooperativa",
    "biobio",
    "la tercera",
    "el mercurio",
    "emol",
    "la tercera",
    "el mercurio",
    "cooperativa",
    "biobio",
    "mega",
    "chilevision",
    "tvn",
    
    // === MEDIOS COLOMBIANOS (EXPANDIDO) ===
    "eltiempo",
    "semana",
    "elespectador",
    "rcn",
    "caracol",
    "el tiempo",
    "semana",
    "el espectador",
    "rcn",
    "caracol",
    "noticias",
    "informacion",
    "actualidad",
    "hechos",
    "sucesos",
    "colombia",
    "bogota",
    "medellin",
    "cali",
    "barranquilla",
    "cartagena",
    "bucaramanga",
    "pereira",
    "manizales",
    "ibague",
    "pasto",
    "villavicencio",
    
    // === MEDIOS MEXICANOS (EXPANDIDO) ===
    "reforma",
    "jornada",
    "universal",
    "milenio",
    "proceso",
    "televisa",
    "azteca",
    "reforma",
    "la jornada",
    "el universal",
    "milenio",
    "proceso",
    "televisa",
    "azteca",
    "noticias",
    "informacion",
    "actualidad",
    "hechos",
    "sucesos",
    "mexico",
    "ciudad de mexico",
    "guadalajara",
    "monterrey",
    "puebla",
    "tijuana",
    "leon",
    "juarez",
    "torreon",
    "queretaro",
    "san luis potosi",
    "merida",
    "mexicali",
    "aguascalientes",
    
    // === MEDIOS ESPAÑOLES (EXPANDIDO) ===
    "elpais",
    "elmundo",
    "abc",
    "lavanguardia",
    "elperiodico",
    "publico",
    "eldiario",
    "elconfidencial",
    "libertaddigital",
    "okdiario",
    "vozpopuli",
    "elespanol",
    "el pais",
    "el mundo",
    "abc",
    "la vanguardia",
    "el periodico",
    "publico",
    "el diario",
    "el confidencial",
    "libertad digital",
    "ok diario",
    "voz populi",
    "el español",
    "noticias",
    "informacion",
    "actualidad",
    "hechos",
    "sucesos",
    "espana",
    "madrid",
    "barcelona",
    "valencia",
    "sevilla",
    "bilbao",
    "zaragoza",
    "malaga",
    "murcia",
    "palma",
    "las palmas",
    "granada",
    "alicante",
    
    // === MEDIOS INTERNACIONALES PRINCIPALES ===
    "bbc",
    "cnn",
    "reuters",
    "ap",
    "afp",
    "efe",
    "ansa",
    "dpa",
    "dw",
    "france24",
    "euronews",
    "sky",
    "itv",
    "channel4",
    "abc",
    "cbs",
    "nbc",
    "fox",
    "msnbc",
    "cnbc",
    "bloomberg",
    "wsj",
    "nytimes",
    "washingtonpost",
    "usatoday",
    "latimes",
    "chicagotribune",
    "bostonglobe",
    "philly",
    "dallasnews",
    "seattletimes",
    "denverpost",
    "azcentral",
    "miamiherald",
    "orlandosentinel",
    "sun",
    "baltimoresun",
    "dailypress",
    "hamptonroads",
    "pilotonline",
    "virginian",
    "pilot",
    "associated press",
    "agence france presse",
    "agencia efe",
    "deutsche welle",
    "france 24",
    "euro news",
    "sky news",
    "itv",
    "channel 4",
    "abc news",
    "cbs news",
    "nbc news",
    "fox news",
    "msnbc",
    "cnbc",
    "bloomberg",
    "wall street journal",
    "new york times",
    "washington post",
    "usa today",
    "los angeles times",
    "chicago tribune",
    "boston globe",
    "philadelphia",
    "dallas news",
    "seattle times",
    "denver post",
    "arizona central",
    "miami herald",
    "orlando sentinel",
    
    // === MEDIOS FRANCESES (EXPANDIDO) ===
    "lemonde",
    "lefigaro",
    "liberation",
    "franceinfo",
    "tf1",
    "france2",
    "france3",
    "bfmtv",
    "cnews",
    "le monde",
    "le figaro",
    "liberation",
    "france info",
    "tf1",
    "france 2",
    "france 3",
    "bfm tv",
    "c news",
    "noticias",
    "informacion",
    "actualidad",
    "hechos",
    "sucesos",
    "francia",
    "paris",
    "lyon",
    "marseille",
    "toulouse",
    "nice",
    "nantes",
    "strasbourg",
    "montpellier",
    "bordeaux",
    "lille",
    "rennes",
    "reims",
    "le havre",
    
    // === MEDIOS ALEMANES (EXPANDIDO) ===
    "spiegel",
    "zeit",
    "faz",
    "sueddeutsche",
    "bild",
    "welt",
    "tagesschau",
    "ard",
    "zdf",
    "der spiegel",
    "die zeit",
    "frankfurter allgemeine",
    "suddeutsche zeitung",
    "bild",
    "die welt",
    "tagesschau",
    "ard",
    "zdf",
    "noticias",
    "informacion",
    "actualidad",
    "hechos",
    "sucesos",
    "alemania",
    "berlin",
    "hamburgo",
    "munich",
    "colonia",
    "frankfurt",
    "stuttgart",
    "dusseldorf",
    "dortmund",
    "essen",
    "leipzig",
    "bremen",
    "dresden",
    
    // === MEDIOS ITALIANOS (EXPANDIDO) ===
    "corriere",
    "repubblica",
    "sole24ore",
    "rai",
    "mediaset",
    "la7",
    "corriere della sera",
    "la repubblica",
    "il sole 24 ore",
    "rai",
    "mediaset",
    "la 7",
    "noticias",
    "informacion",
    "actualidad",
    "hechos",
    "sucesos",
    "italia",
    "roma",
    "milan",
    "napoles",
    "turin",
    "palermo",
    "genova",
    "bolonia",
    "florencia",
    "venecia",
    
    // === MEDIOS BRITÁNICOS (EXPANDIDO) ===
    "guardian",
    "telegraph",
    "independent",
    "mirror",
    "sun",
    "daily",
    "mail",
    "times",
    "ft",
    "the guardian",
    "the telegraph",
    "the independent",
    "the mirror",
    "the sun",
    "daily mail",
    "the times",
    "financial times",
    "noticias",
    "informacion",
    "actualidad",
    "hechos",
    "sucesos",
    "reino unido",
    "londres",
    "birmingham",
    "manchester",
    "glasgow",
    "edimburgo",
    "liverpool",
    "leeds",
    "sheffield",
    "bristol",
    "newcastle",
    
    // === MEDIOS CANADIENSES (EXPANDIDO) ===
    "globeandmail",
    "nationalpost",
    "cbc",
    "ctv",
    "global",
    "globe and mail",
    "national post",
    "cbc",
    "ctv",
    "global",
    "noticias",
    "informacion",
    "actualidad",
    "hechos",
    "sucesos",
    "canada",
    "toronto",
    "montreal",
    "vancouver",
    "calgary",
    "ottawa",
    "edmonton",
    "winnipeg",
    "quebec",
    "hamilton",
    "kitchener",
    "london",
    
    // === MEDIOS AUSTRALIANOS (EXPANDIDO) ===
    "sydney",
    "herald",
    "age",
    "australian",
    "sbs",
    "nine",
    "seven",
    "ten",
    "sydney morning herald",
    "the age",
    "the australian",
    "sbs",
    "channel 9",
    "channel 7",
    "channel 10",
    "noticias",
    "informacion",
    "actualidad",
    "hechos",
    "sucesos",
    "australia",
    "sydney",
    "melbourne",
    "brisbane",
    "perth",
    "adelaide",
    "gold coast",
    "newcastle",
    "wollongong",
    "geelong",
    "hobart",
    "darwin",
    "canberra",
    "townsville",
    "cairns",
    
    // === MEDIOS ASIÁTICOS (EXPANDIDO) ===
    "asahi",
    "yomiuri",
    "mainichi",
    "nikkei",
    "nhk",
    "chosun",
    "joongang",
    "donga",
    "kbs",
    "mbc",
    "sbs",
    "xinhua",
    "people",
    "asahi shimbun",
    "yomiuri shimbun",
    "mainichi shimbun",
    "nikkei",
    "nhk",
    "chosun ilbo",
    "joongang ilbo",
    "donga ilbo",
    "kbs",
    "mbc",
    "sbs",
    "xinhua",
    "people daily",
    "noticias",
    "informacion",
    "actualidad",
    "hechos",
    "sucesos",
    "japon",
    "corea",
    "china",
    "tokio",
    "seul",
    "pekin",
    "shanghai",
    
    // === MEDIOS RUSOS Y ÁRABES (EXPANDIDO) ===
    "rt",
    "sputnik",
    "tass",
    "ria",
    "aljazeera",
    "allafrica",
    "russia today",
    "sputnik",
    "tass",
    "ria novosti",
    "al jazeera",
    "all africa",
    "noticias",
    "informacion",
    "actualidad",
    "hechos",
    "sucesos",
    "rusia",
    "moscu",
    "san petersburgo",
    "novosibirsk",
    "ekaterinburgo",
    "kazan",
    "nizhny novgorod",
    "chelyabinsk",
    "omsk",
    
    // === MEDIOS LATINOAMERICANOS ADICIONALES ===
    "ecuador",
    "peru",
    "chile",
    "uruguay",
    "paraguay",
    "bolivia",
    "venezuela",
    "panama",
    "costa rica",
    "guatemala",
    "honduras",
    "el salvador",
    "nicaragua",
    "belice",
    "haiti",
    "republica dominicana",
    "cuba",
    "puerto rico",
    "jamaica",
    "trinidad",
    "tobago",
    "barbados",
    "guyana",
    "suriname",
    "french guiana",
    
    // === MEDIOS EUROPEOS ADICIONALES ===
    "portugal",
    "espana",
    "francia",
    "italia",
    "alemania",
    "reino unido",
    "irlanda",
    "holanda",
    "belgica",
    "suiza",
    "austria",
    "suecia",
    "noruega",
    "dinamarca",
    "finlandia",
    "islandia",
    "polonia",
    "republica checa",
    "hungria",
    "rumania",
    "bulgaria",
    "croacia",
    "eslovenia",
    "eslovakia",
    "lituania",
    "letonia",
    "estonia",
    "grecia",
    "chipre",
    "malta",
    "luxemburgo",
    "liechtenstein",
    "monaco",
    "andorra",
    "san marino",
    "vaticano",
    
    // === MEDIOS AFRICANOS ===
    "sudafrica",
    "egipto",
    "nigeria",
    "kenia",
    "ghana",
    "senegal",
    "marruecos",
    "tunez",
    "argelia",
    "libia",
    "sudan",
    "etiopia",
    "uganda",
    "tanzania",
    "zambia",
    "zimbabwe",
    "botswana",
    "namibia",
    "lesotho",
    "swazilandia",
    
    // === MEDIOS OCEÁNICOS ===
    "nueva zelanda",
    "fiji",
    "papua nueva guinea",
    "samoa",
    "tonga",
    "vanuatu",
    "salomon",
    "kiribati",
    "tuvalu",
    "nauru",
    "palau",
    "marshall",
    "micronesia",
    "polinesia",
    "melanesia",
    "oceania",
    "pacifico",
    "oceano",
    
    // === MEDIOS ESPECIALIZADOS ===
    "deportes",
    "sports",
    "deporte",
    "futbol",
    "football",
    "basketball",
    "tennis",
    "golf",
    "cricket",
    "rugby",
    "hockey",
    "baseball",
    "volleyball",
    "handball",
    "waterpolo",
    "natacion",
    "atletismo",
    "ciclismo",
    "motociclismo",
    "automovilismo",
    "formula",
    "nascar",
    "indy",
    "rally",
    "rallye",
    "rallying",
    "rallying",
    "rallying",
    "economia",
    "economy",
    "finanzas",
    "finance",
    "negocios",
    "business",
    "mercado",
    "market",
    "bolsa",
    "stock",
    "tecnologia",
    "technology",
    "ciencia",
    "science",
    "salud",
    "health",
    "medicina",
    "medicine",
    "educacion",
    "education",
    "cultura",
    "culture",
    "arte",
    "art",
    "musica",
    "music",
    "cine",
    "cinema",
    "teatro",
    "theater",
    "literatura",
    "literature",
    "libros",
    "books",
    "revista",
    "magazine",
    "periodico",
    "newspaper",
    "radio",
    "television",
    "tv",
    "canal",
    "channel",
    "programa",
    "program",
    "show",
    "especial",
    "special",
    "documental",
    "documentary",
    "reportaje",
    "report",
    "entrevista",
    "interview",
    "opinion",
    "editorial",
    "columna",
    "column",
    "articulo",
    "article",
    "nota",
    "note",
    "informe",
    "report",
    "analisis",
    "analysis",
    "investigacion",
    "investigation",
    "cronica",
    "chronicle",
    "suceso",
    "event",
    "hecho",
    "fact",
    "noticia",
    "news",
    "informacion",
    "information",
    "actualidad",
    "current",
    "presente",
    "present",
    "ahora",
    "now",
    "hoy",
    "today",
    "ayer",
    "yesterday",
    "mañana",
    "tomorrow",
    "semana",
    "week",
    "mes",
    "month",
    "año",
    "year",
    "decada",
    "decade",
    "siglo",
    "century",
    "milenio",
    "millennium",
    "epoca",
    "era",
    "tiempo",
    "time",
    "momento",
    "moment",
    "instante",
    "instant",
    "segundo",
    "second",
    "minuto",
    "minute",
    "hora",
    "hour",
    "dia",
    "day",
    "noche",
    "night",
    "madrugada",
    "dawn",
    "amanecer",
    "sunrise",
    "atardecer",
    "sunset",
    "anochecer",
    "dusk",
    "crepusculo",
    "twilight",
    "alba",
    "dawn",
    "aurora",
    "aurora",
    "ocaso",
    "sunset",
    "poniente",
    "west",
    "oriente",
    "east",
    "norte",
    "north",
    "sur",
    "south",
    "este",
    "east",
    "oeste",
    "west",
    "noreste",
    "northeast",
    "noroeste",
    "northwest",
    "sureste",
    "southeast",
    "suroeste",
    "southwest",
    "centro",
    "center",
    "medio",
    "middle",
    "mitad",
    "half",
    "parte",
    "part",
    "seccion",
    "section",
    "area",
    "zona",
    "region",
    "region",
    "pais",
    "country",
    "nacion",
    "nation",
    "estado",
    "state",
    "provincia",
    "province",
    "departamento",
    "department",
    "municipio",
    "municipality",
    "ciudad",
    "city",
    "pueblo",
    "town",
    "villa",
    "village",
    "aldea",
    "hamlet",
    "caserio",
    "settlement",
    "asentamiento",
    "colonia",
    "colony",
    "barrio",
    "neighborhood",
    "distrito",
    "district",
    "sector",
    "sector",
    "zona",
    "zone",
    "area",
    "area",
    "lugar",
    "place",
    "sitio",
    "site",
    "ubicacion",
    "location",
    "posicion",
    "position",
    "coordenadas",
    "coordinates",
    "latitud",
    "latitude",
    "longitud",
    "longitude",
    "altitud",
    "altitude",
    "elevacion",
    "elevation",
    "nivel",
    "level",
    "profundidad",
    "depth",
    "altura",
    "height",
    "ancho",
    "width",
    "largo",
    "length",
    "alto",
    "high",
    "bajo",
    "low",
    "grande",
    "big",
    "pequeño",
    "small",
    "mediano",
    "medium",
    "medio",
    "middle",
    "mitad",
    "half",
    "completo",
    "complete",
    "incompleto",
    "incomplete",
    "parcial",
    "partial",
    "total",
    "total",
    "entero",
    "whole",
    "fraction",
    "fraccion",
    "porcentaje",
    "percentage",
    "proporcion",
    "proportion",
    "ratio",
    "relacion",
    "relation",
    "conexion",
    "connection",
    "vinculo",
    "link",
    "enlace",
    "link",
    "union",
    "union",
    "separacion",
    "separation",
    "division",
    "division",
    "multiplicacion",
    "multiplication",
    "adicion",
    "addition",
    "sustraccion",
    "subtraction",
    "suma",
    "sum",
    "resta",
    "subtraction",
    "producto",
    "product",
    "cociente",
    "quotient",
    "resultado",
    "result",
    "solucion",
    "solution",
    "respuesta",
    "answer",
    "pregunta",
    "question",
    "interrogante",
    "interrogation",
    "duda",
    "doubt",
    "incertidumbre",
    "uncertainty",
    "certeza",
    "certainty",
    "seguridad",
    "security",
    "confianza",
    "confidence",
    "fe",
    "faith",
    "creencia",
    "belief",
    "conviccion",
    "conviction",
    "opinion",
    "opinion",
    "punto",
    "point",
    "vista",
    "view",
    "perspectiva",
    "perspective",
    "angulo",
    "angle",
    "enfoque",
    "focus",
    "concentracion",
    "concentration",
    "atencion",
    "attention",
    "interes",
    "interest",
    "curiosidad",
    "curiosity",
    "fascinacion",
    "fascination",
    "atraccion",
    "attraction",
    "repulsion",
    "repulsion",
    "rechazo",
    "rejection",
    "aceptacion",
    "acceptance",
    "aprobacion",
    "approval",
    "desaprobacion",
    "disapproval",
    "apoyo",
    "support",
    "oposicion",
    "opposition",
    "respaldo",
    "backing",
    "sustento",
    "sustenance",
    "fundamento",
    "foundation",
    "base",
    "base",
    "cimientos",
    "foundations",
    "estructura",
    "structure",
    "organizacion",
    "organization",
    "sistema",
    "system",
    "metodo",
    "method",
    "tecnica",
    "technique",
    "estrategia",
    "strategy",
    "tactica",
    "tactic",
    "plan",
    "plan",
    "proyecto",
    "project",
    "programa",
    "program",
    "iniciativa",
    "initiative",
    "propuesta",
    "proposal",
    "sugerencia",
    "suggestion",
    "recomendacion",
    "recommendation",
    "consejo",
    "advice",
    "orientacion",
    "guidance",
    "direccion",
    "direction",
    "rumbo",
    "course",
    "trayectoria",
    "trajectory",
    "camino",
    "path",
    "ruta",
    "route",
    "sendero",
    "trail",
    "vereda",
    "pathway",
    "calle",
    "street",
    "avenida",
    "avenue",
    "boulevard",
    "boulevard",
    "carretera",
    "highway",
    "autopista",
    "freeway",
    "autovia",
    "motorway",
    "carretera",
    "road",
    "camino",
    "way",
    "ruta",
    "route",
    "itinerario",
    "itinerary",
    "viaje",
    "trip",
    "travesia",
    "journey",
    "expedicion",
    "expedition",
    "aventura",
    "adventure",
    "exploracion",
    "exploration",
    "descubrimiento",
    "discovery",
    "hallazgo",
    "finding",
    "encuentro",
    "encounter",
    "reunion",
    "meeting",
    "conferencia",
    "conference",
    "congreso",
    "congress",
    "simposio",
    "symposium",
    "seminario",
    "seminar",
    "taller",
    "workshop",
    "curso",
    "course",
    "clase",
    "class",
    "leccion",
    "lesson",
    "enseñanza",
    "teaching",
    "aprendizaje",
    "learning",
    "estudio",
    "study",
    "investigacion",
    "research",
    "analisis",
    "analysis",
    "examen",
    "examination",
    "evaluacion",
    "evaluation",
    "valoracion",
    "assessment",
    "calificacion",
    "rating",
    "puntuacion",
    "scoring",
    "medicion",
    "measurement",
    "cuantificacion",
    "quantification",
    "estadistica",
    "statistics",
    "datos",
    "data",
    "informacion",
    "information",
    "conocimiento",
    "knowledge",
    "sabiduria",
    "wisdom",
    "inteligencia",
    "intelligence",
    "sabiduria",
    "wisdom",
    "erudicion",
    "erudition",
    "cultura",
    "culture",
    "civilizacion",
    "civilization",
    "sociedad",
    "society",
    "comunidad",
    "community",
    "poblacion",
    "population",
    "gente",
    "people",
    "personas",
    "persons",
    "individuos",
    "individuals",
    "seres",
    "beings",
    "humanos",
    "humans",
    "humanidad",
    "humanity",
    "mankind",
    "humanidad",
    "humanity",
    "raza",
    "race",
    "etnia",
    "ethnicity",
    "nacionalidad",
    "nationality",
    "ciudadania",
    "citizenship",
    "identidad",
    "identity",
    "personalidad",
    "personality",
    "caracter",
    "character",
    "temperamento",
    "temperament",
    "caracter",
    "character",
    "naturaleza",
    "nature",
    "esencia",
    "essence",
    "sustancia",
    "substance",
    "materia",
    "matter",
    "energia",
    "energy",
    "fuerza",
    "force",
    "poder",
    "power",
    "potencia",
    "potency",
    "capacidad",
    "capacity",
    "habilidad",
    "ability",
    "destreza",
    "skill",
    "talento",
    "talent",
    "genio",
    "genius",
    "inteligencia",
    "intelligence",
    "sabiduria",
    "wisdom",
    "conocimiento",
    "knowledge",
    "saber",
    "knowing",
    "entendimiento",
    "understanding",
    "comprension",
    "comprehension",
    "percepcion",
    "perception",
    "sensacion",
    "sensation",
    "sentimiento",
    "feeling",
    "emocion",
    "emotion",
    "pasion",
    "passion",
    "amor",
    "love",
    "odio",
    "hate",
    "ira",
    "anger",
    "rabia",
    "rage",
    "furia",
    "fury",
    "enojo",
    "annoyance",
    "molestia",
    "bother",
    "incomodidad",
    "discomfort",
    "dolor",
    "pain",
    "sufrimiento",
    "suffering",
    "agonia",
    "agony",
    "tormento",
    "torment",
    "tortura",
    "torture",
    "martirio",
    "martyrdom",
    "sacrificio",
    "sacrifice",
    "ofrenda",
    "offering",
    "donacion",
    "donation",
    "regalo",
    "gift",
    "presente",
    "present",
    "obsequio",
    "present",
    "sorpresa",
    "surprise",
    "sorpresa",
    "surprise",
    "asombro",
    "amazement",
    "maravilla",
    "wonder",
    "admiración",
    "admiration",
    "respeto",
    "respect",
    "honor",
    "honor",
    "dignidad",
    "dignity",
    "orgullo",
    "pride",
    "vanidad",
    "vanity",
    "arrogancia",
    "arrogance",
    "soberbia",
    "pride",
    "humildad",
    "humility",
    "modestia",
    "modesty",
    "sencillez",
    "simplicity",
    "naturalidad",
    "naturalness",
    "autenticidad",
    "authenticity",
    "sinceridad",
    "sincerity",
    "honestidad",
    "honesty",
    "veracidad",
    "veracity",
    "verdad",
    "truth",
    "realidad",
    "reality",
    "hecho",
    "fact",
    "evidencia",
    "evidence",
    "prueba",
    "proof",
    "testimonio",
    "testimony",
    "declaracion",
    "statement",
    "afirmacion",
    "affirmation",
    "negacion",
    "negation",
    "confirmacion",
    "confirmation",
    "verificacion",
    "verification",
    "validacion",
    "validation",
    "autenticacion",
    "authentication",
    "autorizacion",
    "authorization",
    "permiso",
    "permission",
    "licencia",
    "license",
    "patente",
    "patent",
    "copyright",
    "derechos",
    "rights",
    "privilegios",
    "privileges",
    "beneficios",
    "benefits",
    "ventajas",
    "advantages",
    "desventajas",
    "disadvantages",
    "inconvenientes",
    "inconveniences",
    "problemas",
    "problems",
    "dificultades",
    "difficulties",
    "obstaculos",
    "obstacles",
    "barreras",
    "barriers",
    "limites",
    "limits",
    "restricciones",
    "restrictions",
    "condiciones",
    "conditions",
    "requisitos",
    "requirements",
    "necesidades",
    "needs",
    "demandas",
    "demands",
    "solicitudes",
    "requests",
    "peticiones",
    "petitions",
    "reclamos",
    "claims",
    "quejas",
    "complaints",
    "protestas",
    "protests",
    "manifestaciones",
    "demonstrations",
    "marchas",
    "marches",
    "paradas",
    "strikes",
    "huelgas",
    "strikes",
    "boicots",
    "boycotts",
    "sanciones",
    "sanctions",
    "penalizaciones",
    "penalties",
    "multas",
    "fines",
    "castigos",
    "punishments",
    "recompensas",
    "rewards",
    "premios",
    "prizes",
    "reconocimientos",
    "recognitions",
    "distinciones",
    "distinctions",
    "honores",
    "honors",
    "medallas",
    "medals",
    "trofeos",
    "trophies",
    "certificados",
    "certificates",
    "diplomas",
    "diplomas",
    "titulos",
    "titles",
    "grados",
    "degrees",
    "niveles",
    "levels",
    "categorias",
    "categories",
    "clases",
    "classes",
    "tipos",
    "types",
    "clases",
    "classes",
    "grupos",
    "groups",
    "conjuntos",
    "sets",
    "colecciones",
    "collections",
    "series",
    "series",
    "secuencias",
    "sequences",
    "orden",
    "order",
    "organizacion",
    "organization",
    "estructura",
    "structure",
    "arquitectura",
    "architecture",
    "diseño",
    "design",
    "planificacion",
    "planning",
    "programacion",
    "programming",
    "codificacion",
    "coding",
    "encriptacion",
    "encryption",
    "decodificacion",
    "decoding",
    "desencriptacion",
    "decryption",
    "compresion",
    "compression",
    "descompresion",
    "decompression",
    "archivado",
    "archiving",
    "almacenamiento",
    "storage",
    "memoria",
    "memory",
    "recuerdo",
    "memory",
    "memoria",
    "memory",
    "recuerdo",
    "memory",
    "memoria",
    "memory",
    "recuerdo",
    "memory",
    "memoria",
    "memory",
    "recuerdo",
    "memory",
  ];
  
  // Filtrar solo medios tradicionales, excluir redes sociales
  const filteredArticles = articles.filter((article) => {
    const sourceName = article.source?.name?.toLowerCase() || "";
    const raw: any = article as any;
    const contentType = raw?.content_type;
    
    // Excluir por content_type primero (más confiable)
    if (contentType === "social post" || contentType === "social") {
      console.log(
        `  ❌ Excluido (content_type): ${article.title} | Tipo: ${contentType} | Fuente: ${article.source?.name}`
      );
      return false;
    }
    
    // Excluir redes sociales explícitamente por nombre de fuente
    const isExcludedSocial = excludedSources.some((excluded) =>
      sourceName.includes(excluded)
    );
    if (isExcludedSocial) {
      console.log(
        `  ❌ Excluido (fuente social): ${article.title} | Fuente: ${article.source?.name}`
      );
      return false;
    }
    
    // Incluir medios tradicionales reconocidos
    const isTraditionalSource = allowedTraditionalSources.some((traditional) =>
      sourceName.includes(traditional)
    );
    
    if (isTraditionalSource) {
      console.log(
        `  ✅ Incluido (medio tradicional): ${article.title} | Fuente: ${article.source?.name}`
      );
      return true;
    }
    
    // Excluir fuentes no reconocidas (solo medios tradicionales)
    console.log(
      `  ❌ Excluido (fuente no reconocida): ${article.title} | Fuente: ${article.source?.name}`
    );
    return false;
  });
  
  console.log(
    "  Artículos después de filtrar redes sociales:",
    filteredArticles.length
  );
  
  // Crear SocialEchoScore híbrido solo para medios tradicionales
  const articlesWithHybridSocialEcho = filteredArticles.map((article) => {
    const originalSocialEcho = article.socialEchoScore || 0;
    const engagement = article.engagementScore || 0;
    
    // Si no hay SocialEchoScore pero hay engagement, usar engagement como SocialEcho
    const hybridSocialEcho =
      originalSocialEcho > 0
        ? originalSocialEcho
        : engagement > 0
        ? engagement * 0.5
        : 0;
    
    return {
      ...article,
      hybridSocialEchoScore: hybridSocialEcho,
    };
  });
  
  // Separar artículos con y sin SocialEcho híbrido (solo medios tradicionales)
  const articlesWithSocialEcho = articlesWithHybridSocialEcho.filter(
    (article) => (article.hybridSocialEchoScore || 0) > 0
  );
  const articlesWithoutSocialEcho = articlesWithHybridSocialEcho.filter(
    (article) => (article.hybridSocialEchoScore || 0) === 0
  );

  console.log("  Artículos con SocialEcho:", articlesWithSocialEcho.length);
  console.log("  Artículos sin SocialEcho:", articlesWithoutSocialEcho.length);
  
  // Log detallado de SocialEcho híbrido
  console.log(
    "  📊 ANÁLISIS SOCIAL ECHO HÍBRIDO:",
    articlesWithHybridSocialEcho.length,
    "artículos"
  );
  
  // Log detallado de métricas de medios tradicionales
  console.log(
    "  📊 ANÁLISIS MÉTRICAS MEDIOS TRADICIONALES:",
    articlesWithoutSocialEcho.length,
    "artículos"
  );

  // Ordenar cada grupo por su métrica correspondiente
  const sortedWithSocialEcho = articlesWithSocialEcho.sort((a, b) => {
    const socialEchoA = a.hybridSocialEchoScore || 0;
    const socialEchoB = b.hybridSocialEchoScore || 0;
    return socialEchoB - socialEchoA;
  });
  
  // 3. Para artículos sin SocialEcho, usar métricas específicas de medios tradicionales
  const sortedWithoutSocialEcho = articlesWithoutSocialEcho.sort((a, b) => {
    // Priorizar por métricas de medios tradicionales
    const reachA = a.source?.metrics?.reach || 0;
    const reachB = b.source?.metrics?.reach || 0;
    
    const aveA = a.source?.metrics?.ave || 0;
    const aveB = b.source?.metrics?.ave || 0;
    
    const viewsA = a.metrics?.views || 0;
    const viewsB = b.metrics?.views || 0;
    
    // Calcular score compuesto para medios tradicionales
    const scoreA = reachA * 0.4 + aveA * 0.3 + viewsA * 0.3;
    const scoreB = reachB * 0.4 + aveB * 0.3 + viewsB * 0.3;
    
    return scoreB - scoreA;
  });

  // Combinar: primero los que tienen socialEchoScore, luego los de engagement
  const combinedArticles = [
    ...sortedWithSocialEcho,
    ...sortedWithoutSocialEcho,
  ];
  
  console.log("  Artículos combinados:", combinedArticles.length);

  // Filtrar duplicados
  const uniqueArticles = filterUniqueArticles(combinedArticles, shownArticles);
  
  console.log(
    "  Artículos únicos después de filtrar duplicados:",
    uniqueArticles.length
  );

  // Tomar el límite solicitado
  let result = uniqueArticles.slice(0, limit);
  
  console.log("  Resultado final antes de rellenar:", result.length);

  // Rellenar hasta 50 artículos: ser más permisivo para conseguir más artículos
  if (result.length < limit) {
    const selectedIds = new Set(result.map((a) => generateArticleId(a)));

    // 1) Intentar con más artículos filtrados por engagement
    const engagementCandidates = [...filteredArticles].sort(
      (a, b) => (b.engagementScore || 0) - (a.engagementScore || 0)
    );

    for (const candidate of engagementCandidates) {
      if (result.length >= limit) break;
      const id = generateArticleId(candidate);
      if (!selectedIds.has(id) && !shownArticles.has(id)) {
        result.push(candidate);
        selectedIds.add(id);
      }
    }

    // 2) Si aún faltan, usar artículos filtrados por ContentScore (más permisivo)
    let contentScoreCandidates: MeltwaterArticle[] = [];
    if (result.length < limit) {
      contentScoreCandidates = filteredArticles.sort((a, b) => {
          const scoreA = calculateContentScore(a, filteredArticles);
          const scoreB = calculateContentScore(b, filteredArticles);
          return scoreB - scoreA;
        });

      for (const candidate of contentScoreCandidates) {
        if (result.length >= limit) break;
        const id = generateArticleId(candidate);
        if (!selectedIds.has(id) && !shownArticles.has(id)) {
          result.push(candidate);
          selectedIds.add(id);
        }
      }
    }

    // 3) Si aún faltan, permitir duplicados para llegar a 50
    // if (result.length < limit) {
    //   for (const candidate of contentScoreCandidates) {
    //     if (result.length >= limit) break;
    //     const id = generateArticleId(candidate);
    //     if (!selectedIds.has(id)) {
    //       result.push(candidate);
    //       selectedIds.add(id);
    //     }
    //   }
    // }

    // 4) Como último recurso, usar cualquier artículo disponible
  //   if (result.length < limit) {
  //     for (const candidate of articles) {
  //       if (result.length >= limit) break;
  //       const id = generateArticleId(candidate);
  //       if (!selectedIds.has(id)) {
  //         result.push(candidate);
  //         selectedIds.add(id);
  //       }
  //     }
  //   }
  }

  console.log("  🎯 RESULTADO FINAL getUniqueTopPaisArticles:", result.length);
  console.log("  🎯 META: 50 artículos, RESULTADO:", result.length);

  return assignContentScores(result);
}

// Función específica para obtener artículos de redes sociales ordenados por engagement
function getUniqueSocialMediaArticles(
  articles: MeltwaterArticle[],
  shownArticles: Set<string>,
  limit: number = 500
): MeltwaterArticle[] {
  console.log("🔍 DEBUG getUniqueSocialMediaArticles - INICIANDO FUNCIÓN");
  console.log("  Total artículos de entrada:", articles.length);
  console.log("  Artículos ya mostrados:", shownArticles.size);
  
  // Dominios sociales reconocidos para URL
  const socialHosts = new Set([
    "twitter.com",
    "x.com",
    "instagram.com",
    "www.instagram.com",
    "facebook.com",
    "www.facebook.com",
    "m.facebook.com",
    "reddit.com",
    "www.reddit.com",
    "youtube.com",
    "www.youtube.com",
    "youtu.be",
    "tiktok.com",
    "www.tiktok.com",
    "threads.net",
    "www.threads.net",
    "linkedin.com",
    "www.linkedin.com",
    "x.com",
    "www.x.com",
    "snapchat.com",
    "www.snapchat.com",
    "pinterest.com",
    "www.pinterest.com",
    "telegram.org",
    "www.telegram.org",
    "whatsapp.com",
    "www.whatsapp.com",
    "discord.com",
    "www.discord.com",
    "twitch.tv",
    "www.twitch.tv",
    "vimeo.com",
    "www.vimeo.com",
    "flickr.com",
    "www.flickr.com",
    "tumblr.com",
    "www.tumblr.com",
    "medium.com",
    "www.medium.com",
    "quora.com",
    "www.quora.com",
  ]);

  const getHost = (url?: string) => {
    if (!url) return "";
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return "";
    }
  };

  // Extra: detección por dominio en el objeto source si lo expone Meltwater
  const getSourceDomain = (article: MeltwaterArticle) => {
    const raw: any = article as any;
    const d: string | undefined =
      raw?.source?.domain || raw?.source_domain || raw?.domain;
    return (d || "").toLowerCase();
  };

  // Debug: Log de detección de redes sociales
  console.log("🔍 DEBUG REDES SOCIALES:");
  console.log(`  Total artículos: ${articles.length}`);
  
  // Debug detallado de cada artículo (solo números)
  
  const socialMediaArticles = articles.filter(isSocialMediaArticle);
  
  // Filtrar posts sociales con datos básicos (EXTREMADAMENTE permisivo)
  const completeSocialArticles = socialMediaArticles.filter((article) => {
    const hasValidTitle = article.title && article.title.trim().length > 0;
    const hasValidDescription =
      article.description && article.description.trim().length > 0;
    const hasValidImage =
      article.urlToImage && article.urlToImage !== "/placeholder.svg";
    const hasValidUrl = article.url && article.url.trim().length > 0;
    const hasEngagement = (article.engagementScore || 0) > 0;
    const hasSocialEcho = (article.socialEchoScore || 0) > 0;
    
    // EXTREMADAMENTE permisivo: incluir cualquier artículo social
    return (
      hasValidTitle ||
      hasValidDescription ||
      hasValidImage ||
      hasValidUrl ||
      hasEngagement ||
      hasSocialEcho ||
      true
    );
  });
  
  console.log(`  Artículos sociales detectados: ${socialMediaArticles.length}`);
  console.log(
    `  Artículos sociales completos: ${completeSocialArticles.length}`
  );
  console.log("  Fuentes sociales detectadas:", [
    ...new Set(socialMediaArticles.map((a) => a.source.name)),
  ]);
  console.log(
    "  URLs de redes sociales:",
    socialMediaArticles.slice(0, 100).map((a) => a.url)
  );
  
  // Debug: Analizar por qué se filtran artículos
  const filteredOut = socialMediaArticles.filter((article) => {
    const hasValidTitle =
      article.title &&
      article.title.trim().length > 1 &&
      !article.title.includes("Post sobre:") &&
      !article.title.includes("Post de");
    const hasValidDescription =
      article.description && article.description.trim().length > 1;
    const hasValidImage =
      article.urlToImage && article.urlToImage !== "/placeholder.svg";
    const hasValidUrl = article.url && article.url.trim().length > 5;
    
    return !(
      hasValidTitle ||
      hasValidDescription ||
      hasValidImage ||
      hasValidUrl
    );
  });
  
  if (filteredOut.length > 0) {
    console.log(
      `  Artículos filtrados por datos incompletos: ${filteredOut.length}`
    );
  }
  
  // Debug: Verificar que NO hay medios tradicionales en la selección
  const traditionalInSocial = socialMediaArticles.filter((a) => {
    const sourceName = a.source?.name?.toLowerCase() || "";
    const traditionalKeywords = [
      "diario",
      "newspaper",
      "news",
      "radio",
      "tv",
      "television",
      "magazine",
      "journal",
      "press",
      "media",
      "clarin",
      "lanacion",
      "infobae",
      "bbc",
      "cnn",
      "reuters",
    ];
    return traditionalKeywords.some((traditional) =>
      sourceName.includes(traditional)
    );
  });
  
  if (traditionalInSocial.length > 0) {
    console.log(
      "  ⚠️  ADVERTENCIA: Se detectaron medios tradicionales en redes sociales:",
      traditionalInSocial.length
    );
  } else {
    console.log(
      "  ✅ No se detectaron medios tradicionales en la selección de redes sociales"
    );
  }

  // Ordenar únicamente por engagement (usar solo los completos)
  const sortedArticles = completeSocialArticles.sort((a, b) => {
    const engagementA = a.engagementScore || 0;
    const engagementB = b.engagementScore || 0;
    return engagementB - engagementA; // Orden descendente (mayor engagement primero)
  });

  // Filtrar duplicados
  const uniqueArticles = filterUniqueArticles(sortedArticles, shownArticles);

  // Tomar el límite solicitado
  let result = uniqueArticles.slice(0, limit);

  // Rellenar hasta el límite SOLO con artículos de redes sociales
  if (result.length < limit) {
    const selectedIds = new Set(result.map((a) => generateArticleId(a)));

    // 1) Intentar con más posts sociales completos ordenados por engagement
    const moreSocialCandidates = [...completeSocialArticles].sort(
      (a, b) => (b.engagementScore || 0) - (a.engagementScore || 0)
    );

    for (const candidate of moreSocialCandidates) {
      if (result.length >= limit) break;
      const id = generateArticleId(candidate);
      if (!selectedIds.has(id) && !shownArticles.has(id)) {
        result.push(candidate);
        selectedIds.add(id);
      }
    }

    // 2) Si aún faltan, usar TODOS los artículos sociales por engagement
    if (result.length < limit) {
      const allSocialCandidates = [...socialMediaArticles].sort(
        (a, b) => (b.engagementScore || 0) - (a.engagementScore || 0)
      );
      
      for (const candidate of allSocialCandidates) {
        if (result.length >= limit) break;
        const id = generateArticleId(candidate);
        if (!selectedIds.has(id) && !shownArticles.has(id)) {
          result.push(candidate);
          selectedIds.add(id);
        }
      }
    }

    // 3) Si aún faltan, permitir duplicados sociales (pero SOLO redes sociales)
    if (result.length < limit) {
      const allSocialCandidates = [...socialMediaArticles].sort(
        (a, b) => (b.engagementScore || 0) - (a.engagementScore || 0)
      );
      
      for (const candidate of allSocialCandidates) {
        if (result.length >= limit) break;
        const id = generateArticleId(candidate);
        if (!selectedIds.has(id)) {
          result.push(candidate);
          selectedIds.add(id);
        }
      }
    }
  }

  console.log(
    "  🎯 RESULTADO FINAL getUniqueSocialMediaArticles:",
    result.length
  );
  console.log("  🎯 META: 50 artículos, RESULTADO:", result.length);

  return assignContentScores(result);
}

// Función para calcular métricas relevantes basadas en la API de Meltwater
function calculateRelevantMetrics(articles: MeltwaterArticle[]) {
  // Ordenar artículos por ContentScore para priorizar los más importantes
  const sortedArticles = sortArticlesByContentScore(articles);

  // 1. ENGAGEMENT TOTAL - La métrica más importante para medir interacción
  const totalEngagement = articles.reduce(
    (sum, article) => sum + (article.engagementScore || 0),
    0
  );

  // 2. ALCANCE TOTAL - Cuántas personas ven el contenido
  const totalReach = articles.reduce((sum, article) => {
    // Usar el reach del source si está disponible, sino aproximar con engagement
    const sourceReach = article.source?.metrics?.reach || 0;
    return (
      sum +
      (sourceReach > 0 ? sourceReach : (article.engagementScore || 0) * 10)
    );
  }, 0);

  // 3. NÚMERO DE ARTÍCULOS - Cantidad total de contenido monitoreado
  const totalArticles = articles.length;

  // 4. SENTIMIENTO PROMEDIO - Análisis de opinión pública
  const sentimentData = articles.reduce(
    (acc, article) => {
    const sentiment = article.enrichments?.sentiment;
    if (sentiment) {
      acc.count++;
        acc.score +=
          sentiment === "positive" ? 1 : sentiment === "negative" ? -1 : 0;
    }
    return acc;
    },
    { count: 0, score: 0 }
  );

  const avgSentiment =
    sentimentData.count > 0 ? sentimentData.score / sentimentData.count : 0;

  // 5. FUENTES MONITOREADAS - Diversidad de cobertura
  const uniqueSources = new Set(articles.map((article) => article.source.name))
    .size;

  // 6. TEMAS PRINCIPALES - Keywords más frecuentes
  const topKeywords = articles
    .flatMap((article) => article.enrichments?.keyphrases || [])
    .reduce((acc, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const mostFrequentKeyword = Object.keys(topKeywords).reduce(
    (a, b) => (topKeywords[a] > topKeywords[b] ? a : b),
    "Sin datos"
  );

  return {
    totalEngagement: Math.max(totalEngagement, 0),
    totalReach: Math.max(totalReach, 0),
    totalArticles: Math.max(totalArticles, 0),
    avgSentiment,
    uniqueSources: Math.max(uniqueSources, 0),
    topTopic: mostFrequentKeyword,
    sortedArticles: sortedArticles.slice(0, 500), // Top 500 artículos por ContentScore
  };
}

// Funciones auxiliares para formatear métricas
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function getSentimentColor(sentiment: number): string {
  if (sentiment > 0.1) return "text-green-400";
  if (sentiment < -0.1) return "text-red-400";
  return "text-yellow-400";
}

function getSentimentLabel(sentiment: number): string {
  if (sentiment > 0.1) return "Positivo";
  if (sentiment < -0.1) return "Negativo";
  return "Neutral";
}

// Función para obtener el país desde la configuración
async function getCountryName(
  articles: MeltwaterArticle[] = []
): Promise<string> {
  try {
    const response = await axios.get(
      buildApiUrl(API_CONFIG.ENDPOINTS.DEFAULT_CONFIG)
    );
    if (response.data.success && response.data.config.defaultCountrySearchId) {
      // Intentar inferir el país desde los artículos si están disponibles
      if (articles.length > 0) {
        const countries = articles
          .map((article) => article.location?.country_code)
          .filter((code) => code && code !== "zz") // Filtrar códigos válidos
          .reduce((acc, code) => {
            acc[code] = (acc[code] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

        const mostCommonCountry = Object.keys(countries).reduce(
          (a, b) => (countries[a] > countries[b] ? a : b),
          ""
        );

        if (mostCommonCountry) {
          // Mapear códigos de país a nombres
          const countryNames: Record<string, string> = {
            es: "España",
            mx: "México",
            ar: "Argentina",
            co: "Colombia",
            ec: "Ecuador",
            pe: "Perú",
            cl: "Chile",
            uy: "Uruguay",
            py: "Paraguay",
            bo: "Bolivia",
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
  const [allArticles, setAllArticles] = useState<MeltwaterArticle[]>([]); // Artículos originales sin filtrar
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalEngagement: 0,
    totalReach: 0,
    totalArticles: 0,
    avgSentiment: 0,
    uniqueSources: 0,
    topTopic: "Sin datos",
  });
  const [countryName, setCountryName] = useState("País");
  const [searchName, setSearchName] = useState<string | null>(null);
  const [shownArticles, setShownArticles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true);
        // Manejar URLs limpias y parámetros tradicionales
        const urlParams = new URLSearchParams(window.location.search);
        const emailParam = urlParams.get("email");
        let countryId = urlParams.get("countryId");
        let sectorId = urlParams.get("sectorId");
        let searchName = urlParams.get("searchName");
        
        // Si no hay parámetros en query, verificar si es una URL limpia
        if (!countryId && !sectorId) {
          const pathname = window.location.pathname;
          
          // Si hay un pathname personalizado (ej: /busqueda-personalizada-imm)
          if (pathname && pathname !== "/" && pathname !== "/index.html") {
            // Extraer nombre de búsqueda del pathname
            const cleanPath = pathname.replace(/^\//, "").replace(/\/$/, "");
            
            // Si es una búsqueda personalizada, extraer el nombre
            if (cleanPath.startsWith("busqueda-personalizada-")) {
              const searchNameFromPath = cleanPath.replace(
                "busqueda-personalizada-",
                ""
              );
              searchName = searchNameFromPath
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase());
              setSearchName(searchName);
              
              // Obtener IDs técnicos desde el backend
              try {
                const searchResponse = await axios.get(
                  `${buildApiUrl(
                    API_CONFIG.ENDPOINTS.SEARCHES_BY_NAME
                  )}/${searchNameFromPath}`
                );
                if (searchResponse.data.success) {
                  countryId = searchResponse.data.search.countrySearchId;
                  sectorId = searchResponse.data.search.sectorSearchId;
                }
              } catch (error) {
                console.warn(
                  "No se pudo obtener la búsqueda por nombre:",
                  error
                );
              }
            } else {
              // Para otros formatos, usar lógica anterior
              searchName = cleanPath
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase());
              setSearchName(searchName);
            }
          }
        }

        // Si hay parámetros de URL, usarlos directamente
        if (countryId || sectorId) {
          // Guardar el nombre de la búsqueda si está disponible
          if (searchName) {
            setSearchName(searchName);
          }
          const response = await postWithRetry(
            buildApiUrl(API_CONFIG.ENDPOINTS.NEWS_PERSONALIZED),
            {
            countryId,
            sectorId,
              limit: 500, // Solicitar 500 artículos para cada sección
            }
          );

          if (response.data.success) {
            // Log de la respuesta de la API
            console.log("📊 Total sector:", response.data.sector?.length || 0);
            console.log("📊 Total país:", response.data.pais?.length || 0);
            
            // ARRAY COMPLETO DE ARTÍCULOS DESDE LA API
            console.log("\n📋 ARRAY COMPLETO DE ARTÍCULOS - SECTOR (desde API):");
            console.log(JSON.stringify(response.data.sector || [], null, 2));
            console.log("\n📋 ARRAY COMPLETO DE ARTÍCULOS - PAÍS (desde API):");
            console.log(JSON.stringify(response.data.pais || [], null, 2));
            
            const sectorData = adaptResults(response.data.sector, true); // Incluir redes sociales
            const paisData = adaptResults(response.data.pais, true); // Incluir redes sociales
            
            // Log de los datos después de adaptResults
            
            setSectorArticles(sectorData);
            setPaisArticles(paisData);
            console.log(
              "🔍 ANTES DE setAllArticles - sectorData.length:",
              sectorData.length,
              "paisData.length:",
              paisData.length
            );
            setAllArticles([...sectorData, ...paisData]); // Guardar artículos originales sin filtrar
            console.log(
              "🔍 DESPUÉS DE setAllArticles - Total artículos:",
              [...sectorData, ...paisData].length
            );
            console.log(
              "🔍 DESPUÉS DE setAllArticles - Posts sociales detectados:",
              [...sectorData, ...paisData].filter(
                (a) => (a as any)?.content_type === "social post"
              ).length
            );

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
          const response = await postWithRetry(
            buildApiUrl(API_CONFIG.ENDPOINTS.NEWS_PERSONALIZED),
            {
            email,
              limit: 500, // Solicitar 500 artículos para cada sección
              includeSocial: true, // Incluir redes sociales para el panel social
            }
          );
          if (response.data.success) {
            // Log de la respuesta de la API
            console.log("📊 Total sector:", response.data.sector?.length || 0);
            console.log("📊 Total país:", response.data.pais?.length || 0);
            
            // ARRAY COMPLETO DE ARTÍCULOS DESDE LA API
            console.log("\n📋 ARRAY COMPLETO DE ARTÍCULOS - SECTOR (desde API):");
            console.log(JSON.stringify(response.data.sector || [], null, 2));
            console.log("\n📋 ARRAY COMPLETO DE ARTÍCULOS - PAÍS (desde API):");
            console.log(JSON.stringify(response.data.pais || [], null, 2));
            
            const sectorData = adaptResults(response.data.sector, true); // Incluir redes sociales
            const paisData = adaptResults(response.data.pais, true); // Incluir redes sociales
            
            // Log de los datos después de adaptResults
            
            setSectorArticles(sectorData);
            setPaisArticles(paisData);
            console.log(
              "🔍 ANTES DE setAllArticles - sectorData.length:",
              sectorData.length,
              "paisData.length:",
              paisData.length
            );
            setAllArticles([...sectorData, ...paisData]); // Guardar artículos originales sin filtrar
            console.log(
              "🔍 DESPUÉS DE setAllArticles - Total artículos:",
              [...sectorData, ...paisData].length
            );
            console.log(
              "🔍 DESPUÉS DE setAllArticles - Posts sociales detectados:",
              [...sectorData, ...paisData].filter(
                (a) => (a as any)?.content_type === "social post"
              ).length
            );

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
        const response = await postWithRetry(
          buildApiUrl(API_CONFIG.ENDPOINTS.NEWS_PERSONALIZED),
          {
          email: "default",
            includeSocial: true, // Incluir redes sociales para el panel social
          }
        );
        
        if (response.data.success) {
          // Log de la respuesta de la API
          console.log("📊 Total sector:", response.data.sector?.length || 0);
          console.log("📊 Total país:", response.data.pais?.length || 0);
          
          // ARRAY COMPLETO DE ARTÍCULOS DESDE LA API
          console.log("\n📋 ARRAY COMPLETO DE ARTÍCULOS - SECTOR (desde API):");
          console.log(JSON.stringify(response.data.sector || [], null, 2));
          console.log("\n📋 ARRAY COMPLETO DE ARTÍCULOS - PAÍS (desde API):");
          console.log(JSON.stringify(response.data.pais || [], null, 2));
          
          const sectorData = adaptResults(response.data.sector, true); // Incluir redes sociales
          const paisData = adaptResults(response.data.pais, true); // Incluir redes sociales
          
          // Log de los datos después de adaptResults
          
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
              <h1 className="tech-title text-5xl mb-4">NEWSROOM</h1>
              <p className="tech-subtitle text-xl mb-4">
                Media & Social Dynamics Suite
              </p>
            </div>
          </div>
        </header>

        <main className="dashboard-container">
          {/* Skeleton para Sector */}
          <SectionSkeleton 
            title="Noticias del Sector"
            showDescription={true}
            articleCount={10}
          />

          {/* Skeleton para País */}
          <SectionSkeleton 
            title="Noticias del País"
            showDescription={true}
            articleCount={10}
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
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">
            Error al cargar noticias
          </h2>
          <p className="text-gray-300 mb-6">
            Intenta recargar la página o verifica tu conexión a internet
          </p>
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
            <svg
              className="w-8 h-8 text-orange-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">
            No hay noticias disponibles
          </h2>
          <p className="text-gray-300">
            En este momento no hay contenido disponible para mostrar
          </p>
        </div>
      </div>
    );

  const paisEngagement = paisArticles.filter(
    (a) => a.engagementScore !== undefined
  );
  const paisEcoSocial = paisArticles.filter(
    (a) => a.socialEchoScore !== undefined
  );
  
  // Logs generales de datos disponibles
  console.log("📊 DATOS DISPONIBLES:");
  console.log(`  Sector: ${sectorArticles.length} artículos`);
  console.log(`  País: ${paisArticles.length} artículos`);
  console.log(`  País con Engagement: ${paisEngagement.length} artículos`);
  console.log(`  País con SocialEcho: ${paisEcoSocial.length} artículos`);
  
  // Log de fuentes disponibles
  const sectorSources = [...new Set(sectorArticles.map((a) => a.source.name))];
  const paisSources = [...new Set(paisArticles.map((a) => a.source.name))];
  console.log("📰 FUENTES SECTOR:", sectorSources.length);
  console.log("📰 FUENTES PAÍS:", paisSources.length);

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
          <div className="relative">
            {/* Botón de admin en posición absoluta */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
              <a 
                href="/admin" 
                className="admin-button"
                title="Panel de Administración"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="hidden sm:inline">Admin</span>
              </a>
            </div>
            
            {/* Título centrado */}
            <h1 className="dashboard-title">NEWSROOM</h1>
            <p className="dashboard-subtitle">
              {searchName
                ? `Búsqueda: ${searchName}`
                : "Media & Social Dynamics Suite"}
            </p>
          </div>
        </div>
      </header>

      <main className="dashboard-container">
        {/* TOP 50 Temas - Sector */}
        {sectorArticles.length > 0 && (
          <div className="news-section">
            <div className="section-header-dashboard">
              <div className="section-icon-dashboard">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <h2 className="section-title-dashboard">
                  TOP 50 Contenido - Sector
                </h2>
                <p className="section-description">
                  Las noticias más relevantes ordenadas por ContentScore
                  (alcance, engagement, impacto)
                </p>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-transparent">
              <NewsList
                articles={(() => {
                // Sección 1: Sector (ContentScore)
                  console.log("🔵 DEBUG SECTOR - Estado inicial:");
                  console.log(
                    `  📊 sectorArticles disponibles: ${sectorArticles.length}`
                  );
                console.log(`  📊 shownArticles.size: ${shownArticles.size}`);

                // Panel Sector: Incluir TODAS las noticias (ajuste temporal)
                  console.log(
                    `  📊 sectorArticles totales: ${sectorArticles.length}`
                  );

                  const dynamicLimit = calculateDynamicLimit(
                    sectorArticles.length,
                    500
                  );
                  const articles = getUniqueTopArticles(
                    sectorArticles,
                    shownArticles,
                    dynamicLimit
                  );
                // Marcar como mostrados para evitar duplicados con las siguientes secciones
                markShown(shownArticles, articles);
                  console.log(
                    "🔵 TOP 50 SECTOR - Artículos mostrados:",
                    articles.length
                  );
                return articles;
                })()}
                title="Noticias Sectoriales"
              />
            </div>
          </div>
        )}

        {/* Nube de Palabras - Sector */}
        {sectorArticles.length > 0 &&
          (() => {
          const freqMap = new Map<string, number>();
          const addWords = (words?: string[]) => {
            if (!words) return;
            for (const w of words) {
              if (!w) continue;
              const key = w.toLowerCase();
              freqMap.set(key, (freqMap.get(key) || 0) + 1);
            }
          };
          // tomar keyphrases del sector, con fallback a títulos y descripciones
            sectorArticles.forEach((a) => {
              if (
                a.enrichments?.keyphrases &&
                a.enrichments.keyphrases.length > 0
              ) {
              addWords(a.enrichments.keyphrases);
            } else {
              // Extraer palabras del título y descripción como fallback
                const titleWords = extractWordsFromText(a.title || "");
                const descWords = extractWordsFromText(a.description || "");
              addWords([...titleWords, ...descWords]);
            }
          });
            const words: WordFrequency[] = Array.from(freqMap.entries()).map(
              ([word, count]) => ({ word, count })
            );
          if (words.length === 0) return null;
          return (
            <div className="news-section">
              <div className="section-header-dashboard">
                <div className="section-icon-dashboard">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5h18M3 12h18M3 19h18"
                      />
                  </svg>
                </div>
                <div>
                    <h2 className="section-title-dashboard">
                      Nube de Palabras - Sector
                    </h2>
                    <p className="section-description">
                      Palabras clave más mencionadas en noticias sectoriales;
                      mayor tamaño indica mayor relevancia
                    </p>
                </div>
              </div>
              <WordCloud words={words} maxWords={40} />
            </div>
          );
        })()}

        {/* TOP 50 Contenido - País */}
        {paisArticles.length > 0 && (
          <div className="news-section">
            <div className="section-header-dashboard">
              <div className="section-icon-dashboard">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="section-title-dashboard">
                  TOP 50 Contenido - {countryName}
                </h2>
                <p className="section-description">
                  Las noticias más impactantes de medios tradicionales del país
                  ordenadas por Social Echo Score (eco social, engagement como
                  fallback). Excluye redes sociales.
                </p>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-transparent">
              <NewsList
                articles={(() => {
                  console.log(
                    "🚀 INICIANDO getUniqueTopPaisArticles con:",
                    paisArticles.length,
                    "artículos del país"
                  );
                // Sección 2: País - Mostrar artículos del país (medios tradicionales) ordenados por SocialEcho/ContentScore
                  const dynamicLimit = calculateDynamicLimit(
                    paisArticles.length,
                    500
                  );
                  const articles = getUniqueTopPaisArticles(
                    paisArticles,
                    shownArticles,
                    dynamicLimit
                  );
                // Marcar como mostrados para evitar duplicados con la sección de redes
                markShown(shownArticles, articles);
                  console.log(
                    "🟢 TOP 50 PAÍS - Artículos mostrados:",
                    articles.length
                  );
                return articles;
                })()}
                title="Noticias del País"
              />
            </div>
            </div>
          )}

        {/* Nube de Palabras - País */}
        {paisArticles.length > 0 &&
          (() => {
          const freqMap = new Map<string, number>();
          const addWords = (words?: string[]) => {
            if (!words) return;
            for (const w of words) {
              if (!w) continue;
              const key = w.toLowerCase();
              freqMap.set(key, (freqMap.get(key) || 0) + 1);
            }
          };
          
          // Extraer palabras de títulos y contenido si no hay keyphrases
          const extractWordsFromText = (text: string) => {
            if (!text) return [];
            return text
              .toLowerCase()
                .replace(/[^\w\s]/g, " ")
              .split(/\s+/)
                .filter(
                  (word) =>
                    word.length > 3 &&
                    ![
                      "para",
                      "con",
                      "del",
                      "las",
                      "los",
                      "una",
                      "uno",
                      "que",
                      "por",
                      "sus",
                      "son",
                      "más",
                      "como",
                      "esta",
                      "este",
                      "pero",
                      "también",
                      "puede",
                      "ser",
                      "hacer",
                      "tener",
                      "hacer",
                      "decir",
                      "saber",
                      "ver",
                      "dar",
                      "ir",
                      "venir",
                      "estar",
                      "haber",
                      "poder",
                      "querer",
                      "deber",
                      "parecer",
                      "quedar",
                      "hablar",
                      "llegar",
                      "pasar",
                      "seguir",
                      "encontrar",
                      "pensar",
                      "vivir",
                      "sentir",
                      "tratar",
                      "mirar",
                      "ayudar",
                      "trabajar",
                      "jugar",
                      "mover",
                      "parar",
                      "empezar",
                      "acabar",
                      "volver",
                      "entrar",
                      "salir",
                      "subir",
                      "bajar",
                      "cambiar",
                      "buscar",
                      "encontrar",
                      "perder",
                      "ganar",
                      "creer",
                      "saber",
                      "conocer",
                      "entender",
                      "aprender",
                      "enseñar",
                      "estudiar",
                      "leer",
                      "escribir",
                      "hablar",
                      "escuchar",
                      "ver",
                      "mirar",
                      "sentir",
                      "tocar",
                      "oler",
                      "gustar",
                      "preferir",
                      "elegir",
                      "decidir",
                      "aceptar",
                      "rechazar",
                      "permitir",
                      "prohibir",
                      "obligar",
                      "forzar",
                      "convencer",
                      "persuadir",
                      "intentar",
                      "lograr",
                      "conseguir",
                      "obtener",
                      "recibir",
                      "dar",
                      "ofrecer",
                      "presentar",
                      "mostrar",
                      "explicar",
                      "describir",
                      "contar",
                      "narrar",
                      "relatar",
                      "informar",
                      "comunicar",
                      "expresar",
                      "manifestar",
                      "declarar",
                      "afirmar",
                      "negar",
                      "confirmar",
                      "desmentir",
                      "admitir",
                      "reconocer",
                      "confesar",
                      "ocultar",
                      "esconder",
                      "mostrar",
                      "revelar",
                      "descubrir",
                      "encontrar",
                      "buscar",
                      "investigar",
                      "estudiar",
                      "analizar",
                      "examinar",
                      "revisar",
                      "verificar",
                      "comprobar",
                      "confirmar",
                      "validar",
                      "aprobar",
                      "rechazar",
                      "aceptar",
                      "recibir",
                      "tomar",
                      "coger",
                      "agarrar",
                      "sostener",
                      "mantener",
                      "conservar",
                      "guardar",
                      "almacenar",
                      "depositar",
                      "colocar",
                      "poner",
                      "situar",
                      "ubicar",
                      "localizar",
                      "encontrar",
                      "buscar",
                      "hallar",
                      "descubrir",
                      "encontrar",
                      "detectar",
                      "percibir",
                      "notar",
                      "observar",
                      "ver",
                      "mirar",
                      "contemplar",
                      "admirar",
                      "apreciar",
                      "valorar",
                      "estimar",
                      "considerar",
                      "pensar",
                      "reflexionar",
                      "meditar",
                      "contemplar",
                      "considerar",
                      "evaluar",
                      "juzgar",
                      "valorar",
                      "apreciar",
                      "estimar",
                      "considerar",
                      "tener",
                      "poseer",
                      "disponer",
                      "contar",
                      "disponer",
                      "tener",
                      "poseer",
                      "ser",
                      "estar",
                      "haber",
                      "existir",
                      "vivir",
                      "morir",
                      "nacer",
                      "crecer",
                      "desarrollar",
                      "evolucionar",
                      "cambiar",
                      "transformar",
                      "convertir",
                      "volver",
                      "regresar",
                      "retornar",
                      "volver",
                      "regresar",
                      "retornar",
                      "volver",
                      "regresar",
                      "retornar",
                    ].includes(word)
                )
              .slice(0, 60); // Limitar a 60 palabras por artículo
          };
          
          // Intentar usar keyphrases primero, luego extraer de títulos y descripciones
            paisArticles.forEach((a) => {
              if (
                a.enrichments?.keyphrases &&
                a.enrichments.keyphrases.length > 0
              ) {
              addWords(a.enrichments.keyphrases);
            } else {
              // Extraer palabras del título y descripción
                const titleWords = extractWordsFromText(a.title || "");
                const descWords = extractWordsFromText(a.description || "");
              addWords([...titleWords, ...descWords]);
            }
          });
          
            const words: WordFrequency[] = Array.from(freqMap.entries()).map(
              ([word, count]) => ({ word, count })
            );
          
          // Debug para nubes de palabras
            console.log("🔍 DEBUG NUBE DE PALABRAS:");
          console.log(`  📊 Artículos del país: ${paisArticles.length}`);
          console.log(`  📊 Palabras extraídas: ${words.length}`);
          console.log(`  📊 Primeras 100 palabras:`, words.length);
          
          if (words.length === 0) {
              console.log("⚠️  No hay palabras para nube de palabras");
            return null;
          }
          return (
            <div className="news-section">
              <div className="section-header-dashboard">
                <div className="section-icon-dashboard">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5h18M3 12h18M3 19h18"
                      />
                  </svg>
                </div>
                <div>
                    <h2 className="section-title-dashboard">
                      Nube de Palabras - País
                    </h2>
                    <p className="section-description">
                      Palabras clave más mencionadas en noticias del país; mayor
                      tamaño indica mayor relevancia
                    </p>
                </div>
              </div>
              <WordCloud words={words} maxWords={40} />
            </div>
          );
        })()}

        {/* Contenido Más Relevante */}
        {paisArticles.length > 0 && (
          <div className="news-section">
            <div className="section-header-dashboard">
              <div className="section-icon-dashboard">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="section-title-dashboard">
                  Contenido Más Relevante
                </h2>
                <p className="section-description">
                  Contenido de redes sociales (Instagram, Facebook, Twitter/X,
                  Reddit, YouTube) ordenado por engagement para identificar
                  oportunidades de HOT NEWS
                </p>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-transparent">
              <div className="news-grid-dashboard">
                {(() => {
                  // Sección 3: Redes Sociales - Solo artículos de redes sociales del país
                  const dynamicLimit = calculateSocialMediaLimit(
                    paisArticles.length,
                    500
                  );
                  const combinedForSocial = [
                    ...sectorArticles,
                    ...paisArticles,
                  ];
                  console.log(
                    "🔍 DEBUG PANEL SOCIAL - combinedForSocial.length:",
                    combinedForSocial.length
                  );
                  const articles = getUniqueSocialMediaArticles(
                    combinedForSocial,
                    shownArticles,
                    dynamicLimit
                  );
                  console.log(
                    "🔴 TOP 50 REDES SOCIALES - Artículos mostrados:",
                    articles.length
                  );
                  return articles;
                })().map((article, index) => (
                  <a
                    key={`${article.url}-${index}`}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="news-card-dashboard"
                  >
                    <img
                      src={article.urlToImage || "/placeholder.svg"}
                      alt={article.title}
                      className="news-image-dashboard"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg";
                      }}
                    />
                    <div className="news-content-dashboard">
                      <h3 className="news-title-dashboard">{article.title}</h3>
                      <p className="news-description-dashboard">
                        {article.description}
                      </p>
                      <div className="news-meta-dashboard">
                        <span className="news-source-dashboard">
                          {article.source.name}
                        </span>
                        <span>
                          {new Date(article.publishedAt).toLocaleDateString(
                            "es-ES"
                          )}
                        </span>
                      </div>
                      {index < 2 && (
                        <span className="news-tag">Actualidad</span>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
