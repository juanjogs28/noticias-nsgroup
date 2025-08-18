# 🔐 Autenticación de Admin

## 📋 Contraseña

**Contraseña**: `AdminNSG-+`

## 🚀 Endpoints Protegidos

Todas las rutas de admin requieren autenticación:

- `/api/admin` - Panel principal de admin
- `/api/admin/subscribers` - Gestión de suscriptores
- `/api/admin/subscribers/:id` - Operaciones CRUD en suscriptores

## 🔑 Métodos de Autenticación

### 1. Query Parameter (Más fácil para testing)

```bash
# Acceder a admin principal
curl "http://localhost:3001/api/admin?password=AdminNSG-+"

# Listar suscriptores
curl "http://localhost:3001/api/admin/subscribers?password=AdminNSG-+"

# Crear suscriptor
curl -X POST "http://localhost:3001/api/admin/subscribers?password=AdminNSG-+" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","countrySearchId":"123","sectorSearchId":"456"}'
```

### 2. Header Authorization (Más seguro para producción)

```bash
# Acceder a admin principal
curl -H "Authorization: Bearer AdminNSG-+" \
  http://localhost:3001/api/admin

# Listar suscriptores
curl -H "Authorization: Bearer AdminNSG-+" \
  http://localhost:3001/api/admin/subscribers
```

## 🧪 Probar Autenticación

```bash
# Ejecutar tests de autenticación
npm run test-auth
```

## 📱 Uso en Frontend

### Con Query Parameter:
```javascript
const response = await fetch(`/api/admin/subscribers?password=AdminNSG-+`);
```

### Con Header:
```javascript
const response = await fetch('/api/admin/subscribers', {
  headers: {
    'Authorization': 'Bearer AdminNSG-+'
  }
});
```

## 🚨 Respuestas de Error

### Sin Contraseña (401):
```json
{
  "error": "Acceso denegado",
  "message": "Contraseña requerida",
  "hint": "Use ?password=AdminNSG-+ o header Authorization: Bearer AdminNSG-+"
}
```

### Contraseña Incorrecta (403):
```json
{
  "error": "Acceso denegado",
  "message": "Contraseña incorrecta"
}
```

## 💡 Recomendaciones

1. **Para desarrollo/testing**: Usa query parameter
2. **Para producción**: Usa header Authorization
3. **Nunca compartas** la contraseña en logs o código público
4. **Cambia la contraseña** en el archivo `middleware/auth.js` si es necesario

## 🔒 Seguridad

- La contraseña está hardcodeada en `middleware/auth.js`
- Todas las rutas de admin están protegidas
- No hay sesiones persistentes (cada request requiere la contraseña)
- La contraseña se valida en cada request
