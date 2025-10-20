import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ResetSetPin() {
  const nav = useNavigate();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState(1);
  const [err, setErr] = useState("");

  const press = (d) => {
    setErr("");
    if (step === 1) setPin((p) => (p.length < 6 ? p + d : p));
    else setConfirmPin((p) => (p.length < 6 ? p + d : p));
  };
  const del = () => {
    if (step === 1) setPin((p) => p.slice(0, -1));
    else setConfirmPin((p) => p.slice(0, -1));
  };

  useEffect(() => {
    if (step === 1 && pin.length === 6) setStep(2);
    if (step === 2 && confirmPin.length === 6) {
      if (pin === confirmPin) {
        try {
          sessionStorage.setItem("token", "reset-pin-done");
        } catch (e) {
          console.warn("sessionStorage set failed", e);
        }
        nav("/app/dashboard", { replace: true });
      } else {
        setErr("PIN tidak sama, coba lagi");
        setConfirmPin("");
      }
    }
  }, [pin, confirmPin, step, nav]);

  const active = step === 1 ? pin : confirmPin;

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="flex-1 flex flex-col items-center justify-start pt-12">
        <h2 className="text-lg font-semibold">
          {step === 1 ? "Enter your PIN" : "Confirm your New PIN"}
        </h2>
        <div className="flex gap-3 mt-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full ${active.length > i
                ? "bg-orange-500"
                : "bg-white outline outline-2 outline-gray-400"
                }`}
            />
          ))}
        </div>
        {err ? <p className="text-red-500 text-sm mt-4">{err}</p> : null}
      </div>

      <div className="mt-2 w-full bg-white p-5 rounded-t-xl shadow-lg">
        <div className="grid grid-cols-3 gap-6 justify-items-center text-gray-800">
          {[
            { value: "1", letters: "" },
            { value: "2", letters: "" },
            { value: "3", letters: "" },
            { value: "4", letters: "" },
            { value: "5", letters: "" },
            { value: "6", letters: "" },
            { value: "7", letters: "" },
            { value: "8", letters: "" },
            { value: "9", letters: "" },
          ].map((k) => (
            <button
              key={k.value}
              onClick={() => press(k.value)}
              className="w-20 h-20 rounded-full bg-gray-100 text-2xl font-semibold shadow-lg hover:bg-gray-200 active:scale-95 transition"
            >
              {k.value}
              <div className="text-[10px] mt-1">{k.letters}</div>
            </button>
          ))}

          <button
            onClick={() => { }}
            disabled={active.length < 6}
            className={`w-20 h-20 rounded-full text-2xl font-semibold shadow-lg active:scale-95
    bg-[#305856] text-white
    ${active.length < 6 ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}
  `}
            title={active.length === 6 ? "Enter" : "Isi PIN 6 digit"}
          >
            ✓
          </button>

          <button
            onClick={() => press("0")}
            className="w-20 h-20 rounded-full bg-gray-100 text-2xl font-semibold shadow-lg hover:bg-gray-200 active:scale-95"
          >
            0
          </button>

          <button
            onClick={del}
            className="w-20 h-20 rounded-full bg-gray-100 text-2xl font-semibold shadow-lg hover:bg-gray-200 active:scale-95"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
