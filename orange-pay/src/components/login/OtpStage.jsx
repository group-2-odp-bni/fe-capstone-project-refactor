import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function OtpStage() {
  const nav = useNavigate();
  const { state } = useLocation();
  const phone = state?.phone;

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [time, setTime] = useState(60);
  const [expired, setExpired] = useState(false);
  const refs = useRef([]);

  useEffect(() => {
    if (time <= 0) return setExpired(true);
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [time]);

  const handleChange = (val, i) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    setError("");
    if (val && i < 3) refs.current[i + 1]?.focus();
  };

  const verify = () => {
    const code = otp.join("");
    if (code === "1234") {
      nav("/login/pin", { state: { phone } });
    } else {
      setError("Kode OTP salah");
      refs.current[0]?.focus();
      setOtp(["", "", "", ""]);
    }
  };

  useEffect(() => {
    if (otp.every((d) => d)) verify();
  }, [otp]);

  return (
    <div className="flex-1 bg-[#FF9A25]">
      <div className="h-28" />
      <section className="flex-1 bg-white rounded-t-3xl px-6 pb-[env(safe-area-inset-bottom)] -mt-10">
        <div className="flex justify-center pt-6">
          <img src="/Orangepay.svg" alt="OrangePay" className="h-12" />
        </div>

        <h2 className="text-lg font-semibold text-center mt-4">
          Kode OTP telah dikirim ke WhatsApp {phone ? `(${phone})` : ""}
        </h2>
        <p className="text-sm text-gray-500 text-center mt-1">
          Masukkan kode di bawah untuk melanjutkan.
        </p>

        <div className="flex justify-center gap-3 mt-6">
          {otp.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              value={d}
              maxLength={1}
              inputMode="numeric"
              pattern="\d*"
              onChange={(e) => handleChange(e.target.value.slice(-1), i)}
              className={`w-12 h-12 text-center text-xl rounded-lg border ${
                error ? "border-red-500" : "border-gray-300"
              } focus:outline-none focus:border-[#1C6C79]`}
            />
          ))}
        </div>

        {error ? (
          <p className="text-red-500 text-center text-sm mt-3">{error}</p>
        ) : null}

        <div className="flex justify-center mt-6">
          {!expired ? (
            <p className="text-gray-700 text-2xl font-medium tabular-nums">
              {String(Math.floor(time / 60)).padStart(2, "0")}:
              {String(time % 60).padStart(2, "0")}
            </p>
          ) : (
            <button
              onClick={() => {
                setOtp(["", "", "", ""]);
                setTime(60);
                setExpired(false);
                refs.current[0]?.focus();
              }}
              className="text-[#1C6C79] font-semibold text-sm hover:underline"
            >
              Kirim ulang Kode OTP
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
