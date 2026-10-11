import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// const API_BASE_URL = "http://192.168.1.80:5000/api";
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
      const token = await AsyncStorage.getItem("token");
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
