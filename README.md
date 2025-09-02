# noticias-nsgroup

## 🚨 IMPORTANTE: Configuración de Producción (Railway)

Si estás desplegando en Railway y ves errores como:
```
MongooseServerSelectionError: connect ECONNREFUSED ::1:27017
```

### ✅ LEE ESTO PRIMERO:
**Archivo:** [RAILWAY_SETUP.md](RAILWAY_SETUP.md)

### Solución Rápida:
1. Ve a Railway > Tu proyecto > Variables
2. Agrega: `MONGODB_URI=mongodb://usuario:password@tu-mongodb-url/ns-news`
3. Reinicia el servicio

### Verificación Inmediata:
Después de configurar, visita:
- **Health Check:** `https://tu-app-railway.up.railway.app/api/health`
- **Diagnóstico:** `https://tu-app-railway.up.railway.app/api/diagnose`

O ejecuta en consola de Railway:
```bash
node backend/check-railway.js
```

---

## 📋 Descripción del Proyecto
Este proyecto consiste en el desarrollo de una página web sencilla que recopila y muestra resúmenes diarios de noticias relevantes, extraídos automáticamente a través de una API ya implementada.
