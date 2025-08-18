require("dotenv").config();
const { Resend } = require("resend");

console.log("🧪 Probando configuración de Resend...");

// Verificar variables de entorno
if (!process.env.RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY no está configurada en .env");
  console.log("💡 Agrega: RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
  process.exit(1);
}

if (!process.env.RESEND_FROM_EMAIL) {
  console.log("⚠️ RESEND_FROM_EMAIL no configurada, usando valor por defecto");
}

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY);

async function testResend() {
  try {
    console.log("📧 Enviando email de prueba...");
    
    // En el plan gratuito, solo puedes enviar a tu propio email
    const testEmail = process.env.TEST_EMAIL || 'juanjo28599@gmail.com';
    console.log(`📬 Enviando email de prueba a: ${testEmail}`);
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [testEmail],
      subject: '🧪 Prueba de Resend - NS Group Newsletter',
      html: `
        <h1>¡Resend está funcionando! 🎉</h1>
        <p>Este es un email de prueba para verificar la configuración.</p>
        <p><strong>API Key:</strong> ${process.env.RESEND_API_KEY.substring(0, 10)}...</p>
        <p><strong>From Email:</strong> ${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <hr>
        <p><em>💡 Para enviar a otros emails, necesitas verificar un dominio en resend.com/domains</em></p>
      `,
    });

    if (error) {
      console.error("❌ Error enviando email:", error);
      return;
    }

    console.log("✅ Email de prueba enviado exitosamente!");
    console.log("📧 Email ID:", data?.id);
    console.log("📊 Revisa tu bandeja de entrada para confirmar");
    console.log("💡 También puedes revisar el dashboard de Resend");
    
  } catch (error) {
    console.error("❌ Error en la prueba:", error.message);
  }
}

testResend();
