// Configuraciones optimizadas para Resend - Envío más rápido
require("dotenv").config();
const { Resend } = require("resend");

// Configuración optimizada de Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Función optimizada para envío rápido
async function sendOptimizedEmail(to, subject, html) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject: subject,
      html: html,
      
      // 🚀 CONFIGURACIONES PARA ENVÍO MÁS RÁPIDO
      
      // Headers de alta prioridad
      headers: {
        'X-Priority': '1',           // Alta prioridad
        'X-MSMail-Priority': 'High', // Prioridad alta para Outlook
        'Importance': 'high',        // Importancia alta
        'X-Mailer': 'Newsletter-System', // Identificador del sistema
        'List-Unsubscribe': '<mailto:unsubscribe@newsroom.eyewatch.me>', // Para mejor deliverability
      },
      
      // Tags para mejor tracking y deliverability
      tags: [
        { name: 'newsletter', value: 'daily' },
        { name: 'priority', value: 'high' },
        { name: 'type', value: 'automated' }
      ],
      
      // Configuraciones adicionales para mejor entrega
      reply_to: process.env.RESEND_FROM_EMAIL || 'noticias@newsroom.eyewatch.me',
      
      // Metadata para tracking
      metadata: {
        source: 'newsletter-system',
        version: '2.0',
        timestamp: new Date().toISOString()
      }
    });

    if (error) {
      console.error(`❌ Error enviando email optimizado:`, error);
      return { success: false, error };
    }

    console.log(`✅ Email optimizado enviado (ID: ${data?.id})`);
    return { success: true, data };
    
  } catch (error) {
    console.error(`❌ Error en envío optimizado:`, error.message);
    return { success: false, error: error.message };
  }
}

// Función para envío en lotes (más eficiente)
async function sendBatchEmails(emails, batchSize = 10) {
  const results = [];
  
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    
    // Enviar lote en paralelo
    const batchPromises = batch.map(email => 
      sendOptimizedEmail(email.to, email.subject, email.html)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Pausa mínima entre lotes (100ms en lugar de 500ms)
    if (i + batchSize < emails.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

module.exports = {
  sendOptimizedEmail,
  sendBatchEmails,
  resend
};
