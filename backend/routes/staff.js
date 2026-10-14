const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Direct Staff API Routes: /api/staff
router.get("/", authController.getStaffList);
router.post("/", authController.createStaff);
router.put("/:id/status", authController.toggleStaffStatus);
router.delete("/:id", authController.deleteStaff);

module.exports = router;
