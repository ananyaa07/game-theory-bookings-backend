import Reservation from "../../models/reservation.js";
import Equipment from "../../models/equipment.js";
import Venue from "../../models/venue.js";
import Activity from "../../models/activity.js";
import mongoose from "mongoose";
import moment from "moment-timezone";


const reservationsController = {
  /**
   * POST /reservations
   * Create a new reservation, ensuring no time conflicts.
   */
  async createReservation(req, res) {
    try {
      const {
        venueId,
        activityId,
        equipmentId, 
        reservationDate,
        startPeriod,
        endPeriod,
        category,
        remarks,
      } = req.body;

      // Validate required fields
      if (!venueId || !activityId || !reservationDate || !startPeriod || !endPeriod || !category) {
        return res.status(400).json({
          error: "venueId, activityId, reservationDate, startPeriod, endPeriod, and category are mandatory.",
        });
      }

      // Validate ObjectIds
      if (!mongoose.Types.ObjectId.isValid(venueId) || !mongoose.Types.ObjectId.isValid(activityId)) {
        return res.status(400).json({
          error: "Invalid venueId or activityId.",
        });
      }

      // If equipmentId is provided, validate it
      if (equipmentId && !mongoose.Types.ObjectId.isValid(equipmentId)) {
        return res.status(400).json({
          error: "Invalid equipmentId.",
        });
      }

      // Validate date format
      const formattedDate = moment(reservationDate, "YYYY-MM-DD", true);
      if (!formattedDate.isValid()) {
        return res.status(400).json({
          error: "Invalid date format. Use YYYY-MM-DD.",
        });
      }
      formattedDate.startOf("day");

      // Parse and validate startPeriod and endPeriod
      let startHr, endHr;
      try {
        const [startHrStr, startMinStr] = startPeriod.split(":");
        startHr = parseInt(startHrStr, 10);
        const startMin = parseInt(startMinStr, 10);

        const [endHrStr, endMinStr] = endPeriod.split(":");
        endHr = parseInt(endHrStr, 10);
        const endMin = parseInt(endMinStr, 10);

        // Validate time format
        if (
          isNaN(startHr) ||
          isNaN(endHr) ||
          isNaN(startMin) ||
          isNaN(endMin) ||
          startMin !== 0 ||
          endMin !== 0 ||
          startPeriod.length !== 5 ||
          endPeriod.length !== 5
        ) {
          return res.status(400).json({
            error: "Invalid startPeriod or endPeriod. Must be in HH:00 format.",
          });
        }
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid time format. Use HH:MM, e.g., "09:00".',
        });
      }

      // Validate startHour and endHour
      if (startHr < 4 || startHr >= 22 || endHr <= 4 || endHr > 22 || endHr <= startHr) {
        return res.status(400).json({
          error: "Invalid startPeriod or endPeriod. Must be between 04:00 and 22:00, and endPeriod must follow startPeriod.",
        });
      }

      // Ensure reservation duration is at least 1 hour
      if (endHr - startHr < 1) {
        return res.status(400).json({
          error: "Reservation must be at least 1 hour long.",
        });
      }

      // Validate 'category' field
      const validCategories = ["Reservation", "Checked-in", "Coaching", "Blocked", "Completed", "Payment Pending"];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          error: `Invalid category. Allowed values: ${validCategories.join(", ")}.`,
        });
      }

      let assignedEquipmentId = equipmentId;

      // If no equipmentId, allocate one
      if (!equipmentId) {
        const availableEquipment = await Equipment.find({ activity: activityId, venue: venueId }).select("_id");

        if (!availableEquipment.length) {
          return res.status(404).json({
            error: "No equipment available for the specified venue and activity.",
          });
        }

        const equipmentList = availableEquipment.map((eq) => eq._id);

        // Check for conflicts with other reservations
        const conflictingReservations = await Reservation.find({
          equipment: { $in: equipmentList },
          date: formattedDate.toDate(),
          $or: [
            { startPeriod: { $lt: endHr, $gte: startHr } },
            { endPeriod: { $gt: startHr, $lte: endHr } },
            { startPeriod: { $lte: startHr }, endPeriod: { $gte: endHr } },
            { startPeriod: { $gte: startHr }, endPeriod: { $lte: endHr } },
          ],
        }).select("equipment");

        const bookedEquipmentIds = conflictingReservations.map((res) => res.equipment.toString());

        // Get available equipment by filtering out booked ones
        const availableEquipmentIds = equipmentList.filter((id) => !bookedEquipmentIds.includes(id.toString()));

        if (!availableEquipmentIds.length) {
          return res.status(409).json({
            error: "No equipment available for the selected time.",
          });
        }

        // Randomly assign an available equipment
        assignedEquipmentId = availableEquipmentIds[Math.floor(Math.random() * availableEquipmentIds.length)];
      } else {
        // If equipmentId is provided, check for conflicts
        const existingReservation = await Reservation.findOne({
          equipment: equipmentId,
          date: formattedDate.toDate(),
          $or: [
            { startPeriod: { $lt: endHr, $gte: startHr } },
            { endPeriod: { $gt: startHr, $lte: endHr } },
            { startPeriod: { $lte: startHr }, endPeriod: { $gte: endHr } },
            { startPeriod: { $gte: startHr }, endPeriod: { $lte: endHr } },
          ],
        });

        if (existingReservation) {
          return res.status(409).json({
            error: "Time conflict with another reservation for this equipment.",
          });
        }

        assignedEquipmentId = equipmentId;
      }

      // Create the reservation
      const newReservation = new Reservation({
        user: req.user ? req.user.id : null,
        equipment: assignedEquipmentId,
        date: formattedDate.toDate(),
        startPeriod: startHr,
        endPeriod: endHr,
        venue: venueId,
        activity: activityId,
        category,
        remarks: remarks || "",
      });

      await newReservation.save();

      // Populate the reservation details before sending response
      const populatedReservation = await Reservation.findById(newReservation._id)
        .populate("equipment", "name")
        .populate("user", "name email");

      return res.status(201).json(populatedReservation);
    } catch (error) {
      console.error("Error in createReservation:", error);
      return res.status(500).json({ error: "Server error." });
    }
  },

  
  async getAvailableTimeSlots(req, res) {
    try {
      const { venueId, activityId, date } = req.query;

      // Validate required parameters
      if (!venueId || !activityId || !date) {
        return res.status(400).json({ error: "venueId, activityId, and date are required." });
      }

      // Validate ObjectIds
      if (!mongoose.Types.ObjectId.isValid(venueId) || !mongoose.Types.ObjectId.isValid(activityId)) {
        return res.status(400).json({ error: "Invalid venueId or activityId." });
      }

      // Validate date format
      const formattedDate = moment(date, "YYYY-MM-DD", true);
      if (!formattedDate.isValid()) {
        return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
      }

      const dayStart = formattedDate.clone().startOf("day").toDate();

      // Fetch equipment for the activity and venue
      const availableEquipment = await Equipment.find({ venue: venueId, activity: activityId }).select("_id");

      if (!availableEquipment.length) {
        return res.status(404).json({ error: "No equipment available for the specified venue and activity." });
      }

      const equipmentIds = availableEquipment.map((eq) => eq._id);
      const totalResources = availableEquipment.length;

      // Define available time slots from 4 AM to 10 PM
      const timeBlocks = {};
      for (let hour = 4; hour < 22; hour++) {
        const slotLabel = `${hour}:00 - ${hour + 1}:00`;
        timeBlocks[hour] = {
          startPeriod: hour,
          endPeriod: hour + 1,
          slotLabel,
          totalResources,
          occupiedResources: 0,
          freeResources: totalResources,
        };
      }

      // Fetch reservations for the specific day
      const reservations = await Reservation.find({
        equipment: { $in: equipmentIds },
        date: dayStart,
        category: { $ne: "Blocked" },
      }).select("startPeriod endPeriod equipment");

      // Mark the occupied resources in timeBlocks based on existing reservations
      for (const reservation of reservations) {
        for (let hr = reservation.startPeriod; hr < reservation.endPeriod; hr++) {
          if (timeBlocks[hr]) {
            timeBlocks[hr].occupiedResources += 1;
            timeBlocks[hr].freeResources = totalResources - timeBlocks[hr].occupiedResources;
          }
        }
      }

      const availableTimeSlots = Object.values(timeBlocks).filter(
        (slot) => slot.freeResources > 0
      );

      return res.json(availableTimeSlots);
    } catch (error) {
      console.error("Error fetching available time slots:", error);
      return res.status(500).json({ error: "Server error." });
    }
  },
};

export default reservationsController;
