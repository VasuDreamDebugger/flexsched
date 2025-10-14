import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  branch: { type: String, required: true, trim: true },
  year: { type: Number, required: true, min: 1, max: 4 },
  section: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

studentSchema.index({ branch: 1, year: 1, section: 1 });
studentSchema.index({ email: 1 }, { unique: true });

studentSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  this.updatedAt = new Date();
  next();
});

studentSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Promote all students by 1 year up to max 4, deactivate graduates (>4)
studentSchema.statics.promoteYearly = async function() {
  // Promote years 1->2, 2->3, 3->4
  await this.updateMany({ year: { $lt: 4 }, isActive: true }, { $inc: { year: 1 } });
  // Deactivate anyone exceeding 4
  await this.updateMany({ year: { $gt: 4 } }, { $set: { isActive: false } });
};

const Student = mongoose.model('Student', studentSchema);

export default Student;


