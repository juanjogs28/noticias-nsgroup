# 🚂 Configuración de Railway para NS News Group

## 🚨 Problemas Comunes y Soluciones

### Problema 1: "npm: not found" durante el build
Si ves errores como:
```
sh: 1: npm: not found
ERROR: failed to build: failed to solve: process "sh -c cd backend && npm install" did not complete successfully: exit code: 127
```

**Solución:** Railway no detecta correctamente el proyecto Node.js. Se han creado archivos de configuración:
- `railway.json` - Configuración principal de Railway
- `nixpacks.toml` - Configuración de build con Node.js
- `Procfile` - Comando de inicio
- `.railwayignore` - Archivos a ignorar

#### Pasos para resolver:
1. **Commit y push** los nuevos archivos de configuración
2. **Reinicia el deploy** en Railway
3. **Verifica** que Railway detecte Node.js correctamente
4. Si persiste, **elimina el servicio** y **crea uno nuevo** con los archivos de configuración

### Problema 2: MongoDB Connection Refused

Si ves errores como:
```
MongooseServerSelectionError: connect ECONNREFUSED ::1:27017, connect ECONNREFUSED 127.0.0.1:27017
```

Significa que **no tienes configurada la variable correcta** en Railway.

### Posibles Causas:
1. ❌ **Variable `MONGO_URI`** configurada pero código busca `MONGODB_URI`
2. ❌ **Variable `MONGODB_URI`** no configurada
3. ❌ **Variable configurada** pero con URL incorrecta

## 🛠️ SOLUCIÓN RÁPIDA (5 minutos)

### Paso 1: Configurar Variable de Entorno
1. Ve a [Railway.app](https://railway.app) y abre tu proyecto
2. Ve a **"Variables"** (o **"Environment"**)
3. Haz clic en **"Add Variable"**
4. Agrega:
   ```
   Name: MONGODB_URI
   Value: mongodb://usuario:CONTRASEÑA@containers-us-west-1.railway.app:1234/ns-news
   ```

### Paso 2: Obtener la URL de MongoDB
Necesitas reemplazar `usuario:CONTRASEÑA@containers-us-west-1.railway.app:1234` con tu URL real de MongoDB.

#### Opción A: Railway Database (Recomendado)
Si tienes una base de datos Railway:
1. Ve a tu proyecto Railway
2. Abre el servicio de **Database**
3. Ve a **"Variables"**
4. Copia el valor de `DATABASE_URL`
5. Úsalo como valor para `MONGODB_URI`

#### Opción B: MongoDB Atlas (Alternativo)
Si usas MongoDB Atlas:
```
MONGODB_URI=mongodb+srv://usuario:CONTRASEÑA@cluster0.xxxxx.mongodb.net/ns-news?retryWrites=true&w=majority
```

### Paso 3: Reiniciar el Servicio
1. Ve al servicio del backend en Railway
2. Haz clic en **"Deploy"** o espera el deploy automático
3. Revisa los logs para confirmar la conexión

## 🔍 Verificación

### Método 1: Endpoints Web (Más Fácil)
Visita estos URLs en tu navegador:

#### Health Check:
`https://tu-app-railway.up.railway.app/api/health`

#### Diagnóstico Completo:
`https://tu-app-railway.up.railway.app/api/diagnose`

### Método 2: Consola de Railway
Ejecuta en la consola de Railway:
```bash
node backend/check-railway.js
```

### Método 3: Logs Esperados:
```
🔍 DIAGNÓSTICO DE ENTORNO:
NODE_ENV: production
MONGODB_URI: ✅ Configurada
DATABASE_URL: ❌ No configurada

🔧 Configuración MongoDB: {
  uri: "mongodb://***:***@railway.app/ns-news",
  isProduction: true,
  isLocalhost: false,
  hasCredentials: true,
  protocol: "mongodb"
}
✅ Conectado a MongoDB exitosamente
📊 Estado de conexión: 1
```

### Método 4: Si aún hay problemas:
```bash
node backend/diagnose.js
node backend/test-mongo-connection.js
```

## 📋 Checklist de Verificación

### Variables de Entorno:
- [ ] `MONGO_URI` configurada con URL correcta de MongoDB Atlas
- [ ] URL no contiene `localhost` (debe ser `mongodb+srv://...` o Railway URL)
- [ ] Credenciales de usuario/password son correctas

### Código Actualizado:
- [ ] Código reconoce `MONGO_URI` (ya actualizado ✅)
- [ ] Endpoint `/api/diagnose` muestra `MONGO_URI: CONFIGURADA`
- [ ] Logs muestran conexión exitosa a MongoDB Atlas

### Verificación:
- [ ] Servicio reiniciado después de cambios
- [ ] Logs muestran "✅ Conectado a MongoDB exitosamente"
- [ ] Panel de administración funciona sin errores

## 🆘 Solución de Problemas

### Error: "authentication failed"
- Verifica que usuario y password sean correctos
- Confirma que el usuario tenga permisos en la base de datos

### Error: "connect ECONNREFUSED"
- La URL de MongoDB es incorrecta
- El servidor MongoDB no está ejecutándose
- Firewall bloqueando la conexión

### Error: "getaddrinfo ENOTFOUND"
- El dominio de MongoDB es incorrecto
- Problema de DNS

### Aún usando localhost después de configurar:
- Confirma que la variable se llama exactamente `MONGODB_URI`
- Reinicia completamente el servicio
- Verifica que no haya espacios extras en la variable

## 📞 Contacto

Si después de seguir estos pasos aún tienes problemas:
1. Comparte los logs completos de Railway
2. Indica qué tipo de MongoDB estás usando (Railway, Atlas, etc.)
3. Comparte la URL que configuraste (sin credenciales)

## 🎯 Resultado Esperado

Después de la configuración correcta deberías ver:
- ✅ Panel de administración funcionando
- ✅ API de noticias respondiendo
- ✅ No más errores de MongoDB
- ✅ Newsletter funcionando correctamente

¡Éxito! 🚀
