import jwt from 'jsonwebtoken';
import Faculty from '../Models/Faculty.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find faculty by ID and exclude password
    const faculty = await Faculty.findById(decoded.facultyId).select('-password');
    
    if (!faculty) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token - faculty not found' 
      });
    }

    if (!faculty.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated' 
      });
    }

    req.faculty = faculty;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Middleware to check if faculty has specific permissions
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.faculty) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (roles && !roles.includes(req.faculty.designation)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

// Generate JWT token
export const generateToken = (facultyId) => {
  return jwt.sign(
    { facultyId }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
};

// Generate refresh token
export const generateRefreshToken = (facultyId) => {
  return jwt.sign(
    { facultyId, type: 'refresh' }, 
    JWT_SECRET, 
    { expiresIn: '30d' }
  );
};
