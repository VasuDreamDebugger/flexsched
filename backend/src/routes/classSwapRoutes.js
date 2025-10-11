import express from 'express';
import {
  createSwapRequest,
  getSwapRequests,
  getSwapRequest,
  acceptSwapRequest,
  rejectSwapRequest,
  cancelSwapRequest,
  completeSwapRequest,
  getAvailableFaculties
} from '../controllers/classSwapController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All class swap routes require authentication
router.use(authenticateToken);

// Swap request routes
router.post('/create', createSwapRequest);
router.get('/requests', getSwapRequests);
router.get('/requests/:id', getSwapRequest);
router.put('/requests/:id/accept', acceptSwapRequest);
router.put('/requests/:id/reject', rejectSwapRequest);
router.put('/requests/:id/cancel', cancelSwapRequest);
router.put('/requests/:id/complete', completeSwapRequest);

// Utility routes
router.get('/available-faculties', getAvailableFaculties);

export default router;
