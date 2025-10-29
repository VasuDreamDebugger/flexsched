import ClassSwap from "../Models/ClassSwap.js";
import Faculty from "../Models/Faculty.js";
import Timetable from "../Models/Timetable.js";
import {
  sendSwapRequestNotification,
  sendSwapResponseNotification,
} from "../utils/emailService.js";

//sendStudentNotification,
import mongoose from "mongoose";
import ClassTimetable from "../Models/ClassTimetable.js";
import FacultyTimetable from "../Models/FacultyTimetable.js";
import Student from "../Models/Student.js";
import {
  syncFacultyToClass,
  getClassTimetable as svcGetClassTimetable,
  syncFacultyTimetableFromClass,
} from "../services/timetableSync.js";

// Validates that a slot has the required day and period fields
const isValidSlot = (s) => {
  if (!s || typeof s !== "object") return false;
  return (
    typeof s.day === "string" &&
    typeof s.period === "number" &&
    !isNaN(s.period)
  );
};

// Safely attaches classTimetableId to valid slots
const attachTimetableId = (slots = [], id) => {
  if (!id) {
    console.error("[attachTimetableId] Invalid or missing timetable ID");
    return [];
  }

  if (!Array.isArray(slots)) {
    console.error("[attachTimetableId] Invalid slots array", typeof slots);
    return [];
  }

  return slots
    .filter(isValidSlot)
    .map((s) => ({ ...s, classTimetableId: String(id) }));
};

