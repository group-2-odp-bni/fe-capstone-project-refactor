import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import MobileShell from "../../components/layout/MobileShell";
import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import OrangePayLogo from "../../components/register/OrangePayLogo";
import OrangeHeader from "../../components/register/OrangeHeader";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import LoginTextContainer from "../../components/login/LoginTextContainer";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import PhoneNumberInput from "../../components/login/PhoneNumberInput";
import { useLoginContext } from "../../context/LoginContext";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import DynamicShell from "../../components/layout/DynamicShell";

export default function LoginPage() {
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
        <LoginContextContent />
      </DynamicShell>

    </GoogleReCaptchaProvider>
  );
}

function LoginContextContent() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { setLoginData } = useLoginContext();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [formData, setFormData] = useState({
    phoneNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /** Handle phone number input changes */
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

  /** Handle form submit */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!executeRecaptcha) {
      setError("reCAPTCHA belum siap. Coba beberapa detik lagi.");
      setLoading(false);
      return;
    }

    const { phoneNumber } = formData;
    if (!phoneNumber) {
      Swal.fire({
        icon: "warning",
        title: "Nomor belum diisi",
        text: "Silakan masukkan nomor telepon terlebih dahulu.",
      });
      return;
    }

    if (!phoneNumber.startsWith("8")) {
      Swal.fire({
        icon: "warning",
        title: "Nomor tidak valid",
        text: "Nomor harus dimulai dengan angka 8.",
      });
      return;
    }

    if (phoneNumber.length < 9) {
      Swal.fire({
        icon: "warning",
        title: "Nomor terlalu pendek",
        text: "Nomor minimal 9 digit setelah +62.",
      });
      return;
    }

    const fullPhone = `+62${phoneNumber}`;

    // Konfirmasi sebelum kirim OTP
    const confirmResult = await Swal.fire({
      title: "Kirim OTP?",
      text: `OTP akan dikirim ke nomor ${fullPhone}. Lanjutkan?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, kirim OTP",
      cancelButtonText: "Batal",
    });

    if (!confirmResult.isConfirmed) return;

    setLoading(true);
    try {
      //get google captcha token
      const token = await executeRecaptcha("register");

      //hit login
      const response = await axios.post("/api/v1/auth/login", {
        phoneNumber: fullPhone,
        captchaToken: token,
      });

      setLoginData({ phoneNumber: fullPhone });

      Swal.fire({
        icon: "success",
        title: "OTP Dikirim!",
        text: "Silakan periksa WhatsApp Anda untuk kode OTP.",
        timer: 2000,
        showConfirmButton: false,
      });

      navigate("/login/otp");
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal Mengirim OTP",
        text:
          err.response?.data?.message ||
          err.message ||
          "Terjadi kesalahan saat mengirim OTP.",
      });
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