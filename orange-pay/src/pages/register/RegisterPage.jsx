import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegistrationContext } from "../../context/RegistrationContext";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import OrangeHeader from "../../components/register/OrangeHeader";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import OrangePayLogo from "../../components/register/OrangePayLogo";
import RegisterTextContainer from "../../components/register/RegisterTextContainer";
import axios from "axios";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import View from "../../components/view/View";
import PhoneNumberInput from "../../components/login/PhoneNumberInput";
import LoginTextContainer from "../../components/login/LoginTextContainer";
import TermsModal from "../TermsAndPrivacy";

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
      <View>
        <RegisterContent />
      </View>
    </GoogleReCaptchaProvider>
  );
}
const API_BASE = import.meta.env.VITE_API_BASE || "";

function RegisterContent() {
  const navigate = useNavigate();
  const { setRegistrationData } = useRegistrationContext();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const inputRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      const { data } = await axios.post(`${API_BASE}/api/v1/auth/register`, {
        phoneNumber: phoneNumber,
        captchaToken: token,
      });

      //Save user info for later use
      setRegistrationData({
        phoneNumber: formData.phoneNumber,
      });
      navigate("/register/otp");
    } catch (err) {
      // console.log("error");

      if (err.response) {
        // console.log(err.response);
        const errorCode = err.response.data?.error?.code;

        if (errorCode === "AUTH-1002") {
          setError("Nomor Handphone Anda telah terdaftar");
        } else {
          // fallback message from backend
          setError(
            err.response.data?.error?.message ||
              "Terjadi kesalahan. Silakan coba lagi."
          );
        }
      } else {
        // no response (e.g. network issue)
        setError("Tidak dapat terhubung ke server. Coba lagi nanti.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <OrangeHeader />
      <WhiteCardContainer>
        <OrangePayLogo />
        <h2 className="mt-6 text-2xl font-bold text-center">
          Daftar ke OrangePay
        </h2>

        <RegisterTextContainer>
          Masukkan nomor handphone Anda yang aktif untuk menikmati semua layanan
          kami
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
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="underline font-bold mx-1 text-gray-700 hover:text-orange-600"
            >
              Syarat dan Kebijakan Privasi
            </button>{" "}
            Anda.
          </LoginTextContainer>

          {error && (
            <p className=" text-red-500 text-xs text-center">{error}</p>
          )}

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
      <TermsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
