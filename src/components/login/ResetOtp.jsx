import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ResetOtp() {
  const nav = useNavigate();
  const { state } = useLocation();
  const phone = state?.phone;

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [error, setError] = useState("");

  const refs = useRef([]);

  useEffect(() => {
    if (otp.every((d) => d)) {
      const code = otp.join("");
      if (code === "1234") {
        nav("/login/reset/setpin", { state: { phone } });
      } else {
        setError("Kode OTP salah");
        setOtp(["", "", "", ""]);
        refs.current[0]?.focus();
      }
    }
  }, [otp, nav, phone]);

  return (
    <div className="flex-1 bg-[#FF9A25]">
      <div className="h-28" />
      <section className="flex-1 bg-white rounded-t-3xl px-6 -mt-10">
        <div className="flex justify-center pt-6">
          <img src="/Orangepay.svg" alt="OrangePay" className="h-12" />
        </div>
        <h2 className="text-lg font-semibold text-center mt-4">
          OTP reset dikirim ke {phone ? `(${phone})` : ""}
        </h2>

        <div className="flex justify-center gap-3 mt-6">
          {otp.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              value={d}
              maxLength={1}
              inputMode="numeric"
              pattern="\d*"
              onChange={(e) => {
                const v = e.target.value.slice(-1).replace(/\D/g, "");
                const next = [...otp];
                next[i] = v;
                setOtp(next);
                if (v && i < 3) refs.current[i + 1]?.focus();
              }}
              className="w-12 h-12 text-center text-xl rounded-lg border border-gray-300 focus:outline-none focus:border-[#1C6C79]"
            />
          ))}
        </div>

        {error ? (
          <p className="text-red-500 text-center text-sm mt-3">{error}</p>
        ) : null}
      </section>
    </div>
  );
}
