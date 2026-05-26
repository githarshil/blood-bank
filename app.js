/**
 * Express application (shared by local server + Vercel serverless)
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const donorRoutes = require("./routes/donors");
const donationRoutes = require("./routes/donations");
const inventoryRoutes = require("./routes/inventory");
const requestRoutes = require("./routes/requests");
const reportRoutes = require("./routes/reports");
const alertRoutes = require("./routes/alerts");

const app = express();

// CORS — allow local development origins and configured CORS_ORIGIN
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      /^http:\/\/localhost:\d+$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
    ) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

const { query: dbQuery, poolConfig } = require("./db");

const healthHandler = async (req, res) => {
  let dbConnected = false;
  let dbError = null;

  try {
    await dbQuery("SELECT 1");
    dbConnected = true;
  } catch (err) {
    dbError = err.message;
  }

  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? "OK" : "DEGRADED",
    message: dbConnected
      ? "Blood Bank API is running"
      : "API is up but database is not connected",
    dbConnected,
    dbError,
    database: poolConfig.database,
    host: poolConfig.host,
    port: poolConfig.port,
    user: poolConfig.user,
    envKeys: Object.keys(process.env).filter(
      (k) => !/pass|key|token|secret/i.test(k),
    ),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    platform: "node",
  });
};

app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

app.use("/api/donors", donorRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/alerts", alertRoutes);

if (
  process.env.NODE_ENV === "production" &&
  process.env.SERVE_FRONTEND === "true"
) {
  const frontendDist = path.join(__dirname, "blood-bank-frontend", "dist");
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path,
    method: req.method,
  });
});

app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    error: message,
    statusCode,
    ...(process.env.NODE_ENV === "development" && { details: err.stack }),
  });
});

module.exports = app;
