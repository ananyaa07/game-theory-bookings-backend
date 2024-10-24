import express from "express";
import { handleUserRegistration, handleUserLogin } from "../../controllers/User/auth.controller.js";
import { authMiddleware,adminMiddleware  } from "../../middleware/auth.js";
import { promoteUser } from "../../controllers/Admin/promote.controller.js";
const router = express.Router();

// User Registration Route
router.post("/register", registerUser);

// User Login Route
router.post("/login", loginUser);

router.patch("/promote", authMiddleware, adminMiddleware, promoteUser);

export default router;