import "./index.css";
import "./skeleton.css";

import { useState } from "react";
import { useEffect, useCallback } from "react";
import axios from "axios";

const LoaderTable = () => {
  return (
    <div className="skeleton-timetable">
      <div className="version-toggle skeleton">
        <div className="skeleton-button shimmer"></div>
        <div className="skeleton-button shimmer"></div>
      </div>
      <table className="timetable-table">
        <thead>
          <tr>
            <th>
              <div
                className="skeleton shimmer"
                style={{ height: "24px" }}
              ></div>
            </th>
            {periods.map((period) => (
              <th key={period}>
                <div
                  className="skeleton shimmer"
                  style={{ height: "24px" }}
                ></div>
                <div className="skeleton-time shimmer"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day}>
              <td>
                <div
                  className="skeleton shimmer"
                  style={{ height: "24px" }}
                ></div>
              </td>
              {periods.map((period) => (
                <td key={`${day}-${period}`} className="skeleton-cell">
                  <div className="skeleton-content shimmer"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Timetable logic and state
const API_BASE_URL = "http://localhost:3000/api";
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

const Students = () => {
  const [year, setYear] = useState("3rd Year");
  const [branch, setBranch] = useState("CSE");
  const [section, setSection] = useState("A");
  const [classTimetableVariant, setClassTimetableVariant] = useState("updated");
  const [classTimetable, setClassTimetable] = useState(null);
  const [defaultClassTimetable, setDefaultClassTimetable] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch class timetable
  const fetchClassTimetable = useCallback(async () => {
    if (!branch || !year || !section) {
      setClassTimetable(null);
      setDefaultClassTimetable(null);
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/timetable/classes/v2`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { year, branch, section },
      });
      const data = response.data?.data;
      if (!data) {
        setClassTimetable(null);
        setDefaultClassTimetable(null);
        return;
      }
      const normalizeVersion = (version) => ({
        ...version,
        timeSlots: (version.timeSlots || []).map((s) => ({
          ...s,
          classTimetableId:
            (data.meta && data.meta._id && String(data.meta._id)) ||
            (data.meta && data.meta.id && String(data.meta.id)) ||
            null,
        })),
        meta: data.meta,
      });
      setDefaultClassTimetable(normalizeVersion(data.default || {}));
      setClassTimetable(normalizeVersion(data.updated || data.default || {}));
    } catch (error) {
      setClassTimetable(null);
      setDefaultClassTimetable(null);
    } finally {
      setLoading(false);
    }
  }, [branch, year, section]);

  useEffect(() => {
    fetchClassTimetable();
  }, [fetchClassTimetable, classTimetableVariant]);

  // Highlight changed slots
  const isChangedSlot = (slot, defaultTimetable, variant) => {
    if (!slot || !defaultTimetable || variant === "default") return false;
    const defaultSlot = defaultTimetable.timeSlots?.find(
      (ts) =>
        ts.day === slot.day &&
        (ts.periods?.includes
          ? ts.periods?.includes(slot.period)
          : ts.period === slot.period || ts.periods === slot.period)
    );
    if (!defaultSlot) return true;
    return (
      defaultSlot.faculty !== slot.faculty ||
      defaultSlot.facultyId?.name !== slot.facultyId?.name
    );
  };

  // Timetable grid rendering
  const renderTimetable = (
    timetable,
    defaultTimetable,
    variant = "updated"
  ) => {
    if (!timetable) return null;
    return (
      <div className="timetable-section">
        <h1>vasu</h1>
        <div className="version-toggle">
          <button
            className={variant === "default" ? "active" : ""}
            onClick={() => setClassTimetableVariant("default")}
          >
            Default
          </button>
          <button
            className={variant === "updated" ? "active" : ""}
            onClick={() => setClassTimetableVariant("updated")}
          >
            Updated
          </button>
        </div>
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
                  const isChanged = isChangedSlot(
                    slot,
                    defaultTimetable,
                    variant
                  );
                  return (
                    <td
                      key={`${day}-${period}`}
                      className={`timetable-cell${
                        isChanged ? " changed-class" : ""
                      }`}
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
                        <div
                          className={`class-slot${slot.isLab ? " lab" : ""}`}
                        >
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
      </div>
    );
  };

  return (
    <div className="students-timetable-container">
      <div className="class-selection-section">
        <h3>Class Timetable</h3>
        <div className="dropdowns-container">
          <div className="dropdown-group">
            <label>Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="form-select"
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>
          <div className="dropdown-group">
            <label>Branch</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="form-select"
            >
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
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="form-select"
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <LoaderTable />
          ) : (
            renderTimetable(
              classTimetableVariant === "default"
                ? defaultClassTimetable
                : classTimetable,
              defaultClassTimetable,
              classTimetableVariant
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Students;
