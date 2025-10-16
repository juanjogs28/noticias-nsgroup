const NEWS_API_KEY = "8PMcUPYZ1M954yDpIh6mI8CE61fqwG2LFulSbPGo" //'24897757f4fe4d9c8d1f49870158d6e2';
const NEWS_API_BASE_URL = "https://api.meltwater.com/v2/search"//'https://newsapi.org/v2';
const URUGUAY_API_URL =  "https://downloads.exports.meltwater.com/v3/recurring/14295972?data_key=85969f36-4eff-3098-810c-f0f975b65628"

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
  const url = URUGUAY_API_URL;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error fetching news: ${response.status} ${response.statusText}`);
    }
    
    const data: MeltwaterResponse = await response.json();
    console.log('Meltwater response:', data);
    
    // Transformar los datos de Meltwater al formato esperado por el componente
    const transformedArticles: NewsArticle[] = data.documents.map(doc => ({
      title: doc.content.title || `Post de ${doc.source.name}` || 'Sin título',
      description: doc.content.opening_text || `Contenido de ${doc.source.name}` || 'Sin descripción',
      url: doc.url || doc.thread?.url || '#',
      publishedAt: doc.published_date,
      source: {
        name: doc.source.name
      },
      urlToImage: doc.content.image || "/placeholder.svg"
    }));
    
    // Crear un set temporal para tracking (ya que es una función estática)
    const tempShownArticles = new Set<string>();

    // Filtrar artículos únicos ordenados por ContentScore
    const uniqueArticles = getUniqueTopArticles(transformedArticles, tempShownArticles, transformedArticles.length);

    return {
      status: data.request.status,
      totalResults: uniqueArticles.length,
      articles: uniqueArticles
    };
    
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
};

export const searchNews = async (query: string, pageSize: number = 500): Promise<NewsResponse> => {
  // Real API call to NewsAPI
  const url = `${NEWS_API_BASE_URL}/everything?q=${encodeURIComponent(query)}&pageSize=${pageSize}&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Error searching news: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
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
