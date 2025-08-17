const express = require('express');
const router = express.Router();
const { 
  subscribeToNewsletter, 
  getAllSubscribers, 
  deleteSubscriber,
  toggleSubscriberStatus,
  healthCheck 
} = require('../controllers/subscriptionController');

// Health check
router.get('/health', healthCheck);

// Suscribir email
router.post('/subscribe', subscribeToNewsletter);

// Obtener todos los suscriptores (para admin)
router.get('/subscribers', getAllSubscribers);

// Eliminar suscriptor (para admin)
router.delete('/subscribers/:id', deleteSubscriber);

// Cambiar estado del suscriptor (para admin)
router.patch('/subscribers/:id/toggle', toggleSubscriberStatus);

module.exports = router;
