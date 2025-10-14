import mongoose from 'mongoose';

const classSlotSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  period: { type: Number, required: true, min: 1, max: 6 },
  subject: { type: String, required: true, trim: true },
  room: { type: String, required: true, trim: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  isLab: { type: Boolean, default: false },
  isTheory: { type: Boolean, default: true }
}, { _id: false });

const versionSchema = new mongoose.Schema({
  label: { type: String, enum: ['default', 'updated', 'draft'], required: true },
  timeSlots: { type: [classSlotSchema], default: [] },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { _id: false });

const classTimetableSchema = new mongoose.Schema({
  branch: { type: String, required: true, trim: true, index: true },
  year: { type: String, required: true, trim: true, index: true },
  section: { type: String, required: true, trim: true, index: true },
  academicYear: { type: String, required: true, trim: true, index: true },
  semester: { type: String, required: true, trim: true, index: true },
  versions: { type: [versionSchema], default: [] }
}, { timestamps: true });

classTimetableSchema.index({ branch: 1, year: 1, section: 1, academicYear: 1, semester: 1 }, { unique: true });

const ClassTimetable = mongoose.model('ClassTimetable', classTimetableSchema);

export default ClassTimetable;


