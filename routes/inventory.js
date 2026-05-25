/**
 * Inventory Routes
 * ================
 * Endpoints for blood inventory management (blood_inventory table)
 */

const express = require("express");
const router = express.Router();
const { pool } = require("../db");

const getStatusColor = (quantity) => {
  if (quantity >= 5) return { color: "green", level: "SAFE" };
  if (quantity >= 1) return { color: "yellow", level: "LOW" };
  return { color: "red", level: "CRITICAL" };
};

const mapInventoryRow = (row) => ({
  inventory_id: row.inventory_id,
  blood_group: row.blood_group,
  units_available: row.units_available,
  expiry_date: row.expiry_date,
  updated_at: row.updated_at,
  // PascalCase aliases for Dashboard compatibility
  InventoryID: row.inventory_id,
  BloodType: row.blood_group,
  QuantityAvailable: row.units_available,
  ExpiryDate: row.expiry_date,
});

// GET /api/inventory
router.get("/", async (req, res) => {
  try {
    const { bloodType, blood_group } = req.query;
    const filterGroup = blood_group || bloodType;

    let query =
      "SELECT * FROM blood_inventory WHERE expiry_date > CURDATE()";
    const params = [];

    if (filterGroup) {
      query += " AND blood_group = ?";
      params.push(filterGroup);
    }

    query += " ORDER BY blood_group ASC, expiry_date ASC";

    const connection = await pool.getConnection();
    const [inventory] = await connection.query(query, params);
    connection.release();

    const inventoryWithColors = inventory.map((item) => {
      const mapped = mapInventoryRow(item);
      return {
        ...mapped,
        statusColor: getStatusColor(item.units_available),
      };
    });

    const summary = inventoryWithColors.reduce((acc, item) => {
      const bloodType = item.BloodType;
      if (!acc[bloodType]) {
        acc[bloodType] = {
          bloodType,
          totalQuantity: 0,
          batchCount: 0,
          statusColor: null,
        };
      }
      acc[bloodType].totalQuantity += item.QuantityAvailable;
      acc[bloodType].batchCount += 1;
      const currentStatus = getStatusColor(item.QuantityAvailable);
      if (
        !acc[bloodType].statusColor ||
        currentStatus.level === "CRITICAL" ||
        (currentStatus.level === "LOW" &&
          acc[bloodType].statusColor.level !== "CRITICAL")
      ) {
        acc[bloodType].statusColor = currentStatus;
      }
      return acc;
    }, {});

    const summaryArray = Object.values(summary);

    res.status(200).json({
      success: true,
      count: inventoryWithColors.length,
      data: inventoryWithColors,
      summary: {
        totalBatches: inventoryWithColors.length,
        bloodTypeSummary: summaryArray,
        criticalBloodTypes: summaryArray.filter(
          (b) => b.statusColor?.level === "CRITICAL",
        ),
        lowStockBloodTypes: summaryArray.filter(
          (b) => b.statusColor?.level === "LOW",
        ),
      },
      filters: {
        bloodType: filterGroup || null,
      },
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch inventory",
      details: error.message,
    });
  }
});

// GET /api/inventory/summary/by-type
router.get("/summary/by-type", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [summary] = await connection.query(`
      SELECT 
        blood_group AS BloodType,
        SUM(units_available) AS TotalQuantity,
        COUNT(*) AS BatchCount,
        MIN(expiry_date) AS EarliestExpiry,
        MAX(expiry_date) AS LatestExpiry
      FROM blood_inventory
      WHERE expiry_date > CURDATE()
      GROUP BY blood_group
      ORDER BY blood_group ASC
    `);
    connection.release();

    const summaryWithColors = summary.map((item) => ({
      ...item,
      statusColor: getStatusColor(item.TotalQuantity),
      daysUntilEarliestExpiry: Math.ceil(
        (new Date(item.EarliestExpiry) - new Date()) / (1000 * 60 * 60 * 24),
      ),
    }));

    res.status(200).json({
      success: true,
      data: summaryWithColors,
      stats: {
        totalBloodTypes: summaryWithColors.length,
        totalUnits: summaryWithColors.reduce(
          (sum, item) => sum + item.TotalQuantity,
          0,
        ),
        criticalTypes: summaryWithColors.filter(
          (b) => b.statusColor.level === "CRITICAL",
        ).length,
        lowStockTypes: summaryWithColors.filter(
          (b) => b.statusColor.level === "LOW",
        ).length,
        safeTypes: summaryWithColors.filter(
          (b) => b.statusColor.level === "SAFE",
        ).length,
      },
    });
  } catch (error) {
    console.error("Error fetching inventory summary:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch inventory summary",
      details: error.message,
    });
  }
});

// GET /api/inventory/expiring/soon
router.get("/expiring/soon", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [expiringInventory] = await connection.query(`
      SELECT 
        inventory_id AS InventoryID,
        blood_group AS BloodType,
        units_available AS QuantityAvailable,
        expiry_date AS ExpiryDate,
        DATEDIFF(expiry_date, CURDATE()) AS DaysRemaining
      FROM blood_inventory
      WHERE expiry_date > CURDATE()
        AND DATEDIFF(expiry_date, CURDATE()) <= 7
      ORDER BY expiry_date ASC
    `);
    connection.release();

    res.status(200).json({
      success: true,
      count: expiringInventory.length,
      warning:
        expiringInventory.length > 0
          ? `${expiringInventory.length} batch(es) expiring within 7 days`
          : "No inventory expiring soon",
      data: expiringInventory,
    });
  } catch (error) {
    console.error("Error fetching expiring inventory:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch expiring inventory",
      details: error.message,
    });
  }
});

// GET /api/inventory/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();
    const [inventory] = await connection.query(
      "SELECT * FROM blood_inventory WHERE inventory_id = ?",
      [id],
    );
    connection.release();

    if (inventory.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Inventory with ID ${id} not found`,
      });
    }

    const item = mapInventoryRow(inventory[0]);

    res.status(200).json({
      success: true,
      data: {
        ...item,
        statusColor: getStatusColor(item.QuantityAvailable),
        daysUntilExpiry: Math.ceil(
          (new Date(item.ExpiryDate) - new Date()) / (1000 * 60 * 60 * 24),
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch inventory",
      details: error.message,
    });
  }
});

module.exports = router;
