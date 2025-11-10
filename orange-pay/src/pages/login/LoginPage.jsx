import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import MobileShell from "../../components/layout/MobileShell";
import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import OrangePayLogo from "../../components/register/OrangePayLogo";
import OrangeHeader from "../../components/register/OrangeHeader";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import LoginTextContainer from "../../components/login/LoginTextContainer";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import PhoneNumberInput from "../../components/login/PhoneNumberInput";
import { useLoginContext } from "../../context/LoginContext";

export default function LoginPage() {
  return (
    <PhoneLayoutBackground>
      <MobileShell bg="bg-white">
        <LoginContextContent />
      </MobileShell>
    </PhoneLayoutBackground>
  );
}

function LoginContextContent() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { setLoginData } = useLoginContext();

  const [formData, setFormData] = useState({
    phoneNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /** Handle phone number input changes */
  const handleChange = (e) => {
    const value = e.target.value;

    // Hanya boleh angka
    if (!/^[0-9]*$/.test(value)) {
      setError("Nomor hanya boleh berisi angka");
      return;
    }

    setError("");
    setFormData((prev) => ({ ...prev, phoneNumber: value }));
  };

  /** Handle form submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ✅ Gunakan base URL dari .env
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

      const payload = {
        phoneNumber: `+62${formData.phoneNumber}`,
      };

      console.log("Sending OTP request to:", `${API_URL}/api/v1/auth/request`, payload);

      // ✅ Gunakan axios (bukan fetch)
      const response = await axios.post(`${API_URL}/api/v1/auth/request`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("Login OTP request success:", response.data);

      // Simpan nomor HP ke context (biar bisa dipakai di halaman OTP)
      setLoginData({ phoneNumber: `+62${formData.phoneNumber}` });

      // ✅ Navigasi ke halaman verifikasi OTP
      navigate("/login/otp");
    } catch (err) {
      console.error("Error saat kirim OTP:", err);
      if (err.response?.status === 500) {
        setError("Terjadi kesalahan di server. Coba lagi nanti.");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Gagal mengirim OTP. Pastikan nomor sudah benar.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <OrangeHeader />
      <WhiteCardContainer>
        <OrangePayLogo />

        <h2 className="mt-6 text-2xl font-bold text-center">Welcome Back</h2>
        <LoginTextContainer>
          Please sign in to continue
        </LoginTextContainer>

        <form onSubmit={handleSubmit}>
          <PhoneNumberInput
            value={formData.phoneNumber}
            onChange={handleChange}
            inputRef={inputRef}
            err={error}
          />

          <LoginTextContainer>
            Dengan masuk atau mendaftar, Anda menyetujui
            <span className="underline font-bold mx-1 text-gray-700">
              Syarat dan Kebijakan Privasi
            </span>
            Anda.
          </LoginTextContainer>

          <FullSubmitButton disabled={loading}>
            {loading ? "Mengirim OTP..." : "Kirim OTP via WhatsApp"}
          </FullSubmitButton>
        </form>
      </WhiteCardContainer>
    </div>
  );
}
