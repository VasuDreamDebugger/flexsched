import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

function FacultyDashboard() {
  return (
    <div className="min-vh-100 py-4" style={{ backgroundColor: "#e6f2ff" }}>
      <div className="container">
        {/* Header */}
        <div className="card p-4 shadow-lg rounded-4">
          <h1 className="mb-3">Dashboard</h1>

          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Hello, P.Sindhu</h4>
            <button className="btn btn-outline-primary px-4 py-2 rounded-3">
              Logout
            </button>
          </div>
        </div>

        {/* Faculty Information */}
        <div className="card p-4 shadow-sm mt-4 rounded-4">
          <h5 className="mb-3 text-secondary">Faculty Information</h5>
          <div className="row">
            <div className="col-md-4">
              <strong>Name:</strong> P.Sindhu
            </div>
            <div className="col-md-4 align-items-center">
              <strong>Department:</strong> Computer Science & Engineering
            </div>
            <div className="col-md-4">
              <strong>Primary Subject:</strong> Software Engineering
            </div>
          </div>
        </div>

        {/* Cards Section */}
        <div className="row mt-4 g-4">
          {/* Swap Requests */}
          <div className="col-md-4">
            <div className="card shadow-sm p-4 rounded-4 border-primary">
              <h5 className="text-primary mb-3">Swap Your Requests</h5>
              <p>
                <strong>3</strong> swap requests currently pending
              </p>
              <button className="btn btn-primary-subtle w-100 mb-2 rounded-3">
                Create Request
              </button>
              <button className="btn btn-outline-primary w-100 rounded-3">
                View All
              </button>
            </div>
          </div>

          {/* Approved/Rejected */}
          <div className="col-md-4">
            <div className="card shadow-sm p-4 rounded-4 border-primary">
              <h5 className="text-primary mb-3">Approved/Rejected</h5>
              <p>
                <strong>5</strong> requests with updated approval status
              </p>
              <button className="btn btn-primary-subtle w-100 mb-2 rounded-3">
                View Status
              </button>
              <button className="btn btn-outline-primary w-100 rounded-3">
                Filter Results
              </button>
            </div>
          </div>

          {/* Smart Recommendations */}
          <div className="col-md-4">
            <div className="card shadow-sm p-4 rounded-4 border-primary">
              <h5 className="text-primary mb-3">Smart Recommendations</h5>
              <p>
                <strong>8</strong> optimized suggestions available
              </p>
              <button className="btn btn-primary-subtle w-100 mb-2 rounded-3">
                View Suggestions
              </button>
              <button className="btn btn-outline-primary w-100 rounded-3">
                Preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FacultyDashboard;
