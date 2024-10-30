import express from "express";
import bookingController from "../../controllers/Operations/booking.controller.js";
import { authMiddleware, operationsMiddleware } from "../../middleware/auth.js";
import bookingsController from "../../controllers/User/booking.controller.js";


const router = express.Router();

// GET /bookings - Retrieve all bookings
router.get("/", authMiddleware, operationsMiddleware, bookingController.getBookings);

// GET /bookings/available - Retrieve available time slots for booking
router.get("/available", authMiddleware, bookingController.getAvailableTimeSlots);

// POST /bookings - Create a new booking
router.post("/", authMiddleware, bookingController.createBooking);

// GET /bookings/user/:userId -	Retrieve bookings for a specific user
router.get(
    "/user/:userId",
    authMiddleware,
    bookingsController.getUserBookings
);

// GET /bookings/my - Retrieve bookings for the current user
router.get("/my", authMiddleware, bookingsController.getUserBookings);

export default router;
