require("dotenv").config();
const { sendDailyNewsletter } = require("./dailyNewsletter.js");

console.log("🧪 Iniciando test del programador...");
const startTime = new Date();

// Test 1: Ejecutar exactamente en 1 minuto
setTimeout(async () => {
  console.log("⏰ Test 1 minuto: ejecutando newsletter...");
  await sendDailyNewsletter();
  console.log("✅ Test de 1 minuto completado");
}, 1 * 60 * 1000); // 1 minuto

// Test 2: Ejecutar exactamente en 2 minutos
setTimeout(async () => {
  console.log("⏰ Test 2 minutos: ejecutando newsletter...");
  await sendDailyNewsletter();
  console.log("✅ Test de 2 minutos completado");
}, 2 * 60 * 1000); // 2 minutos

console.log("🧪 Tests programados:");
console.log("   ⏰ Test 1: Dentro de 1 minuto");
console.log("   ⏰ Test 2: Dentro de 2 minutos");
console.log("   📧 Se enviarán emails a todos los suscriptores activos");
console.log(`   🕐 Hora de inicio: ${startTime.toLocaleTimeString()}`);

// Mantener el proceso activo por 3 minutos
setTimeout(() => {
  console.log("🛑 Deteniendo tests después de 3 minutos...");
  process.exit(0);
}, 3 * 60 * 1000);

// Para detener manualmente
process.on("SIGINT", () => {
  console.log("🛑 Deteniendo tests manualmente...");
  process.exit(0);
});
