import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SwapRequestModal.css';

const API_BASE_URL = 'http://localhost:3000/api';

const SwapRequestModal = ({ isOpen, onClose, swapData }) => {
  const [reason, setReason] = useState('');
  const [swapDate, setSwapDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && swapData) {
      // Set default swap date to next working day
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSwapDate(tomorrow.toISOString().split('T')[0]);
    }
  }, [isOpen, swapData]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim() || !swapDate) {
      alert('Please fill in all required fields kl');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const requesterClass = {
        day: swapData.requesterClass.day,
        periods: [swapData.requesterClass.period],
        subject: swapData.requesterClass.slot.subject,
        branch: swapData.selectedClass?.branch || 'CSE',
        semester: swapData.selectedClass?.year || '3rd Year',
        section: swapData.selectedClass?.section || 'A',
        room: swapData.requesterClass.slot.room,
        isLab: !!swapData.requesterClass.slot.isLab
      };

      const targetClass = {
        day: swapData.targetClass.day,
        periods: [swapData.targetClass.period],
        subject: swapData.targetClass.slot.subject,
        branch: swapData.selectedClass?.branch || 'CSE',
        semester: swapData.selectedClass?.year || '3rd Year',
        section: swapData.selectedClass?.section || 'A',
        room: swapData.targetClass.slot.room,
        isLab: !!swapData.targetClass.slot.isLab
      };

      // Get target faculty ID from the slot data
      const targetFacultyId = swapData.targetClass.slot.facultyId;
      if (!targetFacultyId) {
        alert('Could not determine target faculty. Please select a slot that has an assigned faculty.');
        setSubmitting(false);
        return;
      }

      // New compact payload (class-centric). We also send branch/year/section to allow backend lookup if ids are not provided.
      console.log('Submitting swap:', {
        yourClassId: swapData.requesterClass.classTimetableId,
        requestedClassId: swapData.targetClass.classTimetableId,
        requesterClass: swapData.requesterClass,
        targetClass: swapData.targetClass
      });
      
      const compactPayload = {
        yourClassId: swapData.requesterClass.classTimetableId,
        requestedClassId: swapData.targetClass.classTimetableId,
        yourDay: swapData.requesterClass.day,
        yourPeriod: Number(swapData.requesterClass.period),
        requestedDay: swapData.targetClass.day,
        requestedPeriod: Number(swapData.targetClass.period),
        branch: swapData.selectedClass?.branch,
        year: swapData.selectedClass?.year,
        section: swapData.selectedClass?.section,
        swapDate,
        reason
      };
         
      // const compactPayload = {
      //   yourClassId: swapData.classTimetableId || null,
      //   requestedClassId: swapData.classTimetableId || null,
      //   yourDay: swapData.requesterClass.day,
      //   yourPeriod: Number(swapData.requesterClass.period),
      //   requestedDay: swapData.targetClass.day,
      //   requestedPeriod: Number(swapData.targetClass.period),
      //   branch: swapData.selectedClass?.branch,
      //   year: swapData.selectedClass?.year,
      //   section: swapData.selectedClass?.section,
      //   swapDate,
      //   reason
      // };

      

      await axios.post(`${API_BASE_URL}/class-swap/create`, compactPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Swap request sent successfully!');
      onClose();
      
      // Reset form
      setReason('');
      setSwapDate('');
    } catch (error) {
      console.error('Error creating swap request:', error);
      alert('Failed to send swap request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setSwapDate('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Request Class Swap</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Selected Classes Summary */}
          <div className="swap-summary">
            <h3>Swap Details</h3>
            <div className="class-comparison">
              <div className="class-item requester-class">
                <h4>Your Class</h4>
                <div className="class-details">
                  <p><strong>Day:</strong> {swapData?.requesterClass.day}</p>
                  <p><strong>Period:</strong> {swapData?.requesterClass.period}</p>
                  <p><strong>Time:</strong> {getPeriodTime(swapData?.requesterClass.period)}</p>
                </div>
              </div>
              
              <div className="swap-arrow">⇄</div>
              
              <div className="class-item target-class">
                <h4>Requested Class</h4>
                <div className="class-details">
                  <p><strong>Day:</strong> {swapData?.targetClass.day}</p>
                  <p><strong>Period:</strong> {swapData?.targetClass.period}</p>
                  <p><strong>Time:</strong> {getPeriodTime(swapData?.targetClass.period)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Swap Request Form */}
          <form onSubmit={handleSubmit} className="swap-form">

            <div className="form-group">
              <label htmlFor="swapDate">Swap Date *</label>
              <input
                type="date"
                id="swapDate"
                value={swapDate}
                onChange={(e) => setSwapDate(e.target.value)}
                className="form-input"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reason">Reason for Swap *</label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="form-textarea"
                placeholder="Please provide a reason for this class swap request..."
                rows="4"
                
              />
              <div className="char-count">{reason.length}/500</div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || loading}
              >
                {submitting ? 'Sending Request...' : 'Send Swap Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const getPeriodTime = (period) => {
  const periodTimings = {
    1: "09:00 - 10:00",
    2: "10:00 - 11:00",
    3: "11:00 - 12:00",
    4: "13:00 - 14:00",
    5: "14:00 - 15:00",
    6: "15:00 - 16:00"
  };
  return periodTimings[period] || '';
};

export default SwapRequestModal;
