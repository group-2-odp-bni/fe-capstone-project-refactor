import api from "../../lib/api";
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const saveTokens = (accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export function decodeJwtPayload(token) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT");
  const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const json = atob(payloadBase64);
  return JSON.parse(json);
}

export const validateAccessToken = async () => {
  const token = getAccessToken();
  if (!token) return false;
  try {
    const payload = decodeJwtPayload(token);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return await refreshAccessToken();
    }

    if (payload.iss !== "auth-service" || payload.type !== "access") {
      return false;
    }
    return true;
  } catch (e) {
    console.warn("Token validation failed:", e?.message || e);
    return false;
  }
};

export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await api.post("/api/v1/auth/refresh", { refreshToken });

    const p = res?.data || {};
    const nextAccess = p?.accessToken ?? p?.data?.accessToken ?? null;
    const nextRefresh =
      p?.refreshToken ?? p?.data?.refreshToken ?? refreshToken;

    if (!nextAccess) {
      clearTokens();
      return false;
    }

    saveTokens(nextAccess, nextRefresh);
    return true;
  } catch (err) {
    console.error("Token refresh failed:", err?.message || err);
    clearTokens();
    return false;
  }
};

export const isAuthenticated = async () => {
  return await validateAccessToken();
};
