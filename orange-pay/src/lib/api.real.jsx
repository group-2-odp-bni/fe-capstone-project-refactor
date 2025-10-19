// src/lib/api.real.jsx
import axios from "axios";
import { useAuthStore } from "../store/auth.store";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

// attach token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const refreshToken = async () => {
  const authStore = useAuthStore.getState();
  const currentRefreshToken = authStore.refreshToken;

  if (!currentRefreshToken) {
    authStore.logout();
    return Promise.reject(new Error("No refresh token available."));
  }

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      { refreshToken: currentRefreshToken },
      { withCredentials: true }
    );
    const { accessToken, refreshToken: newRefreshToken } = res.data || {};
    authStore.setTokens({ accessToken, refreshToken: newRefreshToken });
    processQueue(null, accessToken);
    return accessToken;
  } catch (err) {
    processQueue(err, null);
    authStore.logout();
    return Promise.reject(err);
  } finally {
    isRefreshing = false;
  }
};

// retry on 401
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const originalRequest = error?.config || {};
    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry ||
      (originalRequest.url || "").includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    try {
      const newAccessToken = await refreshToken();
      if (newAccessToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      }
      return Promise.reject(error);
    } catch (e) {
      return Promise.reject(e);
    }
  }
);

export default api;
