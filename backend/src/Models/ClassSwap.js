import mongoose from "mongoose";

const classSwapSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    targetFacultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    requesterClass: {
      classTimetableId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClassTimetable",
        required: false,
      },
      day: {
        type: String,
        required: true,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
      periods: {
        type: [Number],
        required: true,
        validate: {
          validator: function (periods) {
            return periods.every((period) => period >= 1 && period <= 6);
          },
          message: "Period numbers must be between 1 and 6",
        },
      },
      subject: {
        type: String,
        required: true,
        trim: true,
      },
      branch: {
        type: String,
        required: true,
        trim: true,
      },
      semester: {
        type: String,
        required: true,
        trim: true,
      },
      section: {
        type: String,
        required: true,
        trim: true,
      },
      room: {
        type: String,
        required: true,
        trim: true,
      },
      isLab: {
        type: Boolean,
        default: false,
      },
    },
    targetClass: {
      classTimetableId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClassTimetable",
        required: false,
      },
      day: {
        type: String,
        required: true,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
      periods: {
        type: [Number],
        required: true,
        validate: {
          validator: function (periods) {
            return periods.every((period) => period >= 1 && period <= 6);
          },
          message: "Period numbers must be between 1 and 6",
        },
      },
      subject: {
        type: String,
        required: true,
        trim: true,
      },
      branch: {
        type: String,
        required: true,
        trim: true,
      },
      semester: {
        type: String,
        required: true,
        trim: true,
      },
      section: {
        type: String,
        required: true,
        trim: true,
      },
      room: {
        type: String,
        required: true,
        trim: true,
      },
      isLab: {
        type: Boolean,
        default: false,
      },
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, "Reason cannot exceed 500 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
      default: "pending",
    },
    swapDate: {
      type: Date,
      required: true,
    },
    responseDate: {
      type: Date,
      default: null,
    },
    responseMessage: {
      type: String,
      trim: true,
      maxlength: [500, "Response message cannot exceed 500 characters"],
    },
    notifications: [
      {
        sentTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Faculty",
        },
        sentAt: {
          type: Date,
          default: Date.now,
        },
        notificationType: {
          type: String,
          enum: [
            "swap_request",
            "swap_accepted",
            "swap_rejected",
            "swap_cancelled",
            "reminder",
          ],
        },
        message: String,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to check if swap is pending
classSwapSchema.virtual("isPending").get(function () {
  return this.status === "pending";
});

// Virtual to check if swap is active
classSwapSchema.virtual("isActive").get(function () {
  return this.status === "accepted" && this.swapDate >= new Date();
});

// Virtual to check if swap is completed
classSwapSchema.virtual("isCompleted").get(function () {
  return this.status === "completed";
});

// Index for better query performance
classSwapSchema.index({ requesterId: 1 });
classSwapSchema.index({ targetFacultyId: 1 });
classSwapSchema.index({ status: 1 });
classSwapSchema.index({ swapDate: 1 });
classSwapSchema.index({ createdAt: -1 });

// Pre-save middleware to validate swap date
classSwapSchema.pre("save", function (next) {
  // Validate swap date is not in the past
  if (this.swapDate < new Date().setHours(0, 0, 0, 0)) {
    return next(new Error("Swap date cannot be in the past"));
  }

  // Validate that requester and target faculty are different
  if (this.requesterId.toString() === this.targetFacultyId.toString()) {
    return next(new Error("Cannot swap with yourself"));
  }

  this.updatedAt = Date.now();
  next();
});

// Instance method to accept the swap
classSwapSchema.methods.accept = function (message) {
  this.status = "accepted";
  this.responseDate = new Date();
  this.responseMessage = message;
  return this.save();
};

// Instance method to reject the swap
classSwapSchema.methods.reject = function (message) {
  this.status = "rejected";
  this.responseDate = new Date();
  this.responseMessage = message;
  return this.save();
};

// Instance method to cancel the swap
classSwapSchema.methods.cancel = function () {
  this.status = "cancelled";
  this.responseDate = new Date();
  return this.save();
};

// Instance method to complete the swap
classSwapSchema.methods.complete = function () {
  this.status = "completed";
  return this.save();
};

// Instance method to add notification
classSwapSchema.methods.addNotification = function (sentTo, type, message) {
  this.notifications.push({
    sentTo: sentTo,
    notificationType: type,
    message: message,
  });
  return this.save();
};

// Static method to find swaps by faculty
classSwapSchema.statics.findByFaculty = function (facultyId) {
  return this.find({
    $or: [{ requesterId: facultyId }, { targetFacultyId: facultyId }],
  }).sort({ createdAt: -1 });
};

// Static method to find pending swaps for a faculty
classSwapSchema.statics.findPendingForFaculty = function (facultyId) {
  return this.find({
    targetFacultyId: facultyId,
    status: "pending",
  }).sort({ createdAt: -1 });
};

// Static method to find swaps by date range
classSwapSchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({
    swapDate: { $gte: startDate, $lte: endDate },
  }).sort({ swapDate: 1 });
};

const ClassSwap = mongoose.model("ClassSwap", classSwapSchema);

export default ClassSwap;
