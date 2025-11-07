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
import axios from "axios";
import MobileView from "../../components/view/MobileView";

export default function PinLoginPage() {
  return (
    <MobileView>
      <PageHeader className="mt-5 mb-5">Masukkan PIN</PageHeader>
      <WhiteCardContainer>
        <PinLoginContent />
      </WhiteCardContainer>
    </MobileView>
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

      const response = await axios.post(
        "/api/v1/auth/pin",
        { pin }, // request body
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${loginData.stateToken}`,
          },
        }
      );

      // Save tokens securely
      const { accessToken, refreshToken } = response.data.data;
      saveTokens(accessToken, refreshToken);

      console.log("PIN verified successfully:", response.data);

      // Navigate to dashboard
      navigate("/app/dashboard");
    } catch (err) {
      console.error("PIN verification failed:", err);
      setError(err.response?.data?.message || err.message || "Something went wrong.");
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
