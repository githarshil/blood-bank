/**
 * Local development server (Render, Railway CLI, npm start)
 */

const app = require("./app");
const { testConnection } = require("./db");

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error(
        "⚠️  Failed to connect to database. Server will start but database operations will fail.",
      );
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`
╔════════════════════════════════════════════════════╗
║   Blood Bank Management System - Backend API       ║
║   Server started on port ${PORT}                      ║
║   Environment: ${process.env.NODE_ENV || "development"}                      ║
║   Database: ${process.env.DB_NAME || "bloodbankdb"}              ║
╚════════════════════════════════════════════════════╝
Ready at http://localhost:${PORT}/health
      `);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
