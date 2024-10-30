import Booking from "../../models/booking.js";
import Resource from "../../models/resource.js";
import Center from "../../models/center.js";
import Sport from "../../models/sport.js";
import mongoose from "mongoose";
import moment from "moment-timezone";

const bookingsController = {
	async createBooking(req, res) {
		try {
			const {
				centerId,
				sportId,
				resourceId,
				date,
				startTime,
				endTime,
				type,
				note,
			} = req.body;

			// Validate required fields
			if (!centerId || !sportId || !date || !startTime || !endTime || !type) {
				return res.status(400).json({
					error:
						"centerId, sportId, date, startTime, endTime, and type are required.",
				});
			}

			// Validate ObjectIds
			if (
				!mongoose.Types.ObjectId.isValid(centerId) ||
				!mongoose.Types.ObjectId.isValid(sportId)
			) {
				return res.status(400).json({
					error: "Invalid centerId or sportId.",
				});
			}

			// If resourceId is provided, validate it
			if (resourceId && !mongoose.Types.ObjectId.isValid(resourceId)) {
				return res.status(400).json({
					error: "Invalid resourceId.",
				});
			}

			// Validate date format and parse in UTC
			const bookingDate = moment.utc(date, "YYYY-MM-DD", true);
			if (!bookingDate.isValid()) {
				return res
					.status(400)
					.json({ error: "Invalid date format. Use YYYY-MM-DD." });
			}

			// Parse and validate startTime and endTime
			let startHour, endHour;
			try {
				const [startHourStr, startMinuteStr] = startTime.split(":");
				startHour = parseInt(startHourStr, 10);
				const startMinute = parseInt(startMinuteStr, 10);

				const [endHourStr, endMinuteStr] = endTime.split(":");
				endHour = parseInt(endHourStr, 10);
				const endMinute = parseInt(endMinuteStr, 10);

				// Ensure times are in HH:00 format
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
					error:
						'Invalid startTime or endTime format. Use HH:MM, e.g., "09:00".',
				});
			}

			// Validate startHour and endHour
			if (
				startHour < 4 ||
				startHour >= 22 ||
				endHour <= 4 ||
				endHour > 22 ||
				endHour <= startHour
			) {
				return res.status(400).json({
					error:
						"Invalid startTime or endTime. Times must be between 04:00 and 22:00, and endTime must be after startTime.",
				});
			}

			// Ensure booking duration is at least 1 hour
			if (endHour - startHour < 1) {
				return res.status(400).json({
					error: "Booking duration must be at least 1 hour.",
				});
			}

			// Validate 'type' field
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

			// If resourceId is not provided, allocate one
			if (!resourceId) {
				// Get all resources for the given sport and center
				const resources = await Resource.find({
					sport: sportId,
					center: centerId,
				}).select("_id");

				if (!resources.length) {
					return res.status(404).json({
						error: "No resources found for the specified center and sport.",
					});
				}

				const resourceIds = resources.map((r) => r._id);

				// Find resources that are already booked during the specified time
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

				// Filter out booked resources to get available ones
				const availableResourceIds = resourceIds.filter(
					(id) => !bookedResourceIds.includes(id.toString())
				);

				if (!availableResourceIds.length) {
					return res.status(409).json({
						error: "No resources available for the selected time slot.",
					});
				}

				// Randomly select an available resource
				allocatedResourceId =
					availableResourceIds[
						Math.floor(Math.random() * availableResourceIds.length)
					];
			} else {
				// If resourceId is provided, check for conflicts
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
						error:
							"Time slot overlaps with an existing booking for this resource.",
					});
				}

				allocatedResourceId = resourceId;
			}

			// Create new booking
			const newBooking = new Booking({
				user: req.user ? req.user.id : null, // Include user if authentication is implemented
				resource: allocatedResourceId,
				date: bookingDate.toDate(),
				startTime: startHour,
				endTime: endHour,
				center: centerId,
				sport: sportId,
				type,
				note: note || "",
			});

			await newBooking.save();

			// Populate the booking before returning
			const populatedBooking = await Booking.findById(newBooking._id)
				.populate("resource", "name")
				.populate("user", "name email");

			return res.status(201).json(populatedBooking);
		} catch (err) {
			console.error("Error in createBooking:", err);
			return res.status(500).json({ error: "Server error." });
		}
	},

	async getAvailableTimeSlots(req, res) {
		try {
			const { centerId, sportId, date } = req.query;

			// Validate required parameters
			if (!centerId || !sportId || !date) {
				return res
					.status(400)
					.json({ error: "centerId, sportId, and date are required." });
			}

			// Validate ObjectIds
			if (
				!mongoose.Types.ObjectId.isValid(centerId) ||
				!mongoose.Types.ObjectId.isValid(sportId)
			) {
				return res.status(400).json({ error: "Invalid centerId or sportId." });
			}

			// Validate date format
			const bookingDate = moment(date, "YYYY-MM-DD", true);
			if (!bookingDate.isValid()) {
				return res
					.status(400)
					.json({ error: "Invalid date format. Use YYYY-MM-DD." });
			}

			// Set the date to start of the day
			const bookingDateStart = bookingDate.clone().startOf("day").toDate();

			// Get resources for the given sport and center
			const resources = await Resource.find({
				center: centerId,
				sport: sportId,
			}).select("_id");

			if (!resources.length) {
				return res.status(404).json({
					error: "No resources found for the specified center and sport.",
				});
			}

			const resourceIds = resources.map((r) => r._id);
			const totalResources = resources.length;

			// Initialize time slots from 4 AM to 10 PM
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

			// Get bookings for the given date and resources
			const bookings = await Booking.find({
				resource: { $in: resourceIds },
				date: bookingDateStart,
				type: { $ne: "Blocked / Tournament" }, // Exclude blocked slots
			}).select("startTime endTime");

			// Process bookings to update booked and available resources per time slot
			bookings.forEach((booking) => {
				for (let hour = booking.startTime; hour < booking.endTime; hour++) {
					if (timeSlots[hour]) {
						timeSlots[hour].bookedResources += 1;
						timeSlots[hour].availableResources = Math.max(
							0,
							timeSlots[hour].totalResources - timeSlots[hour].bookedResources
						);
					}
				}
			});

			// Prepare the result array
			const availableTimeSlots = Object.values(timeSlots).map((slot) => ({
				slot: slot.slot,
				availableSlots: slot.availableResources,
			}));

			return res.status(200).json(availableTimeSlots);
		} catch (err) {
			console.error("Error in getAvailableTimeSlots:", err);
			return res.status(500).json({ error: "Server error." });
		}
	},

	// Retrieves all bookings for a specific user by their ID
	async getUserBookings(req, res) {
		try {
			const { userId } = req.params;
	
			// Validate ObjectId
			if (!mongoose.Types.ObjectId.isValid(userId)) {
				return res.status(400).json({ error: "Invalid user ID." });
			}
	
			// Retrieve bookings for the specified user and populate the related fields
			const bookings = await Booking.find({ user: userId })
				.populate("resource", "name")  
				.populate("center", "name")    
				.populate("sport", "name")     
				.select("date startTime endTime type note");
	
			return res.status(200).json(bookings);
		} catch (err) {
			console.error("Error in getUserBookings:", err);
			return res.status(500).json({ error: "Server error." });
		}
	},
	
};

export default bookingsController;
