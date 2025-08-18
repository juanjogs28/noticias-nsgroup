require("dotenv").config();
const mongoose = require("mongoose");
const Subscriber = require("./models/subscribers.js");
const { Resend } = require("resend");

// Conectar a MongoDB
mongoose
  .connect("mongodb://localhost:27017/ns-news")
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error MongoDB:", err));

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Función para generar el HTML del email
function generateEmailHTML(subscriber, frontendUrl) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Noticias Personalizadas - ${new Date().toLocaleDateString('es-ES')}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 15px 30px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; }
        .button:hover { background: #3730a3; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
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
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}" class="button">📰 Ver Noticias Personalizadas</a>
          </div>
          
          <p><strong>💡 Tip:</strong> Guarda este enlace en favoritos para acceso rápido diario.</p>
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

// Función para enviar email a un suscriptor
async function sendNewsletterToSubscriber(subscriber, frontendUrl) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [subscriber.email],
      subject: `📰 Noticias Personalizadas - ${new Date().toLocaleDateString('es-ES')}`,
      html: generateEmailHTML(subscriber, frontendUrl),
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

// Función principal para enviar newsletter diario
async function sendDailyNewsletter() {
  try {
    console.log("🚀 Iniciando envío de newsletter diario...");
    
    // Obtener todos los suscriptores activos
    const subscribers = await Subscriber.find({ isActive: true });
    console.log(`📧 Encontrados ${subscribers.length} suscriptores activos`);
    
    if (subscribers.length === 0) {
      console.log("ℹ️ No hay suscriptores activos");
      return;
    }
    
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    let successCount = 0;
    let errorCount = 0;
    
    // Enviar emails a todos los suscriptores
    for (const subscriber of subscribers) {
      const success = await sendNewsletterToSubscriber(subscriber, frontendUrl);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
      
      // Pausa entre emails para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
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

// Ejecutar si se llama directamente
if (require.main === module) {
  sendDailyNewsletter();
}

module.exports = { sendDailyNewsletter };
