# 🔐 Configuración de Seguridad - Panel Admin

## ⚠️ IMPORTANTE: Configuración de Seguridad

### 1. **Variables de Entorno Requeridas**

Agrega estas variables en Railway (o tu plataforma de hosting):

```bash
# Contraseña del panel admin (CAMBIA ESTA CONTRASEÑA)
ADMIN_PASSWORD=tu_contraseña_super_segura_aqui

# Configuración de Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noticias@newsroom.eyewatch.me

# Base de datos
MONGODB_URI=mongodb://usuario:password@host:puerto/database

# Frontend URL
FRONTEND_URL=https://newsroom.eyewatch.me
```

### 2. **Recomendaciones de Seguridad**

#### ✅ **Contraseña Fuerte:**
- Mínimo 12 caracteres
- Incluir mayúsculas, minúsculas, números y símbolos
- Ejemplo: `Admin2024!@#Newsroom`

#### ✅ **Configuración en Railway:**
1. Ve a tu proyecto en Railway
2. Ve a la pestaña "Variables"
3. Agrega: `ADMIN_PASSWORD=tu_contraseña_segura`
4. Reinicia el servicio

#### ✅ **Verificación:**
- La contraseña ya NO está visible en el código
- Se obtiene desde variables de entorno
- Fallback seguro si no está configurada

### 3. **Uso del Panel Admin**

1. **Acceso:** Ve a `/admin` en tu frontend
2. **Login:** Ingresa la contraseña configurada en `ADMIN_PASSWORD`
3. **Seguridad:** La contraseña se envía via header Authorization

### 4. **Configuración de Producción**

```bash
# En Railway, configura:
ADMIN_PASSWORD=TuContraseñaSuperSegura2024!
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noticias@newsroom.eyewatch.me
MONGODB_URI=mongodb://usuario:password@host:puerto/database
FRONTEND_URL=https://newsroom.eyewatch.me
```

### 5. **Verificación de Seguridad**

- ✅ Contraseña removida del código fuente
- ✅ Usa variables de entorno
- ✅ No hay contraseñas hardcodeadas
- ✅ Autenticación via header Authorization
- ✅ Mensajes de error seguros

## 🚨 **ACCIÓN REQUERIDA**

**CAMBIAR LA CONTRASEÑA INMEDIATAMENTE:**

1. Ve a Railway > Variables
2. Agrega: `ADMIN_PASSWORD=tu_nueva_contraseña_segura`
3. Reinicia el servicio
4. Prueba el acceso con la nueva contraseña
