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
	operationsMiddleware,
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

export default router;
