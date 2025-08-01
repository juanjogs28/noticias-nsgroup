require('dotenv').config();
const path = require('path');

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3001;
const fetch = require('node-fetch') // Si no está instalado: npm i node-fetch@2

const MELTWATER_API_URL = 'https://api.meltwater.com'; // o el base correcto
const MELTWATER_TOKEN = process.env.MELTWATER_API_TOKEN;

// Mapa de búsquedas guardadas en Meltwater
const SEARCH_ID_MAP = {
  //TWEETS VIRAL GLOBAL
  'global:tweets': '27593205',
  //URUGUAY
  'uy:general': '27548571',
  'uy:economy': '27592244', 
  'uy:sports': '27592255',
  'uy:politics': '27592272',
  'uy:health': '27592275',
  //ARGENTINA
  'ar:general': '27592289',
  'ar:economy': '27592219', 
  'ar:sports': '27592307',  
  'ar:politics': '27592319',
  'ar:health': '27592336',
  //MEXICO
  'mx:general': '27592349',
  'mx:economy': '27592353',
  'mx:sports': '27592358',  
  'mx:politics': '27592376',
  'mx:health': '27592380',
  //PARAGUAY
  'py:general': '27592383',
  'py:economy': '27593264', 
  'py:sports': '27592387',
  'py:politics': '27592398',    
  'py:health': '27592400',
  // CHILE
  'cl:general': '27592696', 
  'cl:economy': '27592698',
  'cl:sports': '27592701',
  'cl:politics': '27592703',
  'cl:health': '27592712',
  //ECUADOR
  'ec:general': '27592720',
  'ec:economy': '27592722',
  'ec:sports': '27592725',
  'ec:politics': '27592732',
  'ec:health': '27592739',
  //PAMAMA
  'pa:general': '27593024',
  'pa:economy': '27593028', 
  'pa:sports': '27593034',
  'pa:politics': '27593038',
  'pa:health': '27593069',
  //PERU
  'pe:general': '27593139',
  'pe:economy': '27593141',
  'pe:sports': '27593148',
  'pe:politics': '27593152',
  'pe:health': '27593153',
};

// Middlewares
app.use(cors({
  origin: 'http://localhost:8080', // URL del frontend
  credentials: true
}));
app.use(express.json());



// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/ns-news')
  .then(() => {
    console.log('✅ Conectado a MongoDB');
  })
  .catch((error) => {
    console.error('❌ Error conectando a MongoDB:', error);
  });

// Modelo de Suscriptor
const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  country: String,  // ← AGREGAR ESTO
  sector: String,   // ← AGREGAR ESTO
  subscribedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});


const Subscriber = mongoose.model('Subscriber', subscriberSchema);

// Rutas
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para suscribir email
app.post('/api/subscribe', async (req, res) => {
  try {
    const { email, country, sector } = req.body;
    // Validar que el email existe
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email es requerido' 
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Formato de email inválido' 
      });
    }

 // Verificar si el email ya existe
const existingSubscriber = await Subscriber.findOne({ email: email.toLowerCase() });
if (existingSubscriber) {
  existingSubscriber.country = country;
  existingSubscriber.sector = sector;
  existingSubscriber.isActive = true;
  existingSubscriber.subscribedAt = new Date();
  await existingSubscriber.save();

  return res.json({ 
    success: true,
    message: 'Suscripción actualizada exitosamente' 
  });
}

// Crear nuevo suscriptor
const newSubscriber = new Subscriber({
  email: email.toLowerCase(),
  country,
  sector
});
await newSubscriber.save();

    
    console.log(`✅ Nuevo suscriptor agregado: ${email}`);
    
    res.json({ 
      success: true,
      message: 'Suscripción exitosa' 
    });

  } catch (error) {
    console.error('❌ Error en suscripción:', error);
    
    if (error.code === 11000) {
      // Error de duplicado
      res.status(400).json({ 
        success: false,
        message: 'Este email ya está suscrito' 
      });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Error interno del servidor' 
      });
    }
  }
});

