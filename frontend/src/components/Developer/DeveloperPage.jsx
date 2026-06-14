import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient, { API_BASE_URL } from "../../api/axiosClient";
import "./DeveloperPage.css";

const DeveloperPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is already logged in
    const token = localStorage.getItem("adminToken");
    const adminData = localStorage.getItem("adminData");

    if (token && adminData) {
      setIsAuthenticated(true);
      setAdminData(JSON.parse(adminData));
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/login`,
        loginForm,
      );

      if (response.data.success) {
        const { admin, token } = response.data.data;

        localStorage.setItem("adminToken", token);
        localStorage.setItem("adminData", JSON.stringify(admin));

        setIsAuthenticated(true);
        setAdminData(admin);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    setIsAuthenticated(false);
    setAdminData(null);
  };

  const handleOptionClick = (option) => {
    switch (option) {
      case "add-faculty":
        navigate("/developer/add-faculty");
        break;
      case "add-faculty-timetable":
        navigate("/developer/add-faculty-timetable");
        break;
      case "add-class-timetable":
        navigate("/developer/add-class-timetable");
        break;
      case "add-student":
        navigate("/developer/add-student");
        break;
      case "view-faculties":
        navigate("/developer/view-faculties");
        break;
      case "view-timetables":
        navigate("/developer/view-timetables");
        break;
      default:
        break;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="developer-login-container">
        <div className="login-card">
          <div className="login-header">
            <h2>Developer Access</h2>
            <p>Login to access developer tools</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, email: e.target.value })
                }
                required
                placeholder="Enter admin email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                required
                placeholder="Enter password"
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="login-info">
            <p>
              <strong>Demo Credentials:</strong>
            </p>
            <p>Email: developer@university.edu</p>
            <p>Password: dev123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="developer-page">
      <div className="developer-header">
        <div className="admin-info">
          <h1>Developer Dashboard</h1>
          <p>
            Welcome, {adminData?.username} ({adminData?.role})
          </p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate("/")} className="btn-secondary">
            Back to Home
          </button>
          <button onClick={handleLogout} className="btn-danger">
            Logout
          </button>
        </div>
      </div>

      <div className="developer-options">
        <h2>Management Options</h2>
        <div className="options-grid">
          <div
            className="option-card"
            onClick={() => handleOptionClick("add-faculty")}
          >
            <div className="option-icon">👨‍🏫</div>
            <h3>Add Faculty</h3>
            <p>
              Create new faculty accounts with individual or bulk CSV upload
            </p>
          </div>

          <div
            className="option-card"
            onClick={() => handleOptionClick("add-faculty-timetable")}
          >
            <div className="option-icon">📅</div>
            <h3>Add Faculty Timetable</h3>
            <p>Create timetables for specific faculty members</p>
          </div>

          <div
            className="option-card"
            onClick={() => handleOptionClick("add-class-timetable")}
          >
            <div className="option-icon">🏫</div>
            <h3>Add Class Timetable</h3>
            <p>Create timetables for specific classes (year/branch/section)</p>
          </div>

          <div
            className="option-card"
            onClick={() => handleOptionClick("add-student")}
          >
            <div className="option-icon">🎓</div>
            <h3>Add Student</h3>
            <p>Create a student or bulk generate by branch/year/section</p>
          </div>

          <div
            className="option-card"
            onClick={() => handleOptionClick("view-faculties")}
          >
            <div className="option-icon">👥</div>
            <h3>View Faculties</h3>
            <p>View and manage all faculty accounts</p>
          </div>

          <div
            className="option-card"
            onClick={() => handleOptionClick("view-timetables")}
          >
            <div className="option-icon">📋</div>
            <h3>View Timetables</h3>
            <p>View and manage all timetables</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperPage;
