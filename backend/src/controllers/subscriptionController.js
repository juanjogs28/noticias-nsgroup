const Subscriber = require('../models/Subscriber');
const config = require('../config/config');

// Suscribir o actualizar suscriptor
const subscribeToNewsletter = async (req, res) => {
  try {
    const { email, category, region } = req.body;
    
    // Validar que el email existe
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email es requerido' 
      });
    }

    // Validar formato de email usando configuración centralizada
    if (!config.validation.email.regex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Formato de email inválido' 
      });
    }

    // Validar categoría usando configuración centralizada
    if (category && !config.validation.categories.includes(category)) {
      return res.status(400).json({ 
        success: false,
        message: 'Categoría inválida' 
      });
    }

    // Validar región usando configuración centralizada
    if (region && !config.validation.regions.includes(region)) {
      return res.status(400).json({ 
        success: false,
        message: 'Región inválida' 
      });
    }

    // Verificar si el email ya existe
    const existingSubscriber = await Subscriber.findOne({ email: email.toLowerCase() });
    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        // Actualizar preferencias del suscriptor existente
        existingSubscriber.category = category || existingSubscriber.category;
        existingSubscriber.region = region || existingSubscriber.region;
        existingSubscriber.subscribedAt = new Date();
        await existingSubscriber.save();
        
        return res.json({ 
          success: true,
          message: 'Preferencias actualizadas exitosamente' 
        });
      } else {
        // Reactivar suscripción con nuevas preferencias
        existingSubscriber.isActive = true;
        existingSubscriber.category = category || existingSubscriber.category;
        existingSubscriber.region = region || existingSubscriber.region;
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
      email: email.toLowerCase(),
      category: category || 'all',
      region: region || 'us'
    });

    await newSubscriber.save();
    
    console.log(`✅ Nuevo suscriptor agregado: ${email} - Categoría: ${category || 'all'} - Región: ${region || 'us'}`);
    
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
};

// Obtener todos los suscriptores
const getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find()
      .select('email subscribedAt category region isActive')
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
};

// Eliminar suscriptor
const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subscriber = await Subscriber.findByIdAndDelete(id);
    
    if (!subscriber) {
      return res.status(404).json({ 
        success: false,
        message: 'Suscriptor no encontrado' 
      });
    }
    
    console.log(`🗑️ Suscriptor eliminado: ${subscriber.email}`);
    
    res.json({ 
      success: true,
      message: 'Suscriptor eliminado exitosamente' 
    });
    
  } catch (error) {
    console.error('❌ Error eliminando suscriptor:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
};

// Cambiar estado del suscriptor (activo/inactivo)
const toggleSubscriberStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const subscriber = await Subscriber.findByIdAndUpdate(
      id, 
      { isActive: isActive },
      { new: true }
    );
    
    if (!subscriber) {
      return res.status(404).json({ 
        success: false,
        message: 'Suscriptor no encontrado' 
      });
    }
    
    console.log(`🔄 Estado del suscriptor ${subscriber.email} cambiado a: ${isActive ? 'activo' : 'inactivo'}`);
    
    res.json({ 
      success: true,
      message: `Estado del suscriptor actualizado a ${isActive ? 'activo' : 'inactivo'}`,
      subscriber: subscriber
    });
    
  } catch (error) {
    console.error('❌ Error cambiando estado del suscriptor:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
};

// Health check
const healthCheck = async (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  subscribeToNewsletter,
  getAllSubscribers,
  deleteSubscriber,
  toggleSubscriberStatus,
  healthCheck
};
