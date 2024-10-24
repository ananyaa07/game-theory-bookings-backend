import jwt from "jsonwebtoken";
import User from "../../models/user.js";

// controller for user registration
const handleUserRegistration = async (req, res) => {
  const { name, email, password, username } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already registered' });
    }
    const newUser = await User.create({ name, email, password, role: 'customer', username });
    const token = newUser.generateToken();
    res.status(201).json({ user: {
      id: newUser._id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role
    }, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// controller for user login
const handleUserLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(400).json({ message: 'Invalid login details' });
    }
    const passwordValid = await existingUser.matchPassword(password);
    if (!passwordValid) {
      return res.status(400).json({ message: 'Invalid login details' });
    }
    const token = existingUser.generateToken();
    res.status(200).json({ user: {
      id: existingUser._id,
      email: existingUser.email,
      username: existingUser.username,
      role: existingUser.role
    }, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export { handleUserRegistration, handleUserLogin };
