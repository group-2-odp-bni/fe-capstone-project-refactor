import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import MobileShell from "../../components/layout/MobileShell";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import OrangeHeader from "../../components/register/OrangeHeader";
import InputField from "../../components/register/RegisterGeneralInput";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import { useRegistrationContext } from "../../context/RegistrationContext";
import OrangePayLogo from "../../components/register/OrangePayLogo";
import RegisterTextContainer from "../../components/register/RegisterTextContainer";
import api from "../../lib/api";
import OtpInputField from "../../components/input/OtpInputField";
import CountdownTimer from "../../components/dashboard/CountdownTimer";
import ButtonLink from "../../components/button/ButtonLink";

export default function OtpRegisterPage() {
  return (
    <PhoneLayoutBackground>
      <MobileShell>
        <OrangeHeader />
        <WhiteCardContainer>
          <OrangePayLogo />
          <RegisterTextContainer>
            Kode OTP telah dikirim ke WhatsApp Anda. Masukkan kode di bawah
            untuk melanjutkan.
          </RegisterTextContainer>
          <SetOtpContent />
        </WhiteCardContainer>
      </MobileShell>
    </PhoneLayoutBackground>
  );
}

function SetOtpContent() {
  const navigate = useNavigate();
  const { userData, setRegistrationData } = useRegistrationContext();
  console.log(userData.phoneNumber);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(300); // 5 minutes in seconds

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/api/v1/auth/verify", {
        phoneNumber: userData.phoneNumber,
        otp,
      });
      setRegistrationData({ stateToken: data.data.stateToken });
      navigate("/register/setpin");
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }

  };

  const handleResendOtp = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("/api/v1/auth/resend-otp", {
        phoneNumber: userData.phoneNumber,
      });

      setLoginData({ stateToken: response.data.data.stateToken });
      setOtp("");
      setTimer(300); // Reset 5-minute timer
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || err.message || "Something went wrong."
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
          label="OTP :"
          type="numeric"
          placeholder="Masukkan OTP "
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
        <CountdownTimer initialSeconds={300} />

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <FullSubmitButton disabled={loading}>
          {loading ? "Mengirim..." : "Lanjut"}
        </FullSubmitButton>
      </form>

      <div className="text-center mt-4 text-xs md:text-sm text-gray-600 pb-6">
        
        <ButtonLink onClick={handleResendOtp} disabled={loading || timer > 0}>
          {timer > 0 ? "" : "Resend OTP"}
        </ButtonLink>
      </div>
    </div >
  );
}
