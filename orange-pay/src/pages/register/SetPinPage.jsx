import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import CenteredNumberInputPad from "../../components/register/CenteredNumberInputPad";
import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import MobileShell from "../../components/layout/MobileShell";
import PageHeader from "../../components/page_header/PageHeader";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import { useRegistrationContext } from "../../context/RegistrationContext";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import { saveTokens } from "../../services/auth/authService";
import api from "../../lib/api";
import { v4 as uuidv4 } from "uuid";

export default function SetPinPage() {
  return (
    <PhoneLayoutBackground>
      <MobileShell>
        <PageHeader className="mt-5 mb-5">Input Pin</PageHeader>
        <WhiteCardContainer>
          <SetPinContent />
        </WhiteCardContainer>
      </MobileShell>
    </PhoneLayoutBackground>
  );
}

function SetPinContent() {
  const navigate = useNavigate();
  const { userData } = useRegistrationContext();

  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const submitPin = async () => {
    setAttempt((x) => x + 1);

    if (pin.length !== 6) { setError("PIN harus 6 digit"); return; }
    if (!userData?.stateToken) { setError("Sesi registrasi tidak valid. Silakan ulangi."); return; }

    setError(""); setLoading(true);

    try {
      const pinRes = await api.post("/api/v1/auth/pin", { pin }, {
        headers: { Authorization: `Bearer ${userData.stateToken}`, "Content-Type": "application/json" },
      });

      const { accessToken, refreshToken } = pinRes.data?.data || {};
      if (!accessToken) throw new Error("Access token tidak ditemukan");
      saveTokens(accessToken, refreshToken);
      navigate("/app/dashboard");
    } catch (err) {
      console.error("Set PIN failed:", err);
      setError(err?.response?.data?.message || err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const onFormSubmit = (e) => { e.preventDefault(); submitPin(); };

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/register", { replace: true });
  };

  return (
    <form onSubmit={onFormSubmit} className="pb-10">
      <CenteredNumberInputPad
        value={pin}
        onChange={setPin}
        onConfirm={submitPin}
        errorText={error}
        loading={loading}
        title="Buat PIN Anda"
        attemptKey={attempt}
        onClearError={() => setError("")}
        onBack={goBack}
      />

      {error && <p className="text-red-500 text-xs text-center mb-4">{error}</p>}

      <FullSubmitButton disabled={loading || pin.length !== 6}>
        {loading ? "Menyimpan..." : "Simpan"}
      </FullSubmitButton>
    </form>
  );
}
