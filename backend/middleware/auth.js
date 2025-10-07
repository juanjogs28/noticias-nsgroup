// Middleware de autenticación simple para admin
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function requireAuth(req, res, next) {
  // Obtener la contraseña del header Authorization o del query parameter
  const authHeader = req.headers.authorization;
  const queryPassword = req.query.password;
  
  let providedPassword = null;
  
  // Verificar si viene en el header Authorization (formato: "Bearer password")
  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedPassword = authHeader.substring(7);
  }
  
  // Verificar si viene en query parameter
  if (queryPassword) {
    providedPassword = queryPassword;
  }
  
  // Si no hay contraseña configurada, error crítico
  if (!ADMIN_PASSWORD) {
    return res.status(500).json({ 
      error: "Error de configuración", 
      message: "ADMIN_PASSWORD no configurada en variables de entorno"
    });
  }
  
  // Si no hay contraseña, pedir autenticación
  if (!providedPassword) {
    return res.status(401).json({ 
      error: "Acceso denegado", 
      message: "Contraseña requerida",
      hint: "Use header Authorization: Bearer [password]" 
    });
  }
  
  // Verificar contraseña
  if (providedPassword !== ADMIN_PASSWORD) {
    return res.status(403).json({ 
      error: "Acceso denegado", 
      message: "Contraseña incorrecta"
    });
  }
  
  // Contraseña correcta, continuar
  next();
}

module.exports = { requireAuth, ADMIN_PASSWORD };
