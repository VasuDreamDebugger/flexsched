import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import './index.css';

const API_BASE_URL = 'http://localhost:3000/api';

function FacultyDashboard() {
  const [faculty, setFaculty] = useState(null);
  const [requestStats, setRequestStats] = useState({
    pending: 0,
    received: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFacultyData();
    fetchRequestStats();
  }, []);

  const fetchFacultyData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/facultylogin');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setFaculty(response.data.data.faculty);
      }
    } catch (error) {
      console.error('Error fetching faculty data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('faculty');
        navigate('/facultylogin');
      }
    }
  };

  const fetchRequestStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/class-swap/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const requests = response.data.data.swapRequests;
      const facultyId = JSON.parse(localStorage.getItem('faculty'))._id;
      
      const stats = {
        pending: requests.filter(r => r.status === 'pending' && r.targetFacultyId._id === facultyId).length,
        received: requests.filter(r => r.targetFacultyId._id === facultyId).length,
        total: requests.length
      };
      
      setRequestStats(stats);
    } catch (error) {
      console.error('Error fetching request stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('faculty');
    navigate('/facultylogin');
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Faculty Dashboard</h1>
            <div className="faculty-info">
              <h4>Hello, {faculty?.name || 'Faculty'}</h4>
              <p>{faculty?.designation || 'Designation'} | {faculty?.department || 'Department'}</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/faculty')}
            >
              View Timetable
            </button>
            <button 
              className="btn btn-secondary"
              onClick={handleLogout}
            >
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
        <div className="dashboard-cards">
          {/* Swap Requests */}
          <div className="dashboard-card">
            <div className="card-icon">📋</div>
            <h3>Swap Requests</h3>
            <div className="stats">
              <div className="stat-item">
                <span className="stat-number">{requestStats.pending}</span>
                <span className="stat-label">Pending</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{requestStats.received}</span>
                <span className="stat-label">Received</span>
              </div>
            </div>
            <div className="card-actions">
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/requests')}
              >
                View Requests
              </button>
            </div>
          </div>

          {/* Timetable Management */}
          <div className="dashboard-card">
            <div className="card-icon">📅</div>
            <h3>Timetable</h3>
            <p>Manage your class schedule and view timetables</p>
            <div className="card-actions">
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/faculty')}
              >
                View Timetable
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="dashboard-card">
            <div className="card-icon">🔔</div>
            <h3>Notifications</h3>
            <p>Stay updated with swap requests and updates</p>
            <div className="card-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => navigate('/requests')}
              >
                View Notifications
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FacultyDashboard;
