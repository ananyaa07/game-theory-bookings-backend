import Resource from "../../models/resource.js";
import mongoose from "mongoose";

/**
 * Resources Controller
 */
const resourceController = {
  async createResource(req, res) {
    try {
      const { resourceName, associatedSport, linkedCentre } = req.body;

      // Validate required fields
      if (!resourceName || !associatedSport || !linkedCentre) {
        return res
          .status(400)
          .json({ error: "resourceName, associatedSport, and linkedCentre are required." });
      }

      // Validate ObjectIds
      if (
        !mongoose.Types.ObjectId.isValid(associatedSport) ||
        !mongoose.Types.ObjectId.isValid(linkedCentre)
      ) {
        return res.status(400).json({ error: "Invalid associatedSport or linkedCentre." });
      }

      // Create new resource
      const newResource = new Resource({
        resourceName,
        associatedSport,
        linkedCentre,
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
      const { linkedCentre, associatedSport } = req.query;

      let query = {};

      if (linkedCentre) {
        if (!mongoose.Types.ObjectId.isValid(linkedCentre)) {
          return res.status(400).json({ error: "Invalid linkedCentre." });
        }
        query.linkedCentre = linkedCentre;
      }

      if (associatedSport) {
        if (!mongoose.Types.ObjectId.isValid(associatedSport)) {
          return res.status(400).json({ error: "Invalid associatedSport." });
        }
        query.associatedSport = associatedSport;
      }

      const resources = await Resource.find(query).select("resourceName");

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
        .populate("associatedSport", "name")
        .populate("linkedCentre", "name location");

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
      const { resourceName, associatedSport, linkedCentre } = req.body;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid resource ID." });
      }

      // Validate required fields
      if (!resourceName && !associatedSport && !linkedCentre) {
        return res.status(400).json({
          error: "At least one of resourceName, associatedSport, or linkedCentre must be provided.",
        });
      }

      let updateData = {};

      if (resourceName) updateData.resourceName = resourceName;
      if (associatedSport) {
        if (!mongoose.Types.ObjectId.isValid(associatedSport)) {
          return res.status(400).json({ error: "Invalid associatedSport." });
        }
        updateData.associatedSport = associatedSport;
      }
      if (linkedCentre) {
        if (!mongoose.Types.ObjectId.isValid(linkedCentre)) {
          return res.status(400).json({ error: "Invalid linkedCentre." });
        }
        updateData.linkedCentre = linkedCentre;
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
