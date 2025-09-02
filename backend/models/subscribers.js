const mongoose = require("mongoose");

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  countrySearchId: { type: String, default: "" },
  sectorSearchId: { type: String, default: "" },
  subscribedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  isDefaultCountry: { type: Boolean, default: false },
  isDefaultSector: { type: Boolean, default: false },
});

module.exports = mongoose.model("Subscriber", subscriberSchema);
