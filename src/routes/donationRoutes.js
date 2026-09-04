const express = require("express");
const {
  createDonation,
  listDonations,
  getDonation,
  cancelDonation
} = require("../controllers/donationController");
const { claimDonation } = require("../controllers/claimController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", listDonations);
router.get("/:id", getDonation);

router.post(
  "/",
  authenticate,
  authorize("PROVIDER"),
  createDonation
);

router.patch(
  "/:id/cancel",
  authenticate,
  authorize("PROVIDER"),
  cancelDonation
);

router.post(
  "/:id/claim",
  authenticate,
  authorize("NGO"),
  claimDonation
);

module.exports = router;
