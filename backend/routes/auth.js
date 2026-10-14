const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { requireRole } = require("../middlewares/authMiddleware");

// Public
router.post("/register", authController.register);
router.post("/login", authController.login);

// Customer / Admin / Staff Profile
router.get("/me/:id", authController.getProfile);
router.put("/profile/:id", authController.updateProfile);

// Admin & Staff: Customer Management
router.get("/users", requireRole(["ADMIN", "STAFF"]), authController.getAllUsers);
router.get("/users/:id/bookings", requireRole(["ADMIN", "STAFF"]), authController.getUserBookings);

// Admin only: Staff Management
router.get("/staff", requireRole(["ADMIN"]), authController.getStaffList);
router.post("/staff", requireRole(["ADMIN"]), authController.createStaff);
router.put("/staff/:id/status", requireRole(["ADMIN"]), authController.toggleStaffStatus);
router.delete("/staff/:id", requireRole(["ADMIN"]), authController.deleteStaff);

// System Settings (Public read for hotel info sync, Admin only for update)
router.get("/settings", authController.getSettings);
router.put("/settings", requireRole(["ADMIN"]), authController.updateSettings);

module.exports = router;
