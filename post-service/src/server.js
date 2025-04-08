require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const postRoutes = require("./routes/post-route");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 3002;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info("✅ Connected to MongoDB"))
  .catch((e) => logger.error("❌ Mongo connection error:", e));

const redisClient = new Redis(process.env.REDIS_URL);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  logger.info(`📩 ${req.method} ${req.url}`);
  logger.info("📦 Request body:", req.body); // ✅ Log actual body
  next();
});

// TODO: Implement IP-based rate limiting here

// Routes
app.use("/api/posts", postRoutes);

// Error Handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    app.listen(PORT, () => {
      logger.info(`🚀 Post service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

// Global unhandled rejection listener
process.on("unhandledRejection", (reason, promise) => {
  logger.error("💥 Unhandled Rejection at:", promise, "Reason:", reason);
});
