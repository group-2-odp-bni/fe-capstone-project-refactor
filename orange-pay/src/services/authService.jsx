const API_BASE_URL = "http://localhost:3000/api";

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

export const loginWithPin = (pin) => {
  if (pin === "123456") {
    localStorage.setItem("isLoggedIn", "true");
    try { sessionStorage.setItem("token", "dummy-token"); } catch {}
    return true;
  }
  return false;
};

export const logout = () => {
  localStorage.removeItem("isLoggedIn");
  try { sessionStorage.removeItem("token"); } catch {}
};

export const isAuthenticated = () =>
  localStorage.getItem("isLoggedIn") === "true";