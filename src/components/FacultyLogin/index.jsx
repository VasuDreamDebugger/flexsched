import { Modal } from 'bootstrap';
import { useEffect, useRef, useState } from 'react';
import { useModal } from '../../contexts/modalContext';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';


const FacultyLogin = () => {
  const modalRef = useRef(null);
  const modalInstance = useRef(null);
  const navigate = useNavigate();
  const { isFacultyModalOpen, closeFacultyModal } = useModal();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Username:', username);
    console.log('Password:', password);
    // Do login logic here (like API call)
    const userDetails= {username,password}
    const jsonFormat =JSON.stringify(userDetails)
    Cookies.set("jwt_token",jsonFormat);
    closeFacultyModal();
    navigate('/faculty'); // Redirect to faculty dashboard after login

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

                <button type="submit" className="btn btn-primary w-100 btn-lg">Login</button>

                <div className="text-center mt-3">
                  {/* <span className="text-muted">Don't have an account? </span>
                  <a href="#" className="text-decoration-none">Register</a> */}
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
