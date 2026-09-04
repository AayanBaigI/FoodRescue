const pool = require("../config/db");

async function createPickup(req, res) {
  try {
    const { volunteerId, pickupTime } = req.body;

    const result = await pool.query(
      `UPDATE pickups p
       SET volunteer_id = $1, pickup_time = $2, status = 'ASSIGNED'
       FROM claims c
       WHERE p.claim_id = c.id
         AND p.claim_id = $3
       RETURNING p.*`,
      [volunteerId || null, pickupTime || null, req.params.claimId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Claim/pickup not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not assign pickup" });
  }
}

async function updatePickupStatus(req, res) {
  try {
    const allowed = ["PENDING", "ASSIGNED", "PICKED_UP", "DELIVERED", "CANCELLED"];
    const { status } = req.body;

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid pickup status" });
    }

    const result = await pool.query(
      `UPDATE pickups
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, req.params.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Pickup not found" });
    }

    if (status === "PICKED_UP") {
      await pool.query(
        `UPDATE claims c
         SET status = 'PICKED_UP'
         FROM pickups p
         WHERE p.id = $1 AND c.id = p.claim_id`,
        [req.params.id]
      );
    }

    if (status === "DELIVERED") {
      await pool.query(
        `UPDATE claims c
         SET status = 'PICKED_UP'
         FROM pickups p
         WHERE p.id = $1 AND c.id = p.claim_id`,
        [req.params.id]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update pickup" });
  }
}

module.exports = { createPickup, updatePickupStatus };
