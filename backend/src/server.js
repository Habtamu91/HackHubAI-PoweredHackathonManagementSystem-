const http = require("http");
const path = require("path");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const morgan = require("morgan");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const env = require("./config/env");
const { connectDatabase } = require("./config/database");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const { initSocket } = require("./services/socketService");
const { startScheduler } = require("./jobs/scheduler");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.frontendUrl,
    credentials: true
  }
});

initSocket(io);

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    const decoded = jwt.verify(token, env.jwtSecret);
    socket.userId = decoded.sub;
    return next();
  } catch (error) {
    return next(new Error("Invalid socket token"));
  }
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.userId}`);
  socket.on("join:hackathon", (hackathonId) => socket.join(`hackathon:${hackathonId}`));
  socket.on("leave:hackathon", (hackathonId) => socket.leave(`hackathon:${hackathonId}`));
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true
  })
);
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "hackhub-api", timestamp: new Date().toISOString() });
});

app.use("/certificates", express.static(path.join(process.cwd(), "certificates")));
app.use("/api/v1/auth", authLimiter, require("./routes/auth.routes"));
app.use("/api/v1/hackathons", require("./routes/hackathon.routes"));
app.use("/api/v1/teams", require("./routes/team.routes"));
app.use("/api/v1/submissions", require("./routes/submission.routes"));
app.use("/api/v1/judge", require("./routes/judge.routes"));
app.use("/api/v1/ai", require("./routes/ai.routes"));
app.use("/api/v1/notifications", require("./routes/notification.routes"));
app.use("/api/v1/certificates", require("./routes/certificate.routes"));

app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDatabase();
  startScheduler();
  server.listen(env.port, () => {
    console.log(`HackHub API listening on port ${env.port}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { app, server, io };
