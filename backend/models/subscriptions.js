const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  subscriberId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Subscriber', 
    required: true 
  },
  searchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Search', 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  subscribedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Índice compuesto para evitar duplicados
subscriptionSchema.index({ subscriberId: 1, searchId: 1 }, { unique: true });

module.exports = mongoose.model("Subscription", subscriptionSchema);
