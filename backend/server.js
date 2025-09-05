// server.js
import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

// 1. Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/myapp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 2. Define User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String, // ⚠️ In real apps, always hash passwords!
});

// 3. Create User model
const User = mongoose.model("User", userSchema);

// 4. Signup route
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Save new user
    const newUser = new User({ name, email, password });
    await newUser.save();

    res.status(201).json({ message: "Signup successful", user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Start server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
app.get("/", (req, res) => {
  res.send("Backend is running 🚀 Use POST /signup to register");
});

