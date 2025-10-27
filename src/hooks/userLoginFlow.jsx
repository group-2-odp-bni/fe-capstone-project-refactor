import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { STAGES } from "../constants/loginStages";

export default function useLoginFlow() {
  const navigate = useNavigate();
  const [stage, setStage] = useState(STAGES.SPLASH1);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [zeroInputError, setZeroInputError] = useState("");
  const [phoneEditable, setPhoneEditable] = useState(false);
  const phoneInputRef = useRef(null);
  const PHONE_PREFIX = "+62";

  const [resetPhone, setResetPhone] = useState("");
  const [resetPhoneError, setResetPhoneError] = useState("");
  const [resetZeroInputError, setResetZeroInputError] = useState("");
  const [resetPhoneEditable, setResetPhoneEditable] = useState(false);

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [timer, setTimer] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const correctPin = "123456";

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const lastPath = localStorage.getItem("last_path") || "/app/dashboard";
    if (isLoggedIn === "true") navigate(lastPath);
  }, [navigate]);

  useEffect(() => {
    if (!isTimerActive) return;
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [isTimerActive, timer]);

  useEffect(() => {
    if (
      (stage === STAGES.OTP || stage === STAGES.RESET_OTP) &&
      otp.every((d) => d !== "")
    ) {
      setTimeout(validateOTP, 400);
    }
  }, [otp, stage]);

  useEffect(() => {
    if (pin.length === 6) validatePin();
  }, [pin]);

  const goBack = () => {
    if (stage === STAGES.SETPIN) return setStage(STAGES.RESET_OTP);
    if (stage === STAGES.RESET_OTP) return setStage(STAGES.RESET_PHONE);
    if (stage === STAGES.RESET_PHONE) return setStage(STAGES.PIN);
    if (stage === STAGES.PIN) return setStage(STAGES.OTP);
    if (stage === STAGES.OTP) return setStage(STAGES.PHONE);
    if (stage === STAGES.PHONE) return setStage(STAGES.SPLASH2);
    if (stage === STAGES.SPLASH2) return setStage(STAGES.SPLASH1);
  };

  const onActivatePhone = () => {
    if (!phoneEditable) {
      setPhoneEditable(true);
      setTimeout(() => phoneInputRef.current?.focus(), 0);
    }
  };
  const onPhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    if (digits.startsWith("0")) {
      setZeroInputError("Nomor tidak boleh diawali 0. Mulai dengan 8.");
      setPhoneError("");
      setPhone(digits);
      return;
    }
    setZeroInputError("");
    if (digits !== "" && !digits.startsWith("8"))
      setPhoneError("Nomor harus dimulai 8");
    else setPhoneError("");
    setPhone(digits);
  };
  const onPhoneBlur = () => {
    if (phone.length === 0) setPhoneEditable(false);
  };
  const validatePhone = () => {
    if (!phone.startsWith("8")) {
      setPhoneError("Nomor harus dimulai 8");
      return false;
    }
    if (phone.length < 9) {
      setPhoneError("Minimal 9 digit setelah +62");
      return false;
    }
    setPhoneError("");
    return true;
  };
  const sendOTP = () => {
    if (!validatePhone()) return;
    setStage(STAGES.OTP);
    setOtp(["", "", "", ""]);
    setTimer(60);
    setIsTimerActive(true);
  };

  const onActivateResetPhone = () => {
    if (!resetPhoneEditable) {
      setResetPhoneEditable(true);
    }
  };
  const onResetPhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    if (digits !== "" && digits.startsWith("0")) {
      setResetZeroInputError("Nomor tidak boleh diawali 0. Mulai dengan 8.");
      setResetPhoneError("Nomor harus dimulai 8");
      setResetPhone(digits);
      return;
    }
    setResetZeroInputError("");
    if (digits !== "" && !digits.startsWith("8"))
      setResetPhoneError("Nomor harus dimulai 8");
    else setResetPhoneError("");
    setResetPhone(digits);
  };
  const onResetPhoneBlur = () => {
    if (resetPhone.length === 0) setResetPhoneEditable(false);
  };
  const validateResetPhone = () => {
    if (!resetPhone.startsWith("8")) {
      setResetPhoneError("Nomor harus dimulai 8");
      return false;
    }
    if (resetPhone.length < 9) {
      setResetPhoneError("Minimal 9 digit setelah +62");
      return false;
    }
    setResetPhoneError("");
    return true;
  };
  const sendResetOTP = () => {
    if (!validateResetPhone()) return;
    setStage(STAGES.RESET_OTP);
    setOtp(["", "", "", ""]);
    setTimer(60);
    setIsTimerActive(true);
  };

  const handleOtpChange = (idx, val) => {
    if (val.length > 1) return;
    const next = [...otp];
    next[idx] = val.replace(/\D/g, "");
    setOtp(next);
  };
  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      e.target.form?.elements[idx - 1]?.focus();
  };
  const resendOTP = () => {
    setTimer(60);
    setIsTimerActive(true);
    setOtp(["", "", "", ""]);
  };
  const validateOTP = () => {
    const s = otp.join("");
    if (s === "1234") {
      setOtpError("");
      if (stage === STAGES.RESET_OTP) setStage(STAGES.SETPIN);
      else setStage(STAGES.PIN);
    } else {
      setOtpError("Kode OTP salah");
      setOtp(["", "", "", ""]);
    }
  };

  const handlePinInput = (digit) =>
    setPin((p) => (p.length < 6 ? p + digit : p));
  const handlePinDelete = () => setPin((p) => p.slice(0, -1));
  const validatePin = () => {
    if (pin === correctPin) {
      localStorage.setItem("isLoggedIn", "true");
      try {
        sessionStorage.setItem("token", "dummy-token");
      } catch {}
      navigate("/app/dashboard");
    } else {
      setPinError("PIN salah, coba lagi!");
      setPin("");
    }
  };

  return {
    // state
    stage,
    setStage,
    phone,
    phoneError,
    zeroInputError,
    phoneEditable,
    resetPhone,
    resetPhoneError,
    resetZeroInputError,
    resetPhoneEditable,
    otp,
    otpError,
    timer,
    isTimerActive,
    pin,
    pinError,
    // refs
    phoneInputRef,
    // handlers
    goBack,
    onActivatePhone,
    onPhoneChange,
    onPhoneBlur,
    sendOTP,
    onActivateResetPhone,
    onResetPhoneChange,
    onResetPhoneBlur,
    sendResetOTP,
    handleOtpChange,
    handleOtpKeyDown,
    resendOTP,
    handlePinInput,
    handlePinDelete,
    // constants
    STAGES,
    PHONE_PREFIX,
  };
}
