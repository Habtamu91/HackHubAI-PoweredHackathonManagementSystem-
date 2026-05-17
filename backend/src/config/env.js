require("dotenv").config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:5000/api/v1",
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/hackhub",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  jwtSecret: process.env.JWT_SECRET || "dev-access-token-secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-token-secret",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "7d",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://localhost:8000",
  emailFrom: process.env.EMAIL_FROM || "HackHub <no-reply@hackhub.local>"
};

module.exports = env;
