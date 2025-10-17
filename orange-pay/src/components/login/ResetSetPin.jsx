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
        nav("/login/pin", { replace: true });
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
          {step === 1 ? "Buat PIN Baru" : "Konfirmasi PIN Baru"}
        </h2>
        <div className="flex gap-3 mt-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full ${
                active.length > i
                  ? "bg-orange-500"
                  : "bg-white outline outline-2 outline-gray-400"
              }`}
            />
          ))}
        </div>
        {err ? <p className="text-red-500 text-sm mt-4">{err}</p> : null}
      </div>

      <div className="w-full p-5 rounded-t-xl shadow-[0_-8px_40px_rgba(2,6,23,.08)]">
        <div className="grid grid-cols-3 gap-6 justify-items-center text-gray-800">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => press(String(n))}
              className="w-20 h-20 flex items-center justify-center rounded-full bg-gray-100 text-2xl font-semibold hover:bg-gray-200 active:scale-95 transition"
            >
              {n}
            </button>
          ))}
          <button disabled className="w-20 h-20 rounded-full bg-gray-200" />
          <button
            onClick={() => press("0")}
            className="w-20 h-20 flex items-center justify-center rounded-full bg-gray-100 text-2xl font-semibold hover:bg-gray-200 active:scale-95 transition"
          >
            0
          </button>
          <button
            onClick={del}
            className="w-20 h-20 flex items-center justify-center rounded-full bg-gray-100 text-2xl font-semibold hover:bg-gray-200 active:scale-95 transition"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
