/**
 * Donor Routes
 * ============
 * Endpoints for managing blood donors (donor table)
 */

const express = require("express");
const router = express.Router();
const { pool } = require("../db");

const VALID_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const ensureDonorHospitalColumns = async (connection) => {
  const [hospitalNameColumn] = await connection.query(
    `
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'donor'
      AND COLUMN_NAME = 'hospital_name'
    LIMIT 1
    `,
  );
  if (!hospitalNameColumn.length) {
    await connection.query("ALTER TABLE donor ADD COLUMN hospital_name VARCHAR(150) NULL");
  }

  const [hospitalDistanceColumn] = await connection.query(
    `
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'donor'
      AND COLUMN_NAME = 'hospital_distance_km'
    LIMIT 1
    `,
  );
  if (!hospitalDistanceColumn.length) {
    await connection.query(
      "ALTER TABLE donor ADD COLUMN hospital_distance_km DECIMAL(6,2) NULL",
    );
  }
};

// GET /api/donors
router.get("/", async (req, res) => {
  try {
    const { bloodType, blood_group } = req.query;
    const filterGroup = blood_group || bloodType;

    let query = `
      SELECT
        d.donor_id,
        d.name,
        d.blood_group,
        d.phone,
        d.email,
        d.address,
        d.hospital_name,
        d.hospital_distance_km,
        d.created_at,
        COALESCE(
          d.last_donation_date,
          (SELECT DATE(MAX(donated_at)) FROM donation dn WHERE dn.donor_id = d.donor_id)
        ) AS last_donation_date
      FROM donor d
      WHERE 1=1`;
    const params = [];

    if (filterGroup) {
      query += " AND d.blood_group = ?";
      params.push(filterGroup);
    }

    query += " ORDER BY d.created_at DESC";

    const connection = await pool.getConnection();
    await ensureDonorHospitalColumns(connection);
    const [donors] = await connection.query(query, params);
    connection.release();

    res.status(200).json({
      success: true,
      count: donors.length,
      data: donors,
      filters: {
        blood_group: filterGroup || null,
      },
    });
  } catch (error) {
    console.error("Error fetching donors:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch donors",
      details: error.message,
    });
  }
});

// GET /api/donors/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();
    const [donors] = await connection.query(
      "SELECT * FROM donor WHERE donor_id = ?",
      [id],
    );
    connection.release();

    if (donors.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Donor with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: donors[0],
    });
  } catch (error) {
    console.error("Error fetching donor:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch donor",
      details: error.message,
    });
  }
});

// POST /api/donors
router.post("/", async (req, res) => {
  try {
    const { name, blood_group, phone, email, address, hospital_name, hospital_distance_km } =
      req.body;

    if (!name || !blood_group || !phone) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        required: ["name", "blood_group", "phone"],
      });
    }

    if (!VALID_BLOOD_GROUPS.includes(blood_group)) {
      return res.status(400).json({
        success: false,
        error: "Invalid blood group",
        valid: VALID_BLOOD_GROUPS,
      });
    }

    const connection = await pool.getConnection();

    try {
      // Backward-compatible schema upgrade for hospital selection metadata.
      await ensureDonorHospitalColumns(connection);

      const [result] = await connection.query(
        `INSERT INTO donor (
          name, blood_group, phone, email, address, hospital_name, hospital_distance_km
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          blood_group,
          phone,
          email || null,
          address || null,
          hospital_name || null,
          hospital_distance_km ?? null,
        ],
      );

      connection.release();

      res.status(201).json({
        success: true,
        message: "Donor registered successfully",
        data: {
          donor_id: result.insertId,
          name,
          blood_group,
          phone,
          hospital_name: hospital_name || null,
          hospital_distance_km: hospital_distance_km ?? null,
        },
      });
    } catch (dbError) {
      connection.release();
      throw dbError;
    }
  } catch (error) {
    console.error("Error adding donor:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add donor",
      details: error.message,
    });
  }
});

// PUT /api/donors/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;

    if (!name && !phone && !email && !address) {
      return res.status(400).json({
        success: false,
        error: "No fields to update",
      });
    }

    const updates = [];
    const params = [];

    if (name) {
      updates.push("name = ?");
      params.push(name);
    }
    if (phone) {
      updates.push("phone = ?");
      params.push(phone);
    }
    if (email !== undefined) {
      updates.push("email = ?");
      params.push(email);
    }
    if (address !== undefined) {
      updates.push("address = ?");
      params.push(address);
    }

    params.push(id);

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      `UPDATE donor SET ${updates.join(", ")} WHERE donor_id = ?`,
      params,
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: `Donor with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Donor updated successfully",
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    console.error("Error updating donor:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update donor",
      details: error.message,
    });
  }
});

// DELETE /api/donors/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();
    // Delete associated donations first to satisfy foreign key constraints
    await connection.query("DELETE FROM donation WHERE donor_id = ?", [id]);
    
    // Delete the donor
    const [result] = await connection.query(
      "DELETE FROM donor WHERE donor_id = ?",
      [id]
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: `Donor with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Donor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting donor:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete donor",
      details: error.message,
    });
  }
});

module.exports = router;
