// Script para probar envío optimizado de Resend
require("dotenv").config();
const { sendOptimizedEmail, sendBatchEmails } = require("./optimizeResend.js");

async function testOptimizedResend() {
  console.log("🚀 Probando envío optimizado de Resend...");
  
  // Verificar configuración
  console.log("\n📋 CONFIGURACIÓN:");
  console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? "✅ Configurada" : "❌ No configurada"}`);
  console.log(`RESEND_FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL || "❌ No configurada"}`);
  
  if (!process.env.RESEND_API_KEY) {
    console.log("\n❌ RESEND_API_KEY no está configurada");
    console.log("💡 Agrega: RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    return;
  }
  
  // Email de prueba optimizado
  const testEmail = {
    to: "juanjo28599@gmail.com", // Cambia por tu email
    subject: `🧪 Prueba Optimizada - ${new Date().toISOString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #059669;">🚀 Email Optimizado</h1>
        <p>Este email se envió con configuraciones optimizadas para entrega más rápida:</p>
        
        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>⚡ Optimizaciones Aplicadas:</h3>
          <ul>
            <li><strong>Headers de alta prioridad</strong> - X-Priority: 1</li>
            <li><strong>Tags de tracking</strong> - Para mejor deliverability</li>
            <li><strong>Metadata optimizada</strong> - Para mejor clasificación</li>
            <li><strong>Pausa reducida</strong> - 100ms entre emails</li>
            <li><strong>Envio en lotes</strong> - Hasta 10 emails en paralelo</li>
          </ul>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>📊 Configuración Actual:</h3>
          <p><strong>From:</strong> ${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Optimización:</strong> Alta prioridad + Tags + Metadata</p>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Si recibes este email rápidamente, las optimizaciones están funcionando correctamente.
        </p>
      </div>
    `
  };
  
  try {
    console.log("\n📧 Enviando email de prueba optimizado...");
    const result = await sendOptimizedEmail(testEmail.to, testEmail.subject, testEmail.html);
    
    if (result.success) {
      console.log("✅ Email optimizado enviado exitosamente");
      console.log(`📧 ID del email: ${result.data?.id}`);
      
      console.log("\n🎯 PRÓXIMOS PASOS:");
      console.log("1. Verifica que el email llegue más rápido que antes");
      console.log("2. Si funciona bien, actualiza dailyNewsletter.js para usar estas optimizaciones");
      console.log("3. Considera usar un dominio verificado para mejor reputación");
      
    } else {
      console.log("❌ Error enviando email optimizado:", result.error);
    }
    
  } catch (error) {
    console.error("❌ Error en prueba optimizada:", error.message);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testOptimizedResend();
}

module.exports = { testOptimizedResend };
