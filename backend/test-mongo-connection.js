require("dotenv").config();
const mongoose = require("mongoose");

console.log("🧪 PRUEBA DE CONEXIÓN A MONGODB");
console.log("=" .repeat(60));

// Configurar URI
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb://localhost:27017/ns-news";

console.log("🔧 Configuración:");
console.log("URI:", MONGODB_URI.replace(/\/\/.*@/, "//***:***@"));
console.log("NODE_ENV:", process.env.NODE_ENV || "undefined");
console.log("Es localhost:", MONGODB_URI.includes("localhost"));
console.log("Es Railway:", MONGODB_URI.includes("railway.app"));
console.log("Es MongoDB Atlas:", MONGODB_URI.includes("mongodb.net"));
console.log("-".repeat(60));

// Función para probar conexión
async function testConnection() {
  try {
    console.log("⏳ Intentando conectar a MongoDB...");

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 30000,
    });

    console.log("✅ ¡CONEXIÓN EXITOSA!");
    console.log("📊 Estado de conexión:", mongoose.connection.readyState);
    console.log("🏢 Base de datos:", mongoose.connection.db.databaseName);
    console.log("📍 Host:", mongoose.connection.host);
    console.log("🔌 Puerto:", mongoose.connection.port);

    // Probar una operación simple
    console.log("\n🧪 Probando operación básica...");
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("📋 Colecciones encontradas:", collections.length);
    collections.forEach(col => console.log(`   - ${col.name}`));

    // Cerrar conexión
    await mongoose.connection.close();
    console.log("🔌 Conexión cerrada exitosamente");

  } catch (error) {
    console.error("❌ ERROR DE CONEXIÓN:");
    console.error("Mensaje:", error.message);

    if (error.message.includes("ECONNREFUSED")) {
      console.error("\n🔍 DIAGNÓSTICO:");
      console.error("   - El servidor MongoDB no está accesible");
      console.error("   - Verifica que la URL sea correcta");
      console.error("   - Verifica que las credenciales sean correctas");
      console.error("   - Verifica que el servidor esté ejecutándose");
    }

    if (error.message.includes("authentication failed")) {
      console.error("\n🔍 DIAGNÓSTICO:");
      console.error("   - Credenciales incorrectas");
      console.error("   - Verifica usuario y contraseña");
    }

    console.error("\n🚨 SOLUCIONES:");
    console.error("   1. Verifica la variable MONGODB_URI en Railway");
    console.error("   2. Asegúrate de que la URL sea correcta");
    console.error("   3. Verifica credenciales de usuario/password");
    console.error("   4. Confirma que MongoDB esté ejecutándose");

    process.exit(1);
  }
}

// Ejecutar prueba
testConnection().then(() => {
  console.log("\n🎉 ¡PRUEBA COMPLETADA EXITOSAMENTE!");
  process.exit(0);
}).catch((err) => {
  console.error("\n💥 ERROR EN LA PRUEBA:", err);
  process.exit(1);
});
