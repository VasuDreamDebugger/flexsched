import mongoose from "mongoose";

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Faculty name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters long"],
    maxlength: [100, "Name cannot exceed 100 characters"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
    select: false // Don't include password in queries by default
  },
  branch: {
    type: [String],
    required: [true, "At least one branch is required"],
    validate: {
      validator: function(branches) {
        return branches && branches.length > 0;
      },
      message: "Faculty must be assigned to at least one branch"
    }
  },
  subjects: {
    type: [String],
    required: [true, "At least one subject is required"],
    validate: {
      validator: function(subjects) {
        return subjects && subjects.length > 0;
      },
      message: "Faculty must teach at least one subject"
    }
  },
  timetableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timetable',
    default: null
  },
  classChange: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassChange'
  }],
  // Additional useful fields
  employeeId: {
    type: String,
    required: [true, "Employee ID is required"],
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, "Please enter a valid phone number"]
  },
  designation: {
    type: String,
    enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Guest Faculty'],
    default: 'Lecturer'
  },
  department: {
    type: String,
    required: [true, "Department is required"],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name display
facultySchema.virtual('fullName').get(function() {
  return this.name;
});

// Index for better query performance
facultySchema.index({ email: 1 });
facultySchema.index({ employeeId: 1 });
facultySchema.index({ branch: 1 });
facultySchema.index({ subjects: 1 });

// Pre-save middleware to update the updatedAt field
facultySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to get faculty's timetable
facultySchema.methods.getTimetable = async function() {
  if (!this.timetableId) return null;
  return await this.constructor.db.model('Timetable').findById(this.timetableId);
};

// Instance method to get all class changes
facultySchema.methods.getClassChanges = async function() {
  return await this.constructor.db.model('ClassChange').find({
    _id: { $in: this.classChange }
  });
};

// Static method to find faculty by branch
facultySchema.statics.findByBranch = function(branch) {
  return this.find({ branch: branch, isActive: true });
};

// Static method to find faculty by subject
facultySchema.statics.findBySubject = function(subject) {
  return this.find({ subjects: subject, isActive: true });
};

const Faculty = mongoose.model('Faculty', facultySchema);

export default Faculty;
