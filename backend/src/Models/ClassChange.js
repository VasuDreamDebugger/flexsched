import mongoose from "mongoose";

const classChangeSchema = new mongoose.Schema({
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  originalClass: {
    day: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter time in HH:MM format"]
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter time in HH:MM format"]
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    branch: {
      type: String,
      required: true,
      trim: true
    },
    semester: {
      type: String,
      required: true,
      trim: true
    },
    room: {
      type: String,
      required: true,
      trim: true
    }
  },
  newClass: {
    day: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter time in HH:MM format"]
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter time in HH:MM format"]
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    branch: {
      type: String,
      required: true,
      trim: true
    },
    semester: {
      type: String,
      required: true,
      trim: true
    },
    room: {
      type: String,
      required: true,
      trim: true
    }
  },
  changeType: {
    type: String,
    enum: ['temporary', 'permanent', 'substitution', 'cancellation', 'makeup'],
    required: true,
    default: 'temporary'
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, "Reason cannot exceed 500 characters"]
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  approvalDate: {
    type: Date,
    default: null
  },
  effectiveDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    default: null // For temporary changes
  },
  notifications: [{
    sentTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty'
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    notificationType: {
      type: String,
      enum: ['change_request', 'approval', 'rejection', 'reminder']
    }
  }],
  attachments: [{
    fileName: String,
    filePath: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    commentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty'
    },
    comment: {
      type: String,
      required: true,
      trim: true
    },
    commentedAt: {
      type: Date,
      default: Date.now
    }
  }],
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

// Virtual to check if change is temporary
classChangeSchema.virtual('isTemporary').get(function() {
  return this.changeType === 'temporary' && this.endDate !== null;
});

// Virtual to check if change is active
classChangeSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'approved' && 
         this.effectiveDate <= now && 
         (this.endDate === null || this.endDate >= now);
});

// Virtual to get duration of change
classChangeSchema.virtual('duration').get(function() {
  if (!this.effectiveDate) return null;
  const end = this.endDate || new Date();
  return Math.ceil((end - this.effectiveDate) / (1000 * 60 * 60 * 24)); // days
});

// Index for better query performance
classChangeSchema.index({ facultyId: 1 });
classChangeSchema.index({ status: 1 });
classChangeSchema.index({ effectiveDate: 1 });
classChangeSchema.index({ changeType: 1 });
classChangeSchema.index({ requestedBy: 1 });

// Pre-save middleware to validate dates and times
classChangeSchema.pre('save', function(next) {
  // Validate effective date is not in the past (unless it's a historical record)
  if (this.effectiveDate < new Date().setHours(0, 0, 0, 0) && this.isNew) {
    return next(new Error('Effective date cannot be in the past'));
  }
  
  // Validate end date is after effective date for temporary changes
  if (this.changeType === 'temporary' && this.endDate && this.endDate <= this.effectiveDate) {
    return next(new Error('End date must be after effective date for temporary changes'));
  }
  
  // Validate time format and logic
  const originalStart = new Date(`1970-01-01T${this.originalClass.startTime}:00`);
  const originalEnd = new Date(`1970-01-01T${this.originalClass.endTime}:00`);
  const newStart = new Date(`1970-01-01T${this.newClass.startTime}:00`);
  const newEnd = new Date(`1970-01-01T${this.newClass.endTime}:00`);
  
  if (originalEnd <= originalStart || newEnd <= newStart) {
    return next(new Error('End time must be after start time'));
  }
  
  this.updatedAt = Date.now();
  next();
});

// Instance method to approve the change
classChangeSchema.methods.approve = function(approvedBy) {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvalDate = new Date();
  return this.save();
};

// Instance method to reject the change
classChangeSchema.methods.reject = function(rejectedBy, reason) {
  this.status = 'rejected';
  this.approvedBy = rejectedBy;
  this.comments.push({
    commentBy: rejectedBy,
    comment: `Rejected: ${reason}`
  });
  return this.save();
};

// Instance method to add comment
classChangeSchema.methods.addComment = function(commentBy, comment) {
  this.comments.push({
    commentBy: commentBy,
    comment: comment
  });
  return this.save();
};

// Static method to find changes by faculty
classChangeSchema.statics.findByFaculty = function(facultyId) {
  return this.find({ facultyId: facultyId }).sort({ createdAt: -1 });
};

// Static method to find pending changes
classChangeSchema.statics.findPending = function() {
  return this.find({ status: 'pending' }).sort({ effectiveDate: 1 });
};

// Static method to find changes by date range
classChangeSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    effectiveDate: { $gte: startDate, $lte: endDate }
  }).sort({ effectiveDate: 1 });
};

const ClassChange = mongoose.model('ClassChange', classChangeSchema);

export default ClassChange;
