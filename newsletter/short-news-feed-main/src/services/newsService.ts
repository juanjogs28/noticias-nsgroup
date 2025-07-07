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


export const fetchTopHeadlines = async (country: string = 'us', pageSize: number = 10): Promise<NewsResponse> => {
  // Real API call to NewsAPI
  const url = `${NEWS_API_BASE_URL}/top-headlines?country=${country}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Error fetching news: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
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
