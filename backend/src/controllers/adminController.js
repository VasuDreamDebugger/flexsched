import bcrypt from 'bcryptjs';
import Admin from '../Models/Admin.js';
import Faculty from '../Models/Faculty.js';
import Timetable from '../Models/Timetable.js';
import { generateToken } from '../middleware/auth.js';

// Admin login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(admin._id);

    const adminData = admin.toObject();
    delete adminData.password;

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        admin: adminData,
        token
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create faculty account
export const createFaculty = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      branch,
      subjects,
      employeeId,
      phoneNumber,
      designation,
      department
    } = req.body;

    // Check if faculty already exists
    const existingFaculty = await Faculty.findOne({ 
      $or: [{ email }, { employeeId }] 
    });

    if (existingFaculty) {
      return res.status(400).json({
        success: false,
        message: 'Faculty with this email or employee ID already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const faculty = new Faculty({
      name,
      email,
      password: hashedPassword,
      branch,
      subjects,
      employeeId,
      phoneNumber,
      designation,
      department
    });

    await faculty.save();

    const facultyData = faculty.toObject();
    delete facultyData.password;

    res.status(201).json({
      success: true,
      message: 'Faculty created successfully',
      data: { faculty: facultyData }
    });
  } catch (error) {
    console.error('Create faculty error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Bulk create faculty from CSV
export const bulkCreateFaculty = async (req, res) => {
  try {
    const { facultyData } = req.body;

    if (!Array.isArray(facultyData) || facultyData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Faculty data array is required'
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < facultyData.length; i++) {
      try {
        const facultyInfo = facultyData[i];
        
        // Check if faculty already exists
        const existingFaculty = await Faculty.findOne({ 
          $or: [{ email: facultyInfo.email }, { employeeId: facultyInfo.employeeId }] 
        });

        if (existingFaculty) {
          errors.push({
            row: i + 1,
            message: `Faculty with email ${facultyInfo.email} or employee ID ${facultyInfo.employeeId} already exists`
          });
          continue;
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(facultyInfo.password, saltRounds);

        const faculty = new Faculty({
          ...facultyInfo,
          password: hashedPassword
        });

        await faculty.save();

        const facultyDataResult = faculty.toObject();
        delete facultyDataResult.password;
        results.push(facultyDataResult);

      } catch (error) {
        errors.push({
          row: i + 1,
          message: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${results.length} faculty accounts`,
      data: {
        created: results,
        errors: errors,
        totalProcessed: facultyData.length
      }
    });
  } catch (error) {
    console.error('Bulk create faculty error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create faculty timetable
export const createFacultyTimetable = async (req, res) => {
  try {
    const { facultyId, semester, academicYear, timeSlots } = req.body;

    // Check if faculty exists
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    // Check if timetable already exists
    const existingTimetable = await Timetable.findOne({
      facultyId: facultyId,
      semester: semester,
      academicYear: academicYear
    });

    if (existingTimetable) {
      return res.status(400).json({
        success: false,
        message: 'Timetable for this faculty, semester, and academic year already exists'
      });
    }

    const timetable = new Timetable({
      facultyId,
      semester,
      academicYear,
      timeSlots
    });

    await timetable.save();

    // Update faculty's timetableId reference
    await Faculty.findByIdAndUpdate(facultyId, {
      timetableId: timetable._id
    });

    res.status(201).json({
      success: true,
      message: 'Faculty timetable created successfully',
      data: { timetable }
    });
  } catch (error) {
    console.error('Create faculty timetable error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create class timetable
export const createClassTimetable = async (req, res) => {
  try {
    const { facultyId, semester, academicYear, timeSlots } = req.body;

    // Check if faculty exists
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    const timetable = new Timetable({
      facultyId,
      semester,
      academicYear,
      timeSlots
    });

    await timetable.save();

    res.status(201).json({
      success: true,
      message: 'Class timetable created successfully',
      data: { timetable }
    });
  } catch (error) {
    console.error('Create class timetable error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all faculties
export const getAllFaculties = async (req, res) => {
  try {
    const faculties = await Faculty.find({ isActive: true })
      .select('-password')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: { faculties }
    });
  } catch (error) {
    console.error('Get all faculties error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all timetables
export const getAllTimetables = async (req, res) => {
  try {
    const timetables = await Timetable.find({ isActive: true })
      .populate('facultyId', 'name email employeeId department')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { timetables }
    });
  } catch (error) {
    console.error('Get all timetables error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
