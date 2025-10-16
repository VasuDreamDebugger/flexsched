import mongoose from "mongoose";

// Default period timings (can be customized per institution)
const DEFAULT_PERIOD_TIMINGS = {
  1: { start: "09:00", end: "10:00" },
  2: { start: "10:00", end: "11:00" },
  3: { start: "11:00", end: "12:00" },
  4: { start: "13:00", end: "14:00" },
  5: { start: "14:00", end: "15:00" },
  6: { start: "15:00", end: "16:00" },
};

const timeSlotSchema = new mongoose.Schema({
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
        // Validate period numbers are between 1-6
        if (!periods.every((period) => period >= 1 && period <= 6)) {
          return false;
        }

        // Lab-specific validation: Labs can only have first 3 periods (1,2,3) or last 3 periods (4,5,6)
        if (this.isLab) {
          const isFirstThree = periods.every((period) =>
            [1, 2, 3].includes(period)
          );
          const isLastThree = periods.every((period) =>
            [4, 5, 6].includes(period)
          );
          return isFirstThree || isLastThree;
        }

        return true;
      },
      message: function (props) {
        if (!props.value.every((period) => period >= 1 && period <= 6)) {
          return "Period numbers must be between 1 and 6";
        }
        if (props.path.includes("isLab") && props.path.includes("periods")) {
          return "Lab periods must be either first 3 periods (1,2,3) or last 3 periods (4,5,6) only";
        }
        return "Lab periods must be either first 3 periods (1,2,3) or last 3 periods (4,5,6) only";
      },
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
    defaut: "1",
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
  isTheory: {
    type: Boolean,
    default: true,
  },
});

const timetableSchema = new mongoose.Schema(
  {
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    semester: {
      type: String,
      required: true,
      trim: true,
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
    },
    timeSlots: [timeSlotSchema],
    // default snapshot used for comparison/display
    defaultTimeSlots: [timeSlotSchema],
    isClassTimetable: {
      type: Boolean,
      default: false,
    },
    classDetails: {
      branch: {
        type: String,
        trim: true,
      },
      year: {
        type: String,
        trim: true,
      },
      section: {
        type: String,
        trim: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
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

// Virtual to get total periods per week
timetableSchema.virtual("totalPeriodsPerWeek").get(function () {
  return this.timeSlots.reduce((total, slot) => total + slot.periods.length, 0);
});

// Virtual to get total hours per week (assuming each period is 1 hour)
timetableSchema.virtual("totalHoursPerWeek").get(function () {
  return this.totalPeriodsPerWeek;
});

// Virtual to get subjects taught
timetableSchema.virtual("subjects").get(function () {
  return [...new Set(this.timeSlots.map((slot) => slot.subject))];
});

// Virtual to get branches taught
timetableSchema.virtual("branches").get(function () {
  return [...new Set(this.timeSlots.map((slot) => slot.branch))];
});

// Index for better query performance
timetableSchema.index({ facultyId: 1 });
timetableSchema.index({ semester: 1 });
timetableSchema.index({ academicYear: 1 });
timetableSchema.index({ "timeSlots.day": 1, "timeSlots.periods": 1 });

// Pre-save middleware to validate time slots
timetableSchema.pre("save", function (next) {
  // Validate periods are in ascending order and no duplicates
  for (let slot of this.timeSlots) {
    // Check for duplicate periods
    const uniquePeriods = [...new Set(slot.periods)];
    if (uniquePeriods.length !== slot.periods.length) {
      return next(
        new Error("Duplicate periods are not allowed in the same time slot")
      );
    }

    // Check periods are in ascending order
    const sortedPeriods = [...slot.periods].sort((a, b) => a - b);
    if (JSON.stringify(sortedPeriods) !== JSON.stringify(slot.periods)) {
      return next(new Error("Periods must be in ascending order"));
    }

    // Validate consecutive periods (optional - can be removed if non-consecutive periods are allowed)
    for (let i = 1; i < slot.periods.length; i++) {
      if (slot.periods[i] !== slot.periods[i - 1] + 1) {
        return next(new Error("Periods must be consecutive"));
      }
    }
  }

  this.updatedAt = Date.now();
  next();
});

// Instance method to get timetable for specific day
timetableSchema.methods.getDaySchedule = function (day) {
  return this.timeSlots.filter((slot) => slot.day === day);
};

// Instance method to check for period conflicts
timetableSchema.methods.hasPeriodConflict = function (newSlot) {
  const daySlots = this.getDaySchedule(newSlot.day);

  for (let existingSlot of daySlots) {
    // Check if any periods overlap
    const hasOverlap = newSlot.periods.some((newPeriod) =>
      existingSlot.periods.includes(newPeriod)
    );

    if (hasOverlap) {
      return true;
    }
  }

  return false;
};

// Instance method to get period timings
timetableSchema.methods.getPeriodTimings = function (period) {
  return DEFAULT_PERIOD_TIMINGS[period] || null;
};

// Instance method to get all period timings for a time slot
timetableSchema.methods.getTimeSlotTimings = function (timeSlot) {
  const timings = [];
  for (let period of timeSlot.periods) {
    const timing = this.getPeriodTimings(period);
    if (timing) {
      timings.push({
        period: period,
        start: timing.start,
        end: timing.end,
      });
    }
  }
  return timings;
};

// Static method to find timetables by faculty
timetableSchema.statics.findByFaculty = function (facultyId) {
  return this.find({ facultyId: facultyId, isActive: true });
};

// Static method to find timetables by semester and academic year
timetableSchema.statics.findBySemesterAndYear = function (
  semester,
  academicYear
) {
  return this.find({
    semester: semester,
    academicYear: academicYear,
    isActive: true,
  });
};

// Static method to get default period timings
timetableSchema.statics.getDefaultPeriodTimings = function () {
  return DEFAULT_PERIOD_TIMINGS;
};

// Static method to find timetables by period
timetableSchema.statics.findByPeriod = function (period) {
  return this.find({
    "timeSlots.periods": period,
    isActive: true,
  });
};

const Timetable = mongoose.model("Timetable", timetableSchema);

export default Timetable;
export { DEFAULT_PERIOD_TIMINGS };
