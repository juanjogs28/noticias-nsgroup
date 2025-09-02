#!/usr/bin/env node

console.log("🔧 VERIFICACIÓN DE REPARACIÓN MONGO_URI");
console.log("=" .repeat(50));

// Verificar que las variables estén disponibles
console.log("📋 ESTADO DE VARIABLES:");
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✅' : '❌'} ${process.env.MONGODB_URI ? 'Presente' : 'Ausente'}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅' : '❌'} ${process.env.DATABASE_URL ? 'Presente' : 'Ausente'}`);
console.log(`   MONGO_URI: ${process.env.MONGO_URI ? '✅' : '❌'} ${process.env.MONGO_URI ? 'Presente' : 'Ausente'}`);

if (process.env.MONGO_URI) {
  console.log(`   📍 MONGO_URI: ${process.env.MONGO_URI.replace(/\/\/.*@/, '//***:***@')}`);
}

// Determinar qué URI se usará
const finalUri = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI || "mongodb://localhost:27017/ns-news";

console.log("\n🎯 URI QUE SE USARÁ AHORA:");
console.log(`   ${finalUri.replace(/\/\/.*@/, '//***:***@')}`);
console.log(`   Es localhost: ${finalUri.includes('localhost')}`);
console.log(`   Es MongoDB Atlas: ${finalUri.includes('mongodb.net')}`);
console.log(`   Es Railway: ${finalUri.includes('railway.app')}`);

console.log("\n" + "=" .repeat(50));

// Verificar que el código esté usando la variable correcta
if (process.env.MONGO_URI && !finalUri.includes('localhost')) {
  console.log("✅ ¡PERFECTO! El código ahora detectará tu MONGO_URI");
  console.log("   Ya no usarás localhost como fallback");
} else if (process.env.MONGO_URI && finalUri.includes('localhost')) {
  console.log("⚠️  Tu MONGO_URI existe pero el código está usando localhost");
  console.log("   Verifica que MONGO_URI tenga la URL correcta");
} else if (!process.env.MONGO_URI) {
  console.log("❌ MONGO_URI no está configurada");
  console.log("   Asegúrate de que la variable esté configurada en Railway");
}

console.log("\n🚀 PRUEBA EL ENDPOINT:");
console.log("   Visita: https://tu-app-railway.up.railway.app/api/diagnose");
console.log("   Deberías ver MONGO_URI como 'CONFIGURADA'");

console.log("\n" + "=" .repeat(50));
