import axios from "axios";

const API_BASE_URL = "https://flexsched-462e.vercel.app";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

export default apiClient;
export { API_BASE_URL };
