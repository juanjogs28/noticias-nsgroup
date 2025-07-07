# 🚀 Guía de Ejecución - Sistema básico

## Requisitos previos
- Node.js 18+ instalado
- MongoDB instalado y ejecutándose en localhost:27017

## 1. Instalar MongoDB (si no lo tienes)

### macOS:
```bash
brew install mongodb-community
brew services start mongodb-community
```

### Ubuntu:
```bash
sudo apt install mongodb
sudo systemctl start mongod
```

### Windows:
- Descarga MongoDB desde https://www.mongodb.com/try/download/community
- Instala y ejecuta el servicio

## 2. Configurar el Backend

```bash
# Ir al directorio del backend
cd backend

# Instalar dependencias
npm install

# Ejecutar servidor
npm run dev
```

El servidor estará disponible en: http://localhost:3001

## 3. Configurar el Frontend

```bash
# En otra terminal, ir al directorio del frontend
cd newsletter/short-news-feed-main

# Instalar dependencias (si no las tienes)
npm install

# Ejecutar frontend
npm run dev
```

El frontend estará disponible en: http://localhost:5173

## 4. Probar el sistema

1. Ve a http://localhost:5173
2. Ingresa tu email en el formulario
3. Haz clic en "Suscribirse"
4. Verifica que aparece el mensaje de éxito

## 5. Verificar en MongoDB

Puedes verificar que los emails se guardaron:

```bash
# Conectar a MongoDB
mongo

# Usar la base de datos
use ns-news

# Ver los suscriptores
db.subscribers.find().pretty()
```

## 6. Endpoints disponibles

- `GET http://localhost:3001/api/health` - Verificar estado del servidor
- `POST http://localhost:3001/api/subscribe` - Suscribir email
- `GET http://localhost:3001/api/subscribers` - Ver todos los suscriptores

## 7. Estructura de la base de datos

Los emails se guardan en:
- **Base de datos**: `ns-news`
- **Colección**: `subscribers`
- **Campos**:
  - `email`: Email del suscriptor
  - `subscribedAt`: Fecha de suscripción
  - `isActive`: Estado de la suscripción

## ¡Listo! 🎉

Tu sistema básico está funcionando. Los emails se guardan automáticamente en MongoDB cuando los usuarios se suscriben. 