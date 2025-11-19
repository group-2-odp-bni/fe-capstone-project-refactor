import React, { useState } from "react";
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

  const submitPin = async () => {
    setAttempt((x) => x + 1);

    if (pin.length !== 6) {
      setError("PIN harus 6 digit");
      return;
    }

    if (!loginData?.stateToken) {
       setError("Sesi login tidak valid. Silakan coba lagi.");
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
 
      navigate("/app/dashboard");
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Something went wrong."
      );
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
    submitPin();
  };

  return (
    <form onSubmit={onFormSubmit} className="pb-10">
      <CenteredNumberInputPad
        value={pin}
        onChange={setPin}
        onConfirm={submitPin}
        errorText={error}
       loading={loading}
        title="Masukkan PIN Anda"
        attemptKey={attempt}
        onClearError={() => setError("")}
        onBack={goBack} // ← aktif di login
        onForgot={handleForgotPin} // ← aktif di login
      />

      {error && (
       <p className="text-red-500 text-xs text-center mb-4">{error}</p>
      )}

       <FullSubmitButton disabled={loading || pin.length !== 6}>
        {loading ? "Memverifikasi..." : "Masuk"}
      </FullSubmitButton>
    </form>
  );
}
