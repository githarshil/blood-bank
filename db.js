/**
 * Database Connection Pool
 * =========================
 * MySQL connection pool using mysql2/promise
 * Provides connection pooling for better performance
 * All queries use parameterized statements to prevent SQL injection
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

const poolConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bloodbankdb",
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 15000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  decimalNumbers: true,
};

// Cloud MySQL (Aiven, Railway, etc.) usually requires SSL
if (process.env.DB_SSL === "true") {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(poolConfig);

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
