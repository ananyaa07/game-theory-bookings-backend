import Booking from "../../models/booking.js";
import Resource from "../../models/resource.js";
import Centre from "../../models/center.js";
import Sport from "../../models/sport.js";
import mongoose from "mongoose";
import moment from "moment-timezone";

const bookingsController = {
    // Creates a new booking after validating input and checking resource availability
    async createBooking(req, res) {
        try {
            const {
                centreId,
                sportId,
                resourceId,
                bookingDate,
                startHour,
                endHour,
                status,
                remarks,
            } = req.body;

            // Validate required fields
            if (!centreId || !sportId || !bookingDate || !startHour || !endHour || !status) {
                return res.status(400).json({
                    error: "centreId, sportId, bookingDate, startHour, endHour, and status are required.",
                });
            }

            // Validate ObjectIDs
            if (!mongoose.Types.ObjectId.isValid(centreId) || !mongoose.Types.ObjectId.isValid(sportId)) {
                return res.status(400).json({
                    error: "Invalid centreId or sportId.",
                });
            }

            if (resourceId && !mongoose.Types.ObjectId.isValid(resourceId)) {
                return res.status(400).json({
                    error: "Invalid resourceId.",
                });
            }

            // Validate bookingDate format
            const formattedBookingDate = moment(bookingDate, "YYYY-MM-DD", true);
            if (!formattedBookingDate.isValid()) {
                return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
            }
            formattedBookingDate.startOf("day");

            // Validate time slots
            if (startHour < 4 || startHour >= 22 || endHour <= 4 || endHour > 22 || endHour <= startHour) {
                return res.status(400).json({
                    error: "Invalid startHour or endHour. Times must be between 04:00 and 22:00, and endHour must be after startHour.",
                });
            }

            const validStatuses = [
                "Booking",
                "Checked",
                "Coaching",
                "Blocked",
                "Completed",
                "Payment Pending",
            ];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    error: `Invalid status. Allowed statuses are: ${validStatuses.join(", ")}.`,
                });
            }

            let allocatedResourceId = resourceId;

            // If no resourceId is provided, find an available resource
            if (!resourceId) {
                const resources = await Resource.find({
                    sportId,
                    centreId,
                }).select("_id");

                if (!resources.length) {
                    return res.status(404).json({
                        error: "No resources found for the specified centre and sport.",
                    });
                }

                const resourceIds = resources.map((r) => r._id);

                // Check for conflicting bookings
                const conflictingBookings = await Booking.find({
                    resourceId: { $in: resourceIds },
                    bookingDate: formattedBookingDate.toDate(),
                    $or: [
                        { startHour: { $lt: endHour, $gte: startHour } },
                        { endHour: { $gt: startHour, $lte: endHour } },
                        { startHour: { $lte: startHour }, endHour: { $gte: endHour } },
                        { startHour: { $gte: startHour }, endHour: { $lte: endHour } },
                    ],
                }).select("resourceId");

                const bookedResourceIds = conflictingBookings.map((booking) => booking.resourceId.toString());

                const availableResourceIds = resourceIds.filter((id) => !bookedResourceIds.includes(id.toString()));

                if (!availableResourceIds.length) {
                    return res.status(409).json({
                        error: "No resources available for the selected time slot.",
                    });
                }

                // Randomly allocate one of the available resources
                allocatedResourceId = availableResourceIds[Math.floor(Math.random() * availableResourceIds.length)];
            } else {
                // Check if the specified resource is available for the requested time slot
                const existingBooking = await Booking.findOne({
                    resourceId,
                    bookingDate: formattedBookingDate.toDate(),
                    $or: [
                        { startHour: { $lt: endHour, $gte: startHour } },
                        { endHour: { $gt: startHour, $lte: endHour } },
                        { startHour: { $lte: startHour }, endHour: { $gte: endHour } },
                        { startHour: { $gte: startHour }, endHour: { $lte: endHour } },
                    ],
                });

                if (existingBooking) {
                    return res.status(409).json({
                        error: "Time slot overlaps with an existing booking for this resource.",
                    });
                }

                allocatedResourceId = resourceId; 
            }

            // Create and save the new booking
            const newBooking = new Booking({
                userId: req.user ? req.user.id : null,
                resourceId: allocatedResourceId,
                bookingDate: formattedBookingDate.toDate(),
                startHour,
                endHour,
                centreId,
                sportId,
                status,
                remarks: remarks || "",
            });

            await newBooking.save();

            // Populate and return the newly created booking
            const populatedBooking = await Booking.findById(newBooking._id)
                .populate("resourceId", "name")
                .populate("userId", "name email");

            return res.status(201).json(populatedBooking);
        } catch (err) {
            console.error("Error in createBooking:", err);
            return res.status(500).json({ error: "Server error." });
        }
    },

    // Retrieves available time slots for a specific centre and sport on a given date
    async getAvailableTimeSlots(req, res) {
        try {
            const { centreId, sportId, bookingDate } = req.query;

            // Validate query parameters
            if (!centreId || !sportId || !bookingDate) {
                return res.status(400).json({ error: "centreId, sportId, and bookingDate are required." });
            }

            if (!mongoose.Types.ObjectId.isValid(centreId) || !mongoose.Types.ObjectId.isValid(sportId)) {
                return res.status(400).json({ error: "Invalid centreId or sportId." });
            }

            // Validate bookingDate format
            const formattedBookingDate = moment(bookingDate, "YYYY-MM-DD", true);
            if (!formattedBookingDate.isValid()) {
                return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
            }

            const bookingDateStart = formattedBookingDate.clone().startOf("day").toDate();

            // Retrieve resources for the specified centre and sport
            const resources = await Resource.find({ centreId, sportId }).select("_id");

            if (!resources.length) {
                return res.status(404).json({ error: "No resources found for the specified centre and sport." });
            }

            const resourceIds = resources.map((r) => r._id);
            const totalResources = resources.length;

            const timeSlots = {};
            // Initialize time slots
            for (let hour = 4; hour < 22; hour++) {
                const slotLabel = `${hour}:00 - ${hour + 1}:00`;
                timeSlots[hour] = {
                    startHour: hour,
                    endHour: hour + 1,
                    slot: slotLabel,
                    totalResources,
                    bookedResources: 0,
                    availableResources: totalResources,
                };
            }

            // Retrieve existing bookings for the given date
            const bookings = await Booking.find({
                resourceId: { $in: resourceIds },
                bookingDate: bookingDateStart,
                status: { $ne: "Blocked" },
            }).select("startHour endHour");

            // Update time slots based on existing bookings
            bookings.forEach((booking) => {
                for (let hour = booking.startHour; hour < booking.endHour; hour++) {
                    if (timeSlots[hour]) {
                        timeSlots[hour].bookedResources += 1;
                        timeSlots[hour].availableResources -= 1;
                    }
                }
            });

            // Filter to get only available time slots
            const availableTimeSlots = Object.values(timeSlots).filter(slot => slot.availableResources > 0);

            return res.status(200).json({ availableTimeSlots });
        } catch (err) {
            console.error("Error in getAvailableTimeSlots:", err);
            return res.status(500).json({ error: "Server error." });
        }
    },

    // Retrieves all bookings for a specific user by their ID
    async getUserBookings(req, res) {
        try {
            const { userId } = req.params;

            // Validate userId parameter
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ error: "Invalid userId." });
            }

            // Retrieve bookings for the specified user
            const bookings = await Booking.find({ userId })
                .populate("resourceId", "name")
                .populate("sportId", "name")
                .populate("centreId", "name")
                .sort({ bookingDate: -1 });

            return res.status(200).json(bookings);
        } catch (err) {
            console.error("Error in getUserBookings:", err);
            return res.status(500).json({ error: "Server error." });
        }
    },

    // Retrieves all bookings for a specific centre
    async getCentreBookings(req, res) {
        try {
            const { centreId } = req.params;

            // Validate centreId parameter
            if (!mongoose.Types.ObjectId.isValid(centreId)) {
                return res.status(400).json({ error: "Invalid centreId." });
            }

            // Retrieve bookings for the specified centre
            const bookings = await Booking.find({ centreId })
                .populate("resourceId", "name")
                .populate("sportId", "name")
                .populate("centreId", "name")
                .sort({ bookingDate: -1 });

            return res.status(200).json(bookings);
        } catch (err) {
            console.error("Error in getCentreBookings:", err);
            return res.status(500).json({ error: "Server error." });
        }
    },

    // Updates an existing booking by ID
    async updateBooking(req, res) {
        try {
            const { bookingId } = req.params;

            // Validate bookingId parameter
            if (!mongoose.Types.ObjectId.isValid(bookingId)) {
                return res.status(400).json({ error: "Invalid bookingId." });
            }

            // Update the booking with provided details
            const updatedBooking = await Booking.findByIdAndUpdate(
                bookingId,
                req.body,
                { new: true }
            )
                .populate("resourceId", "name")
                .populate("sportId", "name")
                .populate("centreId", "name");

            // Check if the booking was found
            if (!updatedBooking) {
                return res.status(404).json({ error: "Booking not found." });
            }

            return res.status(200).json(updatedBooking);
        } catch (err) {
            console.error("Error in updateBooking:", err);
            return res.status(500).json({ error: "Server error." });
        }
    },

    // Deletes a booking by its ID
    async deleteBooking(req, res) {
        try {
            const { bookingId } = req.params;

            // Validate bookingId parameter
            if (!mongoose.Types.ObjectId.isValid(bookingId)) {
                return res.status(400).json({ error: "Invalid bookingId." });
            }

            // Attempt to delete the booking
            const deletedBooking = await Booking.findByIdAndDelete(bookingId);
            if (!deletedBooking) {
                return res.status(404).json({ error: "Booking not found." });
            }

            return res.status(204).send(); // No content response
        } catch (err) {
            console.error("Error in deleteBooking:", err);
            return res.status(500).json({ error: "Server error." });
        }
    },
};

export default bookingsController;
