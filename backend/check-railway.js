#!/usr/bin/env node

console.log("🚂 VERIFICACIÓN RÁPIDA PARA RAILWAY");
console.log("=" .repeat(50));

// 1. Verificar variables de entorno
console.log("📋 VARIABLES DE ENTORNO:");
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✅ PRESENTE' : '❌ FALTANTE'}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ PRESENTE' : '❌ FALTANTE'}`);
console.log(`   MONGO_URI: ${process.env.MONGO_URI ? '✅ PRESENTE' : '❌ FALTANTE'}`);

if (process.env.MONGODB_URI) {
  console.log(`   URI (oculta): ${process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);
}
if (process.env.MONGO_URI) {
  console.log(`   MONGO_URI (oculta): ${process.env.MONGO_URI.replace(/\/\/.*@/, '//***:***@')}`);
}

// 2. Determinar URI que se usará
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI || "mongodb://localhost:27017/ns-news";
console.log("\n🎯 URI FINAL QUE SE USARÁ:");
console.log(`   ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);

// 3. Análisis del problema
console.log("\n🔍 ANÁLISIS:");
const problemas = [];

if (!process.env.MONGODB_URI && !process.env.DATABASE_URL && !process.env.MONGO_URI) {
  problemas.push("❌ No hay variable MONGODB_URI, DATABASE_URL ni MONGO_URI configurada");
}

if (MONGODB_URI.includes('localhost')) {
  problemas.push("❌ Estás intentando conectar a localhost en producción");
}

if (problemas.length === 0) {
  console.log("✅ Configuración parece correcta");
} else {
  problemas.forEach(problema => console.log(problema));
}

// 4. Soluciones
if (!process.env.MONGODB_URI && !process.env.DATABASE_URL && !process.env.MONGO_URI) {
  console.log("\n🛠️  SOLUCIÓN:");
  console.log("   1. Ve a Railway > Tu proyecto > Variables");
  console.log("   2. Crea una nueva variable:");
  console.log("      Nombre: MONGODB_URI");
  console.log("      Valor: mongodb://usuario:password@tu-mongodb-url/ns-news");
  console.log("   3. Reinicia el servicio");
  console.log("   4. Verifica los logs");
}

console.log("\n🔗 ENDPOINTS DE DIAGNÓSTICO:");
console.log("   Health check: https://tu-app-railway.up.railway.app/api/health");
console.log("   Diagnóstico completo: https://tu-app-railway.up.railway.app/api/diagnose");

console.log("\n" + "=" .repeat(50));
