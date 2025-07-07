const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3001;

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
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
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
    const { email } = req.body;
    
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
      if (existingSubscriber.isActive) {
        return res.status(400).json({ 
          success: false,
          message: 'Este email ya está suscrito' 
        });
      } else {
        // Reactivar suscripción
        existingSubscriber.isActive = true;
        existingSubscriber.subscribedAt = new Date();
        await existingSubscriber.save();
        
        return res.json({ 
          success: true,
          message: 'Suscripción reactivada exitosamente' 
        });
      }
    }

    // Crear nuevo suscriptor
    const newSubscriber = new Subscriber({
      email: email.toLowerCase()
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📧 Endpoint: http://localhost:${PORT}/api/subscribe`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
}); 