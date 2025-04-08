require("dotenv").config();
const mongoose = require("mongoose");
const logger = require("./utils/logger");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const Redis = require("ioredis");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const routes = require("./routes/identity-services");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Connect to MongoDB with proper timeout
mongoose
  .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => logger.info("Connected to MongoDB"))
  .catch((error) => {
    logger.error("MongoDB connection error:", error.message);
    process.exit(1); // Exit if MongoDB connection fails
  });

// ✅ Fix Redis connection
// 🟢 ✅ Use Redis via Connection URL from .env
const redisClient = new Redis(process.env.REDIS_URL, {
  tls: process.env.REDIS_TLS === "true" ? {} : undefined, // Enables TLS if needed
});
redisClient.on("error", (err) => {
  logger.error("Redis Client Error:", err);
});

// ✅ Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// ✅ Logging Middleware
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body, null, 2)}`);
  next();
});

// ✅ DDoS Protection & Rate Limiting
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10, // Allow 10 requests per second
  duration: 1,
});

app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests" });
  }
});

// ✅ IP-based Rate Limiting for Sensitive Endpoints
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Max 50 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests" });
  },
  store: new RedisStore({
    // ✅ Fix Redis command issue
    sendCommand: async (...args) => {
      return redisClient.call(...args);
    },
  }),
});

// ✅ Apply Rate Limiter to Sensitive Routes
app.use("/api/auth/register", sensitiveEndpointsLimiter);

// ✅ Routes
app.use("/api/auth", routes);

// ✅ Error Handler
app.use(errorHandler);

// ✅ Start Server
const server = app.listen(PORT, () => {
  logger.info(`Identity service running on port ${PORT}`);
});

// ✅ Handle Unhandled Promise Rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "Reason:", reason);
});

// ✅ Handle Uncaught Exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1); // Exit to avoid unexpected behavior
});

// ✅ Graceful Shutdown
process.on("SIGINT", async () => {
  logger.info("Shutting down gracefully...");
  await mongoose.connection.close();
  // await redisClient.quit();
  server.close(() => {
    logger.info("Server closed.");
    process.exit(0);
  });
});
