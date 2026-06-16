require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { config } = require("./config");
const logger = require("./config/logger");
const errorHandler = require("./middlewares/error.middleware");
const { reqLogger } = require("./middlewares/req.middleware");
const authRoutes = require("./routes/auth.route");
const userRoutes = require("./routes/user.route");
const { corsMiddleware } = require("./middlewares/cors.middleware");

const app = express();

const path = require("path");

// Serve test page before helmet so Google scripts aren't blocked by CSP
app.get("/test-google-auth", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "test-google-auth.html"));
});

app.use(helmet());
app.use(corsMiddleware);
app.use(reqLogger);
app.use(cookieParser());
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/user", userRoutes);

app.get("/", (req, res) => {
  res.send("Hello from index.js of the server");
});

app.get("/health", (req, res) => {
  res.status(200).json({ message: "ok" });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    const server = app.listen(config.PORT, () => {
      logger.info(
        `${config.SERVICE_NAME} is running on http://localhost:${config.PORT}`,
      );
    });
    const shutdown = async () => {
      logger.info("Shutting down.....");
      server.close(async () => {
        await disconnectProducer();
        logger.info("Server Close");
        process.exit(0);
      });
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    logger.error("Failed to Start Server", error);
    process.exit(1);
  }
};
startServer();
