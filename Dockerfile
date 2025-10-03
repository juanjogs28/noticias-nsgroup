FROM node:18-alpine

WORKDIR /app

# Copiar package.json y package-lock.json
COPY backend/package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY backend/ .

# Exponer puerto
EXPOSE 3001

# Comando de inicio
CMD ["npm", "start"]
