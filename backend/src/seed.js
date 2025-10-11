import mongoose from "mongoose";
import dotenv from "dotenv";
import seedDatabase from "./utils/seedData.js";

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://vasumanikanta352_db_user:flexsched123@flexsched.zyjwzbw.mongodb.net/FlexSchedDB?retryWrites=true&w=majority&appName=FlexSched";

const runSeed = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    await seedDatabase();

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

runSeed();
