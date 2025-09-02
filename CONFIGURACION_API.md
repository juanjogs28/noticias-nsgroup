# Configuración de URLs de API

## Variables de Entorno

Para cambiar fácilmente entre desarrollo y producción, se han configurado las siguientes variables de entorno:

### Frontend (Vite)
```env
# En desarrollo:
VITE_API_BASE_URL=http://localhost:3001

# En producción:
VITE_API_BASE_URL=https://tu-api-produccion.com
```

### Backend (Node.js)
```env
# En desarrollo:
API_BASE_URL=http://localhost:3001

# En producción:
API_BASE_URL=https://tu-api-produccion.com
```

## Archivos Actualizados

Se han actualizado los siguientes archivos para usar configuración centralizada:

### Frontend:
- ✅ `frontend/src/config/api.ts` - Configuración centralizada
- ✅ `frontend/src/pages/Index.tsx` - Dashboard principal
- ✅ `frontend/src/components/ui/suscribeForm.tsx` - Formulario de suscripción
- ✅ `frontend/src/components/ui/globalTweets.tsx` - Tweets globales
- ✅ `frontend/src/components/ui/personalizedNews.tsx` - Contenido personalizado
- ✅ `frontend/src/components/ui/AdminPanel.tsx` - Panel de administración
- ✅ `frontend/src/api/meltwater.ts` - API de Meltwater
- ✅ `frontend/src/services/newsService.ts` - Servicio de noticias
- ✅ `frontend/src/services/subscriptionService.ts` - Servicio de suscripciones

### Backend:
- ✅ `backend/test.js` - Ya configurado
- ✅ `backend/testAuth.js` - Ya configurado

### Proyecto Alternativo:
- ✅ `short-news-feed-main/src/config/api.ts` - Configuración creada
- ✅ `short-news-feed-main/src/components/ui/AdminPanel.tsx` - Actualizado

## Cómo Usar

1. **Desarrollo local**: Las variables por defecto apuntan a `http://localhost:3001`
2. **Producción**: Crear archivo `.env` con las URLs de producción
3. **Cambios**: Solo modificar las variables de entorno, no el código

## Funciones Helper

```typescript
import { buildApiUrl, API_CONFIG } from '../config/api';

// Construir URL completa
const url = buildApiUrl(API_CONFIG.ENDPOINTS.NEWS);

// Obtener URL base
const baseUrl = getApiBaseUrl();
```

## Beneficios

- ✅ **Mantenibilidad**: Un solo lugar para cambiar URLs
- ✅ **Escalabilidad**: Fácil cambio entre entornos
- ✅ **Seguridad**: No hay URLs hardcodeadas
- ✅ **Consistencia**: Todos los archivos usan la misma configuración