// Endpoint para obtener todos los suscriptores (opcional, para testing)
app.get('/api/subscribers', async (req, res) => {
  try {
    const subscribers = await Subscriber.find({ isActive: true })
      .select('email subscribedAt')
      .sort({ subscribedAt: -1 });
    
    res.json({
      success: true,
      count: subscribers.length,
      subscribers: subscribers
    });
  } catch (error) {
    console.error('❌ Error obteniendo suscriptores:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
});

app.get('/api/preferences/:email', async (req, res) => {
  const { email } = req.params;
  const subscriber = await Subscriber.findOne({ email: email.toLowerCase() });

  if (!subscriber) {
    return res.status(404).json({ success: false, message: "Usuario no encontrado" });
  }

  res.json({
    success: true,
    country: subscriber.country,
    sector: subscriber.sector
  });
});




// Función para crear una búsqueda dinámica en Meltwater
// async function createSearch(country, sector) {
//   const body = {
//     name: `Noticias para ${country} - ${sector}`,
//     query: {
//       operator: "AND",
//       operands: [
//         { type: "keyword", value: sector },
//         { type: "location", value: country }
//       ]
//     },
//     language: "es"
//   };

//   const res = await fetch(`${MELTWATER_API_URL}/v3/explore_plus/assets/searches`, {
//     method: 'POST',
//     headers: {
//   'apikey': MELTWATER_TOKEN,
//   'Content-Type': 'application/json',
// }
// ,
//     body: JSON.stringify(body),
//   });

//   if (!res.ok) {
//     const errorText = await res.text();
//     throw new Error(`Error creando búsqueda Meltwater: ${res.status} - ${errorText}`);
//   }

//   return res.json(); // devuelve datos con search_id, etc.
// }

// Función para buscar resultados en Meltwater dado un search_id
async function getSearchResults(searchId) {
  const now = new Date();
  const end = now.toISOString().slice(0, 19); // hasta segundos
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const start = startDate.toISOString().slice(0, 19);

  const res = await fetch(`${MELTWATER_API_URL}/v3/search/${searchId}`, {
    method: 'POST',
    headers: {
      'apikey': MELTWATER_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tz: "America/Montevideo", // obligatorio
      start: start,
      end: end,
      limit: 10, // o el número que prefieras
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error buscando resultados Meltwater: ${res.status} - ${errorText}`);
  }

  return res.json();
}



// Ruta para obtener noticias personalizadas con país y sector

app.post('/api/news', async (req, res) => {
  try {
    const { country, sector } = req.body;
    console.log("📩 Recibido /api/news con:", { country, sector });
    // Mapear país+sector a searchId
    const searchId = SEARCH_ID_MAP[`${country}:${sector}`];

    if (!searchId) {
      return res.status(400).json({ success: false, message: "No se encontró searchId para esta combinación" });
    }

    const results = await getSearchResults(searchId);
    console.log("📊 Resultados obtenidos:", country,sector);
    // Validar que exista result y documents
    if (results && results.result && Array.isArray(results.result.documents)) {
      res.json({ success: true, data: results.result.documents });
    } else {
      res.status(500).json({ success: false, message: "Estructura de resultados inválida" });
    }

  } catch (error) {
    console.error("❌ Error en /api/news:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

//CONTENIDO VIRAL GLOBAL

// Endpoint para tweets globales desde Meltwater
app.get('/api/global-tweets', async (req, res) => {
  try {
    const searchId = SEARCH_ID_MAP['global:tweets'];
    if (!searchId) return res.status(400).json({ success: false, message: "Search ID para tweets globales no definido" });

    const results = await getSearchResults(searchId);
    if (results && results.result && Array.isArray(results.result.documents)) {
      // Filtrar solo tweets (fuente social y nombre que incluya 'x' por ejemplo)
      // const tweets = results.result.documents.filter(
      //   (doc) => doc.source?.type === "social" && doc.source?.name?.toLowerCase().includes("x")
      // );
      const tweets = results.result.documents; // mostrar todo temporalmente
      res.json({ success: true, data: tweets });
    } else {
      res.status(500).json({ success: false, message: "Estructura de resultados inválida" });
    }
  } catch (error) {
    console.error("❌ Error en /api/global-tweets:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📧 Endpoint: http://localhost:${PORT}/api/subscribe`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
}); 