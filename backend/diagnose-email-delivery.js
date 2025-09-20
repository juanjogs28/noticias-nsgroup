require("dotenv").config();
const mongoose = require("mongoose");
const Subscriber = require("./models/subscribers.js");
const { Resend } = require("resend");

// Conectar a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI || "mongodb://localhost:27017/ns-news";

console.log("📧 DIAGNÓSTICO DE ENTREGA DE EMAILS");
console.log("=" .repeat(50));

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => {
    console.error("❌ Error MongoDB:", err);
    process.exit(1);
  });

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY);

async function diagnoseEmailDelivery() {
  try {
    console.log("\n🔍 PASO 1: Verificando configuración...");
    
    // Verificar variables críticas
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const frontendUrl = process.env.FRONTEND_URL || "https://newsroom.eyewatch.me";
    
    console.log(`FROM Email: ${fromEmail}`);
    console.log(`Frontend URL: ${frontendUrl}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV || "undefined"}`);
    
    // Verificar si es el dominio correcto
    if (fromEmail === 'onboarding@resend.dev' && process.env.NODE_ENV === 'production') {
      console.log("⚠️  ADVERTENCIA: Usando onboarding@resend.dev en producción");
      console.log("   Esto puede causar problemas de entrega");
    }
    
    console.log("\n🔍 PASO 2: Verificando suscriptores...");
    
    // Obtener suscriptores activos
    const subscribers = await Subscriber.find({ isActive: true });
    console.log(`📧 Suscriptores activos encontrados: ${subscribers.length}`);
    
    if (subscribers.length === 0) {
      console.log("❌ No hay suscriptores activos");
      return;
    }
    
    // Mostrar primeros 3 suscriptores (sin mostrar emails completos por privacidad)
    subscribers.slice(0, 3).forEach((sub, index) => {
      const emailMasked = sub.email.replace(/(.{2}).*(@.*)/, '$1***$2');
      console.log(`   ${index + 1}. ${emailMasked} (País: ${sub.countrySearchId || 'N/A'}, Sector: ${sub.sectorSearchId || 'N/A'})`);
    });
    
    console.log("\n🔍 PASO 3: Probando envío a un suscriptor...");
    
    // Tomar el primer suscriptor para prueba
    const testSubscriber = subscribers[0];
    console.log(`📬 Enviando email de prueba a: ${testSubscriber.email}`);
    
    // Construir URL personalizada
    const baseUrl = frontendUrl;
    let personalizedUrl = baseUrl;
    
    const params = new URLSearchParams();
    if (testSubscriber.countrySearchId) {
      params.append('countryId', testSubscriber.countrySearchId);
    }
    if (testSubscriber.sectorSearchId) {
      params.append('sectorId', testSubscriber.sectorSearchId);
    }
    
    if (params.toString()) {
      personalizedUrl += `?${params.toString()}`;
    }
    
    console.log(`🔗 URL personalizada: ${personalizedUrl}`);
    
    // Enviar email de prueba
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [testSubscriber.email],
      subject: `🧪 Diagnóstico - ${new Date().toLocaleDateString('es-ES')}`,
      html: `
        <h1>🧪 Email de Diagnóstico</h1>
        <p>Este es un email de prueba para diagnosticar problemas de entrega.</p>
        <hr>
        <p><strong>Configuración:</strong></p>
        <ul>
          <li><strong>FROM:</strong> ${fromEmail}</li>
          <li><strong>TO:</strong> ${testSubscriber.email}</li>
          <li><strong>NODE_ENV:</strong> ${process.env.NODE_ENV || "undefined"}</li>
          <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
        </ul>
        <hr>
        <p><strong>URL Personalizada:</strong></p>
        <p><a href="${personalizedUrl}">${personalizedUrl}</a></p>
        <hr>
        <p><em>Si recibes este email, la configuración básica funciona.</em></p>
        <p><em>Si no lo recibes, revisa:</em></p>
        <ul>
          <li>Carpeta de spam</li>
          <li>Configuración de dominio en Resend</li>
          <li>Límites de rate limiting</li>
        </ul>
      `,
    });

    if (error) {
      console.log("❌ ERROR ENVIANDO EMAIL:");
      console.log("Error:", error);
      
      // Analizar tipos de error comunes
      if (error.message && error.message.includes('domain')) {
        console.log("\n💡 PROBLEMA DE DOMINIO:");
        console.log("   El dominio no está verificado en Resend");
        console.log("   SOLUCIÓN:");
        console.log("   1. Ve a resend.com/domains");
        console.log("   2. Verifica tu dominio");
        console.log("   3. Configura RESEND_FROM_EMAIL con tu dominio verificado");
      } else if (error.message && error.message.includes('rate')) {
        console.log("\n💡 PROBLEMA DE RATE LIMITING:");
        console.log("   Has excedido el límite de emails por minuto");
        console.log("   SOLUCIÓN:");
        console.log("   1. Espera unos minutos");
        console.log("   2. Reduce la frecuencia de envío");
      } else if (error.message && error.message.includes('invalid')) {
        console.log("\n💡 PROBLEMA DE EMAIL INVÁLIDO:");
        console.log("   El email del destinatario no es válido");
        console.log("   SOLUCIÓN:");
        console.log("   1. Verifica que el email esté bien formateado");
        console.log("   2. Confirma que el suscriptor existe");
      }
      
      return false;
    }

    console.log("✅ EMAIL ENVIADO EXITOSAMENTE!");
    console.log(`📧 Email ID: ${data?.id}`);
    console.log(`📬 Destinatario: ${testSubscriber.email}`);
    
    console.log("\n🔍 PASO 4: Verificando estado del email...");
    
    // Intentar obtener el estado del email (si la API lo permite)
    try {
      // Nota: Resend no siempre permite consultar el estado inmediatamente
      console.log("💡 Para verificar el estado del email:");
      console.log("   1. Ve a resend.com/emails");
      console.log("   2. Busca el email ID:", data?.id);
      console.log("   3. Revisa el estado de entrega");
    } catch (statusError) {
      console.log("ℹ️  No se pudo verificar el estado inmediatamente");
    }
    
    console.log("\n📋 PRÓXIMOS PASOS:");
    console.log("1. Revisa tu bandeja de entrada");
    console.log("2. Revisa la carpeta de spam");
    console.log("3. Ve a resend.com/emails para ver el estado");
    console.log("4. Si no llega, revisa la configuración del dominio");
    
    return true;
    
  } catch (error) {
    console.error("❌ ERROR EN DIAGNÓSTICO:", error.message);
    return false;
  }
}

// Ejecutar diagnóstico
diagnoseEmailDelivery().then(success => {
  console.log("\n" + "=" .repeat(50));
  
  if (success) {
    console.log("🎉 DIAGNÓSTICO COMPLETADO");
    console.log("💡 Si el email no llega, revisa:");
    console.log("   - Carpeta de spam");
    console.log("   - Configuración de dominio en Resend");
    console.log("   - Dashboard de Resend para ver estado de entrega");
  } else {
    console.log("🚨 DIAGNÓSTICO FALLÓ");
    console.log("💡 Revisa los errores mostrados arriba");
  }
  
  console.log("=" .repeat(50));
  
  // Cerrar conexión
  mongoose.connection.close();
});
