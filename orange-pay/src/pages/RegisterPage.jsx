// src/pages/RegisterPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { RegistrationProvider } from "../context/RegistrationContext";
import useRegisterForm from "../hooks/useRegistrationForm";
import Button from "../components/common/Button";
import InputField from "../components/common/InputField";
import PhoneNumberField from "../components/common/PhoneNumberField";
import BrandLogo from "../components/common/BrandLogo";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  return (
    <RegistrationProvider>
      {/* Latar luar + pusatkan phone frame */}
      <div className="min-h-dvh w-full flex items-center justify-center bg-slate-100 p-4">
        {/* PHONE FRAME (sama seperti OTP) */}
        <div
          className="relative w-full h-dvh max-w-[393px] max-h-[852px]
                     rounded-[28px] overflow-hidden shadow-[0_20px_60px_rgba(2,6,23,.18)]
                     ring-1 ring-black/10 bg-white"
        >
          <RegisterContent />
        </div>
      </div>
    </RegistrationProvider>
  );
}

function RegisterContent() {
  const { values, errors, onChange, onSubmit } = useRegisterForm();
  const [recaptchaToken, setRecaptchaToken] = React.useState(null);
  const [captchaLoading, setCaptchaLoading] = React.useState(false);
  const [captchaChecked, setCaptchaChecked] = React.useState(false);
  const [captchaError, setCaptchaError] = React.useState("");
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Header oranye (rounded atas) */}
      <div className="bg-[#FF9A25] h-28 w-full rounded-t-[28px]">
        <div className="pt-[env(safe-area-inset-top)] px-4">
          <div className="pt-4">
            <button
              onClick={() => history.back()}
              aria-label="Back"
              className="absolute left-4 top-4 w-9 h-9 grid place-items-center rounded-full bg-white text-[#FF9A25] shadow-md font-semibold"
            >
              🡨
            </button>
          </div>
        </div>
      </div>

      {/* Card putih overlap → menyatu dgn header */}
      <div
        className="relative -mt-4 z-10 bg-white rounded-t-3xl
                   px-6 pt-4 pb-[env(safe-area-inset-bottom)]"
      >
        {/* Brand */}
        <div className="flex justify-center pt-6">
          <BrandLogo size="sm" align="center" />
        </div>

        <p className="text-sm text-gray-600 text-center mt-6 relative z-20">
          Masukkan nama dan email aktif Anda untuk menikmati semua layanan kami.
        </p>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!captchaChecked) {
              setCaptchaError("Silakan centang kotak 'I am not a robot'");
              return;
            }
            const ok = onSubmit(e);
            if (ok) {
              navigate("/register/otp", {
                state: {
                  fullName: values.fullName.trim(),
                  email: values.email.trim(),
                  phoneNumber: `+62${values.phoneNumber.replace(/^0+/, "")}`,
                },
                replace: true,
              });
            }
          }}
          className="space-y-5 mt-6"
        >
          <div>
            <InputField
              id="fullName"
              name="fullName"
              label="Nama Lengkap"
              value={values.fullName}
              onChange={onChange}
              variant="float"
            />
            {errors.fullName && (
              <p className="text-red-500 text-xs mt-1 relative z-30">{errors.fullName}</p>
            )}
          </div>

          <div>
            <InputField
              id="email"
              name="email"
              label="Alamat Email"
              type="email"
              value={values.email}
              onChange={onChange}
              variant="float"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 relative z-30">{errors.email}</p>
            )}
          </div>

          <PhoneNumberField
            value={values.phoneNumber}
            onChange={onChange}
            error={errors.phoneNumber}
          />

          {/* Simple checkbox captcha (simulated verification) */}
          <div className="border border-slate-300 rounded-xl px-3 py-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (captchaChecked) {
                    setCaptchaChecked(false);
                    setRecaptchaToken(null);
                    return;
                  }
                  setCaptchaLoading(true);
                  setCaptchaError("");
                  // simulate verification delay
                  setTimeout(() => {
                    setCaptchaLoading(false);
                    setCaptchaChecked(true);
                    setRecaptchaToken("simulated-token");
                  }, 800);
                }}
                className={`h-8 w-8 rounded grid place-items-center border ${captchaChecked ? "bg-[#1C6C79] text-white" : "bg-white"}`}
                aria-pressed={captchaChecked}
              >
                {captchaLoading ? (
                  <svg className="animate-spin h-4 w-4 text-gray-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                ) : captchaChecked ? (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div />
                )}
              </button>

              <div className="text-sm text-slate-700">I am not a robot</div>
            </div>
            {captchaError && <p className="text-red-500 text-xs mt-2">{captchaError}</p>}
          </div>

          <br />
          <br />
          <Button
            type="submit"
            className="w-full !bg-[#1C6C79] hover:!bg-[#15555F] !rounded-xl !h-11"
          >
            Daftar
          </Button>

          <div className="text-center text-sm pb-6">
            <span className="text-gray-500">Already have an account? </span>
            <Link
              to="/login"
              className="text-[#1C6C79] font-semibold hover:underline"
            >
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}