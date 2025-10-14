import ClassSwap from '../Models/ClassSwap.js';
import Faculty from '../Models/Faculty.js';
import Timetable from '../Models/Timetable.js';
import { sendSwapRequestNotification, sendSwapResponseNotification, sendStudentNotification } from '../utils/emailService.js';
import ClassTimetable from '../Models/ClassTimetable.js';
import FacultyTimetable from '../Models/FacultyTimetable.js';
import Student from '../Models/Student.js';
import { syncFacultyToClass } from '../services/timetableSync.js';

// Create a new class swap request
export const createSwapRequest = async (req, res) => {
  try {
    console.log('[swap:create] incoming', {
      keys: Object.keys(req.body || {}),
      hasRequesterClass: !!req.body?.requesterClass,
      hasTargetClass: !!req.body?.targetClass
    });

    // Migration-safe payload parsing: support new and old formats
    let targetFacultyId;
    let requesterClass;
    let targetClass;
    const reason = req.body?.reason;
    const swapDate = req.body?.swapDate;

    const isNewFormat = !!(req.body?.yourClassId && req.body?.requestedClassId);
    if (isNewFormat) {
      const { yourClassId, requestedClassId, yourDay, yourPeriod, requestedDay, requestedPeriod } = req.body;
      if (!yourClassId || !requestedClassId) {
        return res.status(400).json({ success: false, message: 'yourClassId and requestedClassId are required' });
      }
      if (!yourDay || !yourPeriod || !requestedDay || !requestedPeriod) {
        return res.status(400).json({ success: false, message: 'yourDay/yourPeriod/requestedDay/requestedPeriod are required in new format' });
      }
      
      // Handle case where both classes are from the same ClassTimetable (same classTimetableId)
      console.log('[swap:create] yourClassId:', yourClassId);
console.log('[swap:create] requestedClassId:', requestedClassId);

      let yourClassDoc, requestedClassDoc;
      if (yourClassId === requestedClassId) {
        // Both classes are from the same ClassTimetable document
        yourClassDoc = await ClassTimetable.findById(yourClassId);
        requestedClassDoc = yourClassDoc; // Same document
      } else {
        // Different ClassTimetable documents
        yourClassDoc = await ClassTimetable.findById(yourClassId);
        requestedClassDoc = await ClassTimetable.findById(requestedClassId);
      }
      
      console.log('[swap:create] yourClassDoc:', yourClassDoc);
      console.log('[swap:create] requestedClassDoc:', requestedClassDoc);

      if (!yourClassDoc || !requestedClassDoc) {
        return res.status(406).json({ success: false, message: 'ClassTimetable not found for provided ids' });
      }
      // build requesterClass from yourClassDoc (prefer updated version if present)
      const yourVersion = (yourClassDoc.versions || []).find(v => v.label === 'updated') || (yourClassDoc.versions || []).find(v => v.label === 'default');
      const reqSlot = yourVersion?.timeSlots?.find(s => s.day === yourDay && s.period === Number(yourPeriod));
      if (!reqSlot) {
        return res.status(400).json({ success: false, message: 'No matching slot found in your class timetable for provided day/period' });
      }
      const requestedVersion = (requestedClassDoc.versions || []).find(v => v.label === 'updated') || (requestedClassDoc.versions || []).find(v => v.label === 'default');
      const tgtSlot = requestedVersion?.timeSlots?.find(s => s.day === requestedDay && s.period === Number(requestedPeriod));
      if (!tgtSlot) {
        return res.status(400).json({ success: false, message: 'No matching slot found in requested class timetable for provided day/period' });
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
        isLab: !!reqSlot.isLab
      };
      targetClass = {
        day: requestedDay,
        periods: [Number(requestedPeriod)],
        subject: tgtSlot.subject,
        branch: requestedClassDoc.branch,
        semester: requestedClassDoc.year,
        section: requestedClassDoc.section,
        room: tgtSlot.room,
        isLab: !!tgtSlot.isLab
      };
      // Prefer facultyId embedded in class-centric slot, else derive from FacultyTimetable
      targetFacultyId = tgtSlot?.facultyId;
      if (!targetFacultyId) {
        const ft = await FacultyTimetable.findOne({
          academicYear: requestedClassDoc.academicYear,
          semester: requestedClassDoc.semester,
          'timeSlots.day': requestedDay,
          'timeSlots.period': Number(requestedPeriod),
          'timeSlots.branch': requestedClassDoc.branch,
          'timeSlots.year': requestedClassDoc.year,
          'timeSlots.section': requestedClassDoc.section
        }).select('facultyId');
        targetFacultyId = ft?.facultyId;
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
      return res.status(400).json({ success: false, message: 'reason and swapDate are required' });
    }

    const targetFaculty = targetFacultyId ? await Faculty.findById(targetFacultyId) : null;
    if (!targetFaculty) {
      return res.status(404).json({
        success: false,
        message: 'Target faculty not found for requested slot. Ensure class timetable slots are linked to faculty or FacultyTimetable exists for that slot.'
      });
    }

    // Check if faculty is trying to swap with themselves
    if (requesterId.toString() === targetFacultyId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot request swap with yourself'
      });
    }

    // Check if there's already a pending swap request between these faculties for the same date
    const existingSwap = await ClassSwap.findOne({
      $or: [
        { requesterId, targetFacultyId },
        { requesterId: targetFacultyId, targetFacultyId: requesterId }
      ],
      swapDate: new Date(swapDate),
      status: 'pending'
    });

    if (existingSwap) {
      return res.status(400).json({
        success: false,
        message: 'There is already a pending swap request for this date'
      });
    }

    // Create new swap request
    const swapRequest = new ClassSwap({
      requesterId,
      targetFacultyId,
      requesterClass,
      targetClass,
      reason,
      swapDate: new Date(swapDate)
    });

    await swapRequest.save();

    // Add notification for target faculty
    swapRequest.notifications.push({
      sentTo: targetFacultyId,
      notificationType: 'swap_request',
      message: `New class swap request from ${req.faculty.name}`,
      createdAt: new Date()
    });
    await swapRequest.save();

    // Populate the request with faculty details
    await swapRequest.populate('requesterId targetFacultyId', 'name email employeeId');

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
          targetClass: targetClass
        }
      );
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Swap request created successfully',
      data: { swapRequest }
    });
  } catch (error) {
    console.error('Create swap request error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all swap requests for a faculty
export const getSwapRequests = async (req, res) => {
  try {
    const facultyId = req.faculty._id;
    const { status, type } = req.query;

    let query = {
      $or: [
        { requesterId: facultyId },
        { targetFacultyId: facultyId }
      ]
    };

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by type (sent/received)
    if (type === 'sent') {
      query = { requesterId: facultyId, ...query };
    } else if (type === 'received') {
      query = { targetFacultyId: facultyId, ...query };
    }

    const swapRequests = await ClassSwap.find(query)
      .populate('requesterId targetFacultyId', 'name email employeeId department')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { swapRequests }
    });
  } catch (error) {
    console.error('Get swap requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
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
      $or: [
        { requesterId: facultyId },
        { targetFacultyId: facultyId }
      ]
    }).populate('requesterId targetFacultyId', 'name email employeeId department branch subjects');

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { swapRequest }
    });
  } catch (error) {
    console.error('Get swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
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
      status: 'pending'
    });

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found or already processed'
      });
    }

    // Accept the swap
    await swapRequest.accept(message || 'Swap request accepted');

    // Add notification for requester
    swapRequest.notifications.push({
      sentTo: swapRequest.requesterId,
      notificationType: 'swap_accepted',
      message: `Your swap request has been accepted by ${req.faculty.name}`,
      createdAt: new Date()
    });
    await swapRequest.save();

    // Populate faculty details
    await swapRequest.populate('requesterId targetFacultyId', 'name email employeeId');

    // Send email notification to requester
    try {
      await sendSwapResponseNotification(
        swapRequest.requesterId.email,
        req.faculty.name,
        'accepted',
        {
          responseMessage: message || 'Swap request accepted',
          requesterClass: swapRequest.requesterClass,
          targetClass: swapRequest.targetClass
        }
      );
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }

  // Update timetables when swap is accepted: swap matching timeSlots between both faculties
  try {
    const requesterTimetable = await Timetable.findOne({ facultyId: swapRequest.requesterId, isActive: true });
    const targetTimetable = await Timetable.findOne({ facultyId: swapRequest.targetFacultyId, isActive: true });

    if (requesterTimetable && targetTimetable) {
      const sameArray = (a = [], b = []) => a.length === b.length && a.every((v, i) => v === b[i]);
      const findSlotIndex = (tt, cls) => {
        // Try exact match by day and periods array
        let idx = tt.timeSlots.findIndex(s => s.day === cls.day && sameArray(s.periods, cls.periods));
        if (idx !== -1) return idx;
        // If single period requested, find a slot that contains that period on the same day
        if (cls.periods && cls.periods.length === 1) {
          const p = cls.periods[0];
          idx = tt.timeSlots.findIndex(s => s.day === cls.day && Array.isArray(s.periods) && s.periods.includes(p));
          return idx;
        }
        return -1;
      };

      const rIndex = findSlotIndex(requesterTimetable, swapRequest.requesterClass);
      const tIndex = findSlotIndex(targetTimetable, swapRequest.targetClass);

      if (rIndex !== -1 && tIndex !== -1) {
        // Swap descriptive fields
        const rSlot = requesterTimetable.timeSlots[rIndex];
        const tSlot = targetTimetable.timeSlots[tIndex];

        const temp = {
          subject: rSlot.subject,
          branch: rSlot.branch,
          semester: rSlot.semester,
          room: rSlot.room,
          isLab: rSlot.isLab,
          isTheory: rSlot.isTheory
        };

        rSlot.subject = tSlot.subject;
        rSlot.branch = tSlot.branch;
        rSlot.semester = tSlot.semester;
        rSlot.room = tSlot.room;
        rSlot.isLab = tSlot.isLab;
        rSlot.isTheory = tSlot.isTheory;

        tSlot.subject = temp.subject;
        tSlot.branch = temp.branch;
        tSlot.semester = temp.semester;
        tSlot.room = temp.room;
        tSlot.isLab = temp.isLab;
        tSlot.isTheory = temp.isTheory;

        requesterTimetable.markModified('timeSlots');
        targetTimetable.markModified('timeSlots');
        await requesterTimetable.save();
        await targetTimetable.save();

        // Also sync these faculty timetable changes back into ClassTimetable (updated version)
        await Promise.all([
          syncFacultyToClass(requesterTimetable),
          syncFacultyToClass(targetTimetable)
        ]);
      } else {
        console.warn('Could not locate exact matching timeSlots to swap for one or both timetables');
      }
    } else {
      console.warn('One or both faculty timetables not found; skipping timetable swap');
    }
  } catch (swapErr) {
    console.error('Timetable swap update failed:', swapErr);
  }

  // Notify students for the target class if emails are available
  try {
    const branch = swapRequest.targetClass.branch;
    const section = swapRequest.targetClass.section;
    // Convert semester/year label to number if needed (supports formats like "3rd Year")
    const yearNumber = typeof swapRequest.targetClass.semester === 'number'
      ? swapRequest.targetClass.semester
      : (parseInt(String(swapRequest.targetClass.semester).match(/\d+/)?.[0] || '0', 10) || 0);

    const students = await Student.find({ branch, section, year: yearNumber, isActive: true }).select('email');
    const studentEmails = students.map(s => s.email).filter(Boolean);
    if (studentEmails.length > 0) {
      await sendStudentNotification(studentEmails, {
        swapDate: swapRequest.swapDate,
        requesterClass: swapRequest.requesterClass,
        targetClass: swapRequest.targetClass
      }, 'swap');
    }
  } catch (studErr) {
    console.error('Student notification failed:', studErr);
  }

    res.status(200).json({
      success: true,
      message: 'Swap request accepted successfully',
      data: { swapRequest }
    });
  } catch (error) {
    console.error('Accept swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
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
      status: 'pending'
    });

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found or already processed'
      });
    }

    // Reject the swap
    await swapRequest.reject(message || 'Swap request rejected');

    // Add notification for requester
    swapRequest.notifications.push({
      sentTo: swapRequest.requesterId,
      notificationType: 'swap_rejected',
      message: `Your swap request has been rejected by ${req.faculty.name}`,
      createdAt: new Date()
    });
    await swapRequest.save();

    // Populate faculty details
    await swapRequest.populate('requesterId targetFacultyId', 'name email employeeId');

    // Send email notification to requester
    try {
      await sendSwapResponseNotification(
        swapRequest.requesterId.email,
        req.faculty.name,
        'rejected',
        {
          responseMessage: message || 'Swap request rejected',
          requesterClass: swapRequest.requesterClass,
          targetClass: swapRequest.targetClass
        }
      );
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Swap request rejected',
      data: { swapRequest }
    });
  } catch (error) {
    console.error('Reject swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
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
      status: 'pending'
    });

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found or cannot be cancelled'
      });
    }

    // Cancel the swap
    await swapRequest.cancel();

    // Add notification for target faculty
    swapRequest.notifications.push({
      sentTo: swapRequest.targetFacultyId,
      notificationType: 'swap_cancelled',
      message: `Swap request has been cancelled by ${req.faculty.name}`,
      createdAt: new Date()
    });
    await swapRequest.save();

    await swapRequest.populate('requesterId targetFacultyId', 'name email employeeId');

    res.status(200).json({
      success: true,
      message: 'Swap request cancelled successfully',
      data: { swapRequest }
    });
  } catch (error) {
    console.error('Cancel swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
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
      $or: [
        { requesterId: facultyId },
        { targetFacultyId: facultyId }
      ],
      status: 'accepted'
    });

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found or not accepted'
      });
    }

    // Complete the swap
    await swapRequest.complete();

    // Add notification for both faculties
    const otherFacultyId = swapRequest.requesterId.toString() === facultyId.toString() 
      ? swapRequest.targetFacultyId 
      : swapRequest.requesterId;

    swapRequest.notifications.push({
      sentTo: otherFacultyId,
      notificationType: 'swap_completed',
      message: `Swap request has been marked as completed`,
      createdAt: new Date()
    });
    await swapRequest.save();

    await swapRequest.populate('requesterId targetFacultyId', 'name email employeeId');

    res.status(200).json({
      success: true,
      message: 'Swap request completed successfully',
      data: { swapRequest }
    });
  } catch (error) {
    console.error('Complete swap request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
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
      isActive: true
    }).select('name email employeeId department subjects');

    // Filter faculties who might be available for swap
    const availableFaculties = faculties.filter(faculty => 
      faculty.subjects && faculty.subjects.length > 0
    );

    res.status(200).json({
      success: true,
      data: { faculties: availableFaculties }
    });
  } catch (error) {
    console.error('Get available faculties error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
