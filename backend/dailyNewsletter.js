require("dotenv").config();
const mongoose = require("mongoose");
const Subscriber = require("./models/subscribers.js");
const Search = require("./models/searches.js");
const Subscription = require("./models/subscriptions.js");
const { Resend } = require("resend");

// Conectar a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI || "mongodb://localhost:27017/ns-news";

console.log('🔧 dailyNewsletter.js - Conectando a MongoDB:', {
  uri: MONGODB_URI.replace(/\/\/.*@/, '//***:***@'),
  isLocalhost: MONGODB_URI.includes('localhost'),
  nodeEnv: process.env.NODE_ENV,
  hasMongodbUri: !!process.env.MONGODB_URI,
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  hasMongoUri: !!process.env.MONGO_URI
});

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error MongoDB:", err));

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Función para generar el HTML del email
function generateEmailHTML(subscriber, personalizedUrl, searchInfo = null) {
  // Construir URL personalizada con los parámetros del suscriptor
  const baseUrl = process.env.FRONTEND_URL || "https://newsroom.eyewatch.me";
  
  // Agregar información de personalización si está disponible
  let personalizationInfo = "";
  if (searchInfo) {
    personalizationInfo = `
      <div class="personalization-info">
        <strong>🔍 Búsqueda personalizada:</strong><br>
        <strong>📝 ${searchInfo.name}</strong><br>
        🌍 País ID: ${searchInfo.countrySearchId}<br>
        🏢 Sector ID: ${searchInfo.sectorSearchId}
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Noticias Personalizadas - ${new Date().toLocaleDateString('es-ES')}</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
          line-height: 1.6; 
          color: #1f2937; 
          background-color: #f3f4f6;
          margin: 0;
          padding: 0;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }
        .header { 
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
        }
        .header h1 {
          margin: 0 0 10px 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content { 
          background: white; 
          padding: 40px 30px; 
          color: #1f2937;
        }
        .content h2 {
          color: #059669;
          margin-top: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content p {
          font-size: 16px;
          margin-bottom: 20px;
        }
        .button-container {
          text-align: center; 
          margin: 40px 0;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
        }
        .button { 
          display: inline-block; 
          padding: 18px 36px; 
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          color: white !important; 
          text-decoration: none; 
          border-radius: 10px; 
          font-size: 18px; 
          font-weight: 700;
          box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.3);
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }
        .button:hover { 
          background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 15px -3px rgba(220, 38, 38, 0.4);
        }
        .tip {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 16px 20px;
          border-radius: 0 8px 8px 0;
          margin: 20px 0;
        }
        .tip strong {
          color: #92400e;
        }
        .personalization-info {
          background: #e0f2fe;
          border-left: 4px solid #0288d1;
          padding: 16px 20px;
          border-radius: 0 8px 8px 0;
          margin: 20px 0;
          font-size: 14px;
          line-height: 1.5;
        }
        .personalization-info strong {
          color: #0277bd;
        }
        .footer { 
          text-align: center; 
          margin-top: 30px; 
          padding: 30px;
          background: #f8fafc;
          color: #6b7280; 
          font-size: 14px;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          margin: 8px 0;
        }
        @media (max-width: 600px) {
          .container {
            margin: 10px;
            border-radius: 8px;
          }
          .header, .content {
            padding: 25px 20px;
          }
          .button {
            padding: 16px 28px;
            font-size: 16px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📰 Noticias Personalizadas</h1>
          <p>${new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
        
        <div class="content">
          <h2>¡Hola!</h2>
          <p>Aquí tienes tu enlace diario para las noticias personalizadas:</p>
          
          <div class="button-container">
            <a href="${personalizedUrl}" class="button">📰 Ver Noticias Personalizadas</a>
          </div>
          
          ${personalizationInfo}
          
          <div class="tip">
            <strong>💡 Tip:</strong> Guarda este enlace en favoritos para acceso rápido diario.
          </div>
        </div>
        
        <div class="footer">
          <p>Este email se envía automáticamente todos los días</p>
          <p>Para cancelar la suscripción, responde a este email con "CANCELAR"</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Función para enviar email a un suscriptor con sus búsquedas
async function sendNewsletterToSubscriber(subscriber, searchInfo) {
  try {
    // Construir URL personalizada para este suscriptor
    const baseUrl = process.env.FRONTEND_URL || "https://newsroom.eyewatch.me";
    let personalizedUrl = baseUrl;
    
    // Agregar parámetros de personalización si están disponibles
    const params = new URLSearchParams();
    if (searchInfo && searchInfo.countrySearchId) {
      params.append('countryId', searchInfo.countrySearchId);
    }
    if (searchInfo && searchInfo.sectorSearchId) {
      params.append('sectorId', searchInfo.sectorSearchId);
    }
    
    if (params.toString()) {
      personalizedUrl += `?${params.toString()}`;
    }
    
    console.log(`🔗 URL personalizada para ${subscriber.email}: ${personalizedUrl}`);
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [subscriber.email],
      subject: `📰 Noticias Personalizadas - ${new Date().toLocaleDateString('es-ES')}`,
      html: generateEmailHTML(subscriber, personalizedUrl, searchInfo),
    });

    if (error) {
      console.error(`❌ Error enviando email a ${subscriber.email}:`, error);
      return false;
    }

    console.log(`✅ Email enviado a: ${subscriber.email} (ID: ${data?.id})`);
    return true;
  } catch (error) {
    console.error(`❌ Error enviando email a ${subscriber.email}:`, error.message);
    return false;
  }
}

// Función mejorada que devuelve detalles del envío
async function sendNewsletterToSubscriberWithDetails(subscriber, searchInfo) {
  try {
    // Construir URL personalizada para este suscriptor
    const baseUrl = process.env.FRONTEND_URL || "https://newsroom.eyewatch.me";
    let personalizedUrl = baseUrl;
    
    // Agregar parámetros de personalización si están disponibles
    const params = new URLSearchParams();
    if (searchInfo && searchInfo.countrySearchId) {
      params.append('countryId', searchInfo.countrySearchId);
    }
    if (searchInfo && searchInfo.sectorSearchId) {
      params.append('sectorId', searchInfo.sectorSearchId);
    }
    
    if (params.toString()) {
      personalizedUrl += `?${params.toString()}`;
    }
    
    console.log(`🔗 URL personalizada para ${subscriber.email}: ${personalizedUrl}`);
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [subscriber.email],
      subject: `📰 Noticias Personalizadas - ${new Date().toLocaleDateString('es-ES')}`,
      html: generateEmailHTML(subscriber, personalizedUrl, searchInfo),
    });

    if (error) {
      console.error(`❌ Error enviando email a ${subscriber.email}:`, error);
      return {
        success: false,
        error: error.message || error,
        emailId: null,
        personalizedUrl
      };
    }

    console.log(`✅ Email enviado a: ${subscriber.email} (ID: ${data?.id})`);
    return {
      success: true,
      error: null,
      emailId: data?.id,
      personalizedUrl
    };
  } catch (error) {
    console.error(`❌ Error enviando email a ${subscriber.email}:`, error.message);
    return {
      success: false,
      error: error.message,
      emailId: null,
      personalizedUrl: null
    };
  }
}

// Función principal para enviar newsletter diario
async function sendDailyNewsletter() {
  try {
    console.log("🚀 Iniciando envío de newsletter diario...");
    
    // Obtener todas las suscripciones activas con información completa
    const subscriptions = await Subscription.find({ isActive: true })
      .populate('subscriberId', 'email isActive')
      .populate('searchId', 'name countrySearchId sectorSearchId isActive');
    
    console.log(`📧 Encontradas ${subscriptions.length} suscripciones activas`);
    
    if (subscriptions.length === 0) {
      console.log("ℹ️ No hay suscripciones activas");
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    // Enviar emails a todos los suscriptores con sus búsquedas
    for (const subscription of subscriptions) {
      // Verificar que tanto el suscriptor como la búsqueda estén activos
      if (subscription.subscriberId.isActive && subscription.searchId.isActive) {
        const success = await sendNewsletterToSubscriber(subscription.subscriberId, subscription.searchId);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
        
        // Pausa entre emails para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log(`⚠️ Saltando suscripción inactiva: ${subscription.subscriberId.email} -> ${subscription.searchId.name}`);
      }
    }
    
    console.log(`📊 Resumen del envío:`);
    console.log(`✅ Emails enviados exitosamente: ${successCount}`);
    console.log(`❌ Emails fallidos: ${errorCount}`);
    console.log(`📅 Newsletter diario completado: ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error("❌ Error en newsletter diario:", error.message);
  }
  // No cerramos la conexión aquí para evitar problemas con el scheduler
}

