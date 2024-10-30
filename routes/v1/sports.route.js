import express from "express";
import sportController from "../../controllers/Operations/sport.controller.js";
import { authMiddleware, operationsMiddleware } from "../../middleware/auth.js";
const router = express.Router();

//Post /sports - Create a new sport
router.post(
	"/",
	authMiddleware,
	operationsMiddleware,
	sportController.createSport
);

// GET /sports - Retrieve all sports
router.get(
	"/",
	authMiddleware,
	sportController.getSports
);

// GET /sports/:id - Retrieve a specific sport
router.get(
	"/:id",
	authMiddleware,
	operationsMiddleware,
	sportController.getSportById
);

//Put /sports/:id - Update a specific sport
router.put(
	"/:id",
	authMiddleware,
	operationsMiddleware,
	sportController.updateSport
);

// Delete /sports/:id - Delete a specific sport
router.delete(
	"/:id",
	authMiddleware,
	operationsMiddleware,
	sportController.deleteSport
);

export default router;
