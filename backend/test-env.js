require("dotenv").config();

console.log("🔍 DIAGNÓSTICO DE VARIABLES DE ENTORNO");
console.log("=" .repeat(50));

// Verificar NODE_ENV
console.log("🌍 NODE_ENV:", process.env.NODE_ENV || "undefined");

// Verificar variables de MongoDB
console.log("\n🗄️  VARIABLES DE MONGODB:");
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "✅ Configurada" : "❌ No configurada");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✅ Configurada" : "❌ No configurada");

if (process.env.MONGODB_URI) {
  console.log("Valor MONGODB_URI (oculto):", process.env.MONGODB_URI.replace(/\/\/.*@/, "//***:***@"));
}

if (process.env.DATABASE_URL) {
  console.log("Valor DATABASE_URL (oculto):", process.env.DATABASE_URL.replace(/\/\/.*@/, "//***:***@"));
}

// Determinar cuál URI se usará
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb://localhost:27017/ns-news";
console.log("\n🎯 URI FINAL QUE SE USARÁ:");
console.log("URI:", MONGODB_URI.replace(/\/\/.*@/, "//***:***@"));
console.log("Es localhost:", MONGODB_URI.includes("localhost"));
console.log("Es Railway:", MONGODB_URI.includes("railway.app"));
console.log("Es MongoDB Atlas:", MONGODB_URI.includes("mongodb.net"));

// Verificar otras variables importantes
console.log("\n🔧 OTRAS VARIABLES:");
console.log("MELTWATER_API_TOKEN:", process.env.MELTWATER_API_TOKEN ? "✅ Configurada" : "❌ No configurada");
console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY ? "✅ Configurada" : "❌ No configurada");

// Listar todas las variables de entorno disponibles
console.log("\n📋 TODAS LAS VARIABLES DISPONIBLES:");
const allEnvVars = Object.keys(process.env).filter(key =>
  key.includes('MONGO') ||
  key.includes('DATABASE') ||
  key.includes('NODE_ENV') ||
  key.includes('MELTWATER') ||
  key.includes('RESEND')
).sort();

allEnvVars.forEach(key => {
  const value = process.env[key];
  const maskedValue = value && value.includes('@') ? value.replace(/\/\/.*@/, "//***:***@") : value;
  console.log(`  ${key}: ${maskedValue ? maskedValue : "undefined"}`);
});

console.log("\n" + "=" .repeat(50));
console.log("💡 RECOMENDACIONES:");
if (!process.env.MONGODB_URI && !process.env.DATABASE_URL) {
  console.log("❌ No hay variable MONGODB_URI o DATABASE_URL configurada");
  console.log("   En Railway: Ve a Variables y configura MONGODB_URI");
} else if (MONGODB_URI.includes("localhost")) {
  console.log("⚠️  Está usando localhost - en producción esto fallará");
  console.log("   Configura la variable MONGODB_URI con tu URL de MongoDB de Railway");
} else {
  console.log("✅ Configuración parece correcta");
}

console.log("=" .repeat(50));
