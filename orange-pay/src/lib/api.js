import axios from "axios";
import {
  getAccessToken,
  saveTokens,
  clearTokens,
  refreshAccessToken,
} from "../services/auth/authService";

const API_BASE =
  import.meta.env.VITE_API_BASE && import.meta.env.VITE_API_BASE.trim() !== ""
    ? import.meta.env.VITE_API_BASE
    : "";
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error?.response?.status;
    const code = error?.response?.data?.error?.code;

    // AUTH business logic
    if (typeof code === "string" && code.startsWith("AUTH-30")) {
      return Promise.reject(error);
    }

    // handle 4xx except 401
    if (status >= 400 && status < 500 && status !== 401) {
      return Promise.reject(error);
    }

    // 5xx
    if (status >= 500) {
      return Promise.reject(error);
    }

    //handle 401 ensure no infinite loop
    if (status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          const ok = await refreshAccessToken();
          if (!ok) throw new Error("Refresh token failed");
        })();
      }

      await refreshPromise;
    } catch (e) {
      refreshPromise = null;
      clearTokens();
      window.location.replace("/login");
      throw error;
    }

    refreshPromise = null;
    const newAccess = getAccessToken();
    if (newAccess) {
      original.headers = {
        ...original.headers,
        Authorization: `Bearer ${newAccess}`,
      };
    }
    return api(original);
  }
);

export default api;
