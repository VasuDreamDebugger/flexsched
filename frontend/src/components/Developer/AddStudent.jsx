import React, { useState } from "react";
import apiClient, { API_BASE_URL } from "../../api/axiosClient";

const AddStudent = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    branch: "",
    year: 1,
    section: "",
  });
  const [bulk, setBulk] = useState({
    branches: ["CSE", "ECE", "MECH", "EEE", "CIVIL"],
    years: [1, 2, 3, 4],
    sections: ["A", "B", "C", "D"],
    countPerSection: 10,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.post(`${API_BASE_URL}/students`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Student created");
      setForm({
        name: "",
        email: "",
        password: "",
        branch: "",
        year: 1,
        section: "",
      });
    } catch (err) {
      console.error(err);
      alert("Failed to create student");
    } finally {
      setLoading(false);
    }
  };

  const handleBulk = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.post(`${API_BASE_URL}/students/bulk`, bulk, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Bulk students created");
    } catch (err) {
      console.error(err);
      alert("Bulk creation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-3">Add Student</h2>
      <form onSubmit={handleSubmit} className="card p-3 mb-4">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Name</label>
            <input
              className="form-control"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Branch</label>
            <select
              className="form-select"
              value={form.branch}
              onChange={(e) => setForm({ ...form, branch: e.target.value })}
              required
            >
              <option value="">Select</option>
              {["CSE", "ECE", "MECH", "EEE", "CIVIL"].map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Year</label>
            <select
              className="form-select"
              value={form.year}
              onChange={(e) =>
                setForm({ ...form, year: Number(e.target.value) })
              }
              required
            >
              {[1, 2, 3, 4].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-1">
            <label className="form-label">Section</label>
            <select
              className="form-select"
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
              required
            >
              {["", "A", "B", "C", "D"].map((s) => (
                <option key={s} value={s}>
                  {s || "--"}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Save Student"}
          </button>
        </div>
      </form>

      <div className="card p-3">
        <h4 className="mb-3">Bulk Create</h4>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">Branches (comma)</label>
            <input
              className="form-control"
              value={bulk.branches.join(",")}
              onChange={(e) =>
                setBulk({
                  ...bulk,
                  branches: e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Years</label>
            <input
              className="form-control"
              value={bulk.years.join(",")}
              onChange={(e) =>
                setBulk({
                  ...bulk,
                  years: e.target.value.split(",").map((v) => Number(v)),
                })
              }
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Sections</label>
            <input
              className="form-control"
              value={bulk.sections.join(",")}
              onChange={(e) =>
                setBulk({
                  ...bulk,
                  sections: e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Count Per Section</label>
            <input
              type="number"
              min={1}
              className="form-control"
              value={bulk.countPerSection}
              onChange={(e) =>
                setBulk({ ...bulk, countPerSection: Number(e.target.value) })
              }
            />
          </div>
        </div>
        <div className="mt-3">
          <button
            className="btn btn-secondary"
            onClick={handleBulk}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Bulk"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStudent;
