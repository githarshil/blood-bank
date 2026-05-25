/**
 * Database Connection Pool
 * =========================
 * MySQL connection pool using mysql2/promise
 * Provides connection pooling for better performance
 * All queries use parameterized statements to prevent SQL injection
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

const isServerless = process.env.VERCEL === "1";

const poolConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bloodbankdb",
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: isServerless ? 1 : 5,
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: !isServerless,
  decimalNumbers: true,
};

if (process.env.DB_SSL === "true") {
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
};
