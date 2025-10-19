// src/services/authService.jsx
const API_BASE_URL = "http://localhost:3000/api";

/* ---------------------- MOCK REGISTRATION FLOW ---------------------- */
export const registerUserApi = async (userData) => {
  console.log("Calling registerUserApi with:", userData);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (userData.email === "test@example.com") {
        reject(new Error("Email sudah terdaftar."));
      } else {
        resolve({
          message: "Registrasi berhasil, OTP terkirim!",
          userId: "abc12345",
        });
      }
    }, 1000);
  });
};

export const verifyOtpApi = async (email, otp) => {
  console.log("Calling verifyOtpApi with:", email, otp);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (otp === "1234") {
        resolve({ message: "OTP berhasil diverifikasi!" });
      } else {
        reject(new Error("OTP salah atau kedaluwarsa."));
      }
    }, 1000);
  });
};

export const resendOtpApi = async (email) => {
  console.log("Calling resendOtpApi for:", email);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ message: "OTP baru telah dikirim!" });
    }, 1000);
  });
};

export const setupPinApi = async (email, pin) => {
  console.log("Calling setupPinApi with:", email, pin);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ message: "PIN berhasil diatur!" });
    }, 1000);
  });
};

export const completeRegistrationApi = async (finalData) => {
  console.log("Calling completeRegistrationApi with:", finalData);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ message: "Registrasi final berhasil!", user: finalData });
    }, 1500);
  });
};

/* ---------------------- AUTH / SESSION ---------------------- */

// Helper to get token safely
export const getToken = () => {
  try {
    return sessionStorage.getItem("token") || null;
  } catch {
    return null;
  }
};

// Login mock using PIN
export const loginWithPin = (pin) => {
  if (pin === "123456") {
    // mark logged-in and store token
    try {
      sessionStorage.setItem("token", "dummy-token");
      localStorage.setItem("isLoggedIn", "true");
    } catch (err) {
      console.warn("Failed to store session:", err);
    }
    return true;
  }
  return false;
};

// Logout (clear session)
export const logout = () => {
  try {
    sessionStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
  } catch (err) {
    console.warn("Failed to clear session:", err);
  }
};

// ✅ Updated isAuthenticated: checks session token
export const isAuthenticated = () => {
  try {
    // synchronous check only — do not return a Promise
    return Boolean(getToken());
  } catch (err) {
    console.warn("isAuthenticated error:", err);
    return false;
  }
};
