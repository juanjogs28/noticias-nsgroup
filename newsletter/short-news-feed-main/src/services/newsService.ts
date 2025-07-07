const NEWS_API_KEY = '24897757f4fe4d9c8d1f49870158d6e2';
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

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

// Mock data with real URLs to make news details functional
const mockNewsData: NewsResponse = {
  status: "ok",
  totalResults: 8,
  articles: [
    {
      title: "Avances en Inteligencia Artificial Revolucionan la Medicina",
      description: "Nuevos algoritmos de IA están permitiendo diagnósticos más precisos y tratamientos personalizados en hospitales de todo el mundo.",
      url: "https://www.nature.com/articles/s41591-023-02506-6",
      publishedAt: "2025-01-07T10:30:00Z",
      source: { name: "TechNews" },
      urlToImage: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400"
    },
    {
      title: "Mercados Financieros Muestran Volatilidad Tras Anuncios Económicos",
      description: "Los principales índices bursátiles registran fluctuaciones significativas después de los últimos datos de inflación.",
      url: "https://www.reuters.com/markets/global-markets-live/",
      publishedAt: "2025-01-07T09:15:00Z",
      source: { name: "Financial Times" },
      urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400"
    },
    {
      title: "Científicos Descubren Nueva Especie Marina en el Pacífico",
      description: "Una expedición internacional ha identificado varias especies desconocidas en las profundidades del océano Pacífico.",
      url: "https://www.nationalgeographic.com/science/article/new-species-discovered-pacific-ocean",
      publishedAt: "2025-01-07T08:45:00Z",
      source: { name: "National Geographic" },
      urlToImage: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400"
    },
    {
      title: "Energías Renovables Alcanzan Récord Histórico de Producción",
      description: "Las fuentes de energía limpia superan por primera vez el 60% de la generación total en varios países europeos.",
      url: "https://www.iea.org/news/renewable-electricity-growth-accelerating-faster-than-ever-worldwide",
      publishedAt: "2025-01-07T07:20:00Z",
      source: { name: "Green Energy Today" },
      urlToImage: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400"
    },
    {
      title: "Nueva Terapia Génica Muestra Resultados Prometedores",
      description: "Ensayos clínicos revelan que el tratamiento podría revolucionar el cuidado de enfermedades genéticas raras.",
      url: "https://www.nejm.org/doi/full/10.1056/NEJMoa2304820",
      publishedAt: "2025-01-07T06:30:00Z",
      source: { name: "Medical Journal" },
      urlToImage: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400"
    },
    {
      title: "Empresas Tecnológicas Lideran Inversión en Sostenibilidad",
      description: "Las principales compañías tech anuncian compromisos multimillonarios para reducir su huella de carbono.",
      url: "https://www.businessinsider.com/tech-companies-sustainability-investment-carbon-footprint-2024",
      publishedAt: "2025-01-07T05:45:00Z",
      source: { name: "Business Insider" },
      urlToImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400"
    },
    {
      title: "Avances en Exploración Espacial Abren Nuevas Posibilidades",
      description: "Misiones recientes proporcionan datos cruciales sobre la posibilidad de vida en otros planetas.",
      url: "https://www.nasa.gov/news/releases/2024/nasa-mars-exploration-breakthrough",
      publishedAt: "2025-01-07T04:15:00Z",
      source: { name: "Space Today" },
      urlToImage: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=400"
    },
    {
      title: "Innovaciones en Agricultura Vertical Prometen Alimentar Ciudades",
      description: "Nuevas técnicas de cultivo urbano podrían resolver problemas de seguridad alimentaria en áreas metropolitanas.",
      url: "https://www.sciencedirect.com/science/article/pii/S0308521X24002087",
      publishedAt: "2025-01-07T03:30:00Z",
      source: { name: "AgriTech News" },
      urlToImage: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400"
    }
  ]
};

export const fetchTopHeadlines = async (country: string = 'us', pageSize: number = 10): Promise<NewsResponse> => {
  // In development, return mock data to avoid CORS issues
  // In production, you would uncomment the real API call below
  
  console.log('Using mock news data to avoid CORS issues during development');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return mockNewsData;
  
  /* 
  // Real API call - uncomment for production with proper backend
  const url = `${NEWS_API_BASE_URL}/top-headlines?country=${country}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Error fetching news: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
  */
};

export const searchNews = async (query: string, pageSize: number = 10): Promise<NewsResponse> => {
  // In development, return filtered mock data
  console.log('Using mock news data for search to avoid CORS issues during development');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Filter mock data based on query
  const filteredArticles = mockNewsData.articles.filter(article => 
    article.title.toLowerCase().includes(query.toLowerCase()) ||
    article.description.toLowerCase().includes(query.toLowerCase())
  );
  
  return {
    ...mockNewsData,
    totalResults: filteredArticles.length,
    articles: filteredArticles.slice(0, pageSize)
  };
  
  /*
  // Real API call - uncomment for production with proper backend
  const url = `${NEWS_API_BASE_URL}/everything?q=${encodeURIComponent(query)}&pageSize=${pageSize}&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Error searching news: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
  */
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
