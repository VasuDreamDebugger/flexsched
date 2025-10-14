import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { createStudentsBulk, createStudent, queryStudents } from '../controllers/studentController.js';

const router = express.Router();

// Protected routes
router.use(authenticateToken);

// Create a single student
router.post('/', createStudent);

// Bulk create students (by year/branch/section ranges)
router.post('/bulk', createStudentsBulk);

// Query students by branch/year/section
router.get('/', queryStudents);

export default router;


