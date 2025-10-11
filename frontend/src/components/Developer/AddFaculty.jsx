import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AddFaculty.css';

const API_BASE_URL = 'http://localhost:3000/api';

const AddFaculty = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState('form'); // 'form' or 'csv'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    branch: [],
    subjects: [],
    employeeId: '',
    phoneNumber: '',
    designation: 'Lecturer',
    department: ''
  });
  const [csvData, setCsvData] = useState([]);
  const [csvFile, setCsvFile] = useState(null);

  const designations = [
    'Professor',
    'Associate Professor',
    'Assistant Professor',
    'Lecturer',
    'Guest Faculty'
  ];

  const branches = [
    'CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'AE', 'CS', 'IS', 'MCA'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBranchChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      branch: value.split(',').map(b => b.trim()).filter(b => b)
    }));
  };

  const handleSubjectsChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      subjects: value.split(',').map(s => s.trim()).filter(s => s)
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_BASE_URL}/admin/faculty/create`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('Faculty created successfully!');
        setFormData({
          name: '',
          email: '',
          password: '',
          branch: [],
          subjects: [],
          employeeId: '',
          phoneNumber: '',
          designation: 'Lecturer',
          department: ''
        });
      }
    } catch (error) {
      console.error('Error creating faculty:', error);
      alert('Error creating faculty. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCSVFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        parseCSV(text);
      };
      reader.readAsText(file);
    }
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        
        headers.forEach((header, index) => {
          row[header.toLowerCase().replace(' ', '')] = values[index] || '';
        });
        
        // Convert comma-separated strings to arrays
        if (row.branch) {
          row.branch = row.branch.split(';').map(b => b.trim()).filter(b => b);
        }
        if (row.subjects) {
          row.subjects = row.subjects.split(';').map(s => s.trim()).filter(s => s);
        }
        
        data.push(row);
      }
    }
    
    setCsvData(data);
  };

  const handleCSVSubmit = async (e) => {
    e.preventDefault();
    if (csvData.length === 0) {
      alert('Please upload a valid CSV file');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_BASE_URL}/admin/faculty/bulk-create`, {
        facultyData: csvData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert(`Successfully created ${response.data.data.created.length} faculty accounts!`);
        setCsvData([]);
        setCsvFile(null);
      }
    } catch (error) {
      console.error('Error creating faculties:', error);
      alert('Error creating faculties. Please check your CSV format.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-faculty-container">
      <div className="page-header">
        <h1>Add Faculty</h1>
        <button onClick={() => navigate('/developer')} className="btn-secondary">
          ← Back to Developer Dashboard
        </button>
      </div>

      <div className="upload-mode-selector">
        <button
          className={uploadMode === 'form' ? 'active' : ''}
          onClick={() => setUploadMode('form')}
        >
          Individual Form
        </button>
        <button
          className={uploadMode === 'csv' ? 'active' : ''}
          onClick={() => setUploadMode('csv')}
        >
          Bulk CSV Upload
        </button>
      </div>

      {uploadMode === 'form' ? (
        <div className="form-container">
          <h2>Create Faculty Account</h2>
          <form onSubmit={handleFormSubmit} className="faculty-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="employeeId">Employee ID *</label>
                <input
                  type="text"
                  id="employeeId"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter employee ID"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter password"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="department">Department *</label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter department"
                />
              </div>

              <div className="form-group">
                <label htmlFor="designation">Designation *</label>
                <select
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  required
                >
                  {designations.map(designation => (
                    <option key={designation} value={designation}>
                      {designation}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="branch">Branch (comma-separated) *</label>
                <input
                  type="text"
                  id="branch"
                  name="branch"
                  value={formData.branch.join(', ')}
                  onChange={handleBranchChange}
                  required
                  placeholder="e.g., CSE, IT"
                />
                <small>Available: {branches.join(', ')}</small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="subjects">Subjects (comma-separated) *</label>
              <input
                type="text"
                id="subjects"
                name="subjects"
                value={formData.subjects.join(', ')}
                onChange={handleSubjectsChange}
                required
                placeholder="e.g., Software Engineering, Database Management"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Faculty'}
              </button>
              <button type="button" onClick={() => navigate('/developer')} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="csv-container">
          <h2>Bulk Upload Faculty Data</h2>
          
          <div className="csv-info">
            <h3>CSV Format Requirements:</h3>
            <ul>
              <li>Headers: name, email, password, employeeId, department, designation, phoneNumber, branch, subjects</li>
              <li>Branch and subjects should be semicolon-separated (e.g., "CSE;IT" or "SE;DBMS;Web Tech")</li>
              <li>First row should contain headers</li>
              <li>Save as CSV format</li>
            </ul>
          </div>

          <form onSubmit={handleCSVSubmit} className="csv-form">
            <div className="form-group">
              <label htmlFor="csvFile">Select CSV File</label>
              <input
                type="file"
                id="csvFile"
                accept=".csv"
                onChange={handleCSVFileChange}
                required
              />
            </div>

            {csvData.length > 0 && (
              <div className="csv-preview">
                <h3>Preview ({csvData.length} records)</h3>
                <div className="preview-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Employee ID</th>
                        <th>Department</th>
                        <th>Branch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 5).map((row, index) => (
                        <tr key={index}>
                          <td>{row.name}</td>
                          <td>{row.email}</td>
                          <td>{row.employeeid}</td>
                          <td>{row.department}</td>
                          <td>{Array.isArray(row.branch) ? row.branch.join(', ') : row.branch}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvData.length > 5 && <p>... and {csvData.length - 5} more records</p>}
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading || csvData.length === 0}>
                {loading ? 'Uploading...' : `Upload ${csvData.length} Faculty Records`}
              </button>
              <button type="button" onClick={() => navigate('/developer')} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddFaculty;
