import express from "express";
import { authenticateToken as auth } from "../middleware/auth.js";
import {
  getSmartRecommendations,
  assignSmartRecommendedSlots,
} from "../controllers/smartRecommendController.js";

const router = express.Router();

// Get smart recommendations for available slots
router.post("/recommendations", auth, getSmartRecommendations);

// Assign faculty to recommended slots
router.post("/assign", auth, assignSmartRecommendedSlots);

export default router;
