import jwt from "jsonwebtoken";
import Faculty from "../Models/Faculty.js";
import Admin from "../Models/Admin.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    // console.log('token', token);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Try to resolve token to a Faculty first, then to an Admin
    let faculty = null;
    let admin = null;

    try {
      faculty = await Faculty.findById(decoded.facultyId).select("-password");
    } catch (e) {
      faculty = null;
    }

    if (!faculty) {
      // Try admin lookup
      try {
        admin = await Admin.findById(decoded.facultyId).select("-password");
      } catch (e) {
        admin = null;
      }
    }

    if (!faculty && !admin) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token - user not found" });
    }

    if (faculty && !faculty.isActive) {
      return res
        .status(401)
        .json({ success: false, message: "Account is deactivated" });
    }

    if (admin && !admin.isActive) {
      return res
        .status(401)
        .json({ success: false, message: "Admin account is deactivated" });
    }

    // Attach whichever was found to request
    if (faculty) req.faculty = faculty;
    if (admin) req.admin = admin;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Middleware to check if faculty has specific permissions
export const requireRole = (roles) => {
  return (req, res, next) => {
    // Allow either authenticated faculty or admin
    if (!req.faculty && !req.admin) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    // If roles are specified, check faculty designation or admin role
    if (roles) {
      if (req.faculty && !roles.includes(req.faculty.designation)) {
        return res
          .status(403)
          .json({ success: false, message: "Insufficient permissions" });
      }
      if (req.admin && !roles.includes(req.admin.role)) {
        return res
          .status(403)
          .json({ success: false, message: "Insufficient permissions" });
      }
    }

    next();
  };
};

// Generate JWT token
export const generateToken = (facultyId) => {
  return jwt.sign({ facultyId }, JWT_SECRET, { expiresIn: "7d" });
};

// Generate refresh token
export const generateRefreshToken = (facultyId) => {
  return jwt.sign({ facultyId, type: "refresh" }, JWT_SECRET, {
    expiresIn: "30d",
  });
};
