import express from "express";
import bookingController from "../../controllers/Operations/booking.controller.js";
import {authMiddleware,operationsMiddleware} from "../../middleware/auth.js";
const router = express.Router();

// GET /bookings - Retrieve bookings for a specific centre, sport, and date
router.get("/", authMiddleware, operationsMiddleware, bookingController.getBookings);

// GET /bookings/available - Retrieve available time slots for a specific centre, sport, and date
router.get(
	"/available",
	authMiddleware,
	bookingController.getAvailableTimeSlots
);

// POST /bookings - Create a new booking
router.post(
	"/",
	authMiddleware, bookingController.createBooking
);

export default router;
