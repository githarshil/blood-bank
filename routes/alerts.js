/**
 * Alerts Routes
 * =============
 * Endpoints for managing system alerts (alerts table)
 */

const express = require("express");
const router = express.Router();
const { pool } = require("../db");

// GET /api/alerts
router.get("/", async (req, res) => {
  try {
    const { blood_group, bloodType } = req.query;
    const filterGroup = blood_group || bloodType;

    let query = "SELECT * FROM alerts WHERE 1=1";
    const params = [];

    if (filterGroup) {
      query += " AND blood_group = ?";
      params.push(filterGroup);
    }

    query += " ORDER BY created_at DESC LIMIT 1000";

    const connection = await pool.getConnection();
    const [alerts] = await connection.query(query, params);
    connection.release();

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
      filters: {
        blood_group: filterGroup || null,
      },
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch alerts",
      details: error.message,
    });
  }
});

// GET /api/alerts/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();
    const [alerts] = await connection.query(
      "SELECT * FROM alerts WHERE alert_id = ?",
      [id],
    );
    connection.release();

    if (alerts.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Alert with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: alerts[0],
    });
  } catch (error) {
    console.error("Error fetching alert:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch alert",
      details: error.message,
    });
  }
});

module.exports = router;
