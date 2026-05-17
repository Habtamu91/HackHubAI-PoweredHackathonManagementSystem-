const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const avatarSchema = new mongoose.Schema(
  {
    url: String,
    publicId: String
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },
    role: {
      type: String,
      enum: ["participant", "organizer", "judge", "mentor", "admin"],
      default: "participant"
    },
    avatar: avatarSchema,
    skills: [{ type: String, trim: true, lowercase: true }],
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    isBanned: { type: Boolean, default: false },
    banReason: String,
    stats: {
      hackathonsJoined: { type: Number, default: 0 },
      hackathonsWon: { type: Number, default: 0 },
      submissions: { type: Number, default: 0 }
    },
    refreshToken: { type: String, select: false },
    lastLogin: Date
  },
  { timestamps: true }
);

userSchema.index({ skills: 1 });

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function toJSON() {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  delete user.emailVerificationToken;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  return user;
};

module.exports = mongoose.model("User", userSchema);
