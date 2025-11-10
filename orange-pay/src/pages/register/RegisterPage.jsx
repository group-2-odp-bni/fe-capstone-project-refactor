import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegistrationContext } from "../../context/RegistrationContext";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import OrangeHeader from "../../components/register/OrangeHeader";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import OrangePayLogo from "../../components/register/OrangePayLogo";
import RegisterTextContainer from "../../components/register/RegisterTextContainer";
import api from "../../lib/api";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import DynamicShell from "../../components/layout/DynamicShell";
import PhoneNumberInput from "../../components/login/PhoneNumberInput";
import LoginTextContainer from "../../components/login/LoginTextContainer";


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
      <DynamicShell>
        <RegisterContent />
      </DynamicShell>
    </GoogleReCaptchaProvider>

  );
}

function RegisterContent() {
  const navigate = useNavigate();
  const { setRegistrationData } = useRegistrationContext();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const inputRef = useRef(null);

  // Local form state
  const [formData, setFormData] = useState({
    phoneNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const v = e.target.value.replace(/\D/g, ""); // hanya angka

    if (v && !v.startsWith("8")) {
      setError("Nomor harus dimulai dengan 8");
    } else if (v.length > 0 && v.length < 9) {
      setError("Nomor minimal 9 digit setelah +62");
    } else {
      setError("");
    }

    // Update state utama
    setFormData((prev) => ({ ...prev, phoneNumber: v }));
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
      const phoneNumber = `0${formData.phoneNumber}`;


      //hit login
      const { data } = await api.post("/api/v1/auth/register", {
        phoneNumber: phoneNumber,
        captchaToken: token,
      });

      //Save user info for later use
      setRegistrationData({
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

          <PhoneNumberInput
            value={formData.phoneNumber}
            onChange={handleChange}
            inputRef={inputRef}
            err={error}
            required
          />

          <LoginTextContainer>
            Dengan masuk atau mendaftar, Anda menyetujui
            <span className="underline font-bold mx-1 text-gray-700">
              Syarat dan Kebijakan Privasi
            </span>
            Anda.
          </LoginTextContainer>


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
