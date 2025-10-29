import mongoose from "mongoose";
import ClassTimetable from "../Models/ClassTimetable.js";
import FacultyTimetable from "../Models/FacultyTimetable.js";
import Faculty from "../Models/Faculty.js";
import Timetable from "../Models/Timetable.js";
import { sendStudentNotification } from "../utils/emailService.js";
import { syncFacultyTimetableFromClass } from "../services/timetableSync.js";

const MORNING_PERIODS = [1, 2, 3];
const AFTERNOON_PERIODS = [4, 5, 6];

export const getSmartRecommendations = async (req, res) => {
  try {
    // Accept facultyId from authenticated user or from request body
    const facultyId =
      (req.faculty && req.faculty._id) || req.body.facultyId || null;
    const { day, section, academicYear, semester, classId } = req.body;

    console.log("[getSmartRecommendations] incoming", {
      facultyId,
      day,
      section,
      academicYear,
      semester,
      classId,
    });

    if (!day || !section || !classId) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required parameters: day, section and classId are required",
      });
    }

    // Get faculty's timetable. academicYear/semester are optional — try to find specific, otherwise the latest
    let facultyTimetable = null;
    if (facultyId) {
      console.log(
        "[getSmartRecommendations] searching for faculty timetable with facultyId:",
        facultyId
      );

      // Try semester-specific first
      if (academicYear && semester) {
        facultyTimetable = await Timetable.findOne({
          facultyId: String(facultyId), // Ensure string comparison
          academicYear,
          semester,
        });
        console.log(
          "[getSmartRecommendations] semester-specific search result:",
          facultyTimetable ? "found" : "not found"
        );
      }

      // Fallback: find the most recent timetable for this faculty
      if (!facultyTimetable) {
        facultyTimetable = await Timetable.findOne({
          facultyId: String(facultyId), // Ensure string comparison
        }).sort({
          updatedAt: -1,
        });
        console.log(
          "[getSmartRecommendations] latest timetable search result:",
          facultyTimetable ? "found" : "not found"
        );
      }

      // Debug: if still not found, list all timetables
      if (!facultyTimetable) {
        const allTimetables = await Timetable.find({}).limit(5);
        console.log(
          "[getSmartRecommendations] first 5 faculty timetables in db:",
          allTimetables.map((t) => ({
            facultyId: t.facultyId,
            academicYear: t.academicYear,
            semester: t.semester,
          }))
        );
      }
    }

    if (!facultyTimetable) {
      console.log(
        "[getSmartRecommendations] no facultyTimetable found for",
        facultyId
      );
      return res.status(404).json({
        success: false,
        message: "Faculty timetable not found for the provided facultyId",
      });
    }

    // Get target class timetable
    const classTimetable = await ClassTimetable.findById(classId);
    if (!classTimetable) {
      console.log(
        "[getSmartRecommendations] no classTimetable found for",
        classId
      );
      return res.status(404).json({
        success: false,
        message: "Class timetable not found",
      });
    }

    // Get current version of both timetables
    console.log("facultyTimetable", facultyTimetable);
    console.log("classTimetable", classTimetable);
    // Select latest 'updated' version for both timetables
    let facultyVersion = facultyTimetable.versions
      .filter((v) => v.label === "updated")
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    if (!facultyVersion || !facultyVersion.timeSlots?.length) {
      facultyVersion = facultyTimetable.versions
        .filter((v) => v.label === "default")
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    }
    let classVersion = classTimetable.versions
      .filter((v) => v.label === "updated")
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    if (!classVersion || !classVersion.timeSlots?.length) {
      classVersion = classTimetable.versions
        .filter((v) => v.label === "default")
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    }

    console.log(
      "[getSmartRecommendations] facultyVersion timeSlots length",
      facultyVersion?.timeSlots?.length,
      facultyVersion
    );
    console.log(
      "[getSmartRecommendations] classVersion timeSlots length",
      classVersion?.timeSlots?.length,
      classVersion
    );

    // Enhanced free slot detection with strict checks for faculty and subject
    const isFreeSlot = (slot) => {
      // Debug log to see what's coming in
      console.log("[isFreeSlot] checking slot:", {
        subject: slot.subject,
        facultyId: slot.facultyId,
        room: slot.room,
        isFree: slot.isFree,
      });

      // First check if we have the explicit isFree flag
      if (typeof slot.isFree === "boolean") {
        return slot.isFree;
      }

      // If subject and facultyId exist and are not leisure markers, slot is NOT free
      if (
        slot.subject &&
        slot.subject !== "FREE" &&
        slot.subject !== "LEISURE" &&
        slot.facultyId
      ) {
        return false;
      }

      // Check if it's explicitly marked as a leisure slot
      const isLeisureSubject =
        !slot.subject || slot.subject === "FREE" || slot.subject === "LEISURE";
      const noFaculty = !slot.facultyId || slot.facultyId === null;

      // A slot is ONLY considered free if it has no faculty AND is marked as leisure
      return isLeisureSubject && noFaculty;
    };

    const facultyLeisure = (facultyVersion?.timeSlots || [])
      .filter((slot) => slot.day === day)
      .flatMap((slot) =>
        (Array.isArray(slot.periods) ? slot.periods : [slot.period])
          .filter((p) =>
            section === "morning"
              ? [1, 2, 3].includes(p)
              : [4, 5, 6].includes(p)
          )
          .map((p) => ({
            day: slot.day,
            period: p,
            isFree: isFreeSlot(slot),
          }))
      )
      .filter((entry) => entry.isFree)
      .map(({ day, period }) => ({ day, period }));

    const classLeisure = (classVersion?.timeSlots || [])
      .filter((slot) => {
        // Only include slots for the requested day
        if (slot.day !== day) return false;

        // Debug logging
        console.log("[Class Slot Check]", {
          day: slot.day,
          subject: slot.subject,
          facultyId: slot.facultyId,
          isFree: slot.isFree,
        });

        return true;
      })
      .flatMap((slot) =>
        (Array.isArray(slot.periods) ? slot.periods : [slot.period])
          // Filter for morning/afternoon periods
          .filter((p) =>
            section === "morning"
              ? [1, 2, 3].includes(p)
              : [4, 5, 6].includes(p)
          )
          .map((p) => {
            const slotForPeriod = {
              day: slot.day,
              period: p,
              isFree: isFreeSlot(slot),
              // Include these for debugging
              _debug: {
                subject: slot.subject,
                facultyId: slot.facultyId,
              },
            };
            // Debug log the mapped slot
            console.log("[Class Mapped Slot]", slotForPeriod);
            return slotForPeriod;
          })
      )
      // Only include actually free slots
      .filter((entry) => {
        const isFree = entry.isFree;
        // Debug log filtered slots
        console.log("[Class Filtering Slot]", {
          day: entry.day,
          period: entry.period,
          isFree,
          debug: entry._debug,
        });
        return isFree;
      })
      .map(({ day, period }) => ({ day, period }));

    console.log("[getSmartRecommendations] facultyLeisure", facultyLeisure);
    console.log("[getSmartRecommendations] classLeisure", classLeisure);

    // Recommend only periods where both faculty and class are free and deduplicate
    const matchedSlots = facultyLeisure.filter((slot) =>
      classLeisure.some(
        (clsSlot) =>
          clsSlot.day === slot.day &&
          Number(clsSlot.period) === Number(slot.period)
      )
    );

    // Deduplicate matched slots
    const uniqueMatchedSlots = Array.from(
      new Set(matchedSlots.map((s) => `${s.day}-${s.period}`))
    ).map((key) => {
      const [day, period] = key.split("-");
      return { day, period: Number(period) };
    });

    console.log(
      "[getSmartRecommendations] uniqueMatchedSlots",
      uniqueMatchedSlots
    );

    res.status(200).json({
      success: true,
      data: uniqueMatchedSlots,
    });
  } catch (error) {
    console.error("Smart recommend error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const assignSmartRecommendedSlots = async (req, res) => {
  try {
    // Accept facultyId from authenticated user or from request body
    let facultyId = req.faculty?._id;

    // If not from auth, try body
    if (!facultyId && req.body.facultyId) {
      try {
        // Validate and convert string to ObjectId if from request body
        facultyId = new mongoose.Types.ObjectId(req.body.facultyId);
      } catch (error) {
        console.error(
          "[assignSmartRecommendedSlots] facultyId validation error",
          {
            providedId: req.body.facultyId,
            error: error.message,
          }
        );
        return res.status(400).json({
          success: false,
          message: `Invalid facultyId format. Provided: ${req.body.facultyId}`,
          details: error.message,
        });
      }
    }

    const { slots, academicYear, semester, classId } = req.body;

    // Check for missing facultyId after validation
    if (!facultyId) {
      console.error("[assignSmartRecommendedSlots] missing facultyId", {
        auth: !!req.faculty,
        bodyId: req.body.facultyId,
      });
      return res.status(400).json({
        success: false,
        message:
          "Missing facultyId. Ensure user is authenticated or facultyId is passed in body.",
      });
    }

    if (!slots || !slots.length || !classId) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: slots and classId are required",
      });
    }

    // Get class timetable
    const classTimetable = await ClassTimetable.findById(classId);
    if (!classTimetable) {
      return res.status(404).json({
        success: false,
        message: "Class timetable not found",
      });
    }

    // Create updated version
    const currentVersion =
      classTimetable.versions.find((v) => v.label === "current") ||
      classTimetable.versions.find((v) => v.label === "default");

    const updatedSlots = [...currentVersion.timeSlots];
    const updatedNotes = [];

    // Log facultyId for debugging
    console.log("[assignSmartRecommendedSlots] facultyId:", facultyId);
    // Update each slot
    for (const slot of slots) {
      const slotIndex = updatedSlots.findIndex(
        (s) =>
          s.day === slot.day &&
          Array.isArray(s.periods) &&
          s.periods.includes(Number(slot.period))
      );

      // Log slotIndex and slot before mutation
      console.log(
        "[assignSmartRecommendedSlots] slotIndex:",
        slotIndex,
        "slot:",
        updatedSlots[slotIndex]
      );

      if (slotIndex !== -1) {
        // Verify this is a valid slot for assignment
        const targetSlot = updatedSlots[slotIndex];
        if (!isFreeSlot(targetSlot)) {
          console.warn(
            `[assignSmartRecommendedSlots] Attempted to assign to non-free slot on ${slot.day} Period ${slot.period}`
          );
          continue;
        }

        // Prepare the updated slot data
        const updatedSlotData = {
          ...targetSlot,
          facultyId: new mongoose.Types.ObjectId(facultyId),
          isFree: false, // Mark as assigned
        };

        // Only update subject if we have a valid non-leisure one
        if (
          slot.subject &&
          slot.subject !== "LEISURE" &&
          slot.subject !== "FREE"
        ) {
          updatedSlotData.subject = slot.subject;
          updatedSlotData.room = slot.room || targetSlot.room;
        }

        updatedSlots[slotIndex] = updatedSlotData;
        updatedNotes.push(
          `Faculty took class on ${slot.day} Period ${slot.period} via Smart Recommend`
        );
      } else {
        console.warn(
          `[assignSmartRecommendedSlots] No matching slot found for day: ${slot.day}, period: ${slot.period}`
        );
      }
    }

    // Defensive: Normalize facultyId fields to never be string 'null'
    updatedSlots.forEach((slot) => {
      if (slot.facultyId === "null") slot.facultyId = null;
    });

    // Create new version
    const updatedVersion = {
      label: "updated",
      timeSlots: updatedSlots,
      updatedAt: new Date(),
      updatedBy: facultyId,
      note: updatedNotes.join("; "),
    };

    // Add new version and set as current
    classTimetable.versions.push(updatedVersion);
    classTimetable.currentVersionLabel = "updated";
    await classTimetable.save();
    // FacultyTimetable sync is paused as requested

    // Send notifications to students
    // Note: This should be moved to a background job in production
    try {
      // Get students for this class (implementation depends on your data model)
      // const students = await Student.find({ classId });
      // for (const student of students) {
      //   await sendStudentNotification(student.email, {
      //     subject: "Class Schedule Update",
      //     text: updatedNotes.join("\n")
      //   });
      // }
    } catch (emailError) {
      console.error("Failed to send notifications:", emailError);
      // Don't fail the request if notifications fail
    }

    res.status(200).json({
      success: true,
      message: "Successfully updated class schedule",
    });
  } catch (error) {
    console.error("Smart recommend assign error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
