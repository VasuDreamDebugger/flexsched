import express from 'express';
import {
  adminLogin,
  createFaculty,
  bulkCreateFaculty,
  createFacultyTimetable,
  createClassTimetable,
  getAllFaculties,
  getAllTimetables
} from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public admin routes
router.post('/login', adminLogin);

// Protected admin routes (require admin authentication)
router.use(authenticateToken); // All routes below require authentication

// Faculty management
router.post('/faculty/create', createFaculty);
router.post('/faculty/bulk-create', bulkCreateFaculty);
router.get('/faculty/all', getAllFaculties);

// Timetable management
router.post('/timetable/faculty', createFacultyTimetable);
router.post('/timetable/class', createClassTimetable);
router.get('/timetable/all', getAllTimetables);

export default router;
