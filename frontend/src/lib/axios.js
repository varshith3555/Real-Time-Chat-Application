import axios from "axios";

// For development: http://localhost:5001/api
// For production: /api (relative URL)
const BASE_API_URL = import.meta.env.MODE === "development" 
  ? "http://localhost:5001/api" 
  : "/api";

console.log("API Base URL:", BASE_API_URL);

export const axiosInstance = axios.create({
  baseURL: BASE_API_URL,
  withCredentials: true,
});

// Add response interceptor for better error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);
