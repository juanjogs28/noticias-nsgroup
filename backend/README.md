# 🚀 NS Group Backend

Backend para el sistema de newsletter con estructura organizada y configuración centralizada.

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/          # Configuraciones centralizadas
│   │   ├── config.js    # Configuración principal
│   │   └── database.js  # Configuración de DB
│   ├── controllers/     # Lógica de negocio
│   ├── middleware/      # Middlewares personalizados
│   ├── models/          # Modelos de MongoDB
│   ├── routes/          # Definición de rutas
│   ├── utils/           # Utilidades y helpers
│   ├── app.js          # Configuración de la aplicación
│   └── server.js       # Punto de entrada del servidor
├── package.json
└── README.md
```

## ⚙️ Configuración

El proyecto usa un archivo de configuración centralizado (`src/config/config.js`) que incluye:

- **Servidor**: Puerto, host
- **Base de datos**: URL de MongoDB
- **CORS**: Origen del frontend
- **API**: Versión, prefijos, endpoints
- **Validaciones**: Regex de email, categorías, regiones
- **Logs**: Nivel de logging

### Variables de Entorno

Puedes configurar el comportamiento usando variables de entorno:

```bash
# Configuración del servidor
PORT=3001
HOST=localhost

# Configuración de la base de datos
MONGODB_URI=mongodb://localhost:27017/ns-news

# Configuración del frontend
FRONTEND_URL=http://localhost:8080

# Configuración de logs
LOG_LEVEL=info
```

## 🚀 Comandos

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo (con nodemon)
npm run dev

# Ejecutar en producción
npm start

# Ejecutar tests
npm test
```

## 🔗 Endpoints

- `GET /` - Información de la API
- `GET /api/health` - Health check
- `POST /api/subscribe` - Suscribir email con categoría y región
- `GET /api/subscribers` - Listar suscriptores

## 📧 Modelo de Suscriptor

```javascript
{
  email: String,        // Email único del suscriptor
  category: String,     // Categoría preferida
  region: String,       // Región preferida
  subscribedAt: Date,   // Fecha de suscripción
  isActive: Boolean     // Estado de la suscripción
}
```

## 🎯 Características

- ✅ Estructura MVC organizada
- ✅ **Configuración centralizada** para fácil mantenimiento
- ✅ **Variables de entorno** para diferentes entornos
- ✅ Validaciones de datos centralizadas
- ✅ Manejo de errores
- ✅ CORS configurado
- ✅ MongoDB con Mongoose
- ✅ Hot reload con nodemon

## 🔧 Personalización

Para cambiar configuraciones como URLs del frontend, categorías o regiones, edita `src/config/config.js` o usa variables de entorno.
