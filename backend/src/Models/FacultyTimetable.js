import mongoose from 'mongoose';

const facultySlotSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  // single period granularity per slot for easier sync
  period: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  subject: { type: String, required: true, trim: true },
  branch: { type: String, required: true, trim: true },
  year: { type: String, required: true, trim: true },
  section: { type: String, required: true, trim: true },
  room: { type: String, required: true, trim: true },
  isLab: { type: Boolean, default: false },
  isTheory: { type: Boolean, default: true }
}, { _id: false });

const facultyTimetableSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true, index: true },
  academicYear: { type: String, required: true, trim: true, index: true },
  semester: { type: String, required: true, trim: true, index: true },
  timeSlots: { type: [facultySlotSchema], default: [] }
}, { timestamps: true });

// Ensure unique (facultyId, academicYear, semester, day, period)
facultyTimetableSchema.index({ facultyId: 1, academicYear: 1, semester: 1, 'timeSlots.day': 1, 'timeSlots.period': 1 });

const FacultyTimetable = mongoose.model('FacultyTimetable', facultyTimetableSchema);

export default FacultyTimetable;


