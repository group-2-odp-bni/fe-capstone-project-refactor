import React from "react";
import { useNavigate } from "react-router-dom";

import BackButton from "../components/common/BackButton";
import Button from "../components/common/Button";
import OtpInput from "../components/register/OtpInput";
import BrandLogo from "../components/common/BrandLogo";
import useOtpLogic from "../hooks/useOtpLogic";

export default function OtpRegisterPage() {
  const navigate = useNavigate();

  const {
    fullName,
    email,
    phoneNumber,
    otp,
    inputRefs,
    isError,
    errorMsg,
    expired,
    formattedTime,
    handleChange,
    handleKeyDown,
    handlePaste,
    handleSubmit,
    resendCode,
  } = useOtpLogic();

  return (
    <div className="min-h-dvh w-full flex items-center justify-center bg-slate-100 p-4">
      <div
        className="relative w-full h-dvh max-w-[393px] max-h-[852px]
                   rounded-[28px] overflow-hidden shadow-[0_20px_60px_rgba(2,6,23,.18)]
                   ring-1 ring-black/10 bg-white"
      >
        <div className="relative">
          <div className="bg-[#FF9A25] h-28 w-full rounded-t-[28px]">
            <div className="pt-[env(safe-area-inset-top)] px-4">
              <div className="pt-4">
                <BackButton
                  onClick={() =>
                    navigate("/register", {
                      replace: true,
                      state: { fromOtp: true, fullName, email, phoneNumber },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div
            className="relative -mt-4 z-10 bg-white rounded-t-3xl
                       px-6 pb-[env(safe-area-inset-bottom)]"
          >
            <div className="flex justify-center pt-6">
              <BrandLogo size="sm" align="center" />
            </div>

            <p className="text-center text-sm text-gray-600 mt-3">
              Kode OTP telah dikirim ke WhatsApp Anda. Masukkan kode di bawah
              untuk melanjutkan.
            </p>

            <form onSubmit={handleSubmit} className="mt-6">
              <OtpInput
                otp={otp}
                inputRefs={inputRefs}
                isError={isError}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
              />

              {errorMsg && (
                <p className="text-red-500 text-center text-sm mt-2">
                  {errorMsg}
                </p>
              )}

              <div className="flex justify-center mt-6">
                {!expired ? (
                  <p className="text-gray-700 text-2xl font-medium tabular-nums">
                    {formattedTime()}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={resendCode}
                    className="text-[#1C6C79] font-semibold text-sm hover:underline"
                  >
                    Kirim ulang Kode OTP
                  </button>
                )}
              </div>

              <div className="w-full flex justify-center mt-6">
                <Button
                  type="submit"
                  disabled={otp.join("").length < 4}
                  className="w-3/4 sm:w-40 !bg-[#1C6C79] hover:!bg-[#15555F] !rounded-lg"
                >
                  Lanjut
                </Button>
              </div>

              <div className="text-center mt-4 text-xs md:text-sm text-gray-600 pb-6">
                Salah nomor?{" "}
                <button
                  type="button"
                  className="text-[#1C6C79] font-semibold hover:underline"
                  onClick={() =>
                    navigate("/register", {
                      replace: true,
                      state: { fromOtp: true, fullName, email, phoneNumber },
                    })
                  }
                >
                  Ubah nomor
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
