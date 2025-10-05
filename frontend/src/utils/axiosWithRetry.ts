import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { AXIOS_CONFIG } from '../config/api';

// Función para hacer retry automático
const retryRequest = async (
  config: AxiosRequestConfig,
  retryCount: number = 0
): Promise<AxiosResponse> => {
  try {
    const response = await axios({
      ...config,
      timeout: AXIOS_CONFIG.timeout,
      headers: {
        ...AXIOS_CONFIG.headers,
        ...config.headers
      }
    });
    return response;
  } catch (error) {
    const axiosError = error as AxiosError;
    
    // Solo hacer retry en ciertos errores
    const shouldRetry = 
      axiosError.code === 'ECONNABORTED' ||
      axiosError.code === 'ECONNRESET' ||
      axiosError.code === 'ETIMEDOUT' ||
      (axiosError.response && axiosError.response.status >= 500) ||
      !axiosError.response; // Sin respuesta del servidor
    
    if (shouldRetry && retryCount < AXIOS_CONFIG.retry) {
      console.log(`🔄 Reintentando petición (${retryCount + 1}/${AXIOS_CONFIG.retry}):`, config.url);
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, AXIOS_CONFIG.retryDelay * (retryCount + 1)));
      
      return retryRequest(config, retryCount + 1);
    }
    
    throw error;
  }
};

// Función principal para hacer peticiones con retry
export const axiosWithRetry = async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
  return retryRequest(config);
};

// Función helper para peticiones POST
export const postWithRetry = async (url: string, data: any, config?: AxiosRequestConfig): Promise<AxiosResponse> => {
  return axiosWithRetry({
    method: 'POST',
    url,
    data,
    ...config
  });
};

// Función helper para peticiones GET
export const getWithRetry = async (url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> => {
  return axiosWithRetry({
    method: 'GET',
    url,
    ...config
  });
};
