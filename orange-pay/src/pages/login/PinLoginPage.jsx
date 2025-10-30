import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import CenteredNumberInputPad from "../../components/register/CenteredNumberInputPad";
import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import MobileShell from "../../components/layout/MobileShell";
import PageHeader from "../../components/page_header/PageHeader";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import { saveTokens } from "../../services/auth/authService";
import { useLoginContext } from "../../context/LoginContext";

export default function PinLoginPage() {
  return (
    <PhoneLayoutBackground>
      <MobileShell>
        <PageHeader className="mt-5 mb-5">Masukkan PIN</PageHeader>
        <WhiteCardContainer>
          <PinLoginContent />
        </WhiteCardContainer>
      </MobileShell>
    </PhoneLayoutBackground>
  );
}

function PinLoginContent() {
  const navigate = useNavigate();
  const { loginData } = useLoginContext();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("--- sending login PIN ---");
      console.log(`PIN: ${pin}`);
      console.log(`State token: ${loginData.stateToken}`);

      const response = await fetch("/api/v1/auth/pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${loginData.stateToken}`,
        },
        body: JSON.stringify({ pin }),
      });

      if (!response.ok) throw new Error("Failed to verify PIN");

      const data = await response.json();

      // Save tokens securely
      saveTokens(data.data.accessToken, data.data.refreshToken);

      console.log("PIN verified successfully:", data);

      // Navigate to dashboard
      navigate("/app/dashboard");
    } catch (err) {
      console.error("PIN verification failed:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pb-10">
      <CenteredNumberInputPad value={pin} onChange={setPin} />

      {error && <p className="text-red-500 text-xs text-center mb-4">{error}</p>}

      <FullSubmitButton disabled={loading}>
        {loading ? "Memverifikasi..." : "Masuk"}
      </FullSubmitButton>
    </form>
  );
}
