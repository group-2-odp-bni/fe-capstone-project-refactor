import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import BackButton from "../../components/common/BackButton";
import Button from "../../components/common/Button";
import BrandLogo from "../../components/common/BrandLogo";
import useOtpLogic from "../../hooks/useOtpLogic";
import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import MobileShell from "../../components/layout/MobileShell";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import OrangeHeader from "../../components/register/OrangeHeader";
import RegisterOtpInput from "../../components/register/RegisterOtpInput";
import InputField from "../../components/register/RegisterGeneralInput";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import { useRegistrationContext } from "../../context/RegistrationContext";

export default function OtpRegisterPage() {





  return (
    <PhoneLayoutBackground>
      <MobileShell>
        <OrangeHeader />
        <WhiteCardContainer>
          <SetOtpContent />
        </WhiteCardContainer>
      </MobileShell>
    </PhoneLayoutBackground>
  );
}

function SetOtpContent() {
  const navigate = useNavigate();
  const { userData } = useRegistrationContext();
  console.log(userData.phoneNumber);


  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("--- sent request ---")
      console.log(`phone number : ${userData.phoneNumber}`)
      console.log(`otp : ${otp}`)


      const response = await fetch('/api/v1/auth/verify', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: userData.phoneNumber,
          otp: otp,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send request");
      }

      const data = await response.json();
      console.log("Registration initiated:", data);
      navigate("/register/setpin");

    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }

//"eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxODA5MTM1My01MTBiLTRmODItOGU3NS0wMzRjMDZlNjAzMzYiLCJzY29wZSI6IlBJTl9TRVRVUCIsImlzcyI6ImF1dGgtc2VydmljZSIsImV4cCI6MTc2MTIwODM5NiwidHlwZSI6InN0YXRlIiwiaWF0IjoxNzYxMjA4MDk2LCJqdGkiOiI5OTc2NzhlMC0yMTg2LTRjYjctODUzZi1jOTQ0MjBlOTg2N2YifQ.bcJOcQSd760k6Ya_0pCQ0SyMu1jJGKDtPjbyQIVuRZruGYVW0n5N66YUmJiMPOgCHUGKUg5XZPpYtyWxk91bziPyZZRB0NBpZTdCTUuDAfIpNGcvFkdq2ZOTaH5x3GZIjQ6sKPunFtlxCrvJfn2KCfjjcgtuZsi7nBRMKyHlmPt-KIl1z245WiX3RZ4H3n4yn46hUY8lk_N1CerQZ7wTWTD0CBASLwflQpEXzaT7f9Z258033nyjqURbonnhvxCqjwNkwtqPE3PNRleYGVfwrSzzIBZNgEj3QlO8ztgRKP1Da0bWt477xQ7VheBaVINDE-XiamqIGeQoEk8Vs9cHPA"


  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-5 mt-6">
        <InputField
          id="otp"
          name="otp"
          label="OTP :"
          type="numeric"
          placeholder="Masukkan OTP "
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value)} 
        />

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <FullSubmitButton disabled={loading}>
          {loading ? "Mengirim..." : "Lanjut"}
        </FullSubmitButton>

        





      </form>

      <div className="text-center mt-4 text-xs md:text-sm text-gray-600 pb-6">
        Salah nomor?{" "}
        <button
          type="button"
          className="text-[#1C6C79] font-semibold hover:underline"
          onClick={() => navigate("/register")}
        >
          Ubah nomor
        </button>
      </div>
    </div>
  );

}
