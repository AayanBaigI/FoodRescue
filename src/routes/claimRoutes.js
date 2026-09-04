const express = require("express");
const { claimDonation, myClaims } = require("../controllers/claimController");
const { createPickup } = require("../controllers/pickupController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router()

router.post(
  "/:id",
  authenticate,
  authorize("NGO"),
  claimDonation
);

router.get(
  "/my",
  authenticate,
  authorize("NGO"),
  myClaims
);

router.post(
  "/:claimId/pickup",
  authenticate,
  authorize("NGO", "ADMIN"),
  createPickup
);

module.exports = router;
