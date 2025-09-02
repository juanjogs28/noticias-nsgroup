# Guía de Ejecución - Sistema de Noticias NS Group

## 🚀 Funcionalidades Implementadas

### 1. **Panel de Administración**
- Gestión de suscriptores (crear, editar, eliminar)
- Configuración de IDs de búsqueda por país y sector
- Autenticación segura con contraseña

### 2. **Configuración por Defecto** ⭐ NUEVO
- Campo separado para configurar IDs por defecto del sistema
- Se usa cuando usuarios no logueados acceden sin proporcionar sector ni país
- Configuración persistente en base de datos
- Actualización en tiempo real

### 3. **Envío Manual de Newsletters** ⭐ NUEVO
- Botón "Enviar Ahora" para envío inmediato
- Envío adicional sin conflictos con programación automática
- Feedback visual del estado del envío

### 4. **Horarios de Envío Dinámicos** ⭐ NUEVO
- Configuración de múltiples horarios de envío
- Formato HH:MM (ej: 08:00, 13:00, 20:00)
- Activación/desactivación individual de horarios
- Descripciones opcionales para cada horario
- Actualización automática del scheduler

### 5. **Newsletter Personalizado**
- Envío automático según horarios configurados
- Personalización por país y sector
- Integración con API de Meltwater

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js (v14 o superior)
- MongoDB (v4.4 o superior)
- Cuenta en Resend para envío de emails

### 1. Clonar y Instalar Dependencias
```bash
# Backend
cd backend
npm install

# Frontend
cd ../short-news-feed-main
npm install
```

### 2. Configurar Variables de Entorno
Crear archivo `.env` en la carpeta `backend`:
```env
MELTWATER_API_TOKEN=tu_token_aqui
RESEND_API_KEY=tu_api_key_aqui
RESEND_FROM_EMAIL=tu_email@dominio.com
FRONTEND_URL=http://localhost:8080
NODE_ENV=development
```

### 3. Inicializar Base de Datos
```bash
cd backend
node initDefaultConfig.js
```

### 4. Ejecutar Servicios
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd short-news-feed-main
npm run dev

# Terminal 3 - Scheduler (opcional, se ejecuta automáticamente)
cd backend
node scheduler.js
```

## 🔐 Acceso al Panel de Administración

1. Navegar a `http://localhost:8080/admin`
2. Ingresar contraseña: `AdminNSG-+`
3. Acceder a todas las funcionalidades de administración

## 📋 Uso del Panel de Administración

### Configuración por Defecto
- **IDs por Defecto**: Configurar los IDs de búsqueda que se usarán cuando usuarios no logueados accedan
- **Guardar**: Los cambios se aplican inmediatamente y persisten en la base de datos

### Envío Manual
- **Botón "Enviar Ahora"**: Ejecuta el envío del newsletter inmediatamente
- **Feedback**: Muestra el estado del envío (éxito o error)

### Horarios de Envío
- **Agregar Horario**: Usar campo de tiempo (HH:MM) y descripción opcional
- **Gestionar**: Activar/desactivar horarios individuales
- **Eliminar**: Remover horarios no deseados
- **Actualización Automática**: El scheduler se actualiza automáticamente

### Gestión de Suscriptores
- **Crear**: Agregar nuevos suscriptores con IDs de búsqueda
- **Editar**: Modificar información existente
- **Eliminar**: Remover suscriptores del sistema

## 🔄 Flujo de Funcionamiento

### 1. **Configuración Inicial**
- Admin configura IDs por defecto del sistema
- Admin configura horarios de envío automático
- Scheduler se inicializa con horarios configurados

### 2. **Envío Automático**
- Scheduler ejecuta newsletters según horarios configurados
- Se usan IDs por defecto del sistema para usuarios no logueados
- Se usan IDs específicos para usuarios logueados

### 3. **Envío Manual**
- Admin puede enviar newsletters en cualquier momento
- No interfiere con programación automática
- Útil para envíos especiales o de emergencia

### 4. **Actualización de Configuración**
- Cambios en horarios se aplican inmediatamente
- Cambios en IDs por defecto se aplican en la siguiente consulta
- Scheduler se reinicia automáticamente

## 🐛 Solución de Problemas

### Error de Conexión a MongoDB
```bash
# Verificar que MongoDB esté ejecutándose
sudo systemctl status mongod

# Reiniciar MongoDB si es necesario
sudo systemctl restart mongod
```

### Error de Autenticación
- Verificar que la contraseña sea exactamente: `AdminNSG-+`
- Revisar logs del backend para errores de autenticación

### Horarios No Funcionan
- Verificar que el scheduler esté ejecutándose
- Revisar logs del scheduler para errores
- Confirmar que los horarios estén marcados como "Activos"

### Emails No Se Envían
- Verificar configuración de Resend en `.env`
- Revisar logs del backend para errores de envío
- Confirmar que haya suscriptores activos

## 📊 Monitoreo y Logs

### Logs del Backend
```bash
cd backend
tail -f logs/app.log  # Si tienes logging configurado
```

### Logs del Scheduler
```bash
cd backend
node scheduler.js  # Ejecutar en terminal separada para ver logs
```

### Estado de la Base de Datos
```bash
# Conectar a MongoDB
mongosh
use ns-news

# Ver configuración por defecto
db.defaultconfigs.find()

# Ver horarios configurados
db.scheduletimes.find()

# Ver suscriptores
db.subscribers.find()
```

## 🔒 Seguridad

- **Autenticación**: Contraseña requerida para acceso admin
- **Validación**: Formato de horarios validado (HH:MM)
- **Sanitización**: Inputs sanitizados antes de procesar
- **Logs**: Todas las acciones admin son registradas

## 🚀 Próximas Mejoras

- [ ] Dashboard con estadísticas de envío
- [ ] Plantillas de email personalizables
- [ ] Sistema de notificaciones para admins
- [ ] Backup automático de configuración
- [ ] API para integración con otros sistemas 