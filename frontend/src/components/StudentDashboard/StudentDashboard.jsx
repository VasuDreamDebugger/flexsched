import './index.css'

import { useState } from 'react';

const Students = () => {
  const [currentBranch, setCurrentBranch] = useState('');
  const [currentSection, setCurrentSection] = useState('');
  const [currentScheduleType, setCurrentScheduleType] = useState('default');
  const [showLoginOverlay, setShowLoginOverlay] = useState(true);
  const [loginBranch, setLoginBranch] = useState('');
  const [loginSection, setLoginSection] = useState('');

  // Sample schedule data
  const scheduleData = {
    cse: {
      1: {
        default: [
          { time: '9:00 AM', subject: 'Data Structures', room: 'Room 301', professor: 'Dr. Kumar', status: 'current' },
          { time: '11:00 AM', subject: 'Computer Networks', room: 'Lab 205', professor: 'Prof. Sharma', status: 'upcoming' },
          { time: '2:00 PM', subject: 'Database Systems', room: 'Room 302', professor: 'Dr. Patel', status: 'later' },
          { time: '4:00 PM', subject: 'Software Engineering', room: 'Room 303', professor: 'Prof. Singh', status: 'later' }
        ],
        changed: [
          { time: '9:00 AM', subject: 'Data Structures', room: 'Room 301', professor: 'Dr. Kumar', status: 'current' },
          { time: '11:00 AM', subject: 'Computer Networks', room: 'Lab 206', professor: 'Prof. Sharma', status: 'upcoming', changed: true },
          { time: '2:00 PM', subject: 'Machine Learning', room: 'Room 304', professor: 'Dr. Gupta', status: 'later', changed: true },
          { time: '4:00 PM', subject: 'Software Engineering', room: 'Room 303', professor: 'Prof. Singh', status: 'cancelled', changed: true }
        ]
      },
      2: {
        default: [
          { time: '10:00 AM', subject: 'Algorithms', room: 'Room 401', professor: 'Dr. Verma', status: 'current' },
          { time: '12:00 PM', subject: 'Operating Systems', room: 'Lab 301', professor: 'Prof. Jain', status: 'upcoming' },
          { time: '3:00 PM', subject: 'Web Development', room: 'Room 402', professor: 'Dr. Agarwal', status: 'later' }
        ],
        changed: [
          { time: '10:00 AM', subject: 'Algorithms', room: 'Room 401', professor: 'Dr. Verma', status: 'current' },
          { time: '12:00 PM', subject: 'Operating Systems', room: 'Lab 302', professor: 'Prof. Jain', status: 'upcoming', changed: true },
          { time: '3:00 PM', subject: 'Web Development', room: 'Room 402', professor: 'Dr. Agarwal', status: 'later' }
        ]
      }
    },
    ece: {
      1: {
        default: [
          { time: '9:00 AM', subject: 'Digital Electronics', room: 'Room 501', professor: 'Dr. Reddy', status: 'current' },
          { time: '11:00 AM', subject: 'Signal Processing', room: 'Lab 401', professor: 'Prof. Nair', status: 'upcoming' },
          { time: '2:00 PM', subject: 'Communication Systems', room: 'Room 502', professor: 'Dr. Iyer', status: 'later' }
        ],
        changed: [
          { time: '9:00 AM', subject: 'Digital Electronics', room: 'Room 501', professor: 'Dr. Reddy', status: 'current' },
          { time: '11:00 AM', subject: 'Signal Processing', room: 'Lab 402', professor: 'Prof. Nair', status: 'upcoming', changed: true },
          { time: '2:00 PM', subject: 'Microprocessors', room: 'Room 503', professor: 'Dr. Menon', status: 'later', changed: true }
        ]
      },
      2: {
        default: [
          { time: '10:00 AM', subject: 'VLSI Design', room: 'Room 601', professor: 'Dr. Pillai', status: 'current' },
          { time: '1:00 PM', subject: 'Embedded Systems', room: 'Lab 501', professor: 'Prof. Krishnan', status: 'upcoming' },
          { time: '4:00 PM', subject: 'Control Systems', room: 'Room 602', professor: 'Dr. Raman', status: 'later' }
        ],
        changed: [
          { time: '10:00 AM', subject: 'VLSI Design', room: 'Room 601', professor: 'Dr. Pillai', status: 'current' },
          { time: '1:00 PM', subject: 'Embedded Systems', room: 'Lab 502', professor: 'Prof. Krishnan', status: 'upcoming', changed: true },
          { time: '4:00 PM', subject: 'Control Systems', room: 'Room 602', professor: 'Dr. Raman', status: 'later' }
        ]
      }
    }
  };

  const handleLogin = () => {
    setCurrentBranch(loginBranch);
    setCurrentSection(loginSection);
    setShowLoginOverlay(false);
  };

  const handleBranchChange = (branch) => {
    setCurrentBranch(branch);
    if (!branch) {
      setCurrentSection('');
    }
  };

  const handleSectionChange = (section) => {
    setCurrentSection(section);
  };

  const handleScheduleItemClick = (item) => {
    alert(`${item.subject} at ${item.time}\nClick the location icon for directions to the classroom.`);
  };

  const handleLocationClick = (e, room) => {
    e.stopPropagation();
    alert(`Getting directions to ${room}...`);
  };

  const handleQuickActionClick = (action) => {
    alert(`Opening ${action}...`);
  };

  const handleNotificationClick = () => {
    alert('You have 3 new notifications:\n• Schedule change for Physics\n• New assignment posted\n• Grade updated for Math Quiz');
  };

  const renderScheduleItem = (item, index) => {
    const statusColors = {
      current: 'status-current',
      upcoming: 'status-upcoming',
      later: 'status-later',
      cancelled: 'status-cancelled'
    };

    return (
      <div
        key={index}
        className={`schedule-item ${item.changed ? 'schedule-item-changed' : 'schedule-item-default'}`}
        onClick={() => handleScheduleItemClick(item)}
      >
        <div className="schedule-item-content">
          <div className="schedule-item-left">
            <div className="schedule-time">
              <p className="time-hour">{item.time.split(' ')[0]}</p>
              <p className="time-period">{item.time.split(' ')[1]}</p>
            </div>
            <div className="schedule-details">
              <h4 className="subject-name">{item.subject}</h4>
              <p className="room-professor">{item.room} • {item.professor}</p>
              {item.changed && <p className="change-indicator">⚠️ Schedule Changed</p>}
            </div>
          </div>
          <div className="schedule-item-right">
            <span className={`status-badge ${statusColors[item.status]}`}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </span>
            <button
              className="location-btn"
              onClick={(e) => handleLocationClick(e, item.room)}
            >
              <span>📍</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderScheduleContent = (type) => {
    const schedule = scheduleData[currentBranch]?.[currentSection]?.[type];
    
    if (!currentBranch || !currentSection) {
      return (
        <div className="empty-state">
          <span className="empty-icon">📚</span>
          <p>Please select your branch and section to view the {type} schedule</p>
        </div>
      );
    }

    if (!schedule) {
      return (
        <div className="empty-state">
          <span className="empty-icon">❌</span>
          <p>No schedule found for {currentBranch.toUpperCase()} Section {currentSection}</p>
        </div>
      );
    }

    return (
      <div className="schedule-list">
        {schedule.map((item, index) => renderScheduleItem(item, index))}
      </div>
    );
  };

  const getWelcomeText = () => {
    if (currentBranch && currentSection) {
      return `Here's the schedule for ${currentBranch.toUpperCase()} Section ${currentSection}`;
    }
    return "Please select your branch and section to view your schedule";
  };

  return (
    <div className="student-dashboard">
      {/* Login Overlay */}
      {showLoginOverlay && (
        <div className="login-overlay">
          <div className="login-modal">
            <div className="login-header">
              <div className="login-icon">
                <span>🎓</span>
              </div>
              <h2>Student Login</h2>
              <p>Select your branch and section to view your timetable</p>
            </div>
            
            <div className="login-form">
              <div className="form-group">
                <label>Branch</label>
                <select
                  value={loginBranch}
                  onChange={(e) => setLoginBranch(e.target.value)}
                >
                  <option value="">Select Branch</option>
                  <option value="cse">Computer Science Engineering (CSE)</option>
                  <option value="ece">Electronics & Communication Engineering (ECE)</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Section</label>
                <select
                  value={loginSection}
                  onChange={(e) => setLoginSection(e.target.value)}
                  disabled={!loginBranch}
                >
                  <option value="">Select Section</option>
                  <option value="1">Section 1</option>
                  <option value="2">Section 2</option>
                  <option value="3">Section 3</option>
                  <option value="4">Section 4</option>
                </select>
              </div>
              
              <button
                className="login-button"
                onClick={handleLogin}
                disabled={!loginBranch || !loginSection}
              >
                Access Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-container">
          <div className="header-left">
            <div className="logo">
              <span>📚</span>
            </div>
            <div className="brand">
              <h1>FlexSched</h1>
              <p>Todays Dashboard</p>
            </div>
          </div>
          
          <div className="header-right">
            <div className="student-selection">
              <select
                value={currentBranch}
                onChange={(e) => handleBranchChange(e.target.value)}
              >
                <option value="">Select Branch</option>
                <option value="cse">CSE</option>
                <option value="ece">ECE</option>
              </select>
              <select
                value={currentSection}
                onChange={(e) => handleSectionChange(e.target.value)}
                disabled={!currentBranch}
              >
                <option value="">Select Section</option>
                <option value="1">Section 1</option>
                <option value="2">Section 2</option>
                <option value="3">Section 3</option>
                <option value="4">Section 4</option>
              </select>
            </div>
            
            <div className="notification-container">
              <button className="notification-btn" onClick={handleNotificationClick}>
                <span>🔔</span>
                <div className="notification-dot"></div>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="main-container">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h2>Welcome! 👋</h2>
          <p>{getWelcomeText()}</p>
        </div>

        {/* Quick Stats */}
        <div className="stats-grid">
          <div className="stat-card card-hover">
            <div className="stat-content">
              <div className="stat-info">
                <p className="stat-label">Today's Classes</p>
                <p className="stat-value">5</p>
              </div>
              <div className="stat-icon stat-icon-blue">
                <span>📖</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card card-hover">
            <div className="stat-content">
              <div className="stat-info">
                <p className="stat-label">Assignments Due</p>
                <p className="stat-value stat-value-red">3</p>
              </div>
              <div className="stat-icon stat-icon-red">
                <span>📝</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card card-hover">
            <div className="stat-content">
              <div className="stat-info">
                <p className="stat-label">Attendance</p>
                <p className="stat-value stat-value-green">92%</p>
              </div>
              <div className="stat-icon stat-icon-green">
                <span>✅</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card card-hover">
            <div className="stat-content">
              <div className="stat-info">
                <p className="stat-label">GPA</p>
                <p className="stat-value stat-value-purple">3.8</p>
              </div>
              <div className="stat-icon stat-icon-purple">
                <span>🎯</span>
              </div>
            </div>
          </div>
        </div>

        <div className="content-grid">
          {/* Schedule Section */}
          <div className="schedule-section">
            <div className="schedule-card">
              <div className="schedule-header">
                <h3>Schedule</h3>
                <div className="schedule-tabs">
                  <button
                    className={`schedule-tab ${currentScheduleType === 'default' ? 'schedule-tab-active' : ''}`}
                    onClick={() => setCurrentScheduleType('default')}
                  >
                    Default Schedule
                  </button>
                  <button
                    className={`schedule-tab ${currentScheduleType === 'changed' ? 'schedule-tab-active' : ''}`}
                    onClick={() => setCurrentScheduleType('changed')}
                  >
                    Changed Schedule
                  </button>
                </div>
              </div>
              
              <div className="schedule-content">
                {currentScheduleType === 'default' ? 
                  renderScheduleContent('default') : 
                  renderScheduleContent('changed')
                }
              </div>
              
              <div className="schedule-footer">
                <button className="view-full-btn">
                  View Full Timetable →
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="sidebar">
            {/* Quick Actions */}
            <div className="sidebar-card">
              <h3>Quick Actions</h3>
              <div className="quick-actions">
                <button 
                  className="quick-action-btn"
                  onClick={() => handleQuickActionClick('View Full Timetable')}
                >
                  <span>📅</span>
                  <span>View Full Timetable</span>
                </button>
                <button 
                  className="quick-action-btn"
                  onClick={() => handleQuickActionClick('Attendance Report')}
                >
                  <span>📊</span>
                  <span>Attendance Report</span>
                </button>
                <button 
                  className="quick-action-btn"
                  onClick={() => handleQuickActionClick('Assignment Tracker')}
                >
                  <span>📋</span>
                  <span>Assignment Tracker</span>
                </button>
                <button 
                  className="quick-action-btn"
                  onClick={() => handleQuickActionClick('Grade Summary')}
                >
                  <span>🎓</span>
                  <span>Grade Summary</span>
                </button>
              </div>
            </div>

            {/* Upcoming Assignments */}
            <div className="sidebar-card">
              <h3>Upcoming Assignments</h3>
              <div className="assignments">
                <div className="assignment-item assignment-urgent">
                  <div className="assignment-info">
                    <p className="assignment-title">Math Assignment</p>
                    <p className="assignment-due">Due Tomorrow</p>
                  </div>
                  <span className="assignment-icon">⚠️</span>
                </div>
                <div className="assignment-item assignment-warning">
                  <div className="assignment-info">
                    <p className="assignment-title">Physics Lab Report</p>
                    <p className="assignment-due">Due in 3 days</p>
                  </div>
                  <span className="assignment-icon">📝</span>
                </div>
                <div className="assignment-item assignment-info">
                  <div className="assignment-info">
                    <p className="assignment-title">CS Project</p>
                    <p className="assignment-due">Due next week</p>
                  </div>
                  <span className="assignment-icon">💻</span>
                </div>
              </div>
            </div>

            {/* Recent Notifications */}
            <div className="sidebar-card">
              <h3>Notifications</h3>
              <div className="notifications">
                <div className="notification-item notification-blue">
                  <p className="notification-title">Schedule Change</p>
                  <p className="notification-desc">Physics class moved to Lab 206</p>
                  <p className="notification-time">2 hours ago</p>
                </div>
                <div className="notification-item notification-green">
                  <p className="notification-title">Grade Posted</p>
                  <p className="notification-desc">Math Quiz - Grade: A-</p>
                  <p className="notification-time">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Students;