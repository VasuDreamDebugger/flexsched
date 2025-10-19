import axios from "axios";

const API_BASE = "http://localhost:3000/api";

const run = async () => {
  try {
    // Attempt admin login
    const loginRes = await axios.post(`${API_BASE}/admin/login`, {
      email: "developer@university.edu",
      password: "dev123",
    });
    console.log("Login response:", loginRes.data.success);
    const token = loginRes.data.data.token;

    // Attempt to call protected route
    const createRes = await axios.post(
      `${API_BASE}/admin/faculty/create`,
      {
        name: "Test API Faculty",
        email: "testapi@university.edu",
        password: "testpass",
        branch: ["CSE"],
        subjects: ["Testing"],
        employeeId: "API100",
        phoneNumber: "+911234567000",
        designation: "Lecturer",
        department: "CSE",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("Create faculty response:", createRes.data);
  } catch (error) {
    if (error.response) console.error("API error:", error.response.data);
    else console.error("Error:", error.message);
  }
};

run();
