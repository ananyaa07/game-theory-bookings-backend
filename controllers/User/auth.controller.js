import jwt from "jsonwebtoken";
import User from "../../models/user.js";

// Handles user registration by creating a new user account
const handleUserRegistration = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already registered' });
    }
    const newUser = await User.create({ 
      name, 
      email, 
      password, 
      role: 'customer' 
    });
    const token = newUser.createToken();
    res.status(201).json({ 
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role 
      }, 
      token 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Handles user login and generates a token for authenticated users
const handleUserLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(400).json({ message: 'Invalid login details' });
    }
    const passwordValid = await existingUser.validatePassword(password);
    if (!passwordValid) {
      return res.status(400).json({ message: 'Invalid login details' });
    }
    const token = existingUser.createToken();
    res.status(200).json({ 
      user: {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role 
      }, 
      token 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export { handleUserRegistration, handleUserLogin };
