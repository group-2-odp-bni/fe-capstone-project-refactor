import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

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

    // Allow only numeric input
    if (!/^[0-9]*$/.test(value)) {
      setError("Nomor hanya boleh berisi angka");
      return;
    }

    setError("");
    setFormData((prev) => ({ ...prev, phoneNumber: value }));
  };
  function isDevMode() {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return (
      window.location.hostname === "localhost" || params.get("dev") === "1"
    );
  }

  /** Handle form submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fullPhone = `+62${formData.phoneNumber}`;

    try {
      const response = await fetch("/api/v1/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: `+62${formData.phoneNumber}`,
        }),
      });

      if (!response.ok) throw new Error("Failed to send request");

      const data = await response.json();

      // Save phone number into LoginContext
      setLoginData({ phoneNumber: `+62${formData.phoneNumber}` });

      console.log("Login OTP request success:", data);

      // Navigate to OTP verification
      navigate("/login/otp");
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
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
        <LoginTextContainer>Please sign in to continue</LoginTextContainer>

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
