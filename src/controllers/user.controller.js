const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const signInJWTToken = require("../utils/jwt");

async function register(req, res, next) {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    const validRoles = ["user", "organizer", "admin"];
    const assignedRole = validRoles.includes(role) ? role : "user"; 

    // Validate input data
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if email already exists
    const user = await userModel.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await userModel.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: assignedRole,
    });

    const token = signInJWTToken(newUser._id, newUser.email);

    res
      .status(201)
      .json({ message: "User registered successfully", token, newUser });
      
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // check if the person have an account on our databse
    const user = await userModel.findOne({ email });

    //  if the person does nt have an account, we send anerror
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    // if the passwords do not match, we send an error

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signInJWTToken(user._id, user.email);

    res.json({ message: "User logged in successfully", token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

const getUser = async (req, res) => {
  const id = req.user;
  try {
    const user = await userModel.findById(id);
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

async function updateUser(req, res) {
  try {
    const userId = req.user; // Extracted from authentication middleware
    const { firstName, lastName, email, password } = req.body;

    let user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // If email is being updated, ensure it's not already taken
    if (email && email !== user.email) {
      const emailExists = await userModel.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ error: "Email already in use" });
      }
      user.email = email;
    }

    // Update fields if provided
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    // If the password is being updated, hash it
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

const authController = {
  register,
  login,
  getUser,
  updateUser,
};

module.exports = authController;
