import mongoose from "mongoose";

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://vasumanikanta352_db_user:flexsched123@flexsched.zyjwzbw.mongodb.net/FlexSchedDB?retryWrites=true&w=majority&appName=FlexSched";

const connectMongoDB = async () => {
  try {
    console.log("Connecting to MongoDB...");
    console.log("MONGO_URI:", MONGO_URI ? "Loaded" : "Not loaded");
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB Connected successfully!");
  } catch (error) {
    console.log("MongoDB connection error:", error.message);
    console.log("Full error:", error.stack);
    throw error;
  }
};

export default connectMongoDB;
