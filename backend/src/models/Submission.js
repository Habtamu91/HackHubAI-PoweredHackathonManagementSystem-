const mongoose = require("mongoose");

const criterionScoreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    score: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, min: 1 },
    weight: { type: Number, required: true, min: 0, max: 1 }
  },
  { _id: false }
);

const judgeScoreSchema = new mongoose.Schema(
  {
    judge: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    criteria: [criterionScoreSchema],
    totalScore: { type: Number, default: 0 },
    feedback: String,
    isFinalized: { type: Boolean, default: false },
    finalizedAt: Date
  },
  { timestamps: true }
);

const aiEvaluationSchema = new mongoose.Schema(
  {
    innovationScore: Number,
    documentationScore: Number,
    complexityScore: Number,
    overallScore: Number,
    summary: String,
    suggestions: [String],
    similarityFlags: [
      {
        submissionId: String,
        projectTitle: String,
        similarity: Number
      }
    ],
    evaluatedAt: Date
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    projectTitle: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, minlength: 50 },
    githubUrl: {
      type: String,
      required: true,
      match: [/^https?:\/\/(www\.)?github\.com\/.+/i, "GitHub URL must point to github.com"]
    },
    demoUrl: String,
    videoUrl: String,
    techStack: [{ type: String, trim: true }],
    hackathon: { type: mongoose.Schema.Types.ObjectId, ref: "Hackathon", required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["draft", "submitted", "under_review", "accepted", "rejected", "disqualified"],
      default: "draft"
    },
    scores: [judgeScoreSchema],
    finalScore: Number,
    rank: Number,
    aiEvaluation: aiEvaluationSchema,
    screenshots: [
      {
        url: String,
        publicId: String,
        caption: String
      }
    ],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    submittedAt: Date
  },
  { timestamps: true }
);

submissionSchema.index({ hackathon: 1, status: 1 });
submissionSchema.index({ team: 1 }, { unique: true });

submissionSchema.methods.recalculateFinalScore = function recalculateFinalScore() {
  const finalizedScores = this.scores.filter((score) => score.isFinalized);
  if (finalizedScores.length === 0) return;
  this.finalScore =
    finalizedScores.reduce((sum, score) => sum + score.totalScore, 0) / finalizedScores.length;
};

module.exports = mongoose.model("Submission", submissionSchema);
