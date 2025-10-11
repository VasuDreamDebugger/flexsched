import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TimetableView.css';

const API_BASE_URL = 'http://localhost:3000/api';

const TimetableView = ({ faculty, onSwapRequest }) => {
  const [facultyTimetable, setFacultyTimetable] = useState(null);
  const [availableClasses, setAvailableClasses] = useState({});
  const [selectedClass, setSelectedClass] = useState({
    year: '',
    branch: '',
    section: ''
  });
  const [classTimetable, setClassTimetable] = useState(null);
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const [loading, setLoading] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = [1, 2, 3, 4, 5, 6];
  const periodTimings = {
    1: { start: "09:00", end: "10:00" },
    2: { start: "10:00", end: "11:00" },
    3: { start: "11:00", end: "12:00" },
    4: { start: "13:00", end: "14:00" },
    5: { start: "14:00", end: "15:00" },
    6: { start: "15:00", end: "16:00" }
  };

  useEffect(() => {
    fetchFacultyTimetable();
    fetchAvailableClasses();
  }, []);

  useEffect(() => {
    if (selectedClass.year && selectedClass.branch && selectedClass.section) {
      fetchClassTimetable();
    }
  }, [selectedClass]);

  const fetchFacultyTimetable = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/timetable/faculty`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFacultyTimetable(response.data.data.timetable);
    } catch (error) {
      console.error('Error fetching faculty timetable:', error);
    }
  };

  const fetchAvailableClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/timetable/classes/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableClasses(response.data.data.classes);
    } catch (error) {
      console.error('Error fetching available classes:', error);
    }
  };

  const fetchClassTimetable = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/timetable/classes`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          year: selectedClass.year,
          branch: selectedClass.branch,
          section: selectedClass.section
        }
      });
      
      const sections = response.data.data.sections;
      const targetSection = sections.find(s => s.section === selectedClass.section);
      setClassTimetable(targetSection);
    } catch (error) {
      console.error('Error fetching class timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  // NEW LOGIC: Handle period selection for class timetable only
  const handlePeriodClick = (day, period, slot) => {
    if (!slot) return; // Don't allow clicking on empty slots
    
    const periodKey = `${day}-${period}`;
    
    if (selectedPeriods.length === 0) {
      // First selection - must be faculty's own class
      if (slot.faculty === faculty?.name) {
        setSelectedPeriods([{ day, period, slot, isFacultyClass: true }]);
      } else {
        alert('Please select your own class first');
      }
    } else if (selectedPeriods.length === 1) {
      // Second selection - must be different faculty's class
      if (slot.faculty !== faculty?.name && selectedPeriods[0].day !== day) {
        setSelectedPeriods([...selectedPeriods, { day, period, slot, isFacultyClass: false }]);
      } else if (slot.faculty === faculty?.name) {
        alert('Please select a different faculty\'s class to swap with');
      } else if (selectedPeriods[0].day === day) {
        alert('Please select a different day');
      }
    } else {
      // Reset selection
      setSelectedPeriods([{ day, period, slot, isFacultyClass: slot.faculty === faculty?.name }]);
    }
  };

  const getCellClass = (day, period, slot) => {
    let classes = 'timetable-cell';
    
    if (slot) {
      if (slot.faculty === faculty?.name) {
        classes += ' faculty-class';
      } else {
        classes += ' other-faculty-class';
      }
      
      const isSelected = selectedPeriods.some(p => p.day === day && p.period === period);
      if (isSelected) {
        classes += ' selected';
      }
    }
    
    return classes;
  };

  const getSampleClassTimetable = () => {
    // Real faculty IDs from database
    const facultyIds = {
      "Dr. P. Sindhu": "68ea3064e63c40c60c310363",
      "Dr. R. Kumar": "68ea3065e63c40c60c310365", 
      "Dr. S. Reddy": "68ea3066e63c40c60c310367",
      "Dr. A. Sharma": "68ea3067e63c40c60c310369",
      "Dr. M. Patel": "68ea3069e63c40c60c31036b",
      "Dr. V. Rao": "68ea30b12dc46ef2b04b1886"
    };

    const sampleData = {
      "CSE": {
        "3rd Year": {
          "A": [
            { day: "Monday", periods: [1, 2], subject: "Software Engineering", faculty: "Dr. P. Sindhu", facultyId: facultyIds["Dr. P. Sindhu"], room: "CS-101", isLab: false },
            { day: "Monday", periods: [4], subject: "Database Management", faculty: "Dr. R. Kumar", facultyId: facultyIds["Dr. R. Kumar"], room: "CS-102", isLab: false },
            { day: "Tuesday", periods: [3, 4], subject: "Web Technologies", faculty: "Dr. S. Reddy", facultyId: facultyIds["Dr. S. Reddy"], room: "CS-103", isLab: false },
            { day: "Wednesday", periods: [1, 2], subject: "Data Structures", faculty: "Dr. A. Sharma", facultyId: facultyIds["Dr. A. Sharma"], room: "CS-104", isLab: false },
            { day: "Wednesday", periods: [5, 6], subject: "Software Engineering Lab", faculty: "Dr. P. Sindhu", facultyId: facultyIds["Dr. P. Sindhu"], room: "CS-Lab-1", isLab: true },
            { day: "Thursday", periods: [2, 3], subject: "Database Lab", faculty: "Dr. R. Kumar", facultyId: facultyIds["Dr. R. Kumar"], room: "CS-Lab-2", isLab: true },
            { day: "Friday", periods: [1], subject: "Software Engineering", faculty: "Dr. P. Sindhu", facultyId: facultyIds["Dr. P. Sindhu"], room: "CS-101", isLab: false },
            { day: "Saturday", periods: [3, 4], subject: "Web Technologies Lab", faculty: "Dr. S. Reddy", facultyId: facultyIds["Dr. S. Reddy"], room: "CS-Lab-1", isLab: true }
          ],
          "B": [
            { day: "Monday", periods: [2, 3], subject: "Computer Networks", faculty: "Dr. M. Patel", facultyId: facultyIds["Dr. M. Patel"], room: "CS-105", isLab: false },
            { day: "Tuesday", periods: [1, 2], subject: "Software Engineering", faculty: "Dr. P. Sindhu", facultyId: facultyIds["Dr. P. Sindhu"], room: "CS-101", isLab: false },
            { day: "Wednesday", periods: [4, 5], subject: "Database Management", faculty: "Dr. R. Kumar", facultyId: facultyIds["Dr. R. Kumar"], room: "CS-102", isLab: false },
            { day: "Thursday", periods: [1, 2], subject: "Web Technologies", faculty: "Dr. S. Reddy", facultyId: facultyIds["Dr. S. Reddy"], room: "CS-103", isLab: false },
            { day: "Thursday", periods: [5, 6], subject: "Computer Networks Lab", faculty: "Dr. M. Patel", facultyId: facultyIds["Dr. M. Patel"], room: "CS-Lab-2", isLab: true },
            { day: "Friday", periods: [3, 4], subject: "Data Structures", faculty: "Dr. A. Sharma", facultyId: facultyIds["Dr. A. Sharma"], room: "CS-104", isLab: false },
            { day: "Saturday", periods: [1, 2], subject: "Software Engineering Lab", faculty: "Dr. P. Sindhu", facultyId: facultyIds["Dr. P. Sindhu"], room: "CS-Lab-1", isLab: true }
          ]
        },
        "2nd Year": {
          "A": [
            { day: "Monday", periods: [1, 2], subject: "Object Oriented Programming", faculty: "Dr. S. Reddy", facultyId: facultyIds["Dr. S. Reddy"], room: "CS-201", isLab: false },
            { day: "Tuesday", periods: [3, 4], subject: "Data Structures", faculty: "Dr. A. Sharma", facultyId: facultyIds["Dr. A. Sharma"], room: "CS-202", isLab: false },
            { day: "Wednesday", periods: [2, 3], subject: "Computer Networks", faculty: "Dr. M. Patel", facultyId: facultyIds["Dr. M. Patel"], room: "CS-203", isLab: false },
            { day: "Thursday", periods: [1, 2], subject: "Database Systems", faculty: "Dr. R. Kumar", facultyId: facultyIds["Dr. R. Kumar"], room: "CS-204", isLab: false },
            { day: "Friday", periods: [5, 6], subject: "OOP Lab", faculty: "Dr. S. Reddy", facultyId: facultyIds["Dr. S. Reddy"], room: "CS-Lab-1", isLab: true },
            { day: "Saturday", periods: [3, 4], subject: "Data Structures Lab", faculty: "Dr. A. Sharma", facultyId: facultyIds["Dr. A. Sharma"], room: "CS-Lab-2", isLab: true }
          ]
        }
      },
      "IT": {
        "3rd Year": {
          "A": [
            { day: "Monday", periods: [2, 3], subject: "Information Security", faculty: "Dr. A. Sharma", facultyId: facultyIds["Dr. A. Sharma"], room: "IT-101", isLab: false },
            { day: "Tuesday", periods: [1, 2], subject: "Software Testing", faculty: "Dr. P. Sindhu", facultyId: facultyIds["Dr. P. Sindhu"], room: "IT-102", isLab: false },
            { day: "Wednesday", periods: [4, 5], subject: "Mobile Computing", faculty: "Dr. R. Kumar", facultyId: facultyIds["Dr. R. Kumar"], room: "IT-103", isLab: false },
            { day: "Thursday", periods: [3, 4], subject: "Information Security Lab", faculty: "Dr. A. Sharma", facultyId: facultyIds["Dr. A. Sharma"], room: "IT-Lab-1", isLab: true },
            { day: "Friday", periods: [1, 2], subject: "Software Testing Lab", faculty: "Dr. P. Sindhu", facultyId: facultyIds["Dr. P. Sindhu"], room: "IT-Lab-2", isLab: true },
            { day: "Saturday", periods: [2, 3], subject: "Mobile Computing Lab", faculty: "Dr. R. Kumar", facultyId: facultyIds["Dr. R. Kumar"], room: "IT-Lab-1", isLab: true }
          ]
        }
      },
      "ECE": {
        "3rd Year": {
          "C": [
            { day: "Monday", periods: [1, 2], subject: "Digital Electronics", faculty: "Dr. V. Rao", facultyId: facultyIds["Dr. V. Rao"], room: "ECE-101", isLab: false },
            { day: "Monday", periods: [4], subject: "Signals & Systems", faculty: "Dr. V. Rao", facultyId: facultyIds["Dr. V. Rao"], room: "ECE-102", isLab: false },
            { day: "Monday", periods: [5, 6], subject: "Digital Electronics Lab", faculty: "Dr. V. Rao", facultyId: facultyIds["Dr. V. Rao"], room: "ECE-Lab-1", isLab: true },
            { day: "Tuesday", periods: [1], subject: "Communication Systems", faculty: "Dr. V. Rao", facultyId: facultyIds["Dr. V. Rao"], room: "ECE-103", isLab: false },
            { day: "Tuesday", periods: [2, 3], subject: "VLSI Design", faculty: "Dr. V. Rao", facultyId: facultyIds["Dr. V. Rao"], room: "ECE-104", isLab: false },
            { day: "Tuesday", periods: [4, 5, 6], subject: "Signals & Systems Lab", faculty: "Dr. V. Rao", facultyId: facultyIds["Dr. V. Rao"], room: "ECE-Lab-2", isLab: true },
            { day: "Wednesday", periods: [1, 2], subject: "Digital Electronics", faculty: "Dr. V. Rao", facultyId: facultyIds["Dr. V. Rao"], room: "ECE-101", isLab: false },
            { day: "Wednesday", periods: [3], subject: "Communication Systems", faculty: "Dr. V. Rao", facultyId: facultyIds["Dr. V. Rao"], room: "ECE-103", isLab: false },
            { day: "Wednesday", periods: [5, 6], subject: "VLSI Design Lab", faculty: "Dr. V. Rao", facultyId: facultyIds["Dr. V. Rao"], room: "ECE-Lab-1", isLab: true },
            { day: "Thursday", periods: [1, 2, 3], subject: "Communication Systems Lab", faculty: "Dr. V. Rao", facultyId: facultyIds["Dr. V. Rao"], room: "ECE-Lab-2", isLab: true },
            { day: "Thursday", periods: [4], subject: "Signals & Systems", faculty: "Dr. V. Rao", facultyId: facultyIds["Dr. V. Rao"], room: "ECE-102", isLab: false },
            { day: "Friday", periods: [1], subject: "VLSI Design", faculty: "Dr. V. Rao", facultyId: facultyIds["Dr. V. Rao"], room: "ECE-104", isLab: false },
            { day: "Friday", periods: [2, 3], subject: "Digital Electronics", faculty: "Dr. V. Rao", facultyId: facultyIds["Dr. V. Rao"], room: "ECE-101", isLab: false },
            { day: "Friday", periods: [4, 5, 6], subject: "Microprocessor Lab", faculty: "Dr. V. Rao", facultyId: facultyIds["Dr. V. Rao"], room: "ECE-Lab-1", isLab: true },
            { day: "Saturday", periods: [1, 2], subject: "Communication Systems", faculty: "Dr. V. Rao", facultyId: facultyIds["Dr. V. Rao"], room: "ECE-103", isLab: false },
            { day: "Saturday", periods: [3], subject: "Signals & Systems", faculty: "Dr. V. Rao", facultyId: facultyIds["Dr. V. Rao"], room: "ECE-102", isLab: false },
            { day: "Saturday", periods: [4, 5, 6], subject: "Embedded Systems Lab", faculty: "Dr. V. Rao", facultyId: facultyIds["Dr. V. Rao"], room: "ECE-Lab-2", isLab: true }
          ]
        }
      }
    };

    return sampleData[selectedClass.branch]?.[selectedClass.year]?.[selectedClass.section] || [];
  };

  const renderTimetable = (timetable, isFacultyTimetable = false) => {
    if (!timetable) return null;

    return (
      <table className="timetable-table">
        <thead>
          <tr>
            <th>Day</th>
            {periods.map(period => (
              <th key={period}>
                P{period}<br/>
                <small>{periodTimings[period].start} - {periodTimings[period].end}</small>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map(day => (
            <tr key={day}>
              <td className="day-header">{day}</td>
              {periods.map(period => {
                const slot = timetable.timeSlots?.find(ts => 
                  ts.day === day && ts.periods.includes(period)
                );
                
                return (
                  <td
                    key={`${day}-${period}`}
                    className={getCellClass(day, period, slot)}
                    onClick={() => handlePeriodClick(day, period, slot)}
                    style={{ cursor: slot ? 'pointer' : 'default' }}
                  >
                    {slot ? (
                      <div className={`class-slot ${slot.isLab ? 'lab' : ''}`}>
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
    const sampleTimetable = getSampleClassTimetable();

    return (
      <table className="timetable-table">
        <thead>
          <tr>
            <th>Day</th>
            {periods.map(period => (
              <th key={period}>
                P{period}<br/>
                <small>{periodTimings[period].start} - {periodTimings[period].end}</small>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map(day => (
            <tr key={day}>
              <td className="day-header">{day}</td>
              {periods.map(period => {
                const slot = sampleTimetable.find(s => 
                  s.day === day && s.periods.includes(period)
                );
                
                return (
                  <td
                    key={`${day}-${period}`}
                    className={getCellClass(day, period, slot)}
                    onClick={() => handlePeriodClick(day, period, slot)}
                    style={{ cursor: slot ? 'pointer' : 'default' }}
                  >
                    {slot ? (
                      <div className={`class-slot ${slot.isLab ? 'lab' : ''}`} title={`Faculty: ${slot.faculty}\nRoom: ${slot.room}\nTime: ${periodTimings[period].start} - ${periodTimings[period].end}`}>
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
      const requesterClass = selectedPeriods.find(p => p.isFacultyClass);
      const targetClass = selectedPeriods.find(p => !p.isFacultyClass);
      
      onSwapRequest({
        requesterClass: {
          day: requesterClass.day,
          period: requesterClass.period,
          slot: requesterClass.slot
        },
        targetClass: {
          day: targetClass.day,
          period: targetClass.period,
          slot: targetClass.slot
        },
        selectedPeriods
      });
    }
  };

  return (
    <div className="timetable-container">
      {/* Faculty Timetable */}
      <div className="timetable-section">
        <div className="section-header">
          <h3>Your Timetable</h3>
        </div>
        <div className="table-wrapper">
          {renderTimetable(facultyTimetable, true)}
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
              onChange={(e) => setSelectedClass({...selectedClass, year: e.target.value, branch: '', section: ''})}
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
              onChange={(e) => setSelectedClass({...selectedClass, branch: e.target.value, section: ''})}
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
              onChange={(e) => setSelectedClass({...selectedClass, section: e.target.value})}
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
            <h3>{selectedClass.branch} {selectedClass.year} - Section {selectedClass.section} Timetable</h3>
            <p className="instruction-text">Click on your class first, then click on another faculty's class to request a swap</p>
          </div>
          <div className="table-wrapper">
            {renderClassTimetable()}
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
                  <p><strong>Day:</strong> {selectedPeriods[0].day}</p>
                  <p><strong>Period:</strong> {selectedPeriods[0].period}</p>
                  <p><strong>Subject:</strong> {selectedPeriods[0].slot.subject}</p>
                  <p><strong>Time:</strong> {periodTimings[selectedPeriods[0].period].start} - {periodTimings[selectedPeriods[0].period].end}</p>
                </div>
              </div>
              
              <div className="swap-arrow">⇄</div>
              
              <div className="class-card target">
                <h4>Requested Class</h4>
                <div className="class-details">
                  <p><strong>Day:</strong> {selectedPeriods[1].day}</p>
                  <p><strong>Period:</strong> {selectedPeriods[1].period}</p>
                  <p><strong>Subject:</strong> {selectedPeriods[1].slot.subject}</p>
                  <p><strong>Faculty:</strong> {selectedPeriods[1].slot.faculty}</p>
                  <p><strong>Time:</strong> {periodTimings[selectedPeriods[1].period].start} - {periodTimings[selectedPeriods[1].period].end}</p>
                </div>
              </div>
            </div>
            <div className="swap-actions">
              <button 
                className="btn btn-primary"
                onClick={handleSwapRequest}
              >
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