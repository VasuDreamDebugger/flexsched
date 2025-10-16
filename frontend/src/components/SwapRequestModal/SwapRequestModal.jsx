import React, { useState, useEffect } from "react";
import axios from "axios";
import "./SwapRequestModal.css";

const API_BASE_URL = "http://localhost:3000/api";

const SwapRequestModal = ({ isOpen, onClose, swapData }) => {
  const [reason, setReason] = useState("");
  const [swapDate, setSwapDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && swapData) {
      // Set default swap date to next working day
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSwapDate(tomorrow.toISOString().split("T")[0]);
    }
  }, [isOpen, swapData]);

  // Only render modal if all required swapData fields are present
  if (
    !isOpen ||
    !swapData ||
    !swapData.requesterClass ||
    !swapData.targetClass ||
    !swapData.selectedClass
  ) {
    return null;
  }

  // Helper to check all required fields before submit
  const hasAllFields = () => {
    return (
      swapData?.requesterClass?.day &&
      swapData?.requesterClass?.period !== undefined &&
      swapData?.requesterClass?.classTimetableId &&
      swapData?.targetClass?.day &&
      swapData?.targetClass?.period !== undefined &&
      swapData?.targetClass?.classTimetableId &&
      swapData?.targetClass?.slot?.facultyId &&
      swapData?.selectedClass?.branch &&
      swapData?.selectedClass?.year &&
      swapData?.selectedClass?.section &&
      swapDate &&
      reason.trim()
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasAllFields()) {
      alert("Missing required swap details. Please check your selections.");
      setSubmitting(false);
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      const compactPayload = {
        yourClassId: swapData.requesterClass.classTimetableId,
        requestedClassId: swapData.targetClass.classTimetableId,
        yourDay: swapData.requesterClass.day,
        yourPeriod: Number(swapData.requesterClass.period),
        requestedDay: swapData.targetClass.day,
        requestedPeriod: Number(swapData.targetClass.period),
        swapDate,
        reason,
        targetFacultyId: swapData.targetClass.slot?.facultyId,
      };

      // Debug: log the outgoing payload so server-side debug can correlate
      console.log("[SwapRequestModal] sending payload", compactPayload);

      await axios.post(`${API_BASE_URL}/class-swap/create`, compactPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      alert("Swap request sent successfully!");
      onClose();

      // Reset form
      setReason("");
      setSwapDate("");
    } catch (error) {
      console.error("Error creating swap request:", error);
      const serverMessage = error?.response?.data?.message || error?.message;
      alert(`Failed to send swap request: ${serverMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setSwapDate("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Request Class Swap</h2>
          <button className="close-btn" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Selected Classes Summary */}
          <div className="swap-summary">
            <h3>Swap Details</h3>
            <div className="class-comparison">
              <div className="class-item requester-class">
                <h4>Your Class</h4>
                <div className="class-details">
                  <p>
                    <strong>Day:</strong> {swapData?.requesterClass?.day ?? "-"}
                  </p>
                  <p>
                    <strong>Period:</strong>{" "}
                    {swapData?.requesterClass?.period ?? "-"}
                  </p>
                  <p>
                    <strong>Time:</strong>{" "}
                    {getPeriodTime(swapData?.requesterClass?.period)}
                  </p>
                </div>
              </div>

              <div className="swap-arrow">⇄</div>

              <div className="class-item target-class">
                <h4>Requested Class</h4>
                <div className="class-details">
                  <p>
                    <strong>Day:</strong> {swapData?.targetClass?.day ?? "-"}
                  </p>
                  <p>
                    <strong>Period:</strong>{" "}
                    {swapData?.targetClass?.period ?? "-"}
                  </p>
                  <p>
                    <strong>Time:</strong>{" "}
                    {getPeriodTime(swapData?.targetClass?.period)}
                  </p>
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
                min={new Date().toISOString().split("T")[0]}
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
                {submitting ? "Sending Request..." : "Send Swap Request"}
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
    6: "15:00 - 16:00",
  };
  return periodTimings[period] || "";
};

export default SwapRequestModal;
