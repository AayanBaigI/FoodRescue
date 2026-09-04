const pool = require("../config/db");

async function createDonation(req, res) {
  try {
    const {
      foodName, category, quantity, locationId, preparedAt, expiryAt
    } = req.body;

    if (!foodName || !category || !quantity || !locationId || !preparedAt || !expiryAt) {
      return res.status(400).json({ error: "All donation fields are required" });
    }

    if (Number(quantity) <= 0 || !Number.isInteger(Number(quantity))) {
      return res.status(400).json({ error: "Quantity must be a positive integer" });
    }

    if (new Date(expiryAt) <= new Date(preparedAt)) {
      return res.status(400).json({ error: "expiryAt must be after preparedAt" });
    }

    const result = await pool.query(
      `INSERT INTO donations
       (provider_id, food_name, category, quantity, remaining_quantity,
        location_id, prepared_at, expiry_at)
       VALUES ($1,$2,$3,$4,$4,$5,$6,$7)
       RETURNING *`,
      [req.user.id, foodName, category, quantity, locationId, preparedAt, expiryAt]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create donation" });
  }
}

async function listDonations(req, res) {
  try {
    const { category, locationId } = req.query;

    const params = [];
    const filters = [
      "d.status IN ('AVAILABLE','PARTIALLY_CLAIMED')",
      "d.expiry_at > NOW()",
      "d.remaining_quantity > 0"
    ];

    if (category) {
      params.push(category);
      filters.push(`d.category = $${params.length}`);
    }

    if (locationId) {
      params.push(locationId);
      filters.push(`d.location_id = $${params.length}`);
    }

    const result = await pool.query(
      `SELECT d.*, l.name AS location_name, l.address,
        ROUND(
          (
            LEAST(EXTRACT(EPOCH FROM (d.expiry_at - NOW())) / 3600.0, 24) / 24.0
          ) * -50
          + LEAST(d.remaining_quantity, 100) * 0.3
        , 2) AS priority_score
       FROM donations d
       JOIN locations l ON l.id = d.location_id
       WHERE ${filters.join(" AND ")}
       ORDER BY d.expiry_at ASC, priority_score DESC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch donations" });
  }
}

async function getDonation(req, res) {
  try {
    const result = await pool.query(
      `SELECT d.*, l.name AS location_name, l.address
       FROM donations d
       JOIN locations l ON l.id = d.location_id
       WHERE d.id = $1`,
      [req.params.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Donation not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch donation" });
  }
}

async function cancelDonation(req, res) {
  try {
    const result = await pool.query(
      `UPDATE donations
       SET status = 'CANCELLED'
       WHERE id = $1 AND provider_id = $2 AND remaining_quantity = quantity
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        error: "Donation not found, not owned by provider, or already claimed"
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not cancel donation" });
  }
}

module.exports = { createDonation, listDonations, getDonation, cancelDonation };
