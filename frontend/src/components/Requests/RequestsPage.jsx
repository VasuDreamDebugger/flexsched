import React, { useState, useEffect } from "react";
import axios from "axios";
import "./RequestsPage.css";

const API_BASE_URL = "http://localhost:3000/api";

const RequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("received");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/class-swap/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(response.data.data.swapRequests);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      setProcessing(true);
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/class-swap/requests/${requestId}/accept`,
        {
          message: responseMessage || "Swap request accepted",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Swap request accepted successfully!");
      fetchRequests();
      setSelectedRequest(null);
      setResponseMessage("");
    } catch (error) {
      console.error("Error accepting request:", error);
      alert("Failed to accept request. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setProcessing(true);
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/class-swap/requests/${requestId}/reject`,
        {
          message: responseMessage || "Swap request rejected",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Swap request rejected");
      fetchRequests();
      setSelectedRequest(null);
      setResponseMessage("");
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async (requestId) => {
    try {
      setProcessing(true);
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/class-swap/requests/${requestId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Swap request cancelled");
      fetchRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error("Error cancelling request:", error);
      alert("Failed to cancel request. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: "status-pending", text: "Pending" },
      accepted: { class: "status-accepted", text: "Accepted" },
      rejected: { class: "status-rejected", text: "Rejected" },
      completed: { class: "status-completed", text: "Completed" },
      cancelled: { class: "status-cancelled", text: "Cancelled" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`status-badge ${config.class}`}>{config.text}</span>
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
  const filteredRequestsReceived = requests.filter(
    (request) =>
      request.targetFacultyId._id ===
      JSON.parse(localStorage.getItem("faculty"))._id
  );

  const filteredRequestsSent = requests.filter(
    (request) =>
      request.requesterId._id ===
      JSON.parse(localStorage.getItem("faculty"))._id
  );

  const filteredRequests = requests.filter((request) => {
    if (activeTab === "sent") {
      return (
        request.requesterId._id ===
        JSON.parse(localStorage.getItem("faculty"))._id
      );
    } else {
      return (
        request.targetFacultyId._id ===
        JSON.parse(localStorage.getItem("faculty"))._id
      );
    }
  });

  if (loading) {
    return (
      <div className="requests-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="requests-container">
      <div className="requests-header">
        <h2>Class Swap Requests</h2>
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === "received" ? "active" : ""}`}
            onClick={() => setActiveTab("received")}
          >
            Received Requests ({filteredRequestsReceived.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "sent" ? "active" : ""}`}
            onClick={() => setActiveTab("sent")}
          >
            My Requests ({filteredRequestsSent.length})
          </button>
        </div>
      </div>

      <div className="requests-list">
        {filteredRequests.length === 0 ? (
          <div className="no-requests">
            <div className="no-requests-icon">📋</div>
            <h3>
              No {activeTab === "received" ? "received" : "sent"} requests
            </h3>
            <p>
              You don't have any{" "}
              {activeTab === "received" ? "incoming" : "outgoing"} swap requests
              at the moment.
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request._id} className="request-card">
              <div className="request-header">
                <div className="request-info">
                  <h4>
                    {activeTab === "received"
                      ? `Request from ${request.requesterId.name}`
                      : `Request to ${request.targetFacultyId.name}`}
                  </h4>
                  <p className="request-date">
                    {new Date(request.createdAt).toLocaleDateString()} at{" "}
                    {new Date(request.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                {getStatusBadge(request.status)}
              </div>

              <div className="request-details">
                <div className="swap-comparison">
                  <div className="class-slot requester">
                    <h5>Your Class</h5>
                    <div className="class-info">
                      <p>
                        <strong>Day:</strong> {request.requesterClass.day}
                      </p>
                      <p>
                        <strong>Period:</strong>{" "}
                        {request.requesterClass.periods[0]}
                      </p>
                      <p>
                        <strong>Time:</strong>{" "}
                        {getPeriodTime(request.requesterClass.periods[0])}
                      </p>
                      <p>
                        <strong>Subject:</strong>{" "}
                        {request.requesterClass.subject}
                      </p>
                      <p>
                        <strong>Room:</strong> {request.requesterClass.room}
                      </p>
                    </div>
                  </div>

                  <div className="swap-arrow">⇄</div>

                  <div className="class-slot target">
                    <h5>Requested Class</h5>
                    <div className="class-info">
                      <p>
                        <strong>Day:</strong> {request.targetClass.day}
                      </p>
                      <p>
                        <strong>Period:</strong>{" "}
                        {request.targetClass.periods[0]}
                      </p>
                      <p>
                        <strong>Time:</strong>{" "}
                        {getPeriodTime(request.targetClass.periods[0])}
                      </p>
                      <p>
                        <strong>Subject:</strong> {request.targetClass.subject}
                      </p>
                      <p>
                        <strong>Room:</strong> {request.targetClass.room}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="request-meta">
                  <p>
                    <strong>Swap Date:</strong>{" "}
                    {new Date(request.swapDate).toLocaleDateString()}
                  </p>
                  <h5>
                    <strong>Reason:</strong> {request.reason}
                  </h5>
                  {request.responseMessage && (
                    <p>
                      <strong>Response:</strong> {request.responseMessage}
                    </p>
                  )}
                </div>
              </div>

              <div className="request-actions">
                {request.status === "pending" && activeTab === "received" && (
                  <>
                    <button
                      className="btn btn-accept"
                      onClick={() =>
                        setSelectedRequest({ ...request, action: "accept" })
                      }
                    >
                      Accept
                    </button>
                    <button
                      className="btn btn-reject"
                      onClick={() =>
                        setSelectedRequest({ ...request, action: "reject" })
                      }
                    >
                      Reject
                    </button>
                  </>
                )}

                {request.status === "pending" && activeTab === "sent" && (
                  <button
                    className="btn btn-cancel"
                    onClick={() => handleCancel(request._id)}
                  >
                    Cancel
                  </button>
                )}

                {request.status === "accepted" && (
                  <button
                    className="btn btn-complete"
                    onClick={() => {
                      // Implement complete functionality
                      alert("Mark as completed functionality coming soon!");
                    }}
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Response Modal */}
      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {selectedRequest.action === "accept" ? "Accept" : "Reject"} Swap
                Request
              </h3>
              <button
                className="close-btn"
                onClick={() => setSelectedRequest(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Response Message (Optional)</label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder={`Enter a message for ${
                    selectedRequest.action === "accept"
                      ? "accepting"
                      : "rejecting"
                  } this request...`}
                  rows="4"
                  className="form-textarea"
                />
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedRequest(null)}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  className={`btn ${
                    selectedRequest.action === "accept"
                      ? "btn-accept"
                      : "btn-reject"
                  }`}
                  onClick={() => {
                    if (selectedRequest.action === "accept") {
                      handleAccept(selectedRequest._id);
                    } else {
                      handleReject(selectedRequest._id);
                    }
                  }}
                  disabled={processing}
                >
                  {processing
                    ? "Processing..."
                    : `${
                        selectedRequest.action === "accept"
                          ? "Accept"
                          : "Reject"
                      } Request`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsPage;
