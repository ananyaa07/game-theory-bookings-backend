import Booking from "../../models/booking.js";
import Resource from "../../models/resource.js";
import Centre from "../../models/center.js";
import Sport from "../../models/sport.js";
import mongoose from "mongoose";
import moment from "moment-timezone";

/**
 * Bookings Controller
 */
const bookingController = {
	// Retrieve bookings for a specific centre, sport, and date
	async getBookings(req, res) {
		try {
			const { centreId, sportId, bookingDate } = req.query;

			// Validate input parameters
			if (!centreId || !sportId || !bookingDate) {
				return res
					.status(400)
					.json({ error: "centreId, sportId, and bookingDate are required." });
			}

			// Validate IDs
			if (!mongoose.Types.ObjectId.isValid(centreId) || !mongoose.Types.ObjectId.isValid(sportId)) {
				return res.status(400).json({ error: "Invalid centreId or sportId." });
			}

			// Validate date format
			const selectedDate = moment(bookingDate, "YYYY-MM-DD", true);
			if (!selectedDate.isValid()) {
				return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
			}

			const startOfDay = selectedDate.clone().startOf("day").toDate();
			const endOfDay = selectedDate.clone().endOf("day").toDate();
			const currentTime = moment().tz("UTC");

			// Update bookings that have ended as "Completed"
			await Booking.updateMany(
				{
					centreId,
					sportId,
					bookingDate: startOfDay,
					endHour: { $lte: currentTime.hours() },
					status: { $ne: "Completed" },
				},
				{ $set: { status: "Completed" } }
			);

			// Fetch bookings for the specified centre, sport, and date
			const fetchedBookings = await Booking.find({
				centreId,
				sportId,
				bookingDate: startOfDay,
			})
				.populate("resourceId", "name")
				.populate("userId", "name email");

			return res.status(200).json(fetchedBookings);
		} catch (err) {
			console.error("Error in getBookings:", err);
			return res.status(500).json({ error: "Server error." });
		}
	},

	// Create a new booking with provided details
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

			// Validate input parameters
			if (!centreId || !sportId || !bookingDate || !startHour || !endHour || !status) {
				return res.status(400).json({
					error: "centreId, sportId, bookingDate, startHour, endHour, and status are required.",
				});
			}

			// Validate IDs
			if (!mongoose.Types.ObjectId.isValid(centreId) || !mongoose.Types.ObjectId.isValid(sportId)) {
				return res.status(400).json({ error: "Invalid centreId or sportId." });
			}

			if (resourceId && !mongoose.Types.ObjectId.isValid(resourceId)) {
				return res.status(400).json({ error: "Invalid resourceId." });
			}

			// Validate date format
			const selectedDate = moment(bookingDate, "YYYY-MM-DD", true);
			if (!selectedDate.isValid()) {
				return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
			}
			selectedDate.startOf("day");

			// Validate startHour and endHour
			if (startHour < 4 || startHour >= 24 || endHour <= 4 || endHour > 24 || endHour <= startHour) {
				return res.status(400).json({ error: "Invalid startHour or endHour." });
			}

			// Ensure booking duration is at least 1 hour
			if (endHour - startHour < 1) {
				return res.status(400).json({ error: "Booking duration must be at least 1 hour." });
			}

			const validBookingTypes = ["Booking", "Checked", "Payment Pending", "Coaching", "Blocked", "Completed"];
			if (!validBookingTypes.includes(status)) {
				return res.status(400).json({ error: `Invalid status. Allowed types are: ${validBookingTypes.join(", ")}.` });
			}

			let chosenResourceId = resourceId;

			if (!resourceId) {
				const allResources = await Resource.find({ sport: sportId, center: centreId }).select("_id");
				if (!allResources.length) {
					return res.status(404).json({ error: "No resources found for the specified centre and sport." });
				}

				const resourceIdsList = allResources.map((r) => r._id);

				// Check for conflicting bookings
				const overlappingBookings = await Booking.find({
					resourceId: { $in: resourceIdsList },
					bookingDate: selectedDate.toDate(),
					$or: [
						{ startHour: { $lt: endHour, $gte: startHour } },
						{ endHour: { $gt: startHour, $lte: endHour } },
						{ startHour: { $lte: startHour }, endHour: { $gte: endHour } },
						{ startHour: { $gte: startHour }, endHour: { $lte: endHour } },
					],
				}).select("resourceId");

				const alreadyBookedResourceIds = overlappingBookings.map((booking) => booking.resourceId.toString());

				const availableResourceIds = resourceIdsList.filter((id) => !alreadyBookedResourceIds.includes(id.toString()));

				// If no resources are available for the selected time slot
				if (!availableResourceIds.length) {
					return res.status(409).json({ error: "No resources available for the selected time slot." });
				}

				chosenResourceId = availableResourceIds[Math.floor(Math.random() * availableResourceIds.length)];
			} else {
				const conflictBooking = await Booking.findOne({
					resourceId,
					bookingDate: selectedDate.toDate(),
					$or: [
						{ startHour: { $lt: endHour, $gte: startHour } },
						{ endHour: { $gt: startHour, $lte: endHour } },
						{ startHour: { $lte: startHour }, endHour: { $gte: endHour } },
						{ startHour: { $gte: startHour }, endHour: { $lte: endHour } },
					],
				});
				if (conflictBooking) {
					return res.status(409).json({ error: "Time slot overlaps with an existing booking for this resource." });
				}
			}

			const newBooking = new Booking({
				centreId,
				sportId,
				resourceId: chosenResourceId,
				userId: req.user._id,
				bookingDate: selectedDate.toDate(),
				startHour,
				endHour,
				status,
				remarks,
			});

			// Save the booking and return the response
			await newBooking.save();
			return res.status(201).json(newBooking);
		} catch (err) {
			console.error("Error in createBooking:", err);
			return res.status(500).json({ error: "Server error." });
		}
	},
};

export default bookingController;
