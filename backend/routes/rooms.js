const express = require("express");
const router = express.Router();
const roomController = require("../controllers/roomController");
const { requireRole } = require("../middlewares/authMiddleware");

// Public
router.get("/", roomController.getAllRooms);
router.get("/:id", roomController.getRoomById);

// Staff (Lễ tân) and Admin can create & update rooms
router.post("/", requireRole(["ADMIN", "STAFF"]), roomController.createRoom);
router.put("/:id", requireRole(["ADMIN", "STAFF"]), roomController.updateRoom);

// Admin only: delete room
router.delete("/:id", requireRole(["ADMIN"]), roomController.deleteRoom);

module.exports = router;
