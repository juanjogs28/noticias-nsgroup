// Configuración centralizada de APIs
const getBaseUrl = () => {
  // FORZAR URL CORRECTA - Temporal para solucionar el problema
  if (import.meta.env.PROD) {
    return 'https://noticias-nsgroup-production-acff.up.railway.app';
  }
  
  // Desarrollo local
  return 'http://localhost:3001';
};

const baseUrl = getBaseUrl();
console.log('🔧 Configuración API:', {
  baseUrl,
  isProduction: import.meta.env.PROD,
  hasCustomUrl: !!import.meta.env.VITE_API_BASE_URL
});

// Configuración de axios con timeouts y retry
export const AXIOS_CONFIG = {
  timeout: 60000, // 60 segundos
  retry: 3, // 3 intentos
  retryDelay: 1000, // 1 segundo entre intentos
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

export const API_CONFIG = {
  BASE_URL: baseUrl,
  ENDPOINTS: {
    NEWS: '/api/news',
    NEWS_PERSONALIZED: '/api/news/personalized',
    SUBSCRIBE: '/api/subscribe',
    PREFERENCES: '/api/preferences',
    UNSUBSCRIBE: '/api/unsubscribe',
    GLOBAL_TWEETS: '/api/global-tweets',
    DEFAULT_CONFIG: '/api/defaultConfig',
    ADMIN: '/api/admin',
    ADMIN_SUBSCRIBERS: '/api/admin/subscribers',
    ADMIN_SEARCHES: '/api/admin/searches',
    ADMIN_SUBSCRIPTIONS: '/api/admin/subscriptions',
    ADMIN_SCHEDULE_TIMES: '/api/admin/schedule-times',
    ADMIN_MANUAL_NEWSLETTER: '/api/admin/manual-newsletter/send',
    ADMIN_DEFAULT_CONFIG: '/api/admin/default-config'
  }
};

// Función helper para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Función helper para obtener URL base
export const getApiBaseUrl = (): string => {
  return API_CONFIG.BASE_URL;
};
