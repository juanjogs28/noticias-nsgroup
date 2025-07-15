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
}

export interface NewsResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

export const fetchTopHeadlines = async (country: string = 'us', pageSize: number = 10): Promise<NewsResponse> => {
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
      urlToImage: doc.content.image || undefined
    }));
    
    return {
      status: data.request.status,
      totalResults: data.documents.length,
      articles: transformedArticles
    };
    
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
};

export const searchNews = async (query: string, pageSize: number = 10): Promise<NewsResponse> => {
  // Real API call to NewsAPI
  const url = `${NEWS_API_BASE_URL}/everything?q=${encodeURIComponent(query)}&pageSize=${pageSize}&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Error searching news: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
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
