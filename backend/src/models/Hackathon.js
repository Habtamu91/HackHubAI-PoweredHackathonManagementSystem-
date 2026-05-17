const mongoose = require("mongoose");
const slugify = require("slugify");

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    registeredAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["registered", "waitlisted", "withdrawn"],
      default: "registered"
    }
  },
  { _id: false }
);

const weightedCriterionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    maxScore: { type: Number, required: true, min: 1 },
    weight: { type: Number, required: true, min: 0, max: 1 }
  },
  { _id: false }
);

const hackathonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 100 },
    slug: { type: String, unique: true, index: true },
    description: { type: String, required: true, minlength: 20 },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: [
        "draft",
        "published",
        "registration_open",
        "ongoing",
        "judging",
        "completed",
        "cancelled"
      ],
      default: "draft"
    },
    registrationStart: { type: Date, required: true },
    registrationEnd: { type: Date, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    submissionDeadline: { type: Date, required: true },
    teamSettings: {
      minSize: { type: Number, default: 1, min: 1 },
      maxSize: { type: Number, default: 4, min: 1 },
      allowSolo: { type: Boolean, default: true }
    },
    judges: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        assignedAt: { type: Date, default: Date.now }
      }
    ],
    mentors: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        assignedAt: { type: Date, default: Date.now }
      }
    ],
    prizes: [
      {
        rank: Number,
        title: String,
        description: String,
        value: String
      }
    ],
    scoringCriteria: {
      type: [weightedCriterionSchema],
      default: [
        { name: "Innovation", maxScore: 100, weight: 0.35 },
        { name: "Technical Complexity", maxScore: 100, weight: 0.35 },
        { name: "Impact", maxScore: 100, weight: 0.3 }
      ]
    },
    participants: [participantSchema],
    stats: {
      participants: { type: Number, default: 0 },
      teams: { type: Number, default: 0 },
      submissions: { type: Number, default: 0 }
    },
    resultsPublishedAt: Date
  },
  { timestamps: true }
);

hackathonSchema.index({ title: "text", description: "text" });
hackathonSchema.index({ status: 1, startDate: 1 });

hackathonSchema.pre("validate", async function assignSlug(next) {
  if (!this.isModified("title") && this.slug) return next();
  const baseSlug = slugify(this.title, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;
  while (await mongoose.models.Hackathon.exists({ slug, _id: { $ne: this._id } })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
  this.slug = slug;
  next();
});

module.exports = mongoose.model("Hackathon", hackathonSchema);
