const API_BASE = "http://localhost:3000/api";

const run = async () => {
  try {
    const loginRes = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "developer@university.edu",
        password: "dev123",
      }),
    });

    const loginJson = await loginRes.json();
    console.log("Login response success:", loginJson.success);
    const token = loginJson.data?.token;

    if (!token) {
      console.error("No token received, aborting test");
      return;
    }

    const createRes = await fetch(`${API_BASE}/admin/faculty/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: "Test API Faculty",
        email: "testapi@university.edu",
        password: "testpass",
        branch: ["CSE"],
        subjects: ["Testing"],
        employeeId: "API100",
        phoneNumber: "+911234567000",
        designation: "Lecturer",
        department: "CSE",
      }),
    });

    const createJson = await createRes.json();
    console.log("Create faculty response:", createJson);
  } catch (error) {
    console.error("Error:", error);
  }
};

run();
