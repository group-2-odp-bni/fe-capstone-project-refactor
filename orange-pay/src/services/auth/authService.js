const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// Helper to get token from sessionStorage
export const getAccessToken = () => sessionStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => sessionStorage.getItem(REFRESH_TOKEN_KEY);

// Save tokens after login or registration
export const saveTokens = (accessToken, refreshToken) => {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

// Clear tokens when user logs out
export const clearTokens = () => {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Validate access token by calling backend or decoding locally
export const validateAccessToken = async () => {
  const token = getAccessToken();
  if (!token) {
    console.warn("No access token found");
    return false;
  }

  try {
    // Decode payload (middle part of JWT)
    const [, payloadBase64] = token.split(".");
    const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);

    // check token expired date
    if (payload.exp && payload.exp < now) {
      console.warn("Access token expired. Trying to refresh...");
      return await refreshAccessToken();
    }

    // check issuer
    if (payload.iss !== "auth-service" || payload.type !== "access") {
      console.warn("Invalid token issuer or type");
      return false;
    }

    return true;
  } catch (err) {
    console.error("Token validation failed:", err);
    return false;
  }
};

// Refresh access token using refresh token
export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch("/api/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return false;
    }

    const data = await response.json();
    if (data?.accessToken) {
      saveTokens(data.accessToken, data.refreshToken || refreshToken);
      return true;
    }

    return false;
  } catch (err) {
    console.error("Token refresh failed:", err);
    clearTokens();
    return false;
  }
};

// Check if authenticated (wrapper)
export const isAuthenticated = async () => {
  return await validateAccessToken();
};
