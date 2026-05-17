const crypto = require("crypto");
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { created, ok } = require("../utils/apiResponse");
const { hashToken, randomToken, signAccessToken, signRefreshToken } = require("../utils/tokens");
const { protect, blacklistToken } = require("../middleware/auth");
const env = require("../config/env");
const { sendEmail, verificationEmail } = require("../services/emailService");

const router = express.Router();

function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password, role = "participant", skills = [] } = req.body;
    const emailVerificationToken = hashToken(randomToken());
    const user = await User.create({ name, email, password, role, skills, emailVerificationToken });
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshToken = hashToken(refreshToken);
    await user.save();

    const verificationUrl = `${env.apiBaseUrl}/auth/verify-email/${emailVerificationToken}`;
    await sendEmail({ to: user.email, ...verificationEmail({ name: user.name, url: verificationUrl }) });
    setRefreshCookie(res, refreshToken);
    created(res, { user, accessToken }, "Account created");
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password +refreshToken");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    if (user.isBanned) {
      return res.status(403).json({ success: false, message: user.banReason || "Account is banned" });
    }

    user.lastLogin = new Date();
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshToken = hashToken(refreshToken);
    await user.save();
    setRefreshCookie(res, refreshToken);
    ok(res, { user, accessToken }, "Logged in");
  })
);

router.post(
  "/logout",
  protect,
  asyncHandler(async (req, res) => {
    blacklistToken(req.token);
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: "" } });
    res.clearCookie("refreshToken");
    ok(res, null, "Logged out");
  })
);

router.post(
  "/refresh-token",
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "Refresh token required" });
    }

    const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);
    const user = await User.findById(decoded.sub).select("+refreshToken");
    if (!user || user.refreshToken !== hashToken(refreshToken)) {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }

    const accessToken = signAccessToken(user);
    ok(res, { user, accessToken }, "Token refreshed");
  })
);

router.get(
  "/verify-email/:token",
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ emailVerificationToken: req.params.token }).select(
      "+emailVerificationToken"
    );
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid verification token" });
    }
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();
    ok(res, { isEmailVerified: true }, "Email verified");
  })
);

router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: String(req.body.email).toLowerCase() });
    if (user) {
      const token = randomToken();
      user.passwordResetToken = hashToken(token);
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      const url = `${env.frontendUrl}/reset-password/${token}`;
      await sendEmail({
        to: user.email,
        subject: "Reset your HackHub password",
        html: `<p>Reset your password by opening <a href="${url}">this secure link</a>.</p>`,
        text: `Reset your password: ${url}`
      });
    }
    ok(res, null, "If the account exists, a reset link was sent");
  })
);

router.patch(
  "/reset-password/:token",
  asyncHandler(async (req, res) => {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    }).select("+passwordResetToken +passwordResetExpires");
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    ok(res, null, "Password reset");
  })
);

router.patch(
  "/change-password",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(req.body.currentPassword))) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }
    user.password = req.body.newPassword;
    await user.save();
    ok(res, null, "Password changed");
  })
);

router.get("/me", protect, (req, res) => ok(res, { user: req.user }));

module.exports = router;
