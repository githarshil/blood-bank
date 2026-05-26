/**
 * Blood Request Routes
 * ====================
 * Endpoints for managing blood requests (blood_request table)
 */

const express = require("express");
const router = express.Router();
const { pool } = require("../db");

const VALID_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// GET /api/requests
router.get("/", async (req, res) => {
  try {
    const { status, bloodType, blood_group } = req.query;
    const filterGroup = blood_group || bloodType;

    let query = "SELECT * FROM blood_request WHERE 1=1";
    const params = [];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    if (filterGroup) {
      query += " AND blood_group = ?";
      params.push(filterGroup);
    }

    query += " ORDER BY requested_at DESC";

    const connection = await pool.getConnection();
    const [requests] = await connection.query(query, params);
    connection.release();

    const data = requests.map((r) => ({
      ...r,
      RequestID: r.request_id,
    }));

    res.status(200).json({
      success: true,
      count: data.length,
      data,
      summary: {
        pending: requests.filter((r) => r.status === "Pending").length,
        fulfilled: requests.filter((r) => r.status === "Fulfilled").length,
        rejected: requests.filter((r) => r.status === "Rejected").length,
      },
      filters: {
        status: status || null,
        blood_group: filterGroup || null,
      },
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch requests",
      details: error.message,
    });
  }
});

// POST /api/requests/fulfill/:id — must be before /:id
router.post("/fulfill/:id", async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    await connection.beginTransaction();

    const [requests] = await connection.query(
      "SELECT * FROM blood_request WHERE request_id = ? FOR UPDATE",
      [id],
    );

    if (requests.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        error: `Request with ID ${id} not found`,
      });
    }

    const request = requests[0];

    if (request.status !== "Pending") {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        error: `Request is already ${request.status}`,
      });
    }

    const [inventory] = await connection.query(
      `SELECT * FROM blood_inventory 
       WHERE blood_group = ? AND expiry_date > CURDATE()
       ORDER BY expiry_date ASC
       FOR UPDATE`,
      [request.blood_group],
    );

    const totalAvailable = inventory.reduce(
      (sum, row) => sum + row.units_available,
      0,
    );

    if (totalAvailable < request.units_required) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        error: `Insufficient inventory. Required: ${request.units_required} units, Available: ${totalAvailable} units.`,
      });
    }

    let remaining = request.units_required;

    for (const batch of inventory) {
      if (remaining <= 0) break;

      const deduct = Math.min(batch.units_available, remaining);
      await connection.query(
        "UPDATE blood_inventory SET units_available = units_available - ? WHERE inventory_id = ?",
        [deduct, batch.inventory_id],
      );
      remaining -= deduct;
    }

    await connection.query(
      "UPDATE blood_request SET status = 'Fulfilled' WHERE request_id = ?",
      [id],
    );

    await connection.commit();
    connection.release();

    res.status(200).json({
      success: true,
      message: "Request fulfilled successfully",
      requestID: id,
      unitsDeducted: request.units_required,
      blood_group: request.blood_group,
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error("Error fulfilling request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fulfill request",
      details: error.message,
    });
  }
});

// GET /api/requests/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();
    const [requests] = await connection.query(
      "SELECT * FROM blood_request WHERE request_id = ?",
      [id],
    );
    connection.release();

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Request with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: requests[0],
    });
  } catch (error) {
    console.error("Error fetching request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch request",
      details: error.message,
    });
  }
});

// POST /api/requests
router.post("/", async (req, res) => {
  try {
    const { patient_name, blood_group, units_required } = req.body;

    if (!patient_name || !blood_group || !units_required) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        required: ["patient_name", "blood_group", "units_required"],
      });
    }

    if (!VALID_BLOOD_GROUPS.includes(blood_group)) {
      return res.status(400).json({
        success: false,
        error: "Invalid blood group",
        valid: VALID_BLOOD_GROUPS,
      });
    }

    if (units_required <= 0) {
      return res.status(400).json({
        success: false,
        error: "Units required must be greater than 0",
      });
    }

    const connection = await pool.getConnection();

    try {
      const [result] = await connection.query(
        `INSERT INTO blood_request (patient_name, blood_group, units_required, status)
         VALUES (?, ?, ?, 'Pending')`,
        [patient_name, blood_group, units_required],
      );

      connection.release();

      res.status(201).json({
        success: true,
        message: "Blood request created successfully",
        data: {
          request_id: result.insertId,
          patient_name,
          blood_group,
          units_required,
          status: "Pending",
        },
      });
    } catch (dbError) {
      connection.release();
      throw dbError;
    }
  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create request",
      details: error.message,
    });
  }
});

// PUT /api/requests/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status is required",
      });
    }

    if (!["Pending", "Fulfilled", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be Pending, Fulfilled, or Rejected",
      });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      "UPDATE blood_request SET status = ? WHERE request_id = ?",
      [status, id],
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: `Request with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Request updated successfully",
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update request",
      details: error.message,
    });
  }
});

// DELETE /api/requests/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      "DELETE FROM blood_request WHERE request_id = ?",
      [id]
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: `Request with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete request",
      details: error.message,
    });
  }
});

module.exports = router;
