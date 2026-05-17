const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");

const tokenBlacklist = new Map();

function blacklistToken(token, expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000) {
  tokenBlacklist.set(token, expiresAt);
}

function isBlacklisted(token) {
  const expiresAt = tokenBlacklist.get(token);
  if (!expiresAt) return false;
  if (expiresAt < Date.now()) {
    tokenBlacklist.delete(token);
    return false;
  }
  return true;
}

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    if (isBlacklisted(token)) {
      return res.status(401).json({ success: false, message: "Token has been revoked" });
    }

    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.sub);
    if (!user || user.isBanned) {
      return res.status(401).json({ success: false, message: "Invalid account" });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return next();
  return protect(req, res, next);
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Insufficient permissions" });
    }
    next();
  };
}

module.exports = { protect, optionalAuth, authorize, blacklistToken };
