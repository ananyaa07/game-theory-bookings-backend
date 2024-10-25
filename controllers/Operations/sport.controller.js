import Sport from "../../models/sport.js";
import Center from "../../models/center.js";
import mongoose from "mongoose";

const sportController = {
  async createSport(req, res) {
    try {
      const { name, resourceKind, centers, resources } = req.body;

      // Validate required fields
      if (!name || !resourceKind) {
        return res.status(400).json({ error: "Name and resourceKind are required." });
      }

      // Create new sport
      const newSport = new Sport({
        name,
        resourceKind,
        centers: centers || [],
        resources: resources || [],
      });

      // Save the new sport
      await newSport.save();

      // Update centers with the new sport
      if (centers && centers.length > 0) {
        await Center.updateMany(
          { _id: { $in: centers } },
          { $push: { sports: newSport._id } }
        );
      }

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
        const center = await Center.findById(centerId).populate("sports", "name resourceKind");

        if (!center) {
          return res.status(404).json({ error: "Center not found." });
        }

        // Return the sports offered at the center
        const sports = center.sports;

        return res.status(200).json(sports);
      } else {
        // If no centerId is provided, return all sports
        const sports = await Sport.find().select("name resourceKind");
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

      // Find the sport and populate related resources and centers
      const sport = await Sport.findById(id)
        .populate("resources", "name")
        .populate("centers", "name");

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
      const { name, resourceKind, centers, resources } = req.body;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid sport ID." });
      }

      // Validate at least one field for update
      if (!name && !resourceKind && !centers && !resources) {
        return res.status(400).json({
          error: "At least one of name, resourceKind, centers, or resources must be provided.",
        });
      }

      // Prepare update data
      const updateData = {};
      if (name) updateData.name = name;
      if (resourceKind) updateData.resourceKind = resourceKind;
      if (centers) updateData.centers = centers;
      if (resources) updateData.resources = resources;

      // Update sport
      const updatedSport = await Sport.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedSport) {
        return res.status(404).json({ error: "Sport not found." });
      }

      // Update centers if provided
      if (centers && centers.length > 0) {
        await Center.updateMany(
          { _id: { $in: centers } },
          { $push: { sports: updatedSport._id } }
        );
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

      // Delete the sport
      const deletedSport = await Sport.findByIdAndDelete(id);

      if (!deletedSport) {
        return res.status(404).json({ error: "Sport not found." });
      }

      // Remove the sport from associated centers
      await Center.updateMany(
        { sports: id },
        { $pull: { sports: id } }
      );

      return res.status(200).json({ message: "Sport deleted successfully." });
    } catch (err) {
      console.error("Error in deleteSport:", err);
      return res.status(500).json({ error: "Server error." });
    }
  },
};

export default sportController;
