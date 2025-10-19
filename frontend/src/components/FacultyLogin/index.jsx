import { Modal } from "bootstrap";
import { useEffect, useRef, useState } from "react";
import { useModal } from "../../contexts/modalContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./index.css";

const API_BASE_URL = "http://localhost:3000/api";

const FacultyLogin = () => {
  const modalRef = useRef(null);
  const modalInstance = useRef(null);
  const navigate = useNavigate();
  const { isFacultyModalOpen, closeFacultyModal } = useModal();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (modalRef.current) {
      modalInstance.current = new Modal(modalRef.current, {
        backdrop: "static",
      });
    }
  }, []);

  useEffect(() => {
    if (isFacultyModalOpen) {
      modalInstance.current.show();
    } else if (modalInstance.current) {
      modalInstance.current.hide();
    }
  }, [isFacultyModalOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: username,
        password: password,
      });

      if (response.data.success) {
        const { faculty, token } = response.data.data;

        localStorage.setItem("token", token);
        localStorage.setItem("faculty", JSON.stringify(faculty));

        closeFacultyModal();
        navigate("/faculty");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade faculty-modal"
      id="facultyLoginModal"
      tabIndex="-1"
      aria-labelledby="facultyLoginModalLabel"
      aria-hidden="true"
      ref={modalRef}
    >
      <div className="modal-dialog modal-dialog-centered faculty-modal-dialog">
        <div className="modal-content faculty-modal-content animate-fade-in">
          <div className="modal-body faculty-modal-body">
            <div className="faculty-login-container">
              <div className="login-icon">🔐</div>
              <h2 className="login-heading">Sign in with email</h2>
              <p className="login-subtext">
                Enter your faculty credentials to access your dashboard.
              </p>

              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className="form-control login-input"
                    id="floatingEmail"
                    placeholder="Email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <label htmlFor="floatingEmail">Email</label>
                </div>

                <div className="form-floating mb-2">
                  <input
                    type="password"
                    className="form-control login-input"
                    id="floatingPassword"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <label htmlFor="floatingPassword">Password</label>
                </div>

                <div className="text-end mb-3"></div>

                {error && (
                  <div className="alert alert-danger fade-in-fast" role="alert">
                    {error}
                  </div>
                )}

                <div className="div-btn">
                  <button
                    type="submit"
                    className="btn btn-get-started"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Get Started"}
                  </button>
                </div>
              </form>

              <div className="modal-footer justify-content-center border-0 mt-4">
                <button
                  type="button"
                  className="btn btn-outline-light btn-close-fancy"
                  onClick={closeFacultyModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyLogin;
