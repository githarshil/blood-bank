/**
 * Database Connection Pool
 * =========================
 * MySQL connection pool using mysql2/promise
 * Provides connection pooling for better performance
 * All queries use parameterized statements to prevent SQL injection
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "BloodBankDB",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10, // Maximum connections in pool
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  decimalNumbers: true, // Convert DECIMAL to numbers instead of strings
});

// Test connection on startup
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL Database Connected Successfully");
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database Connection Error:", error.message);
    return false;
  }
};

// Export pool and test function
module.exports = {
  pool,
  testConnection,
};
