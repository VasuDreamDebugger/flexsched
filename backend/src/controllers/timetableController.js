import Timetable from '../Models/Timetable.js';
import Faculty from '../Models/Faculty.js';

// Get faculty's own timetable
export const getFacultyTimetable = async (req, res) => {
  try {
    const facultyId = req.faculty._id;

    const timetable = await Timetable.findOne({
      facultyId: facultyId,
      isActive: true
    });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { timetable }
    });
  } catch (error) {
    console.error('Get faculty timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get class timetables by year, branch, and section
export const getClassTimetables = async (req, res) => {
  try {
    const { year, branch, section } = req.query;

    if (!year || !branch || !section) {
      return res.status(400).json({
        success: false,
        message: 'Year, branch, and section are required'
      });
    }

    // Find all timetables for the specified class
    const timetables = await Timetable.find({
      'timeSlots.branch': branch,
      'timeSlots.semester': year,
      isActive: true
    }).populate('facultyId', 'name email employeeId department subjects');

    // Filter and organize by sections
    const classTimetables = {};
    
    timetables.forEach(timetable => {
      timetable.timeSlots.forEach(slot => {
        if (slot.branch === branch && slot.semester === year) {
          const sectionKey = slot.section || 'default';
          
          if (!classTimetables[sectionKey]) {
            classTimetables[sectionKey] = {
              section: sectionKey,
              timetables: []
            };
          }
          
          classTimetables[sectionKey].timetables.push({
            faculty: timetable.facultyId,
            slot: slot,
            timetableId: timetable._id
          });
        }
      });
    });

    res.status(200).json({
      success: true,
      data: { 
        year,
        branch,
        sections: Object.values(classTimetables)
      }
    });
  } catch (error) {
    console.error('Get class timetables error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all available class combinations
export const getAvailableClasses = async (req, res) => {
  try {
    // Get all unique combinations of year, branch, and section
    const classCombinations = await Timetable.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$timeSlots' },
      {
        $group: {
          _id: {
            year: '$timeSlots.semester',
            branch: '$timeSlots.branch',
            section: '$timeSlots.section'
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          year: '$_id.year',
          branch: '$_id.branch',
          section: '$_id.section',
          classCount: '$count',
          _id: 0
        }
      },
      { $sort: { year: 1, branch: 1, section: 1 } }
    ]);

    // Organize by year and branch
    const organizedClasses = {};
    
    classCombinations.forEach(cls => {
      if (!organizedClasses[cls.year]) {
        organizedClasses[cls.year] = {};
      }
      if (!organizedClasses[cls.year][cls.branch]) {
        organizedClasses[cls.year][cls.branch] = [];
      }
      organizedClasses[cls.year][cls.branch].push({
        section: cls.section,
        classCount: cls.classCount
      });
    });

    res.status(200).json({
      success: true,
      data: { classes: organizedClasses }
    });
  } catch (error) {
    console.error('Get available classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create or update faculty timetable
export const createOrUpdateTimetable = async (req, res) => {
  try {
    const facultyId = req.faculty._id;
    const { semester, academicYear, timeSlots } = req.body;

    // Check if timetable already exists
    let timetable = await Timetable.findOne({
      facultyId: facultyId,
      semester: semester,
      academicYear: academicYear
    });

    if (timetable) {
      // Update existing timetable
      timetable.timeSlots = timeSlots;
      timetable.updatedAt = new Date();
    } else {
      // Create new timetable
      timetable = new Timetable({
        facultyId: facultyId,
        semester: semester,
        academicYear: academicYear,
        timeSlots: timeSlots
      });
    }

    await timetable.save();

    // Update faculty's timetableId reference
    await Faculty.findByIdAndUpdate(facultyId, {
      timetableId: timetable._id
    });

    res.status(200).json({
      success: true,
      message: 'Timetable saved successfully',
      data: { timetable }
    });
  } catch (error) {
    console.error('Create/Update timetable error:', error);
    
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

// Get timetable by ID
export const getTimetableById = async (req, res) => {
  try {
    const { id } = req.params;

    const timetable = await Timetable.findById(id)
      .populate('facultyId', 'name email employeeId department subjects');

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { timetable }
    });
  } catch (error) {
    console.error('Get timetable by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get period timings
export const getPeriodTimings = async (req, res) => {
  try {
    const periodTimings = Timetable.getDefaultPeriodTimings();

    res.status(200).json({
      success: true,
      data: { periodTimings }
    });
  } catch (error) {
    console.error('Get period timings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Check for timetable conflicts
export const checkTimetableConflicts = async (req, res) => {
  try {
    const { timeSlots } = req.body;

    const conflicts = [];
    
    // Check for conflicts within the provided time slots
    for (let i = 0; i < timeSlots.length; i++) {
      for (let j = i + 1; j < timeSlots.length; j++) {
        const slot1 = timeSlots[i];
        const slot2 = timeSlots[j];
        
        if (slot1.day === slot2.day) {
          const hasConflict = slot1.periods.some(period => 
            slot2.periods.includes(period)
          );
          
          if (hasConflict) {
            conflicts.push({
              type: 'internal_conflict',
              slot1: slot1,
              slot2: slot2,
              message: `Conflict between ${slot1.subject} and ${slot2.subject} on ${slot1.day}`
            });
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      data: { 
        hasConflicts: conflicts.length > 0,
        conflicts 
      }
    });
  } catch (error) {
    console.error('Check timetable conflicts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
