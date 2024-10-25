import jwt from 'jsonwebtoken';
import User from '../models/user.js';

// Middleware to authenticate user
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Authorization token not found" });
  }
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken; 
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Middleware to restrict access to operations personnel only
const operationsMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'operations') {
      return res
        .status(403)
        .json({ message: "Access restricted to operations personnel only" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// Middleware to restrict access to administrators only
const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id); 
    if (!user || user.role !== 'admin') {
      return res
        .status(403)
        .json({ message: "Access restricted to administrators only" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export { authMiddleware, operationsMiddleware, adminMiddleware };
