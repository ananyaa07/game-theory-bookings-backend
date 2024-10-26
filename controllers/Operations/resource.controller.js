import Resource from "../../models/resource.js";
import mongoose from "mongoose";

/**
 * Resources Controller
 */
const resourceController = {
  async createResource(req, res) {
    try {
      const { name, sport, center } = req.body;

      // Validate required fields
      if (!name || !sport || !center) {
        return res
          .status(400)
          .json({ error: "name, sport, and center are required." });
      }

      // Validate ObjectIds
      if (
        !mongoose.Types.ObjectId.isValid(sport) ||
        !mongoose.Types.ObjectId.isValid(center)
      ) {
        return res.status(400).json({ error: "Invalid sport or center." });
      }

      // Create new resource
      const newResource = new Resource({
        name,
        sport,
        center,
      });

      await newResource.save();

      return res.status(201).json(newResource);
    } catch (err) {
      console.error("Error in createResource:", err);
      return res.status(500).json({ error: "Server error." });
    }
  },

  async getResources(req, res) {
    try {
      const { center, sport } = req.query;

      let query = {};

      if (center) {
        if (!mongoose.Types.ObjectId.isValid(center)) {
          return res.status(400).json({ error: "Invalid center." });
        }
        query.center = center;
      }

      if (sport) {
        if (!mongoose.Types.ObjectId.isValid(sport)) {
          return res.status(400).json({ error: "Invalid sport." });
        }
        query.sport = sport;
      }

      const resources = await Resource.find(query).select("name sport center");

      return res.status(200).json(resources);
    } catch (err) {
      console.error("Error in getResources:", err);
      return res.status(500).json({ error: "Server error." });
    }
  },

  async getResourceById(req, res) {
    try {
      const { id } = req.params;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid resource ID." });
      }

      const resource = await Resource.findById(id)
        .populate("sport", "name")
        .populate("center", "name location");

      if (!resource) {
        return res.status(404).json({ error: "Resource not found." });
      }

      return res.status(200).json(resource);
    } catch (err) {
      console.error("Error in getResourceById:", err);
      return res.status(500).json({ error: "Server error." });
    }
  },

  async updateResource(req, res) {
    try {
      const { id } = req.params;
      const { name, sport, center } = req.body;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid resource ID." });
      }

      // Validate required fields
      if (!name && !sport && !center) {
        return res.status(400).json({
          error: "At least one of name, sport, or center must be provided.",
        });
      }

      let updateData = {};

      if (name) updateData.name = name;
      if (sport) {
        if (!mongoose.Types.ObjectId.isValid(sport)) {
          return res.status(400).json({ error: "Invalid sport." });
        }
        updateData.sport = sport;
      }
      if (center) {
        if (!mongoose.Types.ObjectId.isValid(center)) {
          return res.status(400).json({ error: "Invalid center." });
        }
        updateData.center = center;
      }

      // Update resource
      const updatedResource = await Resource.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedResource) {
        return res.status(404).json({ error: "Resource not found." });
      }

      return res.status(200).json(updatedResource);
    } catch (err) {
      console.error("Error in updateResource:", err);
      return res.status(500).json({ error: "Server error." });
    }
  },

  async deleteResource(req, res) {
    try {
      const { id } = req.params;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid resource ID." });
      }

      const deletedResource = await Resource.findByIdAndDelete(id);

      if (!deletedResource) {
        return res.status(404).json({ error: "Resource not found." });
      }

      return res
        .status(200)
        .json({ message: "Resource deleted successfully." });
    } catch (err) {
      console.error("Error in deleteResource:", err);
      return res.status(500).json({ error: "Server error." });
    }
  },
};

export default resourceController;
