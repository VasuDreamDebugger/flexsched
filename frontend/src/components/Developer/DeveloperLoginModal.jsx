import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./DeveloperPage.css";

const API_BASE_URL = "http://localhost:3000/api";

const DeveloperLoginModal = ({ open, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  if (!open) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/login`, {
        email,
        password,
      });
      if (response.data.success) {
        const { admin, token } = response.data.data;
        localStorage.setItem("adminToken", token);
        localStorage.setItem("adminData", JSON.stringify(admin));
        onClose();
        navigate("/developer");
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (err) {
      setError("Invalid credentials or server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="login-card">
        <div className="login-header">
          <h2>Developer Login</h2>
          <p>Login to access developer tools</p>
        </div>
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="dev-email">Email</label>
            <input
              type="email"
              id="dev-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter admin email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="dev-password">Password</label>
            <input
              type="password"
              id="dev-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter password"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
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
        <button
          className="btn-secondary"
          onClick={onClose}
          style={{ marginTop: 8 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default DeveloperLoginModal;
