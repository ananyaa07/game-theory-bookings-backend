import Sport from "../../models/sport.js";
import Centre from "../../models/center.js";
import mongoose from "mongoose";

const sportController = {
  async createSport(req, res) {
    try {
      const { sportName, primaryResource, availableResources } = req.body;

      // Validate required fields
      if (!sportName || !primaryResource) {
        return res.status(400).json({ error: "sportName and primaryResource are required." });
      }

      // Create new sport
      const newSport = new Sport({
        sportName,
        primaryResource,
        availableResources: availableResources || [],
      });

      await newSport.save();

      return res.status(201).json(newSport);
    } catch (err) {
      console.error("Error in createSport:", err);
      return res.status(500).json({ error: "Server error." });
    }
  },

  async getSports(req, res) {
    try {
      const { centerId } = req.query;

      if (centerId) {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(centerId)) {
          return res.status(400).json({ error: "Invalid centerId." });
        }

        // Find the center
        const center = await Centre.findById(centerId).populate("availableSports", "sportName");

        if (!center) {
          return res.status(404).json({ error: "Center not found." });
        }

        // Return the sports offered at the center
        const sports = center.availableSports;

        return res.status(200).json(sports);
      } else {
        // If no centerId, return all sports
        const sports = await Sport.find().select("sportName primaryResource");
        return res.status(200).json(sports);
      }
    } catch (err) {
      console.error("Error in getSports:", err);
      return res.status(500).json({ error: "Server error." });
    }
  },

  async getSportById(req, res) {
    try {
      const { id } = req.params;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid sport ID." });
      }

      const sport = await Sport.findById(id).populate("availableResources", "name");

      if (!sport) {
        return res.status(404).json({ error: "Sport not found." });
      }

      return res.status(200).json(sport);
    } catch (err) {
      console.error("Error in getSportById:", err);
      return res.status(500).json({ error: "Server error." });
    }
  },

  async updateSport(req, res) {
    try {
      const { id } = req.params;
      const { sportName, primaryResource, availableResources } = req.body;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid sport ID." });
      }

      // Validate at least one field for update
      if (!sportName && !primaryResource && !availableResources) {
        return res.status(400).json({
          error: "At least one of sportName, primaryResource, or availableResources must be provided.",
        });
      }

      // Prepare update data
      const updateData = {};
      if (sportName) updateData.sportName = sportName;
      if (primaryResource) updateData.primaryResource = primaryResource;
      if (availableResources) updateData.availableResources = availableResources;

      // Update sport
      const updatedSport = await Sport.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedSport) {
        return res.status(404).json({ error: "Sport not found." });
      }

      return res.status(200).json(updatedSport);
    } catch (err) {
      console.error("Error in updateSport:", err);
      return res.status(500).json({ error: "Server error." });
    }
  },

  async deleteSport(req, res) {
    try {
      const { id } = req.params;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid sport ID." });
      }

      const deletedSport = await Sport.findByIdAndDelete(id);

      if (!deletedSport) {
        return res.status(404).json({ error: "Sport not found." });
      }

      return res.status(200).json({ message: "Sport deleted successfully." });
    } catch (err) {
      console.error("Error in deleteSport:", err);
      return res.status(500).json({ error: "Server error." });
    }
  },
};

export default sportController;
