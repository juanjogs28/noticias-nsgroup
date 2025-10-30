import { buildApiUrl, API_CONFIG } from '@/config/api';

// Nueva interfaz para la estructura de datos de Meltwater
export interface MeltwaterDocument {
  author: {
    external_id: string;
    handle: string | null;
    name: string | null;
    profile_url: string | null;
  };
  content: {
    byline: string | null;
    emojis: string[] | null;
    hashtags: string[] | null;
    image: string | null;
    links: string[] | null;
    mentions: string[] | null;
    opening_text: string | null;
    title: string | null;
  };
  content_type: string;
  custom: {
    custom_categories: string[] | null;
    custom_fields: any | null;
    hidden: boolean;
    tags: string[] | null;
    visible: string;
  };
  enrichments: {
    keyphrases: string[] | null;
    language_code: string;
    sentiment: string;
  };
  external_id: string;
  id: string;
  indexed_date: string;
  location: {
    city: string | null;
    country_code: string;
    geo: {
      latitude: number;
      longitude: number;
    };
    region: string | null;
    state: string | null;
  };
  matched: {
    hit_sentence: string | null;
    inputs: Array<{
      id: number;
      name: string;
      type: string;
    }>;
    keywords: string[];
  };
  metrics: {
    editorial_echo: any | null;
    engagement: {
      comments: number | null;
      likes: number;
      quotes: number;
      reactions: number;
      replies: number;
      reposts: number;
      shares: number;
      total: number;
    };
    estimated_views: number | null;
    social_echo: {
      facebook: any | null;
      reddit: any | null;
      total: any | null;
      x: any | null;
    };
    views: number;
  };
  parent: {
    url: string | null;
  };
  published_date: string;
  source: {
    id: string;
    information_type: string;
    metrics: {
      ave: number;
      national_viewership: number | null;
      reach: number;
      reach_desktop: number | null;
      reach_mobile: number | null;
    };
    name: string;
    outlet_types: string[] | null;
    type: string;
    url: string | null;
  };
  thread: {
    title: string | null;
    url: string | null;
  };
  url: string | null;
}

export interface MeltwaterResponse {
  documents: MeltwaterDocument[];
  request: {
    count: number;
    status: string;
    company_id: string;
    period: {
      start: string;
      end: string;
    };
    inputs: Array<{
      type: string;
      name: string;
      id: number;
    }>;
    export_id: number;
  };
}

// Interfaz compatible con el componente existente
export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: {
    name: string;
  };
  urlToImage?: string;
  contentScore?: number;
}

export interface NewsResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

export const fetchTopHeadlines = async (country: string = 'us', pageSize: number = 500): Promise<NewsResponse> => {
  try {
    const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.NEWS_PERSONALIZED), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'default', includeSocial: false })
    });

    if (!response.ok) {
      throw new Error(`Error fetching news: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const documents = [...(data.pais || []), ...(data.sector || [])];

    const transformedArticles: NewsArticle[] = documents.map((doc: any) => ({
      title: doc?.content?.title || doc?.title || 'Sin título',
      description: doc?.content?.opening_text || 'Sin descripción',
      url: doc?.url || doc?.thread?.url || '#',
      publishedAt: doc?.published_date || new Date().toISOString(),
      source: { name: doc?.source?.name || 'Desconocido' },
      urlToImage: doc?.content?.image || '/placeholder.svg'
    }));

    const tempShownArticles = new Set<string>();
    const uniqueArticles = getUniqueTopArticles(transformedArticles, tempShownArticles, Math.min(pageSize, transformedArticles.length));

    return {
      status: 'ok',
      totalResults: uniqueArticles.length,
      articles: uniqueArticles
    };
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
};

export const searchNews = async (query: string, pageSize: number = 500): Promise<NewsResponse> => {
  // Por ahora usaremos el mismo origen seguro del backend
  return fetchTopHeadlines('us', pageSize);
};

// Función para calcular ContentScore simple
export const calculateContentScore = (article: NewsArticle, allArticles: NewsArticle[]): number => {
  // Estimación simple basada en datos disponibles
  const baseScore = Math.random() * 0.5; // 0-0.5 aleatorio
  const titleLength = article.title.length / 100; // 0-1 basado en longitud del título
  const hasImage = article.urlToImage ? 0.2 : 0; // Bonus por tener imagen

  return Math.min(1, baseScore + titleLength + hasImage);
};

// Función para ordenar artículos por ContentScore
export const sortArticlesByContentScore = (articles: NewsArticle[]): NewsArticle[] => {
  return [...articles]
    .map(article => ({
      ...article,
      contentScore: calculateContentScore(article, articles)
    }))
    .sort((a, b) => (b.contentScore || 0) - (a.contentScore || 0));
};

// Función para generar ID único de artículo
export const generateArticleId = (article: NewsArticle): string => {
  if (article.url && article.url !== '#') {
    return article.url;
  }
  return `${article.source?.name || 'unknown'}_${article.title}`.replace(/\s+/g, '_').toLowerCase();
};

// Función para filtrar artículos únicos
export const filterUniqueArticles = (articles: NewsArticle[], shownArticles: Set<string>): NewsArticle[] => {
  const uniqueArticles: NewsArticle[] = [];

  for (const article of articles) {
    const articleId = generateArticleId(article);

    if (!shownArticles.has(articleId)) {
      uniqueArticles.push(article);
      shownArticles.add(articleId);
    }
  }

  return uniqueArticles;
};

// Función para obtener artículos únicos ordenados por ContentScore
export const getUniqueTopArticles = (articles: NewsArticle[], shownArticles: Set<string>, limit: number = 500): NewsArticle[] => {
  // Primero ordenar por ContentScore
  const sortedArticles = sortArticlesByContentScore(articles);

  // Luego filtrar duplicados
  const uniqueArticles = filterUniqueArticles(sortedArticles, shownArticles);

  // Tomar el límite solicitado
  return uniqueArticles.slice(0, limit);
};

export const formatPublishedDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    return 'Hace menos de 1 hora';
  } else if (diffInHours < 24) {
    return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  }
};
