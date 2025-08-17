const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
  try {
    await mongoose.connect(config.database.url, config.database.options);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
