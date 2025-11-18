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
    : "/api/v1";
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  // headers: { "Content-Type": "application/json" },
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

    const normalizeError = (err) =>
      new Error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Network / API error"
      );

    if (error?.response?.status !== 401 || original?._retry) {
      throw error;
    }
    original._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          const ok = await refreshAccessToken();
          if (!ok) throw new Error("Refresh token failed");
          return true;
        })();
      }

      await refreshPromise;
    } catch (e) {
      refreshPromise = null;
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw normalizeError(error);
    }

    refreshPromise = null;
    const newAccess = getAccessToken();
    if (newAccess) {
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newAccess}`;
    }
    return api(original);
  }
);

export default api;