// Dev helper: resolve provided classTimetable ids and return document presence
export const debugResolveClassTimetables = async (req, res) => {
  try {
    const { yourClassId, requestedClassId } = req.body || {};

    const normalizeId = (id) => {
      if (!id) return null;
      if (typeof id === "object") {
        if (id._id) return String(id._id);
        if (id.id) return String(id.id);
      }
      return String(id);
    };

    const yId = normalizeId(yourClassId);
    const rId = normalizeId(requestedClassId);

    const findSafe = async (id) => {
      if (!id) return { id: null, validObjectId: false, found: false };
      const valid = mongoose.Types.ObjectId.isValid(id);
      let doc = null;
      if (valid) {
        doc = await ClassTimetable.findById(id).lean();
      }
      return { id, validObjectId: valid, found: !!doc, doc };
    };

    const y = await findSafe(yId);
    const r = await findSafe(rId);

    return res
      .status(200)
      .json({ success: true, data: { your: y, requested: r } });
  } catch (err) {
    console.error("debugResolveClassTimetables error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Create a new class swap request
export const createSwapRequest = async (req, res) => {
  try {
    // Log full incoming payload for debugging (safe in dev only)
    console.log(
      "[swap:create] incoming payload:",
      JSON.stringify(req.body || {})
    );

    // Migration-safe payload parsing: support new and old formats
    let targetFacultyId;
    let requesterClass;
    let targetClass;
    const reason = req.body?.reason;
    const swapDate = req.body?.swapDate;

    const isNewFormat = !!(req.body?.yourClassId && req.body?.requestedClassId);
    if (isNewFormat) {
      const {
        yourClassId,
        requestedClassId,
        yourDay,
        yourPeriod,
        requestedDay,
        requestedPeriod,
      } = req.body;

      if (!yourClassId || !requestedClassId) {
        console.warn("[swap:create] missing class ids", {
          yourClassId,
          requestedClassId,
        });
        return res.status(400).json({
          success: false,
          message: "yourClassId and requestedClassId are required",
          details: { yourClassId, requestedClassId, payload: req.body },
        });
      }

      // Normalize period inputs: accept number or array (periods)
      const normalizePeriodInput = (p) => {
        if (typeof p === "number") return p;
        if (Array.isArray(p) && p.length > 0) return Number(p[0]);
        return undefined;
      };

      const yourPeriodNorm = normalizePeriodInput(
        yourPeriod ??
          req.body?.yourPeriods ??
          req.body?.requesterClass?.periods ??
          req.body?.requesterClass?.period
      );
      const requestedPeriodNorm = normalizePeriodInput(
        requestedPeriod ??
          req.body?.requestedPeriods ??
          req.body?.targetClass?.periods ??
          req.body?.targetClass?.period
      );

      if (
        !yourDay ||
        typeof yourPeriodNorm === "undefined" ||
        !requestedDay ||
        typeof requestedPeriodNorm === "undefined"
      ) {
        console.warn("[swap:create] missing day/period fields", {
          yourDay,
          yourPeriod,
          yourPeriodNorm,
          requestedDay,
          requestedPeriod,
          requestedPeriodNorm,
        });
        return res.status(400).json({
          success: false,
          message:
            "yourDay/yourPeriod/requestedDay/requestedPeriod are required in new format",
          details: {
            yourDay,
            yourPeriod: yourPeriodNorm,
            requestedDay,
            requestedPeriod: requestedPeriodNorm,
            payload: req.body,
          },
        });
      }

      // Handle case where both classes are from the same ClassTimetable (same classTimetableId)
      console.log("[swap:create] yourClassId:", yourClassId);
      console.log("[swap:create] requestedClassId:", requestedClassId);
      console.log("[swap:create] typeof yourClassId:", typeof yourClassId);

      // Normalize to strings and validate ObjectId format before querying
      const normalizeId = (id) => {
        if (!id) return null;
        // If id is an object with _id or id, extract string
        if (typeof id === "object") {
          if (id._id) return String(id._id);
          if (id.id) return String(id.id);
        }
        return String(id);
      };

      const yId = normalizeId(yourClassId);
      const rId = normalizeId(requestedClassId);

      let yourClassDoc = null;
      let requestedClassDoc = null;

      const safeFindById = async (id) => {
        if (!id) return null;
        // quick ObjectId sanity check
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        try {
          return await ClassTimetable.findById(id);
        } catch (err) {
          console.warn(
            "[swap:create] ClassTimetable.findById cast error for id:",
            id,
            err
          );
          return null;
        }
      };

      if (yId && rId && yId === rId) {
        yourClassDoc = await safeFindById(yId);
        requestedClassDoc = yourClassDoc;
      } else {
        yourClassDoc = await safeFindById(yId);
        requestedClassDoc = await safeFindById(rId);
      }

      console.log("[swap:create] yourClassDoc found:", !!yourClassDoc);

      //  console.log(yourClassDoc);
      console.log(
        "[swap:create] requestedClassDoc found:",
        !!requestedClassDoc
      );

      if (!yourClassDoc || !requestedClassDoc) {
        console.warn("[swap:create] Initial ClassTimetable resolution failed", {
          yId,
          rId,
        });

        // Fallback attempts: try resolving via legacy Timetable or FacultyTimetable docs
        const tryResolveFallback = async (id, day, period) => {
          if (!id) return null;
          // Try Timetable (legacy) by id
          try {
            const legacy = await Timetable.findById(id).lean();
            if (legacy && legacy.classDetails && legacy.classDetails.branch) {
              const branch = legacy.classDetails.branch || legacy.branch;
              const year =
                legacy.classDetails.year || legacy.semester || legacy.year;
              const section = legacy.classDetails.section || legacy.section;
              if (branch && year && section) {
                const data = await svcGetClassTimetable(branch, year, section);
                if (data?.meta) return data.meta;
              }
            }
          } catch (e) {
            console.warn(
              "[swap:create] fallback Timetable.findById failed for",
              id,
              e.message || e
            );
          }

          // Try FacultyTimetable by id: attempt to derive a class identity from its versioned slots
          try {
            const ft = await FacultyTimetable.findById(id).lean();
            if (ft && ft.versions && Array.isArray(ft.versions)) {
              const v =
                ft.versions.find(
                  (x) => x.label === (ft.currentVersionLabel || "default")
                ) || ft.versions[0];
              const slot = (v?.timeSlots || [])[0];
              if (slot && slot.branch && slot.year && slot.section) {
                const data = await svcGetClassTimetable(
                  slot.branch,
                  slot.year,
                  slot.section
                );
                if (data?.meta) return data.meta;
              }
            }
          } catch (e) {
            console.warn(
              "[swap:create] fallback FacultyTimetable.findById failed for",
              id,
              e.message || e
            );
          }

          return null;
        };

        // Attempt fallback resolution for each missing doc
        if (!yourClassDoc) {
          yourClassDoc = await tryResolveFallback(yId, yourDay, yourPeriod);
        }
        if (!requestedClassDoc) {
          requestedClassDoc = await tryResolveFallback(
            rId,
            requestedDay,
            requestedPeriod
          );
        }

        console.log(
          "[swap:create] after fallback yourClassDoc found:",
          !!yourClassDoc
        );
        console.log(
          "[swap:create] after fallback requestedClassDoc found:",
          !!requestedClassDoc
        );

        if (!yourClassDoc || !requestedClassDoc) {
          // Provide actionable debug info in response for development (non-production)
          return res.status(400).json({
            success: false,
            message:
              "Invalid classTimetableId(s). Could not resolve ClassTimetable documents even after fallback.",
            details: {
              yourClassId: yId,
              requestedClassId: rId,
            },
          });
        }
      }
      // build requesterClass from yourClassDoc (prefer updated version if present)
      let yourVersion = (yourClassDoc.versions || []).find(
        (v) => v.label === "updated"
      );

      if (!yourVersion?.timeSlots?.length) {
        yourVersion = (yourClassDoc.versions || []).find(
          (v) => v.label === "default"
        );
      }

      // console.log("your version", yourVersion);
      console.log("Normalized search:", {
        day: yourDay.toLowerCase().trim(),
        period: Number(yourPeriod),
      });

      // console.log(
      //   "Normalized slots:",
      //   yourVersion.timeSlots.map((s) => ({
      //     day: s.day.toLowerCase().trim(),
      //     period: Number(s.period),
      //   }))
      // );

      console.log("[swap:create] incoming payload:", req.body);
      console.log("Raw inputs:", {
        yourDay,
        yourPeriod,
        typeofDay: typeof yourDay,
        typeofPeriod: typeof yourPeriod,
      });

      const reqSlot = yourVersion?.timeSlots?.find(
        (s) =>
          s.day.toLowerCase().trim() === yourDay.toLowerCase().trim() &&
          s.period === Number(yourPeriod)
      );

      if (reqSlot === null || typeof reqSlot === "undefined") {
        return res.status(400).json({
          success: false,
          message:
            "No matching slot found in your class timetable for provided day/period",
        });
      }

      let requestedVersion = (requestedClassDoc.versions || []).find(
        (v) => v.label === "updated"
      );

      if (!requestedVersion?.timeSlots?.length) {
        requestedVersion = (requestedClassDoc.versions || []).find(
          (v) => v.label === "default"
        );
      }

      const tgtSlot = requestedVersion?.timeSlots?.find(
        (s) => s.day === requestedDay && s.period === Number(requestedPeriod)
      );
      if (!tgtSlot) {
        return res.status(400).json({
          success: false,
          message:
            "No v matching slot found in requested class timetable for provided day/period",
        });
      }
      // Compose legacy-shaped objects to reuse downstream validation and swap flow
      requesterClass = {
        day: yourDay,
        periods: [Number(yourPeriod)],
        subject: reqSlot.subject,
        branch: yourClassDoc.branch,
        semester: yourClassDoc.year,
        section: yourClassDoc.section,
        room: reqSlot.room,
        isLab: !!reqSlot.isLab,
        classTimetableId: yourClassDoc._id,
      };
      targetClass = {
        day: requestedDay,
        periods: [Number(requestedPeriod)],
        subject: tgtSlot.subject,
        branch: requestedClassDoc.branch,
        semester: requestedClassDoc.year,
        section: requestedClassDoc.section,
        room: tgtSlot.room,
        isLab: !!tgtSlot.isLab,
        classTimetableId: requestedClassDoc._id,
      };
      // Prefer facultyId embedded in class-centric slot, else derive from FacultyTimetable
      targetFacultyId = tgtSlot?.facultyId;
      if (!targetFacultyId) {
        // Search faculty timetables for the matching slot in their current version
        const fts = await FacultyTimetable.find({
          academicYear: requestedClassDoc.academicYear,
          semester: requestedClassDoc.semester,
        });

        for (const ft of fts) {
          const currentLabel = ft.currentVersionLabel || "default";
          const version =
            (ft.versions || []).find((v) => v.label === currentLabel) ||
            (ft.versions || [])[0];
          if (!version || !version.timeSlots) continue;

          const matched = version.timeSlots.find(
            (s) =>
              s.day === requestedDay &&
              Number(s.period) === Number(requestedPeriod) &&
              s.branch === requestedClassDoc.branch &&
              s.year === requestedClassDoc.year &&
              s.section === requestedClassDoc.section
          );
          if (matched) {
            targetFacultyId = ft.facultyId;
            break;
          }
        }
      }
    } else {
      // Old format
      targetFacultyId = req.body?.targetFacultyId;
      requesterClass = req.body?.requesterClass;
      targetClass = req.body?.targetClass;
    }

    const requesterId = req.faculty._id;

    // Validate target faculty exists
    if (!reason || !swapDate) {
      return res
        .status(400)
        .json({ success: false, message: "reason and swapDate are required" });
    }

    const targetFaculty = targetFacultyId
      ? await Faculty.findById(targetFacultyId)
      : null;
    if (!targetFaculty) {
      return res.status(404).json({
        success: false,
        message:
          "Target faculty not found for requested slot. Ensure class timetable slots are linked to faculty or FacultyTimetable exists for that slot.",
      });
    }

    // Check if faculty is trying to swap with themselves (compare as strings)
    if (String(requesterId) === String(targetFacultyId)) {
      return res.status(400).json({
        success: false,
        message: "Cannot request swap with yourself",
      });
    }

    // Check if there's already a pending swap request between these faculties for the same date
    const existingSwap = await ClassSwap.findOne({
      $or: [
        { requesterId, targetFacultyId },
        { requesterId: targetFacultyId, targetFacultyId: requesterId },
      ],
      swapDate: new Date(swapDate),
      status: "pending",
    });

    if (existingSwap) {
      return res.status(400).json({
        success: false,
        message: "There is already a pending swap request for this date",
      });
    }

    // Create new swap request
    const swapRequest = new ClassSwap({
      requesterId,
      targetFacultyId,
      requesterClass,
      targetClass,
      reason,
      swapDate: new Date(swapDate),
    });

    await swapRequest.save();

    // Add notification for target faculty
    swapRequest.notifications.push({
      sentTo: targetFacultyId,
      notificationType: "swap_request",
      message: `New class swap request from ${req.faculty.name}`,
      createdAt: new Date(),
    });
    await swapRequest.save();

    // Populate the request with faculty details
    await swapRequest.populate(
      "requesterId targetFacultyId",
      "name email employeeId"
    );

    // Send email notification to target faculty
    try {
      await sendSwapRequestNotification(
        targetFaculty.email,
        req.faculty.name,
        targetFaculty.name,
        {
          swapDate: swapRequest.swapDate,
          reason: swapRequest.reason,
          requesterClass: requesterClass,
          targetClass: targetClass,
        }
      );
    } catch (emailError) {
      console.error("Email notification failed:", emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: "Swap request created successfully",
      data: { swapRequest },
    });
  } catch (error) {
    console.error(
      "Create swap request error:",
      error && error.stack ? error.stack : error
    );

    if (error && error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // In development return error message to aid debugging
    res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : error && error.message
          ? error.message
          : "Internal server error",
      error:
        process.env.NODE_ENV === "production"
          ? {}
          : error && error.stack
          ? error.stack
          : null,
    });
  }
};

// Get all swap requests for a faculty
export const getSwapRequests = async (req, res) => {
  try {
    const facultyId = req.faculty._id;
    const { status, type } = req.query;

    let query = {
      $or: [{ requesterId: facultyId }, { targetFacultyId: facultyId }],
    };

    // Filter by status
    if (status && status !== "all") {
      query.status = status;
    }

    // Filter by type (sent/received)
    if (type === "sent") {
      query = { requesterId: facultyId, ...query };
    } else if (type === "received") {
      query = { targetFacultyId: facultyId, ...query };
    }

    const swapRequests = await ClassSwap.find(query)
      .populate(
        "requesterId targetFacultyId",
        "name email employeeId department"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { swapRequests },
    });
  } catch (error) {
    console.error("Get swap requests error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get a specific swap request
export const getSwapRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const facultyId = req.faculty._id;

    const swapRequest = await ClassSwap.findOne({
      _id: id,
      $or: [{ requesterId: facultyId }, { targetFacultyId: facultyId }],
    }).populate(
      "requesterId targetFacultyId",
      "name email employeeId department branch subjects"
    );

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: "Swap request not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { swapRequest },
    });
  } catch (error) {
    console.error("Get swap request error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Accept a swap request
export const acceptSwapRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const facultyId = req.faculty._id;

    const swapRequest = await ClassSwap.findOne({
      _id: id,
      targetFacultyId: facultyId,
      status: "pending",
    });

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: "Swap request not found or already processed",
      });
    }

    // Accept the swap
    await swapRequest.accept(message || "Swap request accepted");

    // Add notification for requester
    swapRequest.notifications.push({
      sentTo: swapRequest.requesterId,
      notificationType: "swap_accepted",
      message: `Your swap request has been accepted by ${req.faculty.name}`,
      createdAt: new Date(),
    });
    await swapRequest.save();

    // Populate faculty details
    await swapRequest.populate(
      "requesterId targetFacultyId",
      "name email employeeId"
    );

    // Send email notification to requester
    try {
      await sendSwapResponseNotification(
        swapRequest.requesterId.email,
        req.faculty.name,
        "accepted",
        {
          responseMessage: message || "Swap request accepted",
          requesterClass: swapRequest.requesterClass,
          targetClass: swapRequest.targetClass,
        }
      );
    } catch (emailError) {
      console.error("Email notification failed:", emailError);
    }

    // Update timetables when swap is accepted: swap matching timeSlots between both faculties
    // ClassTimetable update handled later in a single, consolidated block.

    // Notify students for the target class if emails are available
    // try {
    //   const branch = swapRequest.targetClass.branch;
    //   const section = swapRequest.targetClass.section;
    //   // Convert semester/year label to number if needed (supports formats like "3rd Year")
    //   const yearNumber =
    //     typeof swapRequest.targetClass.semester === "number"
    //       ? swapRequest.targetClass.semester
    //       : parseInt(
    //           String(swapRequest.targetClass.semester).match(/\d+/)?.[0] || "0",
    //           10
    //         ) || 0;

    //   const students = await Student.find({
    //     branch,
    //     section,
    //     year: yearNumber,
    //     isActive: true,
    //   }).select("email");
    //   const studentEmails = students.map((s) => s.email).filter(Boolean);
    //   if (studentEmails.length > 0) {
    //     await sendStudentNotification(
    //       studentEmails,
    //       {
    //         swapDate: swapRequest.swapDate,
    //         requesterClass: swapRequest.requesterClass,
    //         targetClass: swapRequest.targetClass,
    //       },
    //       "swap"
    //     );
    //   }
    // } catch (studErr) {
    //   console.error("Student notification failed:", studErr);
    // }

    // Update ClassTimetable documents with new version after swap
    try {
      // console.log("swapRequest", swapRequest);
      const yourClassDoc = await ClassTimetable.findById(
        swapRequest.requesterClass.classTimetableId
      );
      const requestedClassDoc = await ClassTimetable.findById(
        swapRequest.targetClass.classTimetableId
      );

      if (!yourClassDoc || !requestedClassDoc) {
        console.warn(
          "[swap:create] One or both ClassTimetable documents not found"
        );
        return res.status(404).json({
          success: false,
          message: "ClassTimetable document(s) not found during swap update.",
        });
      }

      // Get faculty IDs for sync
      const requesterFacultyId = swapRequest.requesterId;
      const targetFacultyId = swapRequest.targetFacultyId;
      const requiredFields = [
        "period",
        "day",
        "subject",
        "room",
        "facultyId",
        "isLab",
        "isTheory",
      ];

      const sanitizeSlotFields = (slot, fallback = {}) => {
        const defaults = {
          period: 1,
          day: "Monday",
          subject: "Unknown",
          room: "Unknown",
          facultyId: null,
          isLab: false,
          isTheory: true,
        };
        requiredFields.forEach((field) => {
          if (typeof slot[field] === "undefined") {
            slot[field] = fallback[field] ?? defaults[field];
            console.warn(
              `[swap:update] Slot missing ${field}, set default`,
              slot
            );
          }
        });
      };

      const updateClassVersion = async (
        classDoc,
        swapDay,
        swapPeriod,
        otherDay,
        otherPeriod,
        updatedBy,
        swapReference
      ) => {
        if (!classDoc) return false;

        // Always operate on the latest 'updated' version if present, else copy from 'default'
        let currentVersion = (classDoc.versions || []).find(
          (v) => v.label === "updated"
        );
        if (!currentVersion) {
          // If no updated version, copy from default
          const defaultVersion = (classDoc.versions || []).find(
            (v) => v.label === "default"
          );
          if (!defaultVersion) {
            console.warn(
              `[swap:update] No default or updated version found for ${classDoc._id}`
            );
            return false;
          }
          // Create updated version as a copy of default
          currentVersion = {
            label: "updated",
            timeSlots: JSON.parse(
              JSON.stringify(defaultVersion.timeSlots || [])
            ),
            updatedAt: new Date(),
            updatedBy,
            swapReference,
          };
          classDoc.versions = [...(classDoc.versions || []), currentVersion];
        }

        // Normalize swapPeriod/otherPeriod (support both number and array stored as 'periods')
        const normalizePeriod = (p) => {
          if (Array.isArray(p)) return p[0];
          return p;
        };
        const sPeriod = normalizePeriod(swapPeriod);
        const oPeriod = normalizePeriod(otherPeriod);

        // Work from the latest updated version's slots
        const updatedSlots = JSON.parse(
          JSON.stringify(currentVersion.timeSlots || [])
        );
        updatedSlots.forEach((slot, i) =>
          sanitizeSlotFields(slot, currentVersion.timeSlots[i])
        );

        const swapIdx = updatedSlots.findIndex(
          (s) => s.day === swapDay && Number(s.period) === Number(sPeriod)
        );
        const otherIdx = updatedSlots.findIndex(
          (s) => s.day === otherDay && Number(s.period) === Number(oPeriod)
        );

        console.log(
          `[swap:update] class ${classDoc._id} currentVersion=${
            currentVersion.label
          } slots=${
            (currentVersion.timeSlots || []).length
          } swapIdx=${swapIdx} otherIdx=${otherIdx}`
        );

        if (swapIdx === -1 || otherIdx === -1) {
          console.warn("[swap:update] Could not locate matching slots", {
            swapDay,
            swapPeriod: sPeriod,
            otherDay,
            otherPeriod: oPeriod,
          });
          return false;
        }

        const isValidSlot = (slot) =>
          slot && requiredFields.every((f) => typeof slot[f] !== "undefined");
        if (
          !isValidSlot(updatedSlots[swapIdx]) ||
          !isValidSlot(updatedSlots[otherIdx])
        ) {
          console.warn(
            "[swap:update] One or both slots are invalid before swap",
            {
              swapSlot: updatedSlots[swapIdx],
              otherSlot: updatedSlots[otherIdx],
            }
          );
          return false;
        }

        // Swap the entire slot objects (deep-cloned) so we preserve all metadata
        // const tempSlot = JSON.parse(JSON.stringify(updatedSlots[swapIdx]));
        // updatedSlots[swapIdx] = JSON.parse(
        //   JSON.stringify(updatedSlots[otherIdx])
        // );
        // updatedSlots[otherIdx] = tempSlot;

        const fieldsToSwap = [
          "subject",
          "facultyId",
          "room",
          "isLab",
          "isTheory",
        ];

        fieldsToSwap.forEach((field) => {
          const temp = updatedSlots[swapIdx][field];
          updatedSlots[swapIdx][field] = updatedSlots[otherIdx][field];
          updatedSlots[otherIdx][field] = temp;
        });

        // updatedSlots.forEach((slot, i) =>
        //   sanitizeSlotFields(slot, currentVersion.timeSlots[i])
        // );

        const hasMissingFields = updatedSlots.some((slot) =>
          requiredFields.some((f) => typeof slot[f] === "undefined")
        );
        console.log("[swap:update] swapped slots preview", {
          swapSlot: updatedSlots[swapIdx],
          otherSlot: updatedSlots[otherIdx],
        });
        console.log("updated slots :", updatedSlots);
        if (hasMissingFields) {
          console.error("[swap:update] Aborting save due to missing fields");
          return false;
        }

        // At this point swap succeeded in-memory. Create or update the 'updated' version
        let updatedVersion = (classDoc.versions || []).find(
          (v) => v.label === "updated"
        );
        if (!updatedVersion) {
          updatedVersion = {
            label: "updated",
            timeSlots: [],
            updatedAt: new Date(),
            updatedBy,
            swapReference,
          };
          // Deep clone versions array and push new version
          classDoc.versions = [...(classDoc.versions || []), updatedVersion];
        }

        // Now write the new slots into the updated version
        // Deep clone slots, validate them, and attach the correct timetable ID
        const validatedSlots = attachTimetableId(updatedSlots, classDoc._id);
        if (validatedSlots.length !== updatedSlots.length) {
          console.warn(
            "[swap:update] Some slots were invalid and filtered out",
            {
              original: updatedSlots.length,
              valid: validatedSlots.length,
              filtered: updatedSlots.length - validatedSlots.length,
            }
          );
        }

        updatedVersion.timeSlots = validatedSlots;
        updatedVersion.updatedAt = new Date();
        updatedVersion.updatedBy = updatedBy;
        updatedVersion.swapReference = swapReference;
        updatedVersion.note = `Swapped ${swapDay} P${sPeriod} with ${otherDay} P${oPeriod}`;
        classDoc.currentVersionLabel = "updated";

        console.log(
          `[swap:update] about to save updatedVersion for class ${classDoc._id} slots=${updatedSlots.length}`
        );
        try {
          // Force Mongoose to detect nested changes
          classDoc.markModified("versions");

          // Save and verify the update
          await classDoc.save();

          // Read back and verify slots were saved
          const saved = await ClassTimetable.findById(classDoc._id);
          const savedVersion = saved.versions.find(
            (v) => v.label === "updated"
          );
          if (
            !savedVersion ||
            !savedVersion.timeSlots ||
            savedVersion.timeSlots.length !== updatedSlots.length
          ) {
            console.error(
              "[swap:update] Verification failed - saved version missing or has wrong number of slots",
              {
                hasVersion: !!savedVersion,
                savedSlots: savedVersion?.timeSlots?.length,
                expectedSlots: updatedSlots.length,
              }
            );
            return false;
          }
          console.log(`[swap:update] Verified save for class ${classDoc._id}`, {
            slots: savedVersion.timeSlots.length,
          });
          try {
            // Sync this class timetable to faculty timetables so faculty docs remain consistent
            await syncFacultyTimetableFromClass(saved, "updated");
            console.log(
              `[swap:update] Synced class ${classDoc._id} to faculty timetables`
            );
            // Debug: print updated faculty timetable for all affected faculties
            const affectedFacultyIds = Array.from(
              new Set(
                saved.versions
                  .find((v) => v.label === "updated")
                  ?.timeSlots.map((s) => s.facultyId)
                  .filter(Boolean)
              )
            );
            for (const fid of affectedFacultyIds) {
              const ft = await FacultyTimetable.findOne({
                facultyId: fid,
                academicYear: saved.academicYear,
                semester: saved.semester,
              });
              if (ft) {
                console.log(
                  `[swap:update] FacultyTimetable for faculty ${fid} (${saved.academicYear}/${saved.semester}):`,
                  ft.versions.find((v) => v.label === ft.currentVersionLabel)
                    ?.timeSlots
                );
              } else {
                console.warn(
                  `[swap:update] No FacultyTimetable found for faculty ${fid} (${saved.academicYear}/${saved.semester})`
                );
              }
            }
          } catch (syncErr) {
            console.warn(
              `[swap:update] Sync to faculty timetables failed for class ${classDoc._id}:`,
              syncErr.message || syncErr
            );
          }
          return true;
        } catch (saveErr) {
          console.error("[swap:update] Save failed:", saveErr);
          return false;
        }
      };

      // Detect intra-class swap
      if (yourClassDoc._id.equals(requestedClassDoc._id)) {
        const success = await updateClassVersion(
          yourClassDoc,
          swapRequest.requesterClass.day,
          swapRequest.requesterClass.periods &&
            swapRequest.requesterClass.periods[0],
          swapRequest.targetClass.day,
          swapRequest.targetClass.periods && swapRequest.targetClass.periods[0],
          swapRequest.requesterId,
          swapRequest._id
        );
        if (success) {
          console.log(
            "✅ ClassTimetable updated with new version for intra-class swap."
          );
        } else {
          console.warn("⚠️ Intra-class swap failed.");
        }
      } else {
        const results = await Promise.all([
          updateClassVersion(
            yourClassDoc,
            swapRequest.requesterClass.day,
            swapRequest.requesterClass.periods,
            swapRequest.targetClass.day,
            swapRequest.targetClass.periods,
            swapRequest.requesterId,
            swapRequest._id
          ),
          updateClassVersion(
            requestedClassDoc,
            swapRequest.targetClass.day,
            swapRequest.targetClass.periods,
            swapRequest.requesterClass.day,
            swapRequest.requesterClass.periods,
            swapRequest.targetFacultyId,
            swapRequest._id
          ),
        ]);

        if (results.every((r) => r)) {
          console.log(
            "✅ Both ClassTimetable documents updated with new version for swap."
          );

          // Sync faculty timetables after successful class timetable update
          try {
            // Sync requester faculty timetable
            await syncFacultyToClass(requesterFacultyId, yourClassDoc._id);

            // Sync target faculty timetable
            await syncFacultyToClass(targetFacultyId, requestedClassDoc._id);

            console.log("✅ Faculty timetables synced successfully");
          } catch (syncErr) {
            console.error("❌ Error syncing faculty timetables:", syncErr);
          }
        } else {
          console.warn("⚠️ One or both ClassTimetable updates failed.");
        }
      }
    } catch (classTTerr) {
      console.error("❌ ClassTimetable swap operation failed:", classTTerr);
    }

    res.status(200).json({
      success: true,
      message: "Swap request accepted successfully",
      data: { swapRequest },
    });
  } catch (error) {
    console.error("Accept swap request error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Reject a swap request
export const rejectSwapRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const facultyId = req.faculty._id;

    const swapRequest = await ClassSwap.findOne({
      _id: id,
      targetFacultyId: facultyId,
      status: "pending",
    });

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: "Swap request not found or already processed",
      });
    }

    // Reject the swap
    await swapRequest.reject(message || "Swap request rejected");

    // Add notification for requester
    swapRequest.notifications.push({
      sentTo: swapRequest.requesterId,
      notificationType: "swap_rejected",
      message: `Your swap request has been rejected by ${req.faculty.name}`,
      createdAt: new Date(),
    });
    await swapRequest.save();

    // Populate faculty details
    await swapRequest.populate(
      "requesterId targetFacultyId",
      "name email employeeId"
    );

    // Send email notification to requester
    try {
      await sendSwapResponseNotification(
        swapRequest.requesterId.email,
        req.faculty.name,
        "rejected",
        {
          responseMessage: message || "Swap request rejected",
          requesterClass: swapRequest.requesterClass,
          targetClass: swapRequest.targetClass,
        }
      );
    } catch (emailError) {
      console.error("Email notification failed:", emailError);
    }

    res.status(200).json({
      success: true,
      message: "Swap request rejected",
      data: { swapRequest },
    });
  } catch (error) {
    console.error("Reject swap request error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Cancel a swap request (only requester can cancel)
export const cancelSwapRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const facultyId = req.faculty._id;

    const swapRequest = await ClassSwap.findOne({
      _id: id,
      requesterId: facultyId,
      status: "pending",
    });

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: "Swap request not found or cannot be cancelled",
      });
    }

    // Cancel the swap
    await swapRequest.cancel();

    // Add notification for target faculty
    swapRequest.notifications.push({
      sentTo: swapRequest.targetFacultyId,
      notificationType: "swap_cancelled",
      message: `Swap request has been cancelled by ${req.faculty.name}`,
      createdAt: new Date(),
    });
    await swapRequest.save();

    await swapRequest.populate(
      "requesterId targetFacultyId",
      "name email employeeId"
    );

    res.status(200).json({
      success: true,
      message: "Swap request cancelled successfully",
      data: { swapRequest },
    });
  } catch (error) {
    console.error("Cancel swap request error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Complete a swap request
export const completeSwapRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const facultyId = req.faculty._id;

    const swapRequest = await ClassSwap.findOne({
      _id: id,
      $or: [{ requesterId: facultyId }, { targetFacultyId: facultyId }],
      status: "accepted",
    });

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: "Swap request not found or not accepted",
      });
    }

    // Complete the swap
    await swapRequest.complete();

    // Add notification for both faculties
    const otherFacultyId =
      swapRequest.requesterId.toString() === facultyId.toString()
        ? swapRequest.targetFacultyId
        : swapRequest.requesterId;

    swapRequest.notifications.push({
      sentTo: otherFacultyId,
      notificationType: "swap_completed",
      message: `Swap request has been marked as completed`,
      createdAt: new Date(),
    });
    await swapRequest.save();

    await swapRequest.populate(
      "requesterId targetFacultyId",
      "name email employeeId"
    );

    res.status(200).json({
      success: true,
      message: "Swap request completed successfully",
      data: { swapRequest },
    });
  } catch (error) {
    console.error("Complete swap request error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get available faculties for swap
export const getAvailableFaculties = async (req, res) => {
  try {
    const { day, periods, branch, semester } = req.query;
    const currentFacultyId = req.faculty._id;

    // Find faculties who have classes at the same time but different subjects
    const faculties = await Faculty.find({
      _id: { $ne: currentFacultyId },
      branch: branch,
      isActive: true,
    }).select("name email employeeId department subjects");

    // Filter faculties who might be available for swap
    const availableFaculties = faculties.filter(
      (faculty) => faculty.subjects && faculty.subjects.length > 0
    );

    res.status(200).json({
      success: true,
      data: { faculties: availableFaculties },
    });
  } catch (error) {
    console.error("Get available faculties error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
