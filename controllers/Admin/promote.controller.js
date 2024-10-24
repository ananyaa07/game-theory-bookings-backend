import User from "../../models/user.js";

// Promote Customer to Operations
const promoteUser = async (req, res) => {
  const { userId } = req.query;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.userRole !== "customer") {
      return res
        .status(400)
        .json({ message: "Only customers can be promoted to operations" });
    }
    user.userRole = "operations";
    await user.save();
    res
      .status(200)
      .json({ message: "User promoted to operations role successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export default promoteUser;
