import mongoose from "mongoose";
import dotenv from "dotenv";
import Faculty from "./src/Models/Faculty.js";
import { createSwapRequest } from "./src/controllers/classSwapController.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

const run = async () => {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected");

    const faculty = await Faculty.findOne({
      email: "p.sindhu@university.edu",
    }).lean();
    if (!faculty) {
      console.error("Faculty not found");
      process.exit(1);
    }

    const req = {
      body: {
        yourClassId: "68f0f3c271325d6aea9e37b5",
        requestedClassId: "68f0f3c271325d6aea9e37b6",
        yourDay: "Monday",
        yourPeriod: 1,
        requestedDay: "Tuesday",
        requestedPeriod: 2,
        swapDate: "2025-10-20",
        reason: "test from direct call",
      },
      faculty: faculty,
    };

    const res = {
      status(code) {
        this._status = code;
        return this;
      },
      json(obj) {
        console.log("RES JSON", this._status, JSON.stringify(obj, null, 2));
      },
    };

    await createSwapRequest(req, res);
    console.log("Done");
    process.exit(0);
  } catch (err) {
    console.error("Script error", err);
    process.exit(1);
  }
};

run();
