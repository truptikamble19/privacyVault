const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  platform: { type: String, required: true },
  type: { type: String, required: true },
  category: String,
  status: { type: String, required: true },
  history: [{
    status: String,
    at: Date
  }]
}, {
  timestamps: true,
  collection: "requests"
});

module.exports = mongoose.model("PrivacyRequest", requestSchema);