/**
 * Shared Vercel serverless handler for all API routes
 */
const serverless = require("serverless-http");
const app = require("../app");

module.exports = serverless(app);
