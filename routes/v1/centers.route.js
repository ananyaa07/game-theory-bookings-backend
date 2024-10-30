import express from "express";
import centerController from "../../controllers/Operations/center.controller.js";
import { authMiddleware, operationsMiddleware } from "../../middleware/auth.js";
const router = express.Router();

// POST /centers - Create a new center
router.post("/", authMiddleware, operationsMiddleware, centerController.createCenter);

// GET /centers - Retrieve all centers
router.get(
	"/",
	authMiddleware,
	centerController.getCenters
);

// GET /centers/:id - Retrieve a specific center
router.get(
	"/:id",
	authMiddleware,
	operationsMiddleware,
	centerController.getCenterById
);

// PUT /centers/:id - Update a specific center
router.put(
	"/:id",
	authMiddleware,
	operationsMiddleware,
	centerController.updateCenter
);

// DELETE /centers/:id - Delete a specific center
router.delete(
	"/:id",
	authMiddleware,
	operationsMiddleware,
	centerController.deleteCenter
);

// GET /centers/:id/sports - Retrieve all sports of a center
router.get(
	"/:id/sports",
	authMiddleware,
	operationsMiddleware,
	centerController.getAllSportsInCenter
);

// POST /centers/:id/sports - Add a sport to a center
router.post(
	"/:id/sports",
	authMiddleware,
	operationsMiddleware,
	centerController.addSportToCenter
);

// DELETE /centers/:id/sports/:sportId - Remove a sport from a center
router.delete(
	"/:id/sports/:sportId",
	authMiddleware,
	operationsMiddleware,
	centerController.deleteSportFromCenter
);

export default router;
