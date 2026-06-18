import { useState } from "react";
import apiClient from "../../api/axiosClient";
import "./Signup.css"; // styles for card

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setMessage("❌ Passwords do not match!");
      return;
    }

    try {
      const res = await apiClient.post("/auth/signup", {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      setMessage("✅ Account created successfully!");
      console.log("Signup Success:", res.data);
    } catch (err) {
      console.error(
        "Signup Error:",
        err.response ? err.response.data : err.message,
      );
      setMessage("❌ " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="signup-bg">
      <div className="signup-card">
        <h2 className="signup-title">Faculty Signup</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="department"
            placeholder="Department"
            value={formData.department}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <button type="submit">Sign Up</button>
        </form>
        {message && <p className="signup-message">{message}</p>}
      </div>
    </div>
  );
}

export default Signup;
