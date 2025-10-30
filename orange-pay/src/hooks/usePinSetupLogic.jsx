import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
//import Swal from "sweetalert2"; 
export default function usePinSetupLogic() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { fullName, email, phoneNumber } = state || {};

  const [step, setStep] = useState(1);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const lastPath = localStorage.getItem("last_path") || "/app/dashboard";
    if (isLoggedIn === "true") navigate(lastPath);
  }, [navigate]);

  const goBackPayload = useMemo(
    () => ({ fromOtp: true, fullName, email, phoneNumber }),
    [fullName, email, phoneNumber]
  );

  const handleNumberClick = (num) => {
    setErrorMsg("");
    if (step === 1 && pin.length < 6) setPin((p) => p + String(num));
    if (step === 2 && confirmPin.length < 6)
      setConfirmPin((p) => p + String(num));
  };

  const handleDelete = () => {
    setErrorMsg("");
    if (step === 1) setPin((p) => p.slice(0, -1));
    else setConfirmPin((p) => p.slice(0, -1));
  };

  const canSubmit = step === 1 ? pin.length === 6 : confirmPin.length === 6;

  const handleSubmit = () => {
    if (!canSubmit) return;

    if (step === 1) {
      setStep(2);
      return;
    }

    if (pin !== confirmPin) {
      setErrorMsg("PIN tidak cocok. Coba lagi.");
      setConfirmPin("");
      return;
    }

    // If we have registration state (fullName/email/phoneNumber), this
    // Set PIN flow is part of registration — after confirming PIN we should
    // route back to login so the user can sign in.
    if (fullName || email || phoneNumber) {
        Swal.fire({
          icon: "success",
          title: "SELAMAT BERGABUNG DI ORANGEPAY !!",
          text: "Akun Anda telah berhasil dibuat!",
          confirmButtonColor: "#FF9A25",
        }).then(() => {
          navigate("/login", { replace: true });
        });
      return;
    }

    // Otherwise, existing flow: set session token and go to dashboard
    sessionStorage.setItem("token", "dummy-token");
    navigate("/app/dashboard", {
      state: { fullName, email, phoneNumber, confirmPin },
      replace: true,
    });
  };

  return {
    step,
    pin,
    confirmPin,
    errorMsg,
    canSubmit,
    handleNumberClick,
    handleDelete,
    handleSubmit,
    goBackPayload,
  };
}
