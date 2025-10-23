import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RegistrationProvider, useRegistrationContext } from "../../context/RegistrationContext";
import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import GoogleCaptcha from "../../components/recaptcha/GoogleCaptcha";
import BrandLogo from "../../components/common/BrandLogo";
import MobileShell from "../../components/layout/MobileShell";
import InputField from "../../components/register/RegisterGeneralInput";
import OrangeHeader from "../../components/register/OrangeHeader";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";

export default function RegisterPage() {
  return (
    <PhoneLayoutBackground>
      <MobileShell>
        <RegisterContent />
      </MobileShell>
    </PhoneLayoutBackground>
  );
}

function RegisterContent() {
  const navigate = useNavigate();
  const { setRegistrationData } = useRegistrationContext();

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

    //hit api
    try {
      const response = await fetch('/api/v1/auth/request', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send request");
      }

      const data = await response.json();

      //Save user info for later use
      setRegistrationData({
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
      });

      console.log("Registration initiated:", data);

      // Navigate to OTP verification
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
      {/* Header */}
      <OrangeHeader />


      {/* White card */}
      <WhiteCardContainer>
        <div className="flex justify-center pt-6">
          <BrandLogo size="md" align="center" />
        </div>

        <p className="text-xs text-center relative mt-5 mb-5">
          Masukkan nama dan email aktif Anda untuk menikmati semua layanan kami.
        </p>

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

          {/* <GoogleCaptcha /> */}

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
