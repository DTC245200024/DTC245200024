const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { requireRole } = require("../middlewares/authMiddleware");

// Public / Customer create booking
router.post("/", bookingController.createBooking);

// Customer cancel booking & request checkin & request checkout
router.put("/:id/cancel", bookingController.cancelBooking);
router.put("/:id/request-checkin", bookingController.requestCheckIn);
router.put("/:id/request-checkout", bookingController.requestCheckout);

// Staff / Admin endpoints
router.put("/:id/confirm", bookingController.confirmBooking);
router.put("/:id/payment", bookingController.confirmPayment);
router.put("/:id/checkin", bookingController.checkInBooking);
router.put("/:id/checkout", bookingController.checkOutBooking);

// Customer / Staff / Admin read & general update
router.get("/", bookingController.getAllBookings);
router.get("/:id", bookingController.getBookingById);
router.put("/:id", bookingController.updateBooking);

// Admin only can delete bookings
router.delete("/:id", requireRole(["ADMIN"]), bookingController.deleteBooking);

module.exports = router;
