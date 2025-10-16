import ClassSwap from "../Models/ClassSwap.js";
import Faculty from "../Models/Faculty.js";
import Timetable from "../Models/Timetable.js";
// import {
//   sendSwapRequestNotification,
//   sendSwapResponseNotification,
//   sendStudentNotification,
// } from "../utils/emailService.js";
import mongoose from "mongoose";
import ClassTimetable from "../Models/ClassTimetable.js";
import FacultyTimetable from "../Models/FacultyTimetable.js";
import Student from "../Models/Student.js";
import {
  syncFacultyToClass,
  getClassTimetable as svcGetClassTimetable,
} from "../services/timetableSync.js";

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
    console.log("[swap:create] incoming", {
      keys: Object.keys(req.body || {}),
      hasRequesterClass: !!req.body?.requesterClass,
      hasTargetClass: !!req.body?.targetClass,
    });

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
        return res.status(400).json({
          success: false,
          message: "yourClassId and requestedClassId are required",
        });
      }
      if (!yourDay || !yourPeriod || !requestedDay || !requestedPeriod) {
        return res.status(400).json({
          success: false,
          message:
            "yourDay/yourPeriod/requestedDay/requestedPeriod are required in new format",
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

      console.log(yourClassDoc);
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
      const yourVersion =
        (yourClassDoc.versions || []).find((v) => v.label === "updated") ||
        (yourClassDoc.versions || []).find((v) => v.label === "default");
      const reqSlot = yourVersion?.timeSlots?.find(
        (s) => s.day === yourDay && s.period === Number(yourPeriod)
      );
      if (!reqSlot) {
        return res.status(400).json({
          success: false,
          message:
            "No matching slot found in your class timetable for provided day/period",
        });
      }
      const requestedVersion =
        (requestedClassDoc.versions || []).find((v) => v.label === "updated") ||
        (requestedClassDoc.versions || []).find((v) => v.label === "default");
      const tgtSlot = requestedVersion?.timeSlots?.find(
        (s) => s.day === requestedDay && s.period === Number(requestedPeriod)
      );
      if (!tgtSlot) {
        return res.status(400).json({
          success: false,
          message:
            "No matching slot found in requested class timetable for provided day/period",
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

    // Check if faculty is trying to swap with themselves
    if (requesterId.toString() === targetFacultyId) {
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
      // await sendSwapRequestNotification(
      //   targetFaculty.email,
      //   req.faculty.name,
      //   targetFaculty.name,
      //   {
      //     swapDate: swapRequest.swapDate,
      //     reason: swapRequest.reason,
      //     requesterClass: requesterClass,
      //     targetClass: targetClass,
      //   }
      // );
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
    console.error("Create swap request error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
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
    // try {
    //   await sendSwapResponseNotification(
    //     swapRequest.requesterId.email,
    //     req.faculty.name,
    //     "accepted",
    //     {
    //       responseMessage: message || "Swap request accepted",
    //       requesterClass: swapRequest.requesterClass,
    //       targetClass: swapRequest.targetClass,
    //     }
    //   );
    // } catch (emailError) {
    //   console.error("Email notification failed:", emailError);
    // }

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
      console.log("swapRequest", swapRequest);
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
        let currentVersion = (classDoc.versions || []).find(
          (v) => v.label === "default"
        );
        if (!currentVersion) {
          console.warn(
            `[swap:update] No default version found for ${classDoc._id}`
          );
          return false;
        }

        if (!classDoc) return false;

        // Always create or update the 'updated' version after swap
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
          classDoc.versions.push(updatedVersion);
        }

        // Start from the latest default version
        currentVersion = (classDoc.versions || []).find(
          (v) => v.label === "default"
        );
        if (!currentVersion) return false;

        const updatedSlots = JSON.parse(
          JSON.stringify(currentVersion.timeSlots || [])
        );
        updatedSlots.forEach((slot, i) =>
          sanitizeSlotFields(slot, currentVersion.timeSlots[i])
        );

        const swapIdx = updatedSlots.findIndex(
          (s) => s.day === swapDay && Number(s.period) === Number(swapPeriod)
        );
        const otherIdx = updatedSlots.findIndex(
          (s) => s.day === otherDay && Number(s.period) === Number(otherPeriod)
        );

        if (swapIdx === -1 || otherIdx === -1) {
          console.warn("[swap:update] Could not locate matching slots", {
            swapDay,
            swapPeriod,
            otherDay,
            otherPeriod,
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

        // Swap the slots
        const tempSlot = {};
        requiredFields.forEach((f) => (tempSlot[f] = updatedSlots[swapIdx][f]));
        requiredFields.forEach((f) => {
          updatedSlots[swapIdx][f] = updatedSlots[otherIdx][f];
          updatedSlots[otherIdx][f] = tempSlot[f];
        });

        updatedSlots.forEach((slot, i) =>
          sanitizeSlotFields(slot, currentVersion.timeSlots[i])
        );

        const hasMissingFields = updatedSlots.some((slot) =>
          requiredFields.some((f) => typeof slot[f] === "undefined")
        );
        if (hasMissingFields) {
          console.error("[swap:update] Aborting save due to missing fields");
          return false;
        }

        // Overwrite or create the 'updated' version
        updatedVersion.timeSlots = updatedSlots;
        updatedVersion.updatedAt = new Date();
        updatedVersion.updatedBy = updatedBy;
        updatedVersion.swapReference = swapReference;
        updatedVersion.note = `Swapped ${swapDay} P${swapPeriod} with ${otherDay} P${otherPeriod}`;
        classDoc.currentVersionLabel = "updated";

        try {
          await classDoc.save();
          console.log(
            `[swap:update] Saved updated version for class ${classDoc._id}`
          );
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
          swapRequest.requesterClass.periods,
          swapRequest.targetClass.day,
          swapRequest.targetClass.periods,
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
            swapRequest.requesterClass.period,
            swapRequest.targetClass.day,
            swapRequest.targetClass.period,
            swapRequest.requesterId,
            swapRequest._id
          ),
          updateClassVersion(
            requestedClassDoc,
            swapRequest.targetClass.day,
            swapRequest.targetClass.period,
            swapRequest.requesterClass.day,
            swapRequest.requesterClass.period,
            swapRequest.targetFacultyId,
            swapRequest._id
          ),
        ]);

        if (results.every((r) => r)) {
          console.log(
            "✅ Both ClassTimetable documents updated with new version for swap."
          );
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
      // await sendSwapResponseNotification(
      //   swapRequest.requesterId.email,
      //   req.faculty.name,
      //   "rejected",
      //   {
      //     responseMessage: message || "Swap request rejected",
      //     requesterClass: swapRequest.requesterClass,
      //     targetClass: swapRequest.targetClass,
      //   }
      // );
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
