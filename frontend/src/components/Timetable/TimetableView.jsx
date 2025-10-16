import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./TimetableView.css";

const API_BASE_URL = "http://localhost:3000/api";

const TimetableView = ({ faculty, onSwapRequest }) => {
  const [facultyTimetable, setFacultyTimetable] = useState(null);
  const [timetableVariant, setTimetableVariant] = useState("current"); // 'current' | 'default'
  const [availableClasses, setAvailableClasses] = useState({});
  const [selectedClass, setSelectedClass] = useState({
    year: "",
    branch: "",
    section: "",
  });
  const [classTimetable, setClassTimetable] = useState(null);
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  const [loadingClass, setLoadingClass] = useState(false);

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

  // Fetch faculty timetable (current/default)
  const fetchFacultyTimetable = useCallback(async () => {
    try {
      setLoadingFaculty(true);
      const token = localStorage.getItem("token");
      // Use v2 faculty endpoint which returns a FacultyTimetable document
      const response = await axios.get(`${API_BASE_URL}/timetable/faculty/v2`, {
        headers: { Authorization: `Bearer ${token}` },
        // v2 supports academicYear & semester if you want to scope; omitted for now
      });

      const data = response.data?.data || null;
      // data may be a versioned FacultyTimetable (with versions/currentVersionLabel) or a legacy timetable
      if (!data) {
        setFacultyTimetable(null);
        return;
      }

      // If the response includes versions, pick the appropriate version
      if (data.versions && Array.isArray(data.versions)) {
        const label =
          timetableVariant === "default"
            ? "default"
            : data.currentVersionLabel || "updated" || "default";
        const version = data.versions.find((v) => v.label === label) ||
          data.versions[0] || { timeSlots: [] };
        setFacultyTimetable({
          ...data,
          timeSlots: version.timeSlots || [],
          versionLabel: label,
        });
      } else if (data.version && data.version.timeSlots) {
        // alternate shape returned by controller (version + versionLabel)
        setFacultyTimetable({
          ...data,
          timeSlots: data.version.timeSlots || [],
          versionLabel: data.versionLabel || "current",
        });
      } else {
        // legacy single-document timetable
        setFacultyTimetable({ ...data, timeSlots: data.timeSlots || [] });
      }
    } catch (error) {
      console.error("Error fetching faculty timetable:", error);
      setFacultyTimetable(null);
    } finally {
      setLoadingFaculty(false);
    }
  }, [timetableVariant]);

  // Fetch available classes (for dropdowns)
  const fetchAvailableClasses = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/timetable/classes/available`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAvailableClasses(response.data.data.classes || {});
    } catch (error) {
      console.error("Error fetching available classes:", error);
      setAvailableClasses({});
    }
  }, []);

  // Fetch selected class timetable (current/default)
  const fetchClassTimetable = useCallback(async () => {
    if (
      !selectedClass.year ||
      !selectedClass.branch ||
      !selectedClass.section
    ) {
      setClassTimetable(null);
      return;
    }

    try {
      setLoadingClass(true);
      const token = localStorage.getItem("token");
      // Use v2 class timetable which returns { default, updated, meta }
      const response = await axios.get(`${API_BASE_URL}/timetable/classes/v2`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          year: selectedClass.year,
          branch: selectedClass.branch,
          section: selectedClass.section,
        },
      });

      const data = response.data?.data;
      if (!data) {
        setClassTimetable(null);
        return;
      }

      // Choose version based on timetableVariant. In v2 model, 'updated' is the current working version.
      const chosenVersion =
        timetableVariant === "default" ? data.default : data.updated;

      // Normalize slots: ensure timeSlots array exists and attach classTimetableId so UI + swap logic can use it
      const normalized = {
        ...chosenVersion,
        timeSlots: (chosenVersion.timeSlots || []).map((s) => ({
          ...s,
          // attach class timetable id from meta for downstream requests
          // ensure we always attach a string id (avoid passing a raw object)
          classTimetableId:
            (data.meta && data.meta._id && String(data.meta._id)) ||
            (data.meta && data.meta.id && String(data.meta.id)) ||
            null,
        })),
        meta: data.meta,
      };

      setClassTimetable(normalized);
    } catch (error) {
      console.error("Error fetching class timetable:", error);
      setClassTimetable(null);
    } finally {
      setLoadingClass(false);
    }
  }, [selectedClass, timetableVariant]);

  // Initial and variant-aware fetches
  useEffect(() => {
    fetchFacultyTimetable();
    fetchAvailableClasses();
  }, [fetchFacultyTimetable, fetchAvailableClasses]);

  // When selected class changes OR timetableVariant changes, reload class timetable
  useEffect(() => {
    fetchClassTimetable();
  }, [fetchClassTimetable]);

  // Helper: check if a given slot object belongs to the current faculty
  // Supports both legacy slot.faculty (string) and v2 slot.facultyId populated object
  const isFacultySlot = (slot) => {
    if (!slot) return false;
    if (slot.faculty && typeof slot.faculty === "string")
      return slot.faculty === faculty?.name;
    if (slot.facultyId && typeof slot.facultyId === "object")
      return slot.facultyId?.name === faculty?.name;
    return false;
  };

  // Prevent duplicate selection (same cell twice)
  const alreadySelectedCell = (day, period) =>
    selectedPeriods.some((p) => p.day === day && p.period === period);

  const handlePeriodClick = (day, period, slot) => {
    if (!slot) return; // Don't allow clicking on empty slots

    // Prevent clicking same cell twice
    if (alreadySelectedCell(day, period)) return;

    if (selectedPeriods.length === 0) {
      // First selection - must be faculty's own class
      if (isFacultySlot(slot)) {
        setSelectedPeriods([{ day, period, slot, isFacultyClass: true }]);
      } else {
        alert("Please select your own class first");
      }
    } else if (selectedPeriods.length === 1) {
      // Second selection - must be different faculty's class and different day
      const first = selectedPeriods[0];
      if (!isFacultySlot(slot) && first.day !== day) {
        setSelectedPeriods([
          ...selectedPeriods,
          { day, period, slot, isFacultyClass: false },
        ]);
      } else if (isFacultySlot(slot)) {
        alert("Please select a different faculty's class to swap with");
      } else if (first.day === day) {
        alert("Please select a different day");
      }
    } else {
      // Reset selection (start new selection with this cell)
      setSelectedPeriods([
        { day, period, slot, isFacultyClass: isFacultySlot(slot) },
      ]);
    }
  };

  const getCellClass = (day, period, slot, isFacultyTimetable = false) => {
    let classes = "timetable-cell";

    if (slot) {
      // If rendering faculty's own timetable, all non-empty slots are faculty's
      if (isFacultyTimetable || isFacultySlot(slot)) {
        classes += " faculty-class";
      } else {
        classes += " other-faculty-class";
      }

      const isSelected = selectedPeriods.some(
        (p) => p.day === day && p.period === period
      );
      if (isSelected) {
        classes += " selected";
        // optional: add distinct marker for source vs target
        const selIndex = selectedPeriods.findIndex(
          (p) => p.day === day && p.period === period
        );
        if (selIndex === 0) classes += " selected-source";
        if (selIndex === 1) classes += " selected-target";
      }
    }

    return classes;
  };

  const renderTimetable = (timetable, isFacultyTimetable = false) => {
    if (!timetable) return null;

    return (
      <table className="timetable-table">
        <thead>
          <tr>
            <th>Day</th>
            {periods.map((period) => (
              <th key={period}>
                P{period}
                <br />
                <small>
                  {periodTimings[period].start} - {periodTimings[period].end}
                </small>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day}>
              <td className="day-header">{day}</td>
              {periods.map((period) => {
                const slot = timetable.timeSlots?.find(
                  (ts) =>
                    ts.day === day &&
                    (ts.periods?.includes
                      ? ts.periods?.includes(period)
                      : ts.period === period || ts.periods === period)
                );

                return (
                  <td
                    key={`${day}-${period}`}
                    className={getCellClass(
                      day,
                      period,
                      slot,
                      isFacultyTimetable
                    )}
                    onClick={() => handlePeriodClick(day, period, slot)}
                    style={{ cursor: slot ? "pointer" : "default" }}
                    title={
                      slot
                        ? `Faculty: ${
                            slot.faculty || slot.facultyId?.name || "-"
                          }\nRoom: ${slot.room || "-"}\nTime: ${
                            periodTimings[period].start
                          } - ${periodTimings[period].end}`
                        : undefined
                    }
                  >
                    {slot ? (
                      <div className={`class-slot ${slot.isLab ? "lab" : ""}`}>
                        <div className="subject">{slot.subject}</div>
                        {slot.isLab && <div className="lab-badge">Lab</div>}
                      </div>
                    ) : (
                      <div className="empty-slot">-</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderClassTimetable = () => {
    if (!classTimetable) return null;

    return (
      <table className="timetable-table">
        <thead>
          <tr>
            <th>Day</th>
            {periods.map((period) => (
              <th key={period}>
                P{period}
                <br />
                <small>
                  {periodTimings[period].start} - {periodTimings[period].end}
                </small>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day}>
              <td className="day-header">{day}</td>
              {periods.map((period) => {
                const slot = classTimetable.timeSlots?.find(
                  (s) =>
                    s.day === day &&
                    (s.periods?.includes
                      ? s.periods?.includes(period)
                      : s.period === period || s.periods === period)
                );

                return (
                  <td
                    key={`${day}-${period}`}
                    className={getCellClass(day, period, slot)}
                    onClick={() => handlePeriodClick(day, period, slot)}
                    style={{ cursor: slot ? "pointer" : "default" }}
                    title={
                      slot
                        ? `Faculty: ${
                            slot.faculty || slot.facultyId?.name || "-"
                          }\nRoom: ${slot.room || "-"}\nTime: ${
                            periodTimings[period].start
                          } - ${periodTimings[period].end}`
                        : undefined
                    }
                  >
                    {slot ? (
                      <div className={`class-slot ${slot.isLab ? "lab" : ""}`}>
                        <div className="subject">{slot.subject}</div>
                        {slot.isLab && <div className="lab-badge">Lab</div>}
                      </div>
                    ) : (
                      <div className="empty-slot">-</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const handleSwapRequest = () => {
    if (selectedPeriods.length === 2) {
      // Identify which is the faculty's own class and which is the target
      const requesterClass = selectedPeriods.find((p) => p.isFacultyClass);
      const targetClass = selectedPeriods.find((p) => !p.isFacultyClass);

      // Defensive checks for required identifiers
      if (
        !requesterClass?.slot ||
        !targetClass?.slot ||
        !requesterClass.slot.classTimetableId ||
        !targetClass.slot.classTimetableId ||
        !targetClass.slot.facultyId
      ) {
        alert("Swap request failed: missing timetable identifiers.");
        return;
      }

      // Construct robust swapData object for modal
      const swapData = {
        requesterClass: {
          day: requesterClass.day,
          period: requesterClass.period,
          classTimetableId: requesterClass.slot.classTimetableId,
          slot: requesterClass.slot,
        },
        targetClass: {
          day: targetClass.day,
          period: targetClass.period,
          classTimetableId: targetClass.slot.classTimetableId,
          slot: targetClass.slot,
        },
        selectedClass: {
          branch: selectedClass.branch,
          year: selectedClass.year,
          section: selectedClass.section,
        },
        selectedPeriods,
      };

      onSwapRequest(swapData);
    }
  };

  return (
    <div className="timetable-container">
      {/* Faculty Timetable */}
      <div className="timetable-section">
        <div className="section-header">
          <h3>Your Timetable</h3>
          <div className="variant-toggle">
            <button
              className={`btn ${
                timetableVariant === "default" ? "btn-primary" : "btn-secondary"
              }`}
              onClick={() => setTimetableVariant("default")}
            >
              Default
            </button>
            <button
              className={`btn ${
                timetableVariant === "current" ? "btn-primary" : "btn-secondary"
              }`}
              onClick={() => setTimetableVariant("current")}
            >
              Current
            </button>
          </div>
        </div>
        <div className="table-wrapper">
          {loadingFaculty && <div className="loader">Loading...</div>}
          {!loadingFaculty && renderTimetable(facultyTimetable, true)}
        </div>
      </div>

      {/* Class Selection */}
      <div className="class-selection-section">
        <h3>Select Class Timetable</h3>
        <div className="dropdowns-container">
          <div className="dropdown-group">
            <label>Year</label>
            <select
              value={selectedClass.year}
              onChange={(e) =>
                setSelectedClass({
                  ...selectedClass,
                  year: e.target.value,
                  branch: "",
                  section: "",
                })
              }
              className="form-select"
            >
              <option value="">Select Year</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>

          <div className="dropdown-group">
            <label>Branch</label>
            <select
              value={selectedClass.branch}
              onChange={(e) =>
                setSelectedClass({
                  ...selectedClass,
                  branch: e.target.value,
                  section: "",
                })
              }
              className="form-select"
              disabled={!selectedClass.year}
            >
              <option value="">Select Branch</option>
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="ME">ME</option>
              <option value="CE">CE</option>
            </select>
          </div>

          <div className="dropdown-group">
            <label>Section</label>
            <select
              value={selectedClass.section}
              onChange={(e) =>
                setSelectedClass({ ...selectedClass, section: e.target.value })
              }
              className="form-select"
              disabled={!selectedClass.branch}
            >
              <option value="">Select Section</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
          </div>
        </div>
      </div>

      {/* Class Timetable */}
      {selectedClass.year && selectedClass.branch && selectedClass.section && (
        <div className="timetable-section">
          <div className="section-header">
            <h3>
              {selectedClass.branch} {selectedClass.year} - Section{" "}
              {selectedClass.section} Timetable
            </h3>
            <p className="instruction-text">
              Click on your class first, then click on another faculty's class
              to request a swap
            </p>
            <div className="variant-toggle">
              <button
                className={`btn ${
                  timetableVariant === "default"
                    ? "btn-primary"
                    : "btn-secondary"
                }`}
                onClick={() => setTimetableVariant("default")}
              >
                Default
              </button>
              <button
                className={`btn ${
                  timetableVariant === "current"
                    ? "btn-primary"
                    : "btn-secondary"
                }`}
                onClick={() => setTimetableVariant("current")}
              >
                Current
              </button>
            </div>
          </div>
          <div className="table-wrapper">
            {loadingClass && <div className="loader">Loading...</div>}
            {!loadingClass && renderClassTimetable()}
          </div>
        </div>
      )}

      {/* Swap Request Button */}
      {selectedPeriods.length === 2 && (
        <div className="swap-request-section">
          <div className="swap-summary">
            <h3>Class Swap Request</h3>
            <div className="selected-classes">
              <div className="class-card requester">
                <h4>Your Class</h4>
                <div className="class-details">
                  <p>
                    <strong>Day:</strong> {selectedPeriods[0].day}
                  </p>
                  <p>
                    <strong>Period:</strong> {selectedPeriods[0].period}
                  </p>
                  <p>
                    <strong>Subject:</strong> {selectedPeriods[0].slot.subject}
                  </p>
                  <p>
                    <strong>Time:</strong>{" "}
                    {periodTimings[selectedPeriods[0].period].start} -{" "}
                    {periodTimings[selectedPeriods[0].period].end}
                  </p>
                </div>
              </div>

              <div className="swap-arrow">⇄</div>

              <div className="class-card target">
                <h4>Requested Class</h4>
                <div className="class-details">
                  <p>
                    <strong>Day:</strong> {selectedPeriods[1].day}
                  </p>
                  <p>
                    <strong>Period:</strong> {selectedPeriods[1].period}
                  </p>
                  <p>
                    <strong>Subject:</strong> {selectedPeriods[1].slot.subject}
                  </p>
                  <p>
                    <strong>Faculty:</strong> {selectedPeriods[1].slot.faculty}
                  </p>
                  <p>
                    <strong>Time:</strong>{" "}
                    {periodTimings[selectedPeriods[1].period].start} -{" "}
                    {periodTimings[selectedPeriods[1].period].end}
                  </p>
                </div>
              </div>
            </div>
            <div className="swap-actions">
              <button className="btn btn-primary" onClick={handleSwapRequest}>
                Request Class Swap
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedPeriods([])}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableView;
