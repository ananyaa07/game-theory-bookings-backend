import jwt from 'jsonwebtoken';
import User from '../models/user';

const authMiddleware = (req, res, next) => {
	const token = req.header("Authorization")?.replace("Bearer ", "");
	console.log(token);
	if (!token) {
		return res.status(401).json({ message: "Authorization token not found" });
	}
	try {
		const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decodedToken;
		console.log(req.user);
		next();
	} catch (error) {
		res.status(401).json({ message: "Invalid token" });
	}
};

const operationsMiddleware = (req, res, next) => {
	if (req.user.role === "customer") {
		return res
			.status(403)
			.json({ message: "Access restricted to operations personnel only" });
	}
	next();
};

const adminMiddleware = (req, res, next) => {
	if (req.user.role !== "admin") {
		return res
			.status(403)
			.json({ message: "Access restricted to administrators only" });
	}
	next();
};

export { authMiddleware, operationsMiddleware, adminMiddleware };