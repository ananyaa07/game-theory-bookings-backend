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
                date,
                startTime,
                endTime,
                type,
                note,
            } = req.body;

            if (!centreId || !sportId || !date || !startTime || !endTime || !type) {
                return res.status(400).json({
                    error: "centreId, sportId, date, startTime, endTime, and type are required.",
                });
            }

            if (
                !mongoose.Types.ObjectId.isValid(centreId) ||
                !mongoose.Types.ObjectId.isValid(sportId)
            ) {
                return res.status(400).json({
                    error: "Invalid centreId or sportId.",
                });
            }

            if (resourceId && !mongoose.Types.ObjectId.isValid(resourceId)) {
                return res.status(400).json({
                    error: "Invalid resourceId.",
                });
            }

            const bookingDate = moment(date, "YYYY-MM-DD", true);
            if (!bookingDate.isValid()) {
                return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
            }
            bookingDate.startOf("day");

            let startHour, endHour;
            try {
                const [startHourStr, startMinuteStr] = startTime.split(":");
                startHour = parseInt(startHourStr, 10);
                const startMinute = parseInt(startMinuteStr, 10);

                const [endHourStr, endMinuteStr] = endTime.split(":");
                endHour = parseInt(endHourStr, 10);
                const endMinute = parseInt(endMinuteStr, 10);

                if (
                    isNaN(startHour) ||
                    isNaN(endHour) ||
                    isNaN(startMinute) ||
                    isNaN(endMinute) ||
                    startMinute !== 0 ||
                    endMinute !== 0 ||
                    startTime.length !== 5 ||
                    endTime.length !== 5
                ) {
                    return res.status(400).json({
                        error: "Invalid startTime or endTime. Must be in HH:00 format.",
                    });
                }
            } catch (e) {
                return res.status(400).json({
                    error: 'Invalid startTime or endTime format. Use HH:MM, e.g., "09:00".',
                });
            }

            if (
                startHour < 4 ||
                startHour >= 22 ||
                endHour <= 4 ||
                endHour > 22 ||
                endHour <= startHour
            ) {
                return res.status(400).json({
                    error: "Invalid startTime or endTime. Times must be between 04:00 and 22:00, and endTime must be after startTime.",
                });
            }

            if (endHour - startHour < 1) {
                return res.status(400).json({
                    error: "Booking duration must be at least 1 hour.",
                });
            }

            const validTypes = [
                "Booking",
                "Checked-in",
                "Coaching",
                "Blocked / Tournament",
                "Completed",
                "Pending Payment",
            ];
            if (!validTypes.includes(type)) {
                return res.status(400).json({
                    error: `Invalid type. Allowed types are: ${validTypes.join(", ")}.`,
                });
            }

            let allocatedResourceId = resourceId;

            if (!resourceId) {
                const resources = await Resource.find({
                    sport: sportId,
                    centre: centreId,
                }).select("_id");

                if (!resources.length) {
                    return res.status(404).json({
                        error: "No resources found for the specified centre and sport.",
                    });
                }

                const resourceIds = resources.map((r) => r._id);

                const conflictingBookings = await Booking.find({
                    resource: { $in: resourceIds },
                    date: bookingDate.toDate(),
                    $or: [
                        {
                            startTime: { $lt: endHour, $gte: startHour },
                        },
                        {
                            endTime: { $gt: startHour, $lte: endHour },
                        },
                        {
                            startTime: { $lte: startHour },
                            endTime: { $gte: endHour },
                        },
                        {
                            startTime: { $gte: startHour },
                            endTime: { $lte: endHour },
                        },
                    ],
                }).select("resource");

                const bookedResourceIds = conflictingBookings.map((booking) =>
                    booking.resource.toString()
                );

                const availableResourceIds = resourceIds.filter(
                    (id) => !bookedResourceIds.includes(id.toString())
                );

                if (!availableResourceIds.length) {
                    return res.status(409).json({
                        error: "No resources available for the selected time slot.",
                    });
                }

                allocatedResourceId =
                    availableResourceIds[
                        Math.floor(Math.random() * availableResourceIds.length)
                    ];
            } else {
                const existingBooking = await Booking.findOne({
                    resource: resourceId,
                    date: bookingDate.toDate(),
                    $or: [
                        {
                            startTime: { $lt: endHour, $gte: startHour },
                        },
                        {
                            endTime: { $gt: startHour, $lte: endHour },
                        },
                        {
                            startTime: { $lte: startHour },
                            endTime: { $gte: endHour },
                        },
                        {
                            startTime: { $gte: startHour },
                            endTime: { $lte: endHour },
                        },
                    ],
                });

                if (existingBooking) {
                    return res.status(409).json({
                        error: "Time slot overlaps with an existing booking for this resource.",
                    });
                }

                allocatedResourceId = resourceId;
            }

            const newBooking = new Booking({
                user: req.user ? req.user.id : null,
                resource: allocatedResourceId,
                date: bookingDate.toDate(),
                startTime: startHour,
                endTime: endHour,
                centre: centreId,
                sport: sportId,
                type,
                note: note || "",
            });

            await newBooking.save();

            const populatedBooking = await Booking.findById(newBooking._id)
                .populate("resource", "name")
                .populate("user", "name email");

            return res.status(201).json(populatedBooking);
        } catch (err) {
            console.error("Error in createBooking:", err);
            return res.status(500).json({ error: "Server error." });
        }
    },

    // Retrieves available time slots for a specific centre and sport on a given date
    async getAvailableTimeSlots(req, res) {
        try {
            const { centreId, sportId, date } = req.query;

            if (!centreId || !sportId || !date) {
                return res.status(400).json({ error: "centreId, sportId, and date are required." });
            }

            if (
                !mongoose.Types.ObjectId.isValid(centreId) ||
                !mongoose.Types.ObjectId.isValid(sportId)
            ) {
                return res.status(400).json({ error: "Invalid centreId or sportId." });
            }

            const bookingDate = moment(date, "YYYY-MM-DD", true);
            if (!bookingDate.isValid()) {
                return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
            }

            const bookingDateStart = bookingDate.clone().startOf("day").toDate();

            const resources = await Resource.find({
                centre: centreId,
                sport: sportId,
            }).select("_id");

            if (!resources.length) {
                return res.status(404).json({ error: "No resources found for the specified centre and sport." });
            }

            const resourceIds = resources.map((r) => r._id);
            const totalResources = resources.length;

            const timeSlots = {};
            for (let hour = 4; hour < 22; hour++) {
                const slotLabel = `${hour}:00 - ${hour + 1}:00`;
                timeSlots[hour] = {
                    startTime: hour,
                    endTime: hour + 1,
                    slot: slotLabel,
                    totalResources: totalResources,
                    bookedResources: 0,
                    availableResources: totalResources,
                };
            }

            const bookings = await Booking.find({
                resource: { $in: resourceIds },
                date: bookingDateStart,
                type: { $ne: "Blocked / Tournament" },
            }).select("startTime endTime");

            bookings.forEach((booking) => {
                for (let hour = booking.startTime; hour < booking.endTime; hour++) {
                    if (timeSlots[hour]) {
                        timeSlots[hour].bookedResources += 1;
                        timeSlots[hour].availableResources -= 1;
                    }
                }
            });

            const availableTimeSlots = Object.values(timeSlots).filter(
                (slot) => slot.availableResources > 0
            );

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

            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ error: "Invalid userId." });
            }

            const bookings = await Booking.find({ user: userId })
                .populate("resource", "name")
                .populate("sport", "name")
                .populate("centre", "name")
                .sort({ date: -1 });

            return res.status(200).json(bookings);
        } catch (err) {
            console.error("Error in getUserBookings:", err);
            return res.status(500).json({ error: "Server error." });
        }
    },

    // Retrieves bookings for the currently logged-in user
    async getMyBookings(req, res) {
        try {
            const userId = req.user.id;  

            const bookings = await Booking.find({ user: userId })
                .populate("resource", "name")
                .populate("sport", "name")
                .populate("centre", "name")
                .sort({ date: -1 });

            return res.status(200).json(bookings);
        } catch (err) {
            console.error("Error in getMyBookings:", err);
            return res.status(500).json({ error: "Server error." });
        }
    },
};

export default bookingsController;
