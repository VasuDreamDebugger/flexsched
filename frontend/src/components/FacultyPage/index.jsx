import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient, { API_BASE_URL } from "../api/axiosClient";
import TimetableView from "../Timetable/TimetableView";
import SwapRequestModal from "../SwapRequestModal/SwapRequestModal";
import "./index.css";

function FacultyPage() {
  const [faculty, setFaculty] = useState(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapData, setSwapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFacultyData();
  }, []);

  const fetchFacultyData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/facultylogin");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const facultyData = response.data.data.faculty;
        setFaculty(facultyData);
        localStorage.setItem("faculty", JSON.stringify(facultyData));
      }
    } catch (error) {
      console.error("Error fetching faculty data:", error);
      // If token is invalid, redirect to login
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("faculty");
        navigate("/facultylogin");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSwapRequest = (data) => {
    // Validate all required fields before opening modal
    const valid =
      data?.requesterClass?.day &&
      data?.requesterClass?.period !== undefined &&
      data?.requesterClass?.classTimetableId &&
      data?.targetClass?.day &&
      data?.targetClass?.period !== undefined &&
      data?.targetClass?.classTimetableId &&
      data?.targetClass?.slot?.facultyId &&
      data?.selectedClass?.branch &&
      data?.selectedClass?.year &&
      data?.selectedClass?.section;
    if (!valid) {
      alert("Cannot request swap: missing required class or faculty details.");
      return;
    }
    setSwapData(data);
    setSwapModalOpen(true);
  };

  const handleCloseSwapModal = () => {
    setSwapModalOpen(false);
    setSwapData(null);
  };

  const gotoDashboard = () => {
    navigate("/facultydashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("faculty");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="outer-wrapper rounded">
        <div
          className="container mt-5 d-flex justify-content-center align-items-center"
          style={{ minHeight: "50vh" }}
        >
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading faculty data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="outer-wrapper">
      <div className="mt-5">
        {/* container  */}
        <div className="d-flex justify-content-between card-1 p-3 mb-4">
          <div className="faculty-info">
            <h1>Welcome, {faculty?.name || "Faculty"}</h1>
            <h4>{faculty?.designation || "Designation"}</h4>
            <p>
              {faculty?.department || "Department"} | Branches:{" "}
              {faculty?.branch?.join(", ") || "N/A"}
            </p>
          </div>
          <div className="d-flex gap-3 align-items-center">
            <li
              style={{ listStyle: "none" }}
              className="fs-5"
              onClick={gotoDashboard}
            >
              Dashboard
            </li>
            {/* <li style={{ listStyle: "none" }} className="fs-5">
              Edit Profile
            </li> */}
            <li
              style={{ listStyle: "none" }}
              className="fs-5"
              onClick={handleLogout}
            >
              Logout
            </li>
          </div>
        </div>

        <TimetableView faculty={faculty} onSwapRequest={handleSwapRequest} />

        <SwapRequestModal
          isOpen={swapModalOpen}
          onClose={handleCloseSwapModal}
          swapData={swapData}
        />
      </div>
    </div>
  );
}

export default FacultyPage;
