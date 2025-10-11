import bcrypt from 'bcryptjs';
import Faculty from '../Models/Faculty.js';
import { generateToken, generateRefreshToken } from '../middleware/auth.js';

// Register new faculty
export const register = async (req, res) => {
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

    // Create new faculty
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

    // Generate tokens
    const token = generateToken(faculty._id);
    const refreshToken = generateRefreshToken(faculty._id);

    // Return faculty data without password
    const facultyData = faculty.toObject();
    delete facultyData.password;

    res.status(201).json({
      success: true,
      message: 'Faculty registered successfully',
      data: {
        faculty: facultyData,
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
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

// Login faculty
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find faculty by email and include password for comparison
    const faculty = await Faculty.findOne({ email }).select('+password');

    if (!faculty) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!faculty.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, faculty.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const token = generateToken(faculty._id);
    const refreshToken = generateRefreshToken(faculty._id);

    // Update last login
    faculty.lastLogin = new Date();
    await faculty.save();

    // Return faculty data without password
    const facultyData = faculty.toObject();
    delete facultyData.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        faculty: facultyData,
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get current faculty profile
export const getProfile = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.faculty._id)
      .populate('timetableId')
      .populate('classChange');

    res.status(200).json({
      success: true,
      data: { faculty }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update faculty profile
export const updateProfile = async (req, res) => {
  try {
    const { name, phoneNumber, designation, profilePicture } = req.body;

    const faculty = await Faculty.findByIdAndUpdate(
      req.faculty._id,
      {
        name,
        phoneNumber,
        designation,
        profilePicture
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { faculty }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
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

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Find faculty with password
    const faculty = await Faculty.findById(req.faculty._id).select('+password');

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, faculty.password);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    faculty.password = hashedNewPassword;
    await faculty.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout (client-side token removal)
export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};
