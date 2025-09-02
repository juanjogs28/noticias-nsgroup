// Configuración centralizada de APIs
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
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
