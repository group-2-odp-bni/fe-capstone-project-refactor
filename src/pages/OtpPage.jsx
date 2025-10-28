import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function OtpInput({ length = 4, onChange }) {
  const inputsRef = useRef([]);
  const [values, setValues] = useState(Array(length).fill(""));

  useEffect(() => onChange(values.join("")), [values, onChange]);

  const onKey = (e, idx) => {
    if (e.key === "Backspace") {
      setValues((v) => {
        const copy = [...v];
        if (copy[idx]) copy[idx] = "";
        else if (idx > 0) copy[idx - 1] = "";
        return copy;
      });
      if (idx > 0) inputsRef.current[idx - 1].focus();
    }
  };

  return (
    <div className="flex gap-4 justify-center">
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          value={val}
          onChange={(e) => {
            const ch = e.target.value.slice(-1).replace(/\D/, "");
            setValues((v) => {
              const copy = [...v];
              copy[i] = ch;
              return copy;
            });
            if (ch && i < length - 1) inputsRef.current[i + 1].focus();
          }}
          onKeyDown={(e) => onKey(e, i)}
          className="w-16 h-16 text-center text-2xl border rounded-md"
        />
      ))}
    </div>
  );
}

export default function OtpPage() {
  const navigate = useNavigate();
  const loc = useLocation();
  const phone = loc.state?.phone || "unknown";

  const [otp, setOtp] = useState("");
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const onSubmit = (e) => {
    e.preventDefault();
    // mock verification success -> success page
    navigate("/app/profile/success");
  };

  return (
    <div className="min-h-screen bg-orange-400 p-6">
      <div className="max-w-md mx-auto bg-white rounded-3xl p-6 text-center">
        <button onClick={() => navigate(-1)} className="mb-4 text-left">← Kembali</button>
        <h1 className="text-lg font-semibold mb-4">Kode OTP telah dikirim ke {phone}.</h1>

        <form onSubmit={onSubmit} className="space-y-6">
          <OtpInput onChange={setOtp} length={4} />
          <div className="text-3xl font-semibold mt-4">{String(seconds).padStart(2, "0")}</div>

          <div>
            <button type="button" onClick={() => setSeconds(60)} className="underline">
              Kirim ulang Kode OTP
            </button>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={otp.length < 4}
              className="w-full bg-emerald-800 text-white py-3 rounded-full disabled:opacity-50"
            >
              Verifikasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