// Función mejorada que devuelve resultados detallados
async function sendDailyNewsletterWithResults() {
  try {
    console.log("🚀 Iniciando envío de newsletter diario con resultados...");
    
    // Obtener todas las suscripciones activas con información completa
    const subscriptions = await Subscription.find({ isActive: true })
      .populate('subscriberId', 'email isActive')
      .populate('searchId', 'name countrySearchId sectorSearchId isActive');
    
    console.log(`📧 Encontradas ${subscriptions.length} suscripciones activas`);
    
    if (subscriptions.length === 0) {
      console.log("ℹ️ No hay suscripciones activas");
      return {
        totalSubscriptions: 0,
        successCount: 0,
        errorCount: 0,
        successEmails: [],
        errorEmails: [],
        message: "No hay suscripciones activas"
      };
    }
    
    let successCount = 0;
    let errorCount = 0;
    const successEmails = [];
    const errorEmails = [];
    
    // Enviar emails a todos los suscriptores con sus búsquedas
    for (const subscription of subscriptions) {
      // Verificar que tanto el suscriptor como la búsqueda estén activos
      if (subscription.subscriberId.isActive && subscription.searchId.isActive) {
        const result = await sendNewsletterToSubscriberWithDetails(subscription.subscriberId, subscription.searchId);
        if (result.success) {
          successCount++;
          successEmails.push({
            email: subscription.subscriberId.email,
            searchName: subscription.searchId.name,
            emailId: result.emailId,
            personalizedUrl: result.personalizedUrl
          });
        } else {
          errorCount++;
          errorEmails.push({
            email: subscription.subscriberId.email,
            searchName: subscription.searchId.name,
            error: result.error
          });
        }
        
        // Pausa entre emails para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log(`⚠️ Saltando suscripción inactiva: ${subscription.subscriberId.email} -> ${subscription.searchId.name}`);
      }
    }
    
    console.log(`📊 Resumen del envío:`);
    console.log(`✅ Emails enviados exitosamente: ${successCount}`);
    console.log(`❌ Emails fallidos: ${errorCount}`);
    console.log(`📅 Newsletter diario completado: ${new Date().toISOString()}`);
    
    return {
      totalSubscriptions: subscriptions.length,
      successCount,
      errorCount,
      successEmails,
      errorEmails,
      message: `Enviados ${successCount}/${subscriptions.length} emails exitosamente`
    };
    
  } catch (error) {
    console.error("❌ Error en newsletter diario:", error.message);
    return {
      totalSubscriptions: 0,
      successCount: 0,
      errorCount: 0,
      successEmails: [],
      errorEmails: [],
      message: `Error: ${error.message}`
    };
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  sendDailyNewsletter();
}

module.exports = { sendDailyNewsletter, sendDailyNewsletterWithResults };
