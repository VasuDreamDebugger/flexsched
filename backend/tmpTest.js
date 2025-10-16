const API = "http://localhost:3000/api";

(async () => {
  try {
    const loginRes = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "p.sindhu@university.edu",
        password: "password123",
      }),
    });
    const login = await loginRes.json();
    console.log("login", login);
    const token = login?.data?.token;

    const payload = {
      yourClassId: "68f0f3c271325d6aea9e37b5",
      requestedClassId: "68f0f3c271325d6aea9e37b6",
      yourDay: "Monday",
      yourPeriod: 1,
      requestedDay: "Tuesday",
      requestedPeriod: 2,
      swapDate: "2025-10-20",
      reason: "test swap via script",
    };

    const swapRes = await fetch(`${API}/class-swap/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const swap = await swapRes.json();
    console.log("swap response", swapRes.status, swap);
  } catch (err) {
    console.error(err);
  }
})();
