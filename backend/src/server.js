import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectMongoDB from "./database/db.js";
import routes from "./routes/index.js";
import testRoutes from "./routes/testRoutes.js";
import "./Models/index.js";
import Student from "./Models/Student.js";
import ClassTimetable from "./Models/ClassTimetable.js";
import cron from "node-cron";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api", routes);
app.use("/test", testRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 3000;

const scheduleJobs = () => {
  cron.schedule("0 2 1 6 *", async () => {
    try {
      console.log("Running yearly student promotion job...");
      await Student.promoteYearly();
      console.log("Student promotion completed.");
    } catch (e) {
      console.error("Student promotion job failed:", e);
    }
  });
};

export const initializeServer = async () => {
  await connectMongoDB();

  if (process.env.VERCEL === "1") {
    console.log(
      "Running in Vercel serverless environment; skipping app.listen and cron scheduling.",
    );
    return;
  }

  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    scheduleJobs();
  });
};

if (process.env.VERCEL !== "1") {
  initializeServer().catch((error) => {
    console.error("Server initialization failed:", error);
    process.exit(1);
  });
}

export default app;
