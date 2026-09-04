const pool = require("../config/db");

async function expireDonations() {
  try {
    const result = await pool.query(
      `UPDATE donations
       SET status = 'EXPIRED'
       WHERE expiry_at <= NOW()
         AND status IN ('AVAILABLE','PARTIALLY_CLAIMED')
       RETURNING id`
    );

    if (result.rowCount) {
      console.log(`Expiry job: marked ${result.rowCount} donation(s) as expired.`);
    }
  } catch (err) {
    console.error("Expiry job failed:", err.message);
  }
}

function startExpiryJob() {
  expireDonations();
  setInterval(expireDonations, 60 * 1000);
}

module.exports = startExpiryJob;
