const mongoose = require("mongoose");

const platformSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  name: { type: String, required: true },
  riskScore: Number,
  riskLevel: String,
  dataCategories: [String],
  status: String,
  lastSynced: Date
});

module.exports = mongoose.model("Platform", platformSchema);