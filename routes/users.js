import express from "express";
import { handleUserRegistration, handleUserLogin } from "../controllers/User/authController.js";
import { authMiddleware,adminMiddleware  } from "../middleware/auth.js";
import promoteUser from "../controllers/admin/promoteCustomer.js";
const router = express.Router();

// User Registration Route
router.post("/register", registerUser);

// User Login Route
router.post("/login", loginUser);

router.patch("/promote", authMiddleware, adminMiddleware, promoteUser);

export default router;
