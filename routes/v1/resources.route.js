import express from "express";
import resourceController from "../../controllers/Operations/resource.controller.js";
import { authMiddleware, operationsMiddleware } from "../../middleware/auth.js";
const router = express.Router();

//Post /resources - Create a new resource
router.post("/", authMiddleware, operationsMiddleware, resourceController.createResource);

//Get /resources - Retrieve all resources
router.get("/", authMiddleware, operationsMiddleware, resourceController.getResources);

// GET /resources/:id - Retrieve a specific resource
router.get(
	"/:id",
	authMiddleware,
	operationsMiddleware,
	resourceController.getResourceById
);

//Put /resources/:id - Update a specific resource
router.put(
	"/:id",
	authMiddleware,
	operationsMiddleware,
	resourceController.updateResource
);

//Delete /resources/:id - Delete a specific resource
router.delete(
	"/:id",
	authMiddleware,
	operationsMiddleware,
	resourceController.deleteResource
);

export default router;
