import express from "express";
import { handleUserRegistration, handleUserLogin  } from "../../controllers/User/auth.controller.js";
import { authMiddleware, adminMiddleware } from "../../middleware/auth.js";
import promoteUser from "../../controllers/Admin/promote.controller.js";
import getAllCustomers from "../../controllers/Admin/users.controller.js";
const router = express.Router();

// User Registration Route
router.post("/register", handleUserRegistration);

// User Login Route
router.post("/login", handleUserLogin);

// Promote User Route
router.patch("/promote", authMiddleware, adminMiddleware, promoteUser);

//Fetch all users with the role of 'customer'
router.get("/customers", authMiddleware, adminMiddleware, getAllCustomers);

export default router;
