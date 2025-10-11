import { Modal } from 'bootstrap';
import { useEffect, useRef, useState } from 'react';
import { useModal } from '../../contexts/modalContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_BASE_URL = 'http://localhost:3000/api';


const FacultyLogin = () => {
  const modalRef = useRef(null);
  const modalInstance = useRef(null);
  const navigate = useNavigate();
  const { isFacultyModalOpen, closeFacultyModal } = useModal();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (modalRef.current) {
      modalInstance.current = new Modal(modalRef.current, { backdrop: 'static' });
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
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: username,
        password: password
      });

      if (response.data.success) {
        const { faculty, token } = response.data.data;
        
        // Store token and faculty data
        localStorage.setItem('token', token);
        localStorage.setItem('faculty', JSON.stringify(faculty));
        
        closeFacultyModal();
        navigate('/faculty'); // Redirect to faculty dashboard after login
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade"
      id="facultyLoginModal"
      tabIndex="-1"
      aria-labelledby="facultyLoginModalLabel"
      aria-hidden="true"
      ref={modalRef}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: '20px' }}>
          <div className="modal-body p-4 login-bg" style={{ borderRadius: '20px' }}>
            <div className="card login-card shadow p-4" style={{ borderRadius: '15px' }}>
              <h2 className="text-center mb-4 fw-bold text-primary">Faculty Login</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-floating mb-3">
                  <input
                    type="text"
                    className="form-control"
                    id="floatingEmail"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <label htmlFor="floatingEmail">Email address</label>
                </div>

                <div className="form-floating mb-3">
                  <input
                    type="password"
                    className="form-control"
                    id="floatingPassword"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <label htmlFor="floatingPassword">Password</label>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="rememberMe" />
                    <label className="form-check-label" htmlFor="rememberMe">Remember me</label>
                  </div>
                  <a href="#" className="small text-decoration-none text-muted">Forgot Password?</a>
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>

                <div className="text-center mt-3">
                  <span className="text-muted">Demo Credentials: </span>
                  <small className="text-muted d-block">Email: p.sindhu@university.edu</small>
                  <small className="text-muted d-block">Password: password123</small>
                </div>
              </form>
            </div>
            <div className="modal-footer border-0">
            <button type="button" className="btn btn-danger" onClick={closeFacultyModal}>
              Close
            </button>
          </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default FacultyLogin;
