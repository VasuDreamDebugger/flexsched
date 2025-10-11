import ClassSwap from '../Models/ClassSwap.js';
import Faculty from '../Models/Faculty.js';
import Timetable from '../Models/Timetable.js';
import { sendSwapRequestNotification, sendSwapResponseNotification, sendStudentNotification } from '../utils/emailService.js';

// Create a new class swap request
export const createSwapRequest = async (req, res) => {
  try {
    const {
      targetFacultyId,
      requesterClass,
      targetClass,
      reason,
      swapDate
    } = req.body;

    const requesterId = req.faculty._id;

    // Validate target faculty exists
    const targetFaculty = await Faculty.findById(targetFacultyId);
    if (!targetFaculty) {
      return res.status(404).json({
        success: false,
        message: 'Target faculty not found'
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
    await swapRequest.addNotification(
      targetFacultyId,
      'swap_request',
      `New class swap request from ${req.faculty.name}`
    );

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
    await swapRequest.addNotification(
      swapRequest.requesterId,
      'swap_accepted',
      `Your swap request has been accepted by ${req.faculty.name}`
    );

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

    // TODO: Update timetables when swap is accepted
    // This would involve updating the actual timetable records
    // For now, we'll just log that the swap was accepted
    console.log('Swap accepted - timetables should be updated');

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
    await swapRequest.addNotification(
      swapRequest.requesterId,
      'swap_rejected',
      `Your swap request has been rejected by ${req.faculty.name}`
    );

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
    await swapRequest.addNotification(
      swapRequest.targetFacultyId,
      'swap_cancelled',
      `Swap request has been cancelled by ${req.faculty.name}`
    );

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

    await swapRequest.addNotification(
      otherFacultyId,
      'swap_completed',
      `Swap request has been marked as completed`
    );

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
