import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegistrationContext } from "../../context/RegistrationContext";
import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";

import MobileShell from "../../components/layout/MobileShell";
import InputField from "../../components/register/RegisterGeneralInput";
import OrangeHeader from "../../components/register/OrangeHeader";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import OrangePayLogo from "../../components/register/OrangePayLogo";
import RegisterTextContainer from "../../components/register/RegisterTextContainer";
import api from "../../lib/api";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";


export default function RegisterPage() {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: "body",
      }}
    >
      <PhoneLayoutBackground>
        <MobileShell>
          <RegisterContent />
        </MobileShell>
      </PhoneLayoutBackground>
    </GoogleReCaptchaProvider>

  );
}

function RegisterContent() {
  const navigate = useNavigate();
  const { setRegistrationData } = useRegistrationContext();
  const { executeRecaptcha } = useGoogleReCaptcha();

  // Local form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!executeRecaptcha) {
      setError("reCAPTCHA belum siap. Coba beberapa detik lagi.");
      setLoading(false);
      return;
    }

    //hit api
    try {
      //get google captcha token
      const token = await executeRecaptcha("register");

      //hit login
      const { data } = await api.post("/api/v1/auth/register", {
        phoneNumber: formData.phoneNumber,
        captchaToken: token,
      });

      //Save user info for later use
      setRegistrationData({
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
      });
      navigate("/register/otp");
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <OrangeHeader />
      <WhiteCardContainer>
        <OrangePayLogo />
        <RegisterTextContainer>
          Masukkan nama dan email aktif Anda untuk menikmati semua layanan kami.
        </RegisterTextContainer>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <InputField
            id="fullName"
            name="fullName"
            label="Nama Lengkap :"
            type="text"
            placeholder="Masukkan nama lengkap"
            required
            value={formData.fullName}
            onChange={handleChange}
          />

          <InputField
            id="email"
            name="email"
            label="Alamat Email :"
            type="email"
            placeholder="Masukkan alamat email"
            required
            value={formData.email}
            onChange={handleChange}
          />

          <InputField
            id="phoneNumber"
            name="phoneNumber"
            label="Nomor Telepon :"
            type="tel"
            placeholder="Masukkan nomor telepon"
            required
            value={formData.phoneNumber}
            onChange={handleChange}
          />


          {error && <p className="text-red-500 text-xs">{error}</p>}

          <FullSubmitButton disabled={loading}>
            {loading ? "Mengirim..." : "Daftar"}
          </FullSubmitButton>

          <div className="text-center text-xs">
            <span className="text-gray-500">Sudah punya akun? </span>
            <Link
              to="/login"
              className="text-[#1C6C79] font-semibold hover:underline"
            >
              Login
            </Link>
          </div>
        </form>
      </WhiteCardContainer>
    </div>
  );
}
