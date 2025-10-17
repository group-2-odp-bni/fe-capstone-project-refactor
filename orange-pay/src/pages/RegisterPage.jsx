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

  return (
    <div className="relative">
      {/* Header oranye (rounded atas) */}
      <div className="bg-[#FF9A25] h-28 w-full rounded-t-[28px]">
        <div className="pt-[env(safe-area-inset-top)] px-4">
          <div className="pt-4">
            <BackButton onClick={() => history.back()} />
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
        <form onSubmit={onSubmit} className="space-y-5 mt-6">
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

          {/* Fake reCAPTCHA */}
          <div className="border border-slate-300 rounded-xl px-3 py-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-slate-700">I am not a robot</span>
              <img
                src="/recaptcha-logo.png"
                alt=""
                className="ml-auto h-5 opacity-70"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
          </div>

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
