import React, { useState, useEffect } from "react";
import "./SmartRecommendModal.css";

const SmartRecommendModal = ({
  isOpen,
  onClose,
  onSubmit,
  days = [],
  selectedClass = {},
  faculty,
}) => {
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [noMatches, setNoMatches] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedDay("");
      setSelectedSection("");
      setRecommendations([]);
      setSelectedSlots([]);
      setError("");
      setNoMatches(false);
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setError("");
    setNoMatches(false);

    try {
      const result = await onSubmit({
        day: selectedDay,
        section: selectedSection,
      });
      const data = Array.isArray(result) ? result : result?.data ?? result;
      console.log("[SmartRecommend] raw recommendations:", data);
      if (!data || (Array.isArray(data) && data.length === 0)) {
        setRecommendations([]);
        setNoMatches(true);
      } else if (Array.isArray(data)) {
        setRecommendations(data);
      } else {
        setRecommendations([]);
        setNoMatches(true);
      }
    } catch (err) {
      console.error("[SmartRecommend] error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to get recommendations"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelection = (slot) => {
    setSelectedSlots((prev) => {
      const exists = prev.some(
        (s) => s.day === slot.day && s.period === slot.period
      );
      if (exists)
        return prev.filter(
          (s) => !(s.day === slot.day && s.period === slot.period)
        );
      return [...prev, slot];
    });
  };

  const handleGetClass = async () => {
    if (!selectedSlots.length) {
      setError("Please select at least one slot");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit({ slots: selectedSlots });
      onClose();
    } catch (err) {
      console.error("[SmartRecommend] assign error:", err);
      setError(
        err?.response?.data?.message || err?.message || "Failed to get class"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="smart-recommend-modal">
      <div className="modal-content">
        <h2>Smart Recommend</h2>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>

        <div className="class-info">
          <h3>Selected Class</h3>
          <p>
            {selectedClass?.branch} {selectedClass?.year} - Section{" "}
            {selectedClass?.section}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="day">Select Day:</label>
            <select
              id="day"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              required
            >
              <option value="">Choose a day</option>
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="section">Section Preference:</label>
            <select
              id="section"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              required
            >
              <option value="">Choose a section</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
            </select>
          </div>

          {!recommendations.length && (
            <button type="submit" className="find-slots-btn" disabled={loading}>
              {loading ? "Finding slots..." : "Find Available Slots"}
            </button>
          )}
        </form>

        {error && <div className="error-message">{error}</div>}
        {noMatches && (
          <div className="no-matches">
            No matching leisure slots found. You may proceed with a swap request
            instead.
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="recommendations">
            <h3>Available Slots:</h3>
            <div className="slots-grid">
              {recommendations
                .filter(
                  (slot) =>
                    slot &&
                    typeof slot.day === "string" &&
                    slot.day.length > 0 &&
                    typeof slot.period === "number" &&
                    slot.period > 0
                )
                .map((slot) => (
                  <div
                    key={`${slot.day}-${slot.period}`}
                    className={`slot-card ${
                      selectedSlots.some(
                        (s) => s.day === slot.day && s.period === slot.period
                      )
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => handleSlotSelection(slot)}
                  >
                    <div className="slot-info">
                      <span className="day">{slot.day}</span>
                      <span className="period">Period {slot.period}</span>
                    </div>
                    <div className="slot-time">
                      {slot.period <= 3 ? "Morning" : "Afternoon"}
                    </div>
                  </div>
                ))}
            </div>

            <button
              className="get-class-btn"
              onClick={handleGetClass}
              disabled={loading || !selectedSlots.length}
            >
              {loading ? "Processing..." : "Get Selected Classes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartRecommendModal;
