require("dotenv").config();

console.log("🔍 DIAGNÓSTICO RÁPIDO - Railway");
console.log("=" .repeat(40));

// Variables críticas
const envVars = {
  'NODE_ENV': process.env.NODE_ENV,
  'MONGODB_URI': process.env.MONGODB_URI ? '✅ Configurada' : '❌ NO CONFIGURADA',
  'DATABASE_URL': process.env.DATABASE_URL ? '✅ Configurada' : '❌ NO CONFIGURADA',
  'MELTWATER_API_TOKEN': process.env.MELTWATER_API_TOKEN ? '✅ Configurada' : '❌ NO CONFIGURADA',
  'RESEND_API_KEY': process.env.RESEND_API_KEY ? '✅ Configurada' : '❌ NO CONFIGURADA'
};

console.log("📋 VARIABLES DE ENTORNO:");
Object.entries(envVars).forEach(([key, value]) => {
  console.log(`   ${key}: ${value}`);
});

console.log("\n🔧 CONFIGURACIÓN MONGODB:");
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb://localhost:27017/ns-news";
console.log(`   URI usada: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);
console.log(`   Es localhost: ${MONGODB_URI.includes('localhost')}`);
console.log(`   Es Railway: ${MONGODB_URI.includes('railway.app')}`);
console.log(`   Es Atlas: ${MONGODB_URI.includes('mongodb.net')}`);

console.log("\n" + "=" .repeat(40));

if (!process.env.MONGODB_URI && !process.env.DATABASE_URL) {
  console.log("🚨 SOLUCIÓN:");
  console.log("   1. Ve a Railway > Tu proyecto > Variables");
  console.log("   2. Agrega: MONGODB_URI=mongodb://usuario:password@tu-url/ns-news");
  console.log("   3. Reinicia el servicio");
  console.log("   4. Revisa los logs para confirmar conexión");
} else if (MONGODB_URI.includes('localhost')) {
  console.log("⚠️  ADVERTENCIA: Estás usando localhost en producción!");
  console.log("   La variable MONGODB_URI debe apuntar a tu base de datos externa");
  console.log("   Ejemplo: mongodb://user:pass@containers-us-west-1.railway.app:1234/ns-news");
} else {
  console.log("✅ Configuración parece correcta");
  console.log("   Si aún hay errores, verifica que las credenciales sean correctas");
}

console.log("=" .repeat(40));
