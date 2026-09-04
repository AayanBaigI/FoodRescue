const express = require("express");
const { updatePickupStatus } = require("../controllers/pickupController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.patch(
  "/:id/status",
  authenticate,
  authorize("VOLUNTEER", "ADMIN"),
  updatePickupStatus
);

module.exports = router;
