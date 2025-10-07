require("dotenv").config();

console.log("🔍 VERIFICACIÓN DE VARIABLES DE ENTORNO EN PRODUCCIÓN");
console.log("==================================================");

// Verificar variables críticas
const criticalVars = [
  'MELTWATER_API_TOKEN',
  'MONGODB_URI', 
  'RESEND_API_KEY',
  'ADMIN_PASSWORD'
];

criticalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: Configurada (${value.length} caracteres)`);
  } else {
    console.log(`❌ ${varName}: NO CONFIGURADA`);
  }
});

// Verificar configuración de Meltwater
const meltwaterToken = process.env.MELTWATER_API_TOKEN;
if (meltwaterToken) {
  console.log(`\n🔍 MELTWATER TOKEN:`);
  console.log(`   - Longitud: ${meltwaterToken.length} caracteres`);
  console.log(`   - Formato: ${meltwaterToken.startsWith('mw_') ? 'Correcto (mw_)' : 'Incorrecto'}`);
  console.log(`   - Primeros 10: ${meltwaterToken.substring(0, 10)}...`);
} else {
  console.log(`\n❌ MELTWATER TOKEN: NO CONFIGURADO`);
}

// Verificar MongoDB
const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
if (mongoUri) {
  console.log(`\n🔍 MONGODB URI:`);
  console.log(`   - Configurada: Sí`);
  console.log(`   - Tipo: ${mongoUri.includes('mongodb.net') ? 'MongoDB Atlas' : 'Local/Other'}`);
} else {
  console.log(`\n❌ MONGODB URI: NO CONFIGURADA`);
}

console.log(`\n📋 TODAS LAS VARIABLES DISPONIBLES:`);
console.log(Object.keys(process.env).filter(key => 
  key.includes('MELTWATER') || 
  key.includes('MONGO') || 
  key.includes('RESEND') || 
  key.includes('ADMIN')
).join(', '));
