import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import View from "../../components/view/View";
import TermsModal from "../TermsAndPrivacy";
import useTrack from "../../hooks/useTrack";
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
      <View>
        <LoginContextContent />
      </View>
    </GoogleReCaptchaProvider>
  );
}
const API_BASE = import.meta.env.VITE_API_BASE || "";

function LoginContextContent() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { setLoginData } = useLoginContext();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const track = useTrack("login");

  /** Handle phone number input changes */
  const handleChange = (e) => {
    const v = e.target.value.replace(/\D/g, ""); // hanya angka

    if (v && !v.startsWith("8")) {
      setError("Nomor harus dimulai dengan 8");
      track("validation_failed", { reason: "must_start_with_8" });
    } else if (v.length > 0 && v.length < 9) {
      setError("Nomor minimal 9 digit setelah +62");
      track("validation_failed", { reason: "min_digits_9" });
    } else {
      setError("");
    }

    // Update state utama
    setFormData((prev) => ({ ...prev, phoneNumber: v }));
  };

  /** Handle form submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    track("clicked", { source: "submit_login" });

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
      track("validation_failed", { reason: "empty_phone" });

      return;
    }

    if (!phoneNumber.startsWith("8")) {
      Swal.fire({
        icon: "warning",
        title: "Nomor tidak valid",
        text: "Nomor harus dimulai dengan angka 8.",
      });
      track("validation_failed", { reason: "not_start_with_8" });

      return;
    }

    if (phoneNumber.length < 9) {
      Swal.fire({
        icon: "warning",
        title: "Nomor terlalu pendek",
        text: "Nomor minimal 9 digit setelah +62.",
      });
      track("validation_failed", { reason: "too_short" });

      return;
    }

    const fullPhone = `+62${phoneNumber}`;

    // safe loginData
    setLoginData({
      phoneNumber: fullPhone,
    });

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

    if (!confirmResult.isConfirmed) {
      track("otp_send_cancelled");
      return;
    }

    setLoading(true);
    try {
      //get google captcha token
      const token = await executeRecaptcha("register");

      //hit login
      const response = await axios.post(`${API_BASE}/api/v1/auth/login`, {
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
      // console.error(err);
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
  const openTerms = () => {
    setIsModalOpen(true);
    track("terms_modal_opened");
  };
  return (
    <div>
      <OrangeHeader />
      <WhiteCardContainer>
        <OrangePayLogo />
        <h2 className="mt-6 text-2xl font-bold text-center">
          Masuk ke OrangePay
        </h2>
        <LoginTextContainer>Silakan masuk untuk melanjutkan</LoginTextContainer>

        <form onSubmit={handleSubmit}>
          <PhoneNumberInput
            value={formData.phoneNumber}
            onChange={handleChange}
            inputRef={inputRef}
            err={error}
          />

          <LoginTextContainer>
            Dengan masuk atau mendaftar, Anda menyetujui
            <button
              type="button"
              onClick={openTerms}
              className="underline font-bold mx-1 text-gray-700 hover:text-orange-600"
            >
              Syarat dan Kebijakan Privasi
            </button>
            Anda.
          </LoginTextContainer>

          <FullSubmitButton disabled={loading}>
            {loading ? "Mengirim OTP..." : "Kirim OTP via WhatsApp"}
          </FullSubmitButton>
          <div className="text-center text-xs">
            <span className="text-gray-500">Belum punya akun? </span>
            <Link
              to="/register"
              className="text-[#1C6C79] font-semibold hover:underline"
            >
              Register
            </Link>
          </div>
        </form>
      </WhiteCardContainer>
      <TermsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
