import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import "./TimetableView.css";
import "./skeleton.css";
import SmartRecommendModal from "../SmartRecommend/SmartRecommendModal";

const API_BASE_URL = "http://localhost:3000/api";

// Time periods mapping for morning/afternoon sections
const MORNING_PERIODS = [1, 2, 3];
const AFTERNOON_PERIODS = [4, 5, 6];

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const periods = [1, 2, 3, 4, 5, 6];

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

const TimetableView = ({ faculty, onSwapRequest }) => {
  const [facultyTimetable, setFacultyTimetable] = useState(null);
  const [defaultFacultyTimetable, setDefaultFacultyTimetable] = useState(null);
  const [timetableVariant, setTimetableVariant] = useState("updated"); // 'updated' | 'default' for faculty
  const [classTimetableVariant, setClassTimetableVariant] = useState("updated"); // 'updated' | 'default' for class
  const [availableClasses, setAvailableClasses] = useState({});
  const [selectedClass, setSelectedClass] = useState({
    year: "",
    branch: "",
    section: "",
  });
  const [classTimetable, setClassTimetable] = useState(null);
  const [defaultClassTimetable, setDefaultClassTimetable] = useState(null);
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const classHeadingRef = useRef(null);
  const timetableContainerRef = useRef(null);
  // Scroll timetable heading into view when class selection changes
  useEffect(() => {
    if (
      selectedClass.year &&
      selectedClass.branch &&
      selectedClass.section &&
      classHeadingRef.current
    ) {
      const headerOffset = 64; // Adjust this value to match your header height
      const top =
        classHeadingRef.current.getBoundingClientRect().top +
        window.pageYOffset -
        headerOffset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, [selectedClass.year, selectedClass.branch, selectedClass.section]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  const [loadingClass, setLoadingClass] = useState(false);
  const [showSmartRecommend, setShowSmartRecommend] = useState(false);

  const periodTimings = {
    1: { start: "09:00", end: "10:00" },
    2: { start: "10:00", end: "11:00" },
    3: { start: "11:00", end: "12:00" },
    4: { start: "13:00", end: "14:00" },
    5: { start: "14:00", end: "15:00" },
    6: { start: "15:00", end: "16:00" },
  };

  // Smart Recommend handlers
  const handleSmartRecommend = async (day, section) => {
    try {
      if (!classTimetable?._id) {
        throw new Error("Please select a class first");
      }
      // Get token from faculty prop or localStorage fallback
      const token = faculty?.token || localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token missing. Please log in again.");
      }
      const response = await axios.post(
        `${API_BASE_URL}/smart-recommend/recommendations`,
        {
          day,
          section,
          academicYear: faculty?.academicYear,
          semester: faculty?.semester,
          classId: classTimetable._id,
          facultyId: faculty?._id || faculty?.id || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  const handleSmartRecommendAssign = async ({ slots }) => {
    try {
      if (!classTimetable?._id) {
        throw new Error("Please select a class first");
      }
      // Get token from faculty prop or localStorage fallback
      const token = faculty?.token || localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token missing. Please log in again.");
      }
      const response = await axios.post(
        `${API_BASE_URL}/smart-recommend/assign`,
        {
          slots,
          academicYear: faculty?.academicYear,
          semester: faculty?.semester,
          classId: classTimetable._id,
          facultyId: faculty?._id || faculty?.id || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      // Refresh the timetable data
      await fetchClassTimetable(selectedClass);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  // Function to generate a consistent color for a subject
  const getSubjectColor = (subject) => {
    // List of predefined colors for subjects
    const colors = [
      "#4CAF50",
      "#2196F3",
      "#9C27B0",
      "#FF9800",
      "#E91E63",
      "#00BCD4",
      "#FF5722",
      "#8BC34A",
      "#3F51B5",
      "#FFEB3B",
      "#795548",
      "#009688",
    ];

    // Create a hash of the subject name to get a consistent index
    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
      hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use the hash to pick a color
    const index = Math.abs(hash) % colors.length;
    return colors[index];
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
      if (!data) {
        setFacultyTimetable(null);
        setDefaultFacultyTimetable(null);
        return;
      }

      // If the response includes versions, store both default and updated versions
      if (data.versions && Array.isArray(data.versions)) {
        const defaultVersion =
          data.versions.find((v) => v.label === "default") || data.versions[0];
        const updatedVersion =
          data.versions.find(
            (v) => v.label === data.currentVersionLabel || "updated"
          ) || defaultVersion;

        setDefaultFacultyTimetable({
          ...data,
          timeSlots: defaultVersion.timeSlots || [],
          versionLabel: "default",
        });

        setFacultyTimetable({
          ...data,
          timeSlots: updatedVersion.timeSlots || [],
          versionLabel: "updated",
        });
      } else if (data.version && data.version.timeSlots) {
        // alternate shape returned by controller (version + versionLabel)
        setDefaultFacultyTimetable({
          ...data,
          timeSlots:
            data.defaultVersion?.timeSlots || data.version.timeSlots || [],
          versionLabel: "default",
        });
        setFacultyTimetable({
          ...data,
          timeSlots: data.version.timeSlots || [],
          versionLabel: data.versionLabel || "updated",
        });
      } else {
        // legacy single-document timetable
        const timetableData = { ...data, timeSlots: data.timeSlots || [] };
        setDefaultFacultyTimetable(timetableData);
        setFacultyTimetable(timetableData);
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
      setDefaultClassTimetable(null);
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
        setDefaultClassTimetable(null);
        return;
      }
      // Always ensure _id is present in normalized timetable
      const timetableId =
        data.meta?._id || data.meta?.id || data._id || data.id || null;
      const normalizeVersion = (version) => ({
        ...version,
        _id: timetableId,
        timeSlots: (version.timeSlots || []).map((s) => ({
          ...s,
          classTimetableId: timetableId,
        })),
        meta: data.meta,
      });

      // Store both versions
      const defaultNormalized = normalizeVersion(data.default || {});
      const updatedNormalized = normalizeVersion(
        data.updated || data.default || {}
      );

      setDefaultClassTimetable(defaultNormalized);
      setClassTimetable(updatedNormalized);
      // Debug log
      console.log("[DEBUG] setClassTimetable:", updatedNormalized);
    } catch (error) {
      console.error("Error fetching class timetable:", error);
      setClassTimetable(null);
      setDefaultClassTimetable(null);
    } finally {
      setLoadingClass(false);
    }
  }, [selectedClass]);

  // Initial and variant-aware fetches
  useEffect(() => {
    fetchFacultyTimetable();
    fetchAvailableClasses();
  }, [fetchFacultyTimetable, fetchAvailableClasses]);

  // When selected class or classTimetableVariant changes, reload class timetable
  useEffect(() => {
    fetchClassTimetable();
  }, [fetchClassTimetable, classTimetableVariant]);

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

  // Renders timetable with independent variant toggles for faculty/class
  const renderTimetable = (
    timetable,
    isFacultyTimetable = false,
    defaultTimetable = null,
    variant = "updated"
  ) => {
    if (!timetable) return null;

    return (
      <div className="timetable-section">
        <div className="version-toggle">
          <button
            className={variant === "default" ? "active" : ""}
            onClick={() =>
              isFacultyTimetable
                ? setTimetableVariant("default")
                : setClassTimetableVariant("default")
            }
          >
            Default
          </button>
          <button
            className={variant === "updated" ? "active" : ""}
            onClick={() =>
              isFacultyTimetable
                ? setTimetableVariant("updated")
                : setClassTimetableVariant("updated")
            }
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
                  const cellClasses = `${getCellClass(
                    day,
                    period,
                    slot,
                    isFacultyTimetable
                  )} ${isChanged ? "changed-class" : ""}`;

                  return (
                    <td
                      key={`${day}-${period}`}
                      className={cellClasses}
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
                        <div
                          className={`class-slot ${slot.isLab ? "lab" : ""}`}
                          style={{
                            borderColor: getSubjectColor(slot.subject),
                            borderWidth: "0px",
                            borderStyle: "solid",
                            borderRadius: "8px",
                          }}
                        >
                          <div className="subject">
                            {slot.subject === "LEISURE" ? " - " : slot.subject}
                          </div>
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
      setSelectedPeriods([]);
    }
  };

  return (
    <div className="timetable-container" ref={timetableContainerRef}>
      {/* Faculty Timetable */}
      <div className="timetable-section">
        <div className="section-header">
          <h3>Your Timetable</h3>
        </div>
        <div className="table-wrapper">
          {loadingFaculty && <LoaderTable />}
          {!loadingFaculty &&
            renderTimetable(
              timetableVariant === "default"
                ? defaultFacultyTimetable
                : facultyTimetable,
              true,
              defaultFacultyTimetable,
              timetableVariant
            )}
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
          <div className="section-header" ref={classHeadingRef}>
            <h3>
              {selectedClass.branch} {selectedClass.year} - Section{" "}
              {selectedClass.section} Timetable
            </h3>
            <div className="timetable-actions">
              {/* Detailed debug logs for required data */}
              {(() => {
                try {
                  console.log(
                    "[DEBUG] faculty keys:",
                    faculty ? Object.keys(faculty) : null
                  );
                  console.log(
                    "[DEBUG] faculty.timetableId:",
                    faculty?.timetableId
                  );
                } catch (e) {
                  console.log("[DEBUG] faculty log error", e);
                }
                try {
                  console.log("[DEBUG] classTimetable (raw):", classTimetable);
                  console.log(
                    "[DEBUG] classTimetable typeof:",
                    typeof classTimetable
                  );
                  console.log(
                    "[DEBUG] classTimetable._id:",
                    classTimetable?._id || classTimetable?.id || null
                  );
                  console.log(
                    "[DEBUG] classTimetable.timeSlots exists:",
                    Array.isArray(classTimetable?.timeSlots)
                  );
                } catch (e) {
                  console.log("[DEBUG] classTimetable log error", e);
                }
                return null;
              })()}
              <button
                className="smart-recommend-btn"
                onClick={() => {
                  const missing = [];
                  if (!selectedClass.year) missing.push("year");
                  if (!selectedClass.branch) missing.push("branch");
                  if (!selectedClass.section) missing.push("section");
                  if (!classTimetable) missing.push("classTimetable");
                  if (
                    classTimetable &&
                    !(classTimetable._id || classTimetable.id)
                  )
                    missing.push("classTimetable._id");
                  if (missing.length === 0) {
                    setShowSmartRecommend(true);
                  } else {
                    alert(
                      "Missing: " +
                        missing.join(", ") +
                        ". Please reselect class."
                    );
                    console.warn(
                      "[DEBUG] Missing fields for Smart Recommend:",
                      missing,
                      { selectedClass, classTimetable, faculty }
                    );
                  }
                }}
                disabled={
                  !selectedClass.year ||
                  !selectedClass.branch ||
                  !selectedClass.section ||
                  !classTimetable ||
                  !classTimetable._id
                }
              >
                Smart Recommend
              </button>
              <p className="instruction-text">
                Click on your class first, then click on another faculty's class
                to request a swap
              </p>
            </div>
          </div>
          <div className="table-wrapper">
            {loadingClass && <LoaderTable />}
            {!loadingClass &&
              renderTimetable(
                classTimetableVariant === "default"
                  ? defaultClassTimetable
                  : classTimetable,
                false,
                defaultClassTimetable,
                classTimetableVariant
              )}
          </div>
        </div>
      )}

      {/* Smart Recommend Modal */}
      <SmartRecommendModal
        isOpen={showSmartRecommend}
        onClose={() => setShowSmartRecommend(false)}
        onSubmit={async ({ day, section, slots }) => {
          // If slots are present, it's an assign request
          if (slots) {
            return handleSmartRecommendAssign({ slots });
          }
          // Otherwise, day and section are provided by modal, rest is filled here
          if (!day || !section) {
            throw new Error("Please select both day and section.");
          }
          // Defensive: ensure required data is present.
          // faculty.academicYear/semester may be stored under faculty.timetableId in this app,
          // so require a faculty identifier and the class timetable id instead.
          if (!classTimetable?._id || !(faculty?._id || faculty?.id)) {
            throw new Error(
              "Missing timetable or faculty details. Please reselect class."
            );
          }
          return handleSmartRecommend(day, section);
        }}
        days={days}
        selectedClass={selectedClass}
        faculty={faculty}
      />

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
                    {console.log("selected slot", selectedPeriods[1].slot)}
                    <strong>Faculty:</strong>{" "}
                    {selectedPeriods[1].slot.facultyId?.name}
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
