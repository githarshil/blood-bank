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

// Vercel serverless may strip /api prefix — restore it for Express routes
app.use((req, res, next) => {
  const path = req.path || "";
  if (
    !path.startsWith("/api") &&
    path !== "/health" &&
    /^\/(donors|donations|inventory|requests|reports|alerts)/.test(path)
  ) {
    req.url = `/api${req.url}`;
  }
  next();
});

// CORS — local, Render, Vercel production & preview URLs
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (/\.vercel\.app$/i.test(origin)) return callback(null, true);
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

const { query: dbQuery } = require("./db");

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
    database: process.env.DB_NAME || null,
    host: process.env.DB_HOST ? "***configured***" : "missing",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    platform: process.env.VERCEL ? "vercel" : "node",
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

if (process.env.NODE_ENV === "production" && process.env.SERVE_FRONTEND === "true") {
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
