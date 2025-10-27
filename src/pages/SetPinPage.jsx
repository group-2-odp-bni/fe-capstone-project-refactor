import React from "react";
import { useNavigate } from "react-router-dom";
import BrandLogo from "../components/common/BrandLogo";
import PinKeypad from "../components/register/PinKeypad";
import PinDots from "../components/register/PinDots";
import usePinSetupLogic from "../hooks/usePinSetupLogic";
import PhoneLayoutBackground from "../components/PhoneLayoutBackground";

export default function SetPinPage() {
  const navigate = useNavigate();

  const {
    step,
    pin,
    confirmPin,
    errorMsg,
    canSubmit,
    handleNumberClick,
    handleDelete,
    handleSubmit,
    goBackPayload,
  } = usePinSetupLogic();

  const activePin = step === 1 ? pin : confirmPin;
  const title = step === 1 ? "Enter your PIN" : "Confirm your PIN";

  return (
    <PhoneLayoutBackground>
      <div
        className="relative w-full h-dvh max-w-[393px] max-h-[852px]
                   rounded-[28px] overflow-hidden shadow-[0_20px_60px_rgba(2,6,23,.18)]
                   ring-1 ring-black/10 flex flex-col bg-white"
      >
        <div className="bg-[#FF9A25] h-28 w-full rounded-t-[28px]">
          <div className="pt-[env(safe-area-inset-top)] px-4">
          </div>
        </div>

        <section className="flex-2 bg-white rounded-t-3xl px-6 pb-[env(safe-area-inset-bottom)] -mt-10 min-h-[100vh]">
          <div className="flex justify-center pt-6">
            <BrandLogo size="sm" align="center" />
          </div>
          <br />
          <br />

          <h2 className="text-center text-xl font-semibold text-slate-800 mt-4">
            {title}
          </h2>

          <div className="mt-8 flex flex-col items-center">
            <PinDots length={6} value={activePin} />
            {errorMsg && (
              <p className="text-red-500 text-sm mt-3">{errorMsg}</p>
            )}
          </div>

          <div className="mt-8">
            <PinKeypad
              onNumber={handleNumberClick}
              onDelete={handleDelete} 
              onEnter={handleSubmit}
              canEnter={canSubmit}
            />
          </div>

        </section>
      </div>
    </PhoneLayoutBackground>
  );
}
