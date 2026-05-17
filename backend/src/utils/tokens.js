const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const env = require("../config/env");

function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtAccessExpiresIn
  });
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user._id.toString(), type: "refresh" }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn
  });
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function randomToken() {
  return crypto.randomBytes(32).toString("hex");
}

module.exports = { signAccessToken, signRefreshToken, hashToken, randomToken };
