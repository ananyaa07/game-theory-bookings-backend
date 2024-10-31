import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";

// Import route files
import authRoutes from "./routes/v1/users.route.js";
import centersRoutes from "./routes/v1/centers.route.js";
import sportsRoutes from "./routes/v1/sports.route.js";
import resourcesRoutes from "./routes/v1/resources.route.js";
import bookingsRoutes from "./routes/v1/bookings.route.js";

// Initialize dotenv for environment variables
dotenv.config();

const app = express();

// Use CORS to allow all origins
app.use(cors());

// Use body-parser middleware
app.use(bodyParser.json());

// Connect to MongoDB
mongoose
	.connect(process.env.MONGO_URI, {})
	.then(() => console.log("MongoDB connected"))
	.catch((err) => console.log("Error connecting to MongoDB:", err));

// Set up routes
app.use("/api/v1/auth", authRoutes);        // User authentication routes
app.use("/api/v1/centers", centersRoutes);  // Centers routes
app.use("/api/v1/sports", sportsRoutes);    // Sports routes
app.use("/api/v1/resources", resourcesRoutes);  // Resources routes
app.use("/api/v1/bookings", bookingsRoutes);    // Bookings routes

// Test route
app.get("/", (req, res) => {
	res.send("hello");
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(err.status || 500).json({
		message: err.message || "Internal Server Error",
		error: process.env.NODE_ENV === "production" ? {} : err,
	});
});

// 404 route handler
app.use((req, res) => {
	res.status(404).json({ message: "Route not found" });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
