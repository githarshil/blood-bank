/**
 * Blood Bank & Donor Management System - Backend API
 * ====================================================
 * Express.js server with MySQL database integration
 * RESTful API for managing blood donations and requests
 */

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { testConnection } = require("./db");

// Import routes
const donorRoutes = require("./routes/donors");
const donationRoutes = require("./routes/donations");
const inventoryRoutes = require("./routes/inventory");
const requestRoutes = require("./routes/requests");
const reportRoutes = require("./routes/reports");
const alertRoutes = require("./routes/alerts");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// ===============================================
// MIDDLEWARE SETUP
// ===============================================

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ===============================================
// HEALTH CHECK ENDPOINT
// ===============================================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Blood Bank API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ===============================================
// API ROUTES
// ===============================================

// Donor routes
app.use("/api/donors", donorRoutes);

// Donation routes
app.use("/api/donations", donationRoutes);

// Blood Inventory routes
app.use("/api/inventory", inventoryRoutes);

// Blood Request routes
app.use("/api/requests", requestRoutes);

// Reports routes
app.use("/api/reports", reportRoutes);

// Alerts routes
app.use("/api/alerts", alertRoutes);

// ===============================================
// 404 NOT FOUND HANDLER
// ===============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path,
    method: req.method,
  });
});

// ===============================================
// GLOBAL ERROR HANDLER
// ===============================================

app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    error: message,
    statusCode: statusCode,
    ...(process.env.NODE_ENV === "development" && { details: err.stack }),
  });
});

// ===============================================
// SERVER STARTUP
// ===============================================

const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error(
        "⚠️  Failed to connect to database. Server will start but database operations will fail.",
      );
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════╗
║   Blood Bank Management System - Backend API       ║
║   Server started on port ${PORT}                      ║
║   Environment: ${process.env.NODE_ENV || "development"}                      ║
║   Database: ${process.env.DB_NAME}              ║
╚════════════════════════════════════════════════════╝

Available Endpoints:
  GET  /health                    - Health check
  GET  /api/donors                - Get all donors
  POST /api/donors                - Add new donor
  
  GET  /api/inventory             - Get all inventory
  
  GET  /api/requests              - Get all requests
  POST /api/requests              - Create new request
  POST /api/requests/fulfill/:id  - Fulfill a request
  
  GET  /api/reports/monthly       - Get monthly report
  
  GET  /api/alerts                - Get all alerts

Ready to accept connections! 🚀
            `);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\nSIGINT received. Shutting down gracefully...");
  process.exit(0);
});

module.exports = app;
