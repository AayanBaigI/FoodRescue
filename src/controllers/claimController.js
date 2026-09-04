const pool = require("../config/db");

async function claimDonation(req, res) {
  const client = await pool.connect();

  try {
    const donationId = Number(req.params.id);
    const quantity = Number(req.body.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: "quantity must be a positive integer" });
    }

    await client.query("BEGIN");

    // Lock the donation row until the transaction finishes.
    const locked = await client.query(
      `SELECT id, remaining_quantity, status, expiry_at
       FROM donations
       WHERE id = $1
       FOR UPDATE`,
      [donationId]
    );

    if (!locked.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Donation not found" });
    }

    const donation = locked.rows[0];

    if (new Date(donation.expiry_at) <= new Date()) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Donation has expired" });
    }

    if (!["AVAILABLE", "PARTIALLY_CLAIMED"].includes(donation.status)) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Donation is not available" });
    }

    if (quantity > donation.remaining_quantity) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Requested quantity exceeds remaining quantity",
        remainingQuantity: donation.remaining_quantity
      });
    }

    const newRemaining = donation.remaining_quantity - quantity;
    const newStatus = newRemaining === 0 ? "CLAIMED" : "PARTIALLY_CLAIMED";

    const claimResult = await client.query(
      `INSERT INTO claims (donation_id, ngo_id, quantity_claimed, status)
       VALUES ($1, $2, $3, 'CLAIMED')
       RETURNING *`,
      [donationId, req.user.id, quantity]
    );

    await client.query(
      `UPDATE donations
       SET remaining_quantity = $1, status = $2
       WHERE id = $3`,
      [newRemaining, newStatus, donationId]
    );

    await client.query(
      `INSERT INTO pickups (claim_id, status)
       VALUES ($1, 'PENDING')`,
      [claimResult.rows[0].id]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Donation claimed successfully",
      claim: claimResult.rows[0],
      remainingQuantity: newRemaining
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Could not claim donation" });
  } finally {
    client.release();
  }
}

async function myClaims(req, res) {
  try {
    const result = await pool.query(
      `SELECT c.*, d.food_name, d.location_id, p.id AS pickup_id, p.status AS pickup_status
       FROM claims c
       JOIN donations d ON d.id = c.donation_id
       LEFT JOIN pickups p ON p.claim_id = c.id
       WHERE c.ngo_id = $1
       ORDER BY c.claimed_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch claims" });
  }
}

module.exports = { claimDonation, myClaims };
