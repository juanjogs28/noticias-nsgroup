const cors = require('cors');
const config = require('../config/config');

const corsOptions = {
  origin: config.cors.origin,
  credentials: config.cors.credentials
};

module.exports = cors(corsOptions);
