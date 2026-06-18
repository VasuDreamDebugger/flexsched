import axios from "axios";

const LOCAL_BACKEND_URL = "http://localhost:3000/api";
const PROD_BACKEND_URL = "https://flexsched-backend.vercel.app/api";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? LOCAL_BACKEND_URL : PROD_BACKEND_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

export default apiClient;
export { API_BASE_URL };
