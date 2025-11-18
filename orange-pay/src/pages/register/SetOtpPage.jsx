import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import OrangeHeader from "../../components/register/OrangeHeader";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import { useRegistrationContext } from "../../context/RegistrationContext";
import OrangePayLogo from "../../components/register/OrangePayLogo";
import RegisterTextContainer from "../../components/register/RegisterTextContainer";
import axios from "axios";
import OtpInputField from "../../components/input/OtpInputField";
import CountdownTimer from "../../components/dashboard/CountdownTimer";
import ButtonLink from "../../components/button/ButtonLink";
import View from "../../components/view/View";
import { useCountdown } from "../../hooks/useCountdown";

export default function OtpRegisterPage() {
  return (
    <View>
      <OrangeHeader />
      <WhiteCardContainer>
        <OrangePayLogo />
        <RegisterTextContainer>
          Kode OTP telah dikirim ke WhatsApp Anda. Masukkan kode di bawah untuk
          melanjutkan.
        </RegisterTextContainer>
        <SetOtpContent />
      </WhiteCardContainer>
    </View>
  );
}
const API_BASE = import.meta.env.VITE_API_BASE || "";

function SetOtpContent() {
  const navigate = useNavigate();
  const { userData, setRegistrationData } = useRegistrationContext();
  // console.log(userData.phoneNumber);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { secondsLeft, reset } = useCountdown(60);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post(`${API_BASE}//api/v1/auth/verify`, {
        phoneNumber: userData.phoneNumber,
        otp,
      });
      setRegistrationData({ stateToken: data.data.stateToken });
      navigate("/register/setpin");
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setLoading(true);

    //get recaptcha token
    const recaptchaToken = localStorage.getItem("_grecaptcha");

    try {
      const response = await axios.post(`${API_BASE}/api/v1/auth/resend-otp`, {
        phoneNumber: userData.phoneNumber,
        captchaToken: recaptchaToken,
      });

      setRegistrationData({ stateToken: response.data.data.stateToken });
      setOtp("");
      reset();
    } catch (err) {
      // get error code
      const errorCode = err.response?.data?.error.code;

      // error handle - expired
      if (errorCode === "AUTH-2002") {
        setError("OTP telah expired");
        setOtp("");
        reset();
      }

      // else
      setError(
        err.response?.data?.error.message ||
          err.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-5 mt-6">
        <OtpInputField
          id="otp"
          name="otp"
          type="numeric"
          placeholder="Masukkan OTP "
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
        <CountdownTimer initialSeconds={secondsLeft} />

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <FullSubmitButton disabled={loading}>
          {loading ? "Mengirim..." : "Lanjut"}
        </FullSubmitButton>
      </form>

      {/* Resend OTP */}
      <div className="text-center mt-4 pb-6">
        <ButtonLink
          onClick={handleResendOtp}
          isDisabled={secondsLeft !== 0 ? true : false}
        >
          Kirim Ulang OTP
        </ButtonLink>
      </div>
    </div>
  );
}
