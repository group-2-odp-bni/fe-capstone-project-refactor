import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import CenteredNumberInputPad from "../../components/register/CenteredNumberInputPad";
import PageHeader from "../../components/page_header/PageHeader";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import { saveTokens } from "../../services/auth/authService";
import { useLoginContext } from "../../context/LoginContext";
import axios from "axios";
import View from "../../components/view/View";

const API_BASE = import.meta.env.VITE_API_BASE || "";
const MAX_ATTEMPTS = 5; // ✅ Diubah jadi 5 kesempatan

export default function PinLoginPage() {
  return (
    <View>
      <PageHeader className="mt-5 mb-5">Masukkan PIN</PageHeader>
      <WhiteCardContainer>
        <PinLoginContent />
      </WhiteCardContainer>
    </View>
  );
}

function PinLoginContent() {
  const navigate = useNavigate();
  const { loginData } = useLoginContext();

  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // redirect auto setelah terkunci ke halaman root "/"
  useEffect(() => {
    if (isLocked) {
      const timer = setTimeout(() => {
        navigate("/", { replace: true }); // ✅ Redirect ke root path
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isLocked, navigate]);

  const submitPin = async () => {
    setAttempt((x) => x + 1);

    // udah keburu ke-lock → jangan apa² lagi
    if (isLocked) {
      setError("Akun Anda telah terblokir. Mengalihkan ke halaman utama...");
      return;
    }

    // panjang PIN
    if (pin.length !== 6) {
      setError("PIN harus 6 digit");
      return;
    }

    // kalau stateToken nggak ada, tetap dianggap 1 percobaan login yang gagal
    if (!loginData?.stateToken) {
      setFailedAttempts((prev) => {
        const newFailed = prev + 1;

        if (newFailed >= MAX_ATTEMPTS) {
          setIsLocked(true);
          setError(
            "Akun Anda telah terblokir. Anda akan dialihkan ke halaman utama..."
          );
          setPin("");
        } else {
          const remaining = MAX_ATTEMPTS - newFailed;
          setError(
            `Anda masih punya kesempatan ${remaining} kali lagi.`
          );
        }

        return newFailed;
      });
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/api/v1/auth/pin`,
        { pin },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${loginData.stateToken}`,
          },
        }
      );
      const { accessToken, refreshToken } = res?.data?.data || {};
      saveTokens(accessToken, refreshToken);

      // login sukses → reset counter
      setFailedAttempts(0);
      setIsLocked(false);
      navigate("/app/dashboard");
    } catch (err) {
      const serverMsg =
        err?.response?.data?.message || err?.message || "Something went wrong.";

      setFailedAttempts((prev) => {
        const newFailed = prev + 1;

        if (newFailed >= MAX_ATTEMPTS) {
          setIsLocked(true);
          setError(
            "Akun Anda telah terblokir. Anda akan dialihkan ke halaman utama..."
          );
          setPin("");
        } else {
          const remaining = MAX_ATTEMPTS - newFailed;
          setError(
            `Pin Anda Salah. Anda masih punya kesempatan ${remaining} kali lagi.`
          );
        }

        return newFailed;
      });
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/login", { replace: true });
  };

  const handleForgotPin = () => {
    navigate("/login/forget-pin/otp", {
      state: { phone: loginData?.phone ?? null },
    });
  };

  const onFormSubmit = (e) => {
    e.preventDefault();
    if (!isLocked) {
      submitPin();
    }
  };

  return (
    <form onSubmit={onFormSubmit} className="pb-10">
      <CenteredNumberInputPad
        value={pin}
        onChange={setPin}
        onConfirm={submitPin}
        errorText={error}
        loading={loading || isLocked}
        attemptKey={attempt}
        onClearError={() => setError("")}
        onBack={goBack}
        onForgot={handleForgotPin}
      />

      {error && (
        <p
          className={`text-xs text-center mb-4 ${
            isLocked ? "text-red-600 font-semibold" : "text-red-500"
          }`}
        >
          {error}
        </p>
      )}

      <FullSubmitButton disabled={loading || pin.length !== 6 || isLocked}>
        {isLocked ? "Akun Terblokir" : loading ? "Memverifikasi..." : "Masuk"}
      </FullSubmitButton>
    </form>
  );
}
