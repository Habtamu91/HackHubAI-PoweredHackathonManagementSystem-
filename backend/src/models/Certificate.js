const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    verificationId: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hackathon: { type: mongoose.Schema.Types.ObjectId, ref: "Hackathon", required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    rank: Number,
    pdfUrl: String,
    issuedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Certificate", certificateSchema);
