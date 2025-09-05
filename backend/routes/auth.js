import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Faculty from "../models/Faculty.js";

const router = express.Router();

// Faculty Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    // Check if email already exists
    const existingFaculty = await Faculty.findOne({ email });
    if (existingFaculty) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const faculty = new Faculty({
      name,
      email,
      password: hashedPassword,
      department
    });

    await faculty.save();
    res.status(201).json({ message: "Faculty registered successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Faculty Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const faculty = await Faculty.findOne({ email });
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, faculty.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign({ id: faculty._id }, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    res.json({ 
      token, 
      faculty: { id: faculty._id, name: faculty.name, email: faculty.email, department: faculty.department }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
