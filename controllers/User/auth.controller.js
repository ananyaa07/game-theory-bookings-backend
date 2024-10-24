import jwt from "jsonwebtoken";
import User from "../../models/user.js";

// Handles user registration by creating a new user account
const handleUserRegistration = async (req, res) => {
  const { fullName, emailAddress, userPassword, userHandle } = req.body;
  try {
    const existingUser = await User.findOne({ emailAddress });
    if (existingUser) {
      return res.status(400).json({ message: 'User already registered' });
    }
    const newUser = await User.create({ 
      fullName, 
      emailAddress, 
      userPassword, 
      userRole: 'customer', 
      userHandle 
    });
    const token = newUser.createToken();
    res.status(201).json({ 
      user: {
        id: newUser._id,
        emailAddress: newUser.emailAddress,
        userHandle: newUser.userHandle,
        userRole: newUser.userRole 
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
  const { emailAddress, userPassword } = req.body;
  try {
    const existingUser = await User.findOne({ emailAddress });
    if (!existingUser) {
      return res.status(400).json({ message: 'Invalid login details' });
    }
    const passwordValid = await existingUser.validatePassword(userPassword);
    if (!passwordValid) {
      return res.status(400).json({ message: 'Invalid login details' });
    }
    const token = existingUser.createToken();
    res.status(200).json({ 
      user: {
        id: existingUser._id,
        emailAddress: existingUser.emailAddress,
        userHandle: existingUser.userHandle,
        userRole: existingUser.userRole 
      }, 
      token 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export { handleUserRegistration, handleUserLogin };
