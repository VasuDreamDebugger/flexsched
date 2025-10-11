import express from 'express';
import authRoutes from './authRoutes.js';
import timetableRoutes from './timetableRoutes.js';
import classSwapRoutes from './classSwapRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FlexSched API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/timetable', timetableRoutes);
router.use('/class-swap', classSwapRoutes);
router.use('/admin', adminRoutes);

export default router;
