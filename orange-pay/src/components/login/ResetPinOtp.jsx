import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLoginContext } from "../../context/LoginContext";
import { verifyOtpApi } from "../../services/authService";

const STORAGE_KEY = "app:login_flow";

function readPhoneFromSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.phone ?? null;
  } catch {
    return null;
  }
}

export default function ResetPinOtp() {
  const nav = useNavigate();
  const { state } = useLocation();

  let phoneFromState = state?.phone ?? null;
  const { loginFlow, markOtpVerified } = (() => {
    try {
      return useLoginContext();
    } catch (e) {
      return { loginFlow: null, markOtpVerified: () => { } };
    }
  })();

  const phone = loginFlow?.phone ?? phoneFromState ?? readPhoneFromSession();

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [time, setTime] = useState(60);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const refs = useRef([]);

  useEffect(() => {
    if (time <= 0) {
      setExpired(true);
      return;
    }
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [time]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const handleChange = (val, i) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    setError("");
    if (val && i < refs.current.length - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (e, i) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const resend = () => {
    setOtp(["", "", "", ""]);
    setTime(60);
    setExpired(false);
    setError("");
    refs.current[0]?.focus();
  };

  const submitOtp = async (code) => {
    if (!phone) {
      setError("Nomor telepon tidak ditemukan. Kembali ke halaman reset.");
      return nav("/login/reset", { replace: true });
    }
    setLoading(true);
    setError("");
    try {
      await verifyOtpApi(phone, code);

      try {
        markOtpVerified();
      } catch (e) {
        console.warn("markOtpVerified failed (provider missing?), continuing", e);
      }

      // navigate to reset set-pin step (choose appropriate route)
      nav("/login/reset/pin", { replace: true });
    } catch (err) {
      console.error("OTP verification failed:", err);
      setError(err?.message || "Gagal verifikasi OTP");
      setOtp(["", "", "", ""]);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (otp.every((d) => d && d.length > 0)) {
      const code = otp.join("");
      const id = setTimeout(() => submitOtp(code), 100);
      return () => clearTimeout(id);
    }
  }, [otp]);

  return (
    <div className="flex-1 bg-[#FF9A25]">
      <button
        onClick={() => nav("/login/reset")}
        aria-label="Back"
        className="absolute left-4 top-4 w-9 h-9 grid place-items-center rounded-full bg-white text-[#FF9A25] shadow-md font-semibold"
      >
        🡨
      </button>
      <div className="h-28" />
      <section className="flex-2 bg-white rounded-t-3xl px-6 pb-[env(safe-area-inset-bottom)] -mt-10 min-h-[100vh]">
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
              onKeyDown={(e) => handleKeyDown(e, i)}
              disabled={loading}
              className={`w-12 h-12 text-center text-xl rounded-lg border ${error ? "border-red-500" : "border-gray-300"
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
                resend();
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
