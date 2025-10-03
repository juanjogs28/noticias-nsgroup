# 🔧 Variables de Entorno Requeridas

## Variables Necesarias en Railway

Para que la aplicación funcione correctamente, necesitas configurar estas variables en Railway:

### 1. MongoDB (OBLIGATORIO)
```
MONGODB_URI=mongodb://usuario:password@tu-mongodb-url/ns-news
```

### 2. Meltwater API (OBLIGATORIO)
```
MELTWATER_API_TOKEN=tu-token-de-meltwater
```

### 3. Resend Email (OPCIONAL)
```
RESEND_API_KEY=tu-resend-api-key
RESEND_FROM_EMAIL=noticias@tu-dominio.com
```

### 4. Frontend URL (OPCIONAL)
```
FRONTEND_URL=https://tu-frontend-url.com
```

### 5. Entorno
```
NODE_ENV=production
```

## 🚨 Si no configuras MONGODB_URI

La aplicación fallará con error 404 porque no puede conectarse a la base de datos.

## 📋 Cómo Configurar en Railway

1. Ve a tu proyecto en Railway
2. Haz clic en "Variables"
3. Agrega cada variable con su valor
4. Reinicia el servicio

## ✅ Verificación

Una vez configuradas, prueba:
- `https://tu-app.up.railway.app/` (debería mostrar mensaje de funcionamiento)
- `https://tu-app.up.railway.app/api/health` (debería mostrar estado de MongoDB)
- `https://tu-app.up.railway.app/api/diagnose` (diagnóstico completo)
