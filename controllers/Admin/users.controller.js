import User from "../../models/user.js";

// Fetch all users with the role of 'customer'
const getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' });

    if (!customers.length) {
      return res.status(404).json({ message: "No customers found" });
    }

    res.status(200).json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export default getAllCustomers;
