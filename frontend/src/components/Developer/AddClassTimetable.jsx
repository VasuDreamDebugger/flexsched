import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient, { API_BASE_URL } from "../../api/axiosClient";
import "./AddTimetable.css";

const AddClassTimetable = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [faculties, setFaculties] = useState([]);
  const [formData, setFormData] = useState({
    facultyId: "",
    semester: "",
    academicYear: "",
    timeSlots: [],
  });
  const [currentSlot, setCurrentSlot] = useState({
    day: "Monday",
    periods: [1],
    subject: "",
    branch: "",
    semester: "",
    section: "",
    room: "",
    isLab: false,
  });

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const periods = [1, 2, 3, 4, 5, 6];
  const periodTimings = {
    1: { start: "09:00", end: "10:00" },
    2: { start: "10:00", end: "11:00" },
    3: { start: "11:00", end: "12:00" },
    4: { start: "13:00", end: "14:00" },
    5: { start: "14:00", end: "15:00" },
    6: { start: "15:00", end: "16:00" },
  };

  const branches = [
    "CSE",
    "IT",
    "ECE",
    "EEE",
    "ME",
    "CE",
    "AE",
    "CS",
    "IS",
    "MCA",
  ];
  const sections = ["A", "B", "C", "D", "E", "F"];

  useEffect(() => {
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(`${API_BASE_URL}/admin/faculty/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setFaculties(response.data.data.faculties);
      }
    } catch (error) {
      console.error("Error fetching faculties:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSlotChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentSlot((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePeriodsChange = (e) => {
    const selectedPeriods = Array.from(e.target.selectedOptions, (option) =>
      parseInt(option.value),
    );
    setCurrentSlot((prev) => ({
      ...prev,
      periods: selectedPeriods,
    }));
  };

  const addTimeSlot = () => {
    if (
      !currentSlot.subject ||
      !currentSlot.branch ||
      !currentSlot.semester ||
      !currentSlot.section ||
      !currentSlot.room
    ) {
      alert("Please fill in all required fields for the time slot");
      return;
    }

    if (currentSlot.periods.length === 0) {
      alert("Please select at least one period");
      return;
    }

    // Validate lab periods
    if (currentSlot.isLab) {
      const isFirstThree = currentSlot.periods.every((period) =>
        [1, 2, 3].includes(period),
      );
      const isLastThree = currentSlot.periods.every((period) =>
        [4, 5, 6].includes(period),
      );

      if (!isFirstThree && !isLastThree) {
        alert(
          "Lab periods must be either first 3 periods (1,2,3) or last 3 periods (4,5,6) only",
        );
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { ...currentSlot }],
    }));

    // Reset current slot
    setCurrentSlot({
      day: "Monday",
      periods: [1],
      subject: "",
      branch: "",
      semester: "",
      section: "",
      room: "",
      isLab: false,
    });
  };

  const removeTimeSlot = (index) => {
    setFormData((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.facultyId || !formData.semester || !formData.academicYear) {
      alert("Please fill in all required fields");
      return;
    }

    if (formData.timeSlots.length === 0) {
      alert("Please add at least one time slot");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.post(
        `${API_BASE_URL}/admin/timetable/class`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        alert("Class timetable created successfully!");
        navigate("/developer");
      }
    } catch (error) {
      console.error("Error creating timetable:", error);
      alert("Error creating timetable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSelectedFaculty = () => {
    return faculties.find((f) => f._id === formData.facultyId);
  };

  return (
    <div className="add-timetable-container">
      <div className="page-header">
        <h1>Add Class Timetable</h1>
        <button
          onClick={() => navigate("/developer")}
          className="btn-secondary"
        >
          ← Back to Developer Dashboard
        </button>
      </div>

      <div className="form-container">
        <h2>Create Class Timetable</h2>

        <form onSubmit={handleSubmit} className="timetable-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="facultyId">Select Faculty *</label>
              <select
                id="facultyId"
                name="facultyId"
                value={formData.facultyId}
                onChange={handleInputChange}
                required
              >
                <option value="">Choose a faculty member...</option>
                {faculties.map((faculty) => (
                  <option key={faculty._id} value={faculty._id}>
                    {faculty.name} ({faculty.employeeId}) - {faculty.department}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="semester">Academic Year *</label>
              <input
                type="text"
                id="semester"
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                required
                placeholder="e.g., 2024-2025"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="academicYear">Academic Year Type *</label>
              <select
                id="academicYear"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Academic Year...</option>
                <option value="Odd Semester">Odd Semester</option>
                <option value="Even Semester">Even Semester</option>
              </select>
            </div>
          </div>

          {getSelectedFaculty() && (
            <div className="faculty-info">
              <h3>Selected Faculty: {getSelectedFaculty().name}</h3>
              <p>Department: {getSelectedFaculty().department}</p>
              <p>Branches: {getSelectedFaculty().branch?.join(", ")}</p>
              <p>Subjects: {getSelectedFaculty().subjects?.join(", ")}</p>
            </div>
          )}

          <div className="time-slot-section">
            <h3>Add Class Time Slots</h3>

            <div className="slot-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="day">Day *</label>
                  <select
                    id="day"
                    name="day"
                    value={currentSlot.day}
                    onChange={handleSlotChange}
                    required
                  >
                    {days.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="periods">Periods *</label>
                  <select
                    id="periods"
                    name="periods"
                    multiple
                    value={currentSlot.periods}
                    onChange={handlePeriodsChange}
                    required
                  >
                    {periods.map((period) => (
                      <option key={period} value={period}>
                        Period {period} ({periodTimings[period].start} -{" "}
                        {periodTimings[period].end})
                      </option>
                    ))}
                  </select>
                  <small>Hold Ctrl/Cmd to select multiple periods</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="subject">Subject *</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={currentSlot.subject}
                    onChange={handleSlotChange}
                    required
                    placeholder="Enter subject name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="branch">Branch *</label>
                  <select
                    id="branch"
                    name="branch"
                    value={currentSlot.branch}
                    onChange={handleSlotChange}
                    required
                  >
                    <option value="">Select Branch...</option>
                    {branches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="semester">Class Year *</label>
                  <select
                    id="semester"
                    name="semester"
                    value={currentSlot.semester}
                    onChange={handleSlotChange}
                    required
                  >
                    <option value="">Select Year...</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="section">Section *</label>
                  <select
                    id="section"
                    name="section"
                    value={currentSlot.section}
                    onChange={handleSlotChange}
                    required
                  >
                    <option value="">Select Section...</option>
                    {sections.map((section) => (
                      <option key={section} value={section}>
                        Section {section}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="room">Room *</label>
                  <input
                    type="text"
                    id="room"
                    name="room"
                    value={currentSlot.room}
                    onChange={handleSlotChange}
                    required
                    placeholder="e.g., CS-101"
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isLab"
                      checked={currentSlot.isLab}
                      onChange={handleSlotChange}
                    />
                    This is a Lab Class
                  </label>
                  <small>
                    Note: Lab classes must use either first 3 periods (1,2,3) or
                    last 3 periods (4,5,6)
                  </small>
                </div>
              </div>

              <button
                type="button"
                onClick={addTimeSlot}
                className="btn-add-slot"
              >
                Add Class Time Slot
              </button>
            </div>

            {formData.timeSlots.length > 0 && (
              <div className="added-slots">
                <h4>Added Class Time Slots ({formData.timeSlots.length})</h4>
                <div className="slots-list">
                  {formData.timeSlots.map((slot, index) => (
                    <div key={index} className="slot-item">
                      <div className="slot-details">
                        <strong>{slot.day}</strong> - Periods{" "}
                        {slot.periods.join(", ")}
                        <br />
                        {slot.subject} | {slot.branch} {slot.semester} - Section{" "}
                        {slot.section} | {slot.room}
                        {slot.isLab && <span className="lab-badge">Lab</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(index)}
                        className="btn-remove"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? "Creating Class Timetable..."
                : "Create Class Timetable"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/developer")}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClassTimetable;
