/**
 * Donation Routes
 * ===============
 * Record blood donations (donation table)
 */

const express = require("express");
const router = express.Router();
const { pool } = require("../db");

const VALID_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// POST /api/donations — log a new donation
router.post("/", async (req, res) => {
  try {
    const { donor_id, blood_group, units = 1, donated_at } = req.body;

    if (!donor_id || !blood_group) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        required: ["donor_id", "blood_group"],
      });
    }

    if (!VALID_BLOOD_GROUPS.includes(blood_group)) {
      return res.status(400).json({
        success: false,
        error: "Invalid blood group",
        valid: VALID_BLOOD_GROUPS,
      });
    }

    const unitsNum = parseInt(units, 10);
    if (Number.isNaN(unitsNum) || unitsNum < 1) {
      return res.status(400).json({
        success: false,
        error: "Units must be a positive number",
      });
    }

    const [donors] = await pool.query(
      "SELECT donor_id, blood_group FROM donor WHERE donor_id = ?",
      [donor_id],
    );

    if (donors.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Donor with ID ${donor_id} not found`,
      });
    }

    const donatedAt = donated_at || new Date();

    const [result] = await pool.query(
      `INSERT INTO donation (donor_id, blood_group, units, donated_at)
       VALUES (?, ?, ?, ?)`,
      [donor_id, blood_group, unitsNum, donatedAt],
    );

    await pool.query(
      `UPDATE donor SET last_donation_date = (
         SELECT DATE(MAX(donated_at)) FROM donation WHERE donor_id = ?
       ) WHERE donor_id = ?`,
      [donor_id, donor_id],
    );

    res.status(201).json({
      success: true,
      message: "Donation logged successfully",
      data: {
        donation_id: result.insertId,
        donor_id,
        blood_group,
        units: unitsNum,
        donated_at: donatedAt,
      },
    });
  } catch (error) {
    console.error("Error logging donation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to log donation",
      details: error.message,
    });
  }
});

// GET /api/donations — list donations (optional, for debugging)
router.get("/", async (req, res) => {
  try {
    const [donations] = await pool.query(
      `SELECT d.donation_id, d.donor_id, dn.name AS donor_name,
              d.blood_group, d.units, d.donated_at
       FROM donation d
       JOIN donor dn ON d.donor_id = dn.donor_id
       ORDER BY d.donated_at DESC`,
    );

    res.status(200).json({
      success: true,
      count: donations.length,
      data: donations,
    });
  } catch (error) {
    console.error("Error fetching donations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch donations",
      details: error.message,
    });
  }
});

module.exports = router;
