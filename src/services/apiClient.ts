import axios from "axios";
import { getAuthToken } from "./authStorage";

// const API_BASE_URL = "http://192.168.1.80:5000/api";
// const API_BASE_URL = "https://valoracore.vercel.app/api"; // legacy: iwaldi-putras-projects team (unused)
const API_BASE_URL = "https://valora-be.vercel.app/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor token JWT otomatis
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Gagal mengambil token dari storage:", error);
    }
    return config;
  },
  (error) => Promise.reject(error),
);
