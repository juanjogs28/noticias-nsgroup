require("dotenv").config();
const { Resend } = require("resend");

console.log("📧 DIAGNÓSTICO DE EMAIL - Railway vs Localhost");
console.log("=" .repeat(60));

// Verificar variables de entorno críticas para email
console.log("🔍 VARIABLES DE ENTORNO:");
console.log(`NODE_ENV: ${process.env.NODE_ENV || "undefined"}`);
console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? "✅ Configurada" : "❌ NO CONFIGURADA"}`);
console.log(`RESEND_FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL ? "✅ Configurada" : "❌ NO CONFIGURADA"}`);
console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL ? "✅ Configurada" : "❌ NO CONFIGURADA"}`);

// Mostrar valores (ocultando API key por seguridad)
if (process.env.RESEND_API_KEY) {
  console.log(`RESEND_API_KEY (primeros 10 chars): ${process.env.RESEND_API_KEY.substring(0, 10)}...`);
}
if (process.env.RESEND_FROM_EMAIL) {
  console.log(`RESEND_FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL}`);
}
if (process.env.FRONTEND_URL) {
  console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL}`);
}

console.log("\n🔧 CONFIGURACIÓN ACTUAL:");
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const frontendUrl = process.env.FRONTEND_URL || "https://newsroom.eyewatch.me";

console.log(`Email FROM: ${fromEmail}`);
console.log(`Frontend URL: ${frontendUrl}`);
console.log(`Es producción: ${process.env.NODE_ENV === 'production'}`);
console.log(`Es localhost: ${frontendUrl.includes('localhost')}`);

// Verificar si Resend está configurado correctamente
if (!process.env.RESEND_API_KEY) {
  console.log("\n🚨 PROBLEMA CRÍTICO:");
  console.log("❌ RESEND_API_KEY no está configurada");
  console.log("💡 SOLUCIÓN:");
  console.log("   1. Ve a Railway > Tu proyecto > Variables");
  console.log("   2. Agrega: RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
  console.log("   3. Reinicia el servicio");
  process.exit(1);
}

// Inicializar Resend y hacer prueba
const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmailConfiguration() {
  try {
    console.log("\n🧪 PROBANDO CONFIGURACIÓN DE RESEND...");
    
    // Email de prueba (usar el mismo que funciona en localhost)
    const testEmail = 'juanjo28599@gmail.com';
    console.log(`📬 Enviando email de prueba a: ${testEmail}`);
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [testEmail],
      subject: `🧪 Prueba Railway - ${new Date().toISOString()}`,
      html: `
        <h1>¡Prueba desde Railway! 🚂</h1>
        <p>Este email se envió desde Railway para verificar la configuración.</p>
        <hr>
        <p><strong>Configuración:</strong></p>
        <ul>
          <li><strong>NODE_ENV:</strong> ${process.env.NODE_ENV || "undefined"}</li>
          <li><strong>FROM Email:</strong> ${fromEmail}</li>
          <li><strong>Frontend URL:</strong> ${frontendUrl}</li>
          <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
        </ul>
        <hr>
        <p><em>Si recibes este email, la configuración de Railway está funcionando correctamente.</em></p>
      `,
    });

    if (error) {
      console.log("❌ ERROR ENVIANDO EMAIL:");
      console.log("Error:", error);
      
      // Analizar el tipo de error
      if (error.message && error.message.includes('domain')) {
        console.log("\n💡 PROBLEMA DE DOMINIO:");
        console.log("   El dominio 'onboarding@resend.dev' solo funciona en desarrollo");
        console.log("   En producción necesitas verificar tu propio dominio");
        console.log("   SOLUCIÓN:");
        console.log("   1. Ve a resend.com/domains");
        console.log("   2. Verifica tu dominio (ej: eyewatch.me)");
        console.log("   3. Configura RESEND_FROM_EMAIL=noticias@eyewatch.me");
      } else if (error.message && error.message.includes('API key')) {
        console.log("\n💡 PROBLEMA DE API KEY:");
        console.log("   La API key no es válida o no tiene permisos");
        console.log("   SOLUCIÓN:");
        console.log("   1. Ve a resend.com/api-keys");
        console.log("   2. Genera una nueva API key");
        console.log("   3. Actualiza RESEND_API_KEY en Railway");
      }
      
      return false;
    }

    console.log("✅ EMAIL ENVIADO EXITOSAMENTE!");
    console.log(`📧 Email ID: ${data?.id}`);
    console.log("📊 Revisa tu bandeja de entrada para confirmar");
    
    return true;
    
  } catch (error) {
    console.log("❌ ERROR EN LA PRUEBA:");
    console.log("Error:", error.message);
    return false;
  }
}

// Ejecutar prueba
testEmailConfiguration().then(success => {
  console.log("\n" + "=" .repeat(60));
  
  if (success) {
    console.log("🎉 RESULTADO: Configuración de email funcionando correctamente");
    console.log("💡 Si el newsletter no funciona, revisa:");
    console.log("   - Los logs del scheduler en Railway");
    console.log("   - La configuración de MongoDB");
    console.log("   - Los suscriptores activos en la base de datos");
  } else {
    console.log("🚨 RESULTADO: Problema con la configuración de email");
    console.log("💡 Revisa los errores mostrados arriba y corrige la configuración");
  }
  
  console.log("=" .repeat(60));
});
