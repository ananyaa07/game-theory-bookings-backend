import Center from "../../models/center.js";
import Sport from "../../models/sport.js";
import mongoose from "mongoose";

const centerController = {

	async createCenter(req, res) {
		try {
			const { name, address, sports } = req.body;

			// Validate required fields
			if (!name || !address) {
				return res.status(400).json({ error: "Center name and address are required." });
			}

			// Create new center
			const newCenter = new Center({
				name,
				address,
				sports: sports || [], 
			});

			await newCenter.save();

			return res.status(201).json(newCenter);
		} catch (err) {
			console.error("Error in createCenter:", err);
			return res.status(500).json({ error: "Server error." });
		}
	},

	async getCenters(req, res) {
		try {
			const centers = await Center.find().select("name address");

			return res.status(200).json(centers);
		} catch (err) {
			console.error("Error in getCenters:", err);
			return res.status(500).json({ error: "Server error." });
		}
	},

	async getCenterById(req, res) {
		try {
			const { id } = req.params;

			// Validate ObjectId
			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).json({ error: "Invalid center ID." });
			}

			// Find center by id and populate sports
			const center = await Center.findById(id).populate("sports", "name");

			if (!center) {
				return res.status(404).json({ error: "Center not found." });
			}

			return res.status(200).json(center);
		} catch (err) {
			console.error("Error in getCenterById:", err);
			return res.status(500).json({ error: "Server error." });
		}
	},

	async updateCenter(req, res) {
		try {
			const { id } = req.params;
			const { name, address, sports } = req.body;

			// Validate ObjectId
			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).json({ error: "Invalid center ID." });
			}

			// Update center
			const updatedCenter = await Center.findByIdAndUpdate(
				id,
				{ name, address, sports },
				{ new: true, runValidators: true }
			);

			if (!updatedCenter) {
				return res.status(404).json({ error: "Center not found." });
			}

			return res.status(200).json(updatedCenter);
		} catch (err) {
			console.error("Error in updateCenter:", err);
			return res.status(500).json({ error: "Server error." });
		}
	},

	async addSportToCenter(req, res) {
		try {
			const { id } = req.params;
			const { sportId } = req.body;

			// Validate ObjectId
			if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(sportId)) {
				return res.status(400).json({ error: "Invalid center or sport ID." });
			}

			// Find center by id
			const center = await Center.findById(id);
			const sport = await Sport.findById(sportId);

			if (!center) {
				return res.status(404).json({ error: "Center not found." });
			}

			// Check if sport already exists in center
			if (center.sports.includes(sportId)) {
				return res.status(400).json({ error: "Sport already exists in center." });
			}

			// Add sport to center
			center.sports.push(sportId);
			sport.centers.push(id);
			await sport.save();
			await center.save();

			return res.status(200).json(center);
		} catch (err) {
			console.error("Error in addSportToCenter:", err);
			return res.status(500).json({ error: "Server error." });
		}
	},

	async deleteCenter(req, res) {
		try {
			const { id } = req.params;

			// Validate ObjectId
			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).json({ error: "Invalid center ID." });
			}

			const deletedCenter = await Center.findByIdAndDelete(id);

			if (!deletedCenter) {
				return res.status(404).json({ error: "Center not found." });
			}

			return res.status(200).json({ message: "Center deleted successfully." });
		} catch (err) {
			console.error("Error in deleteCenter:", err);
			return res.status(500).json({ error: "Server error." });
		}
	},

	async getAllSportsInCenter(req, res) {
		try {
			const { id } = req.params;

			// Validate ObjectId
			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).json({ error: "Invalid center ID." });
			}

			const center = await Center.findById(id).populate("sports", "name _id");

			if (!center) {
				return res.status(404).json({ error: "Center not found." });
			}

			return res.status(200).json(center.sports);
		} catch (err) {
			console.error("Error in getAllSportsInCenter:", err);
			return res.status(500).json({ error: "Server error." });
		}
	},

	async deleteSportFromCenter(req, res) {
		try {
			const { id, sportId } = req.params;

			// Validate ObjectId
			if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(sportId)) {
				return res.status(400).json({ error: "Invalid center or sport ID." });
			}

			const center = await Center.findById(id);
			const sport = await Sport.findById(sportId);

			if (!center) {
				return res.status(404).json({ error: "Center not found." });
			}

			// Check if sport exists in center
			if (!center.sports.includes(sportId)) {
				return res.status(400).json({ error: "Sport does not exist in center." });
			}

			// Remove sport from center
			center.sports = center.sports.filter((s) => s.toString() !== sportId);
			sport.centers = sport.centers.filter((c) => c.toString() !== id);
			await sport.save();
			await center.save();

			return res.status(200).json(center);
		} catch (err) {
			console.error("Error in deleteSportFromCenter:", err);
			return res.status(500).json({ error: "Server error." });
		}
	},
};

export default centerController;
