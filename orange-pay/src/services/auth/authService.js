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
  if (!token) return false;

  try {
    // Option 1: Verify by calling backend endpoint (recommended)
    const response = await fetch("/api/v1/auth/validate", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      // try refresh if backend supports it
      const refreshed = await refreshAccessToken();
      return refreshed;
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
