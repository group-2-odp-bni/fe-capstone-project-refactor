import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function useOtpLogic() {
  const navigate = useNavigate();
  const { state: routeState } = useLocation();
  const { fullName, email, phoneNumber } = routeState || {};

  const CORRECT_OTP = useMemo(() => "1234", []);

  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const [timeLeft, setTimeLeft] = useState(60);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const lastPath = localStorage.getItem("last_path") || "/app/dashboard";
    if (isLoggedIn === "true") navigate(lastPath);
  }, [navigate]);

  useEffect(() => {
    if (timeLeft <= 0) {
      setExpired(true);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const focusInput = useCallback((idx) => {
    const el = inputRefs.current[idx];
    if (el) el.focus();
  }, []);

  const handleChange = useCallback(
    (val, idx) => {
      if (!/^\d?$/.test(val)) return;
      const next = [...otp];
      next[idx] = val;
      setOtp(next);
      setErrorMsg("");
      setIsError(false);

      if (val && idx < 3) focusInput(idx + 1);
    },
    [otp, focusInput]
  );

  const handleKeyDown = useCallback(
    (e, idx) => {
      if (e.key === "Backspace") {
        if (!otp[idx] && idx > 0) {
          const prev = [...otp];
          prev[idx - 1] = "";
          setOtp(prev);
          focusInput(idx - 1);
        } else {
          const cur = [...otp];
          cur[idx] = "";
          setOtp(cur);
        }
      }
      if (e.key === "ArrowLeft" && idx > 0) focusInput(idx - 1);
      if (e.key === "ArrowRight" && idx < 3) focusInput(idx + 1);
    },
    [otp, focusInput]
  );

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);
    if (!pasted) return;
    const arr = pasted.split("").concat(Array(4).fill("")).slice(0, 4);
    setOtp(arr);
    setErrorMsg("");
    setIsError(false);
    if (arr.join("").length === 4) verifyOtp(arr.join(""));
  }, []);

  const verifyOtp = useCallback(
    (value) => {
      if (value === CORRECT_OTP) {
        setErrorMsg("");
        setIsError(false);
        navigate("/register/setpin", {
          state: { fullName, email, phoneNumber },
        });
      } else {
        setErrorMsg("OTP salah");
        setIsError(true);
        focusInput(0);
      }
    },
    [CORRECT_OTP, navigate, focusInput, fullName, email, phoneNumber]
  );

  const handleSubmit = useCallback(
    (e) => {
      e?.preventDefault();
      const code = otp.join("");
      if (code.length < 4) {
        setErrorMsg("Masukkan 4 digit kode");
        setIsError(true);
        return;
      }
      verifyOtp(code);
    },
    [otp, verifyOtp]
  );

  const resendCode = useCallback(() => {
    setOtp(["", "", "", ""]);
    setErrorMsg("");
    setIsError(false);
    setTimeLeft(60);
    setExpired(false);
    setTimeout(() => focusInput(0), 50);
  }, [focusInput]);

  const formattedTime = useCallback(() => {
    const mm = Math.floor(timeLeft / 60)
      .toString()
      .padStart(2, "0");
    const ss = (timeLeft % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  }, [timeLeft]);

  return {
    fullName,
    email,
    phoneNumber,
    otp,
    inputRefs,
    isError,
    errorMsg,
    expired,
    timeLeft,
    formattedTime,
    handleChange,
    handleKeyDown,
    handlePaste,
    handleSubmit,
    resendCode,
  };
}
