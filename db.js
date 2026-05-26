/**
 * Database Connection Pool
 * =========================
 * MySQL connection pool using mysql2/promise
 * Provides connection pooling for better performance
 * All queries use parameterized statements to prevent SQL injection
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

let poolConfig = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "bloodbankdb",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: true,
  decimalNumbers: true,
};

// Fallback / overrides using DB_* or MYSQL* variables
poolConfig.host = process.env.DB_HOST || process.env.MYSQLHOST || poolConfig.host;
poolConfig.port = Number(process.env.DB_PORT || process.env.MYSQLPORT) || poolConfig.port;
poolConfig.user = process.env.DB_USER || process.env.MYSQLUSER || poolConfig.user;
poolConfig.password = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || poolConfig.password;
poolConfig.database = process.env.DB_NAME || process.env.MYSQLDATABASE || poolConfig.database;

// Check if a unified connection URL is provided (e.g. MYSQL_URL or DATABASE_URL)
const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

if (connectionUrl) {
  try {
    // Parse connection URL (mysql://user:pass@host:port/db)
    const url = new URL(connectionUrl);
    poolConfig.host = url.hostname;
    poolConfig.port = Number(url.port) || 3306;
    poolConfig.user = url.username;
    poolConfig.password = decodeURIComponent(url.password);
    poolConfig.database = url.pathname.replace(/^\//, "");
  } catch (err) {
    console.error("Failed to parse MYSQL_URL/DATABASE_URL:", err.message);
  }
}

// Auto-enable SSL for any remote database (when host is not localhost) or when explicitly requested
if (
  process.env.DB_SSL === "true" ||
  process.env.MYSQL_SSL === "true" ||
  (poolConfig.host && poolConfig.host !== "localhost" && poolConfig.host !== "127.0.0.1")
) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(poolConfig);

/** Run query with timeout (prevents serverless hang) */
const query = async (sql, params = []) => {
  const timeoutMs = 10000;
  const result = await Promise.race([
    pool.query(sql, params),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Database query timed out after ${timeoutMs}ms`)),
        timeoutMs,
      ),
    ),
  ]);
  return result;
};

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
  query,
  testConnection,
  poolConfig,
};
