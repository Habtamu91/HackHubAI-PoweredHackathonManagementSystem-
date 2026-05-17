const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, default: "member" },
    joinedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const workflowSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending"
    },
    message: String,
    expiresAt: Date,
    createdAt: { type: Date, default: Date.now },
    resolvedAt: Date
  },
  { timestamps: false }
);

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    hackathon: { type: mongoose.Schema.Types.ObjectId, ref: "Hackathon", required: true },
    leader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [memberSchema], required: true },
    joinRequests: [workflowSchema],
    invitations: [workflowSchema],
    lookingForSkills: [{ type: String, trim: true, lowercase: true }],
    submission: { type: mongoose.Schema.Types.ObjectId, ref: "Submission" },
    finalScore: Number,
    rank: Number,
    status: {
      type: String,
      enum: ["forming", "active", "submitted", "disqualified", "withdrew"],
      default: "forming"
    }
  },
  { timestamps: true }
);

teamSchema.index({ hackathon: 1, name: 1 }, { unique: true });
teamSchema.index({ "members.user": 1, hackathon: 1 });

module.exports = mongoose.model("Team", teamSchema);
