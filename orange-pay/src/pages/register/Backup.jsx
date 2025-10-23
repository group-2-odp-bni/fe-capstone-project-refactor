import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

import BackButton from "../../components/common/BackButton";
import Button from "../../components/common/Button";
import OtpInput from "../../components/register/OtpInput";
import BrandLogo from "../../components/common/BrandLogo";
import useOtpLogic from "../../hooks/useOtpLogic";
import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";

// import FullSubmitButton from "../../components/button/FullSubmitButton";

export default function OtpRegisterPage() {


  // const navigate = useNavigate();
  

  return (
    <PhoneLayoutBackground>
      <div
        className="relative w-full h-dvh max-w-[393px] max-h-[852px]
                   rounded-[28px] overflow-hidden shadow-[0_20px_60px_rgba(2,6,23,.18)]
                   ring-1 ring-black/10 bg-white"
      >
        <div className="relative">
          <div className="bg-[#FF9A25] h-28 w-full rounded-t-[28px]">
            <div className="pt-[env(safe-area-inset-top)] px-4">
              <div className="pt-4">
                <button
                  // onClick={() =>
                  //   navigate("/register", {
                  //     replace: true,
                  //     state: { fromOtp: true, fullName, email, phoneNumber },
                  //   })
                  // }
                  aria-label="Back"
                  className="absolute left-4 top-4 w-9 h-9 grid place-items-center rounded-full bg-white text-[#FF9A25] shadow-md font-semibold"
                >
                  🡨
                </button>
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
              Kode OTP telah dikirim ke xxxx. Masukkan kode di bawah
              untuk melanjutkan.
            </p>

            <form className="mt-6">
              <OtpInput></OtpInput>

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

              {/* <FullSubmitButton>Lanjut</FullSubmitButton> */}

              <div className="text-center mt-4 text-xs md:text-sm text-gray-600 pb-6">
                Salah nomor?{" "}
                <button
                  type="button"
                  className="text-[#1C6C79] font-semibold hover:underline"
                  // onClick={() =>
                  //   navigate("/register", {
                  //     replace: true,
                  //     state: { fromOtp: true, fullName, email, phoneNumber },
                  //   })
                  // }
                >
                  Ubah nomor
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PhoneLayoutBackground>
  );
}
