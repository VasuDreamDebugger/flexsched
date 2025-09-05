import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
 
import './index.css'

function FacultyPage() {
  const [allotedPeriod, setAllotedPeriod] = useState('');
  const [requestingPeriod, setRequestingPeriod] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!allotedPeriod || !requestingPeriod) {
      alert('Please select both allotted and requesting period');
      return;
    }
    if (allotedPeriod === requestingPeriod) {
      alert('Please select different periods');
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      setAllotedPeriod('');
      setRequestingPeriod('');
      setSubmitted(false);
    }, 5000);
  };
  
  const gotoDashboard = () => {
    navigate('/facultydashboard');
  }

  useEffect(() => {
    if (submitted) {
      const alert = document.querySelector('.alert-success');
      alert && alert.scrollIntoView({ behavior: 'smooth' });
    }
  }, [submitted]);

  return (
    <div className="outer-wrapper rounded">
      <div className="container mt-5">
        <div className="d-flex justify-content-between  card-1 p-3 mb-4 ">
          <div className="faculty-info">
            <h1>P.Sindhu</h1>
            <h4>Software Engineering</h4>
            <p>Computer Science & Engineering</p>
          </div>
          <div className='d-flex gap-3 align-items-center'>
            <li style={{listStyle:"none"}} className='fs-5' onClick={gotoDashboard}>Dashboard</li>
            <li style={{listStyle:"none"}} className='fs-5'>Edit Profile</li>
            <li style={{listStyle:"none"}} className='fs-5'>Logout</li>
          </div>
        </div>

        <div className="card p-4 mb-4">
          <h3>Faculty Timetable</h3>
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>9:30 - 10:30</th>
                  <th>10:30 - 11:30</th>
                  <th>11:40 - 12:40</th>
                  <th>1:30 - 2:30</th>
                  <th>2:30 - 3:30</th>
                  <th>3:40 - 4:40</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Monday</td>
                  <td>CSE-4</td>
                  <td>-</td>
                  <td>-</td>
                  <td>CSE-4</td>
                  <td>-</td>
                  <td>CSE-4</td>
                </tr>
                <tr>
                  <td>Tuesday</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>CSE-3</td>
                  <td>CSE-2</td>
                </tr>
                <tr>
                  <td>Wednesday</td>
                  <td>-</td>
                  <td>-</td>
                  <td>CSE-4</td>
                  <td colSpan={3}>CSE-4</td>
                </tr>
                <tr>
                  <td>Thursday</td>
                  <td>CSE-2</td>
                  <td colSpan={3}>CSE-3</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>Friday</td>
                  <td></td>
                  <td></td>
                  <td>-</td>
                  <td>CSE-4</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>Saturday</td>
                  <td>CSE-4</td>
                  <td>-</td>
                  <td>CSE-2</td>
                  <td colSpan={3}>-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-4 mb-4">
          <h3>Section-3 Timetable</h3>
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>P1</th>
                  <th>P2</th>
                  <th>P3</th>
                  <th>P4</th>
                  <th>P5</th>
                  <th>P6</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Monday</td>
                  <td colSpan={3}>OS-Lab</td>
                  <td>CN</td>
                  <td>NPTEL</td>
                  <td>NPTEL</td>
                </tr>
                <tr>
                  <td>Tuesday</td>
                  <td>SE</td>
                  <td>NPTEL</td>
                  <td>NPTEL</td>
                  <td colSpan={3}>SE-lab</td>
                </tr>
                <tr>
                  <td>Wednesday</td>
                  <td>SE</td>
                  <td>OS</td>
                  <td>CN</td>
                  <td colSpan={3}>CN-lab</td>
                </tr>
                <tr>
                  <td>Thursday</td>
                  <td colSpan={3}>Eng-Lab</td>
                  <td>OS</td>
                  <td>NPTEL</td>
                  <td></td>
                </tr>
                <tr>
                  <td>Friday</td>
                  <td>NPTEL</td>
                  <td>OS</td>
                  <td>SE</td>
                  <td colSpan={3}>-</td>
                </tr>
                <tr>
                  <td>Saturday</td>
                  <td colSpan={3}></td>
                  <td>CN</td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-4 mb-5 swap-request-card">
          <h3>Swap Request</h3>
          <div className="dropdowns-wrapper">
            <div className="col-md-6">
              <label className="form-label">Allotted period to swap</label>
              <select className="form-select" value={allotedPeriod} onChange={(e) => setAllotedPeriod(e.target.value)}>
                <option value="">Select your period</option>
                <option value="mon-p2">M2</option>
                <option value="mon-p5">M5</option>
                <option value="tue-p1">T1</option>
                <option value="tue-p4">T4</option>
                <option value="tue-p5">T5</option>
                <option value="tue-p6">T6</option>
                <option value="wed-p1">W1</option>
                <option value="wed-p4">W4</option>
                <option value="thu-p2">TH2</option>
                <option value="thu-p4">TH4</option>
                <option value="thu-p5">TH5</option>
                <option value="thu-p6">TH6</option>
                <option value="fri-p3">F3</option>
                <option value="fri-p5">F5</option>
                <option value="sat-p1">S1</option>
                <option value="sat-p3">S3</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Requesting Period to Swap</label>
              <select className="form-select" value={requestingPeriod} onChange={(e) => setRequestingPeriod(e.target.value)}>
                <option value="">Select requesting period</option>
                <option value="mon-p1">M1</option>
                <option value="mon-p3">M3</option>
                <option value="mon-p4">M4</option>
                <option value="mon-p6">M6</option>
                <option value="tue-p2">T2</option>
                <option value="wed-p2">W2</option>
                <option value="wed-p3">W3</option>
                <option value="wed-p5">W5</option>
                <option value="wed-p6">W6</option>
                <option value="thu-p1">TH1</option>
                <option value="thu-p3">TH3</option>
                <option value="fri-p1">F1</option>
                <option value="fri-p2">F2</option>
                <option value="fri-p4">F4</option>
                <option value="fri-p6">F6</option>
                <option value="sat-p2">S2</option>
                <option value="sat-p4">S4</option>
                <option value="sat-p5">S5</option>
                <option value="sat-p6">S6</option>
              </select>
            </div>
          </div>

          <div className="d-flex justify-content-center gap-3 mt-4">
            <button className="btn btn-primary px-4" onClick={handleSubmit} disabled={submitted}>
              {submitted ? 'Submitting...' : 'Submit Swap request'}
            </button>
            <button className="btn btn-secondary" onClick={() => {
              setAllotedPeriod('');
              setRequestingPeriod('');
            }}>
              Reset
            </button>
          </div>

          {submitted && (
            <div className="alert alert-success mt-4" role="alert">
              Swap request submitted successfully! You will be notified once it's reviewed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FacultyPage;
