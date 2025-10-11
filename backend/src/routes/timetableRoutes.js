import express from 'express';
import {
  getFacultyTimetable,
  getClassTimetables,
  getAvailableClasses,
  createOrUpdateTimetable,
  getTimetableById,
  getPeriodTimings,
  checkTimetableConflicts
} from '../controllers/timetableController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All timetable routes require authentication
router.use(authenticateToken);

// Faculty timetable routes
router.get('/faculty', getFacultyTimetable);
router.post('/faculty', createOrUpdateTimetable);
router.put('/faculty', createOrUpdateTimetable);

// Class timetable routes
router.get('/classes', getClassTimetables);
router.get('/classes/available', getAvailableClasses);

// General timetable routes
router.get('/:id', getTimetableById);
router.get('/utils/period-timings', getPeriodTimings);
router.post('/utils/check-conflicts', checkTimetableConflicts);

export default router;
