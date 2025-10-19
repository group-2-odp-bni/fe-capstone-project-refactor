// src/pages/RegisterPage.jsx
import React from "react";
import { Link } from "react-router-dom";

import { RegistrationProvider } from "../context/RegistrationContext";
import useRegisterForm from "../hooks/useRegistrationForm";

import BackButton from "../components/common/BackButton";
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
                   px-6 pb-[env(safe-area-inset-bottom)]"
      >
        {/* Brand */}
        <div className="flex justify-center pt-6">
          <BrandLogo size="sm" align="center" />
        </div>

        <p className="text-sm text-gray-600 text-center mt-3">
          Masukkan nama dan email aktif Anda untuk menikmati semua layanan kami.
        </p>

        {/* Form */}
        <form
          onSubmit={(e) => {
            const ok = onSubmit(e, recaptchaToken);
            if (ok) {
              // Navigate via react-router and pass the registration data to OTP page
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
              <p className="text-red-500 text-xs -mt-3">{errors.fullName}</p>
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
              <p className="text-red-500 text-xs -mt-3">{errors.email}</p>
            )}
          </div>

          <PhoneNumberField
            value={values.phoneNumber}
            onChange={onChange}
            error={errors.phoneNumber}
          />

          <br />
          <br />
          <br />
          <br />
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
