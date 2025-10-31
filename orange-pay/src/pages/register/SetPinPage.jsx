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
  console.log(userData.stateToken);

  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const pinRes = await api.post(
        "/api/v1/auth/pin",
        { pin },
        {
          headers: { Authorization: `Bearer ${userData.stateToken}` },
        }
      );

      const accessToken = pinRes.data?.data?.accessToken;
      const refreshToken = pinRes.data?.data?.refreshToken;
      if (!accessToken) throw new Error("Access token tidak ditemukan");
      saveTokens(accessToken, refreshToken);
      const idemKey = `wallet-create-${uuidv4()}`;
      const createWalletRes = await api.post(
        "/api/v1/wallets",
        {
          type: "PERSONAL",
          name: "Default Main Wallet",
          metadata: { colors: "#2F5755" },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Idempotency-Key": idemKey,
          },
        }
      );
      const walletId =
        createWalletRes.data?.data?.id || createWalletRes.data?.data?.walletId; // fallback kalau BE pakai field berbeda
      if (!walletId) throw new Error("Wallet ID tidak ditemukan dari response");
      await api.put(
        "/api/v1/users/me/receive/default",
        { walletId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      navigate("/app/dashboard");
    } catch {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pb-10">
      <CenteredNumberInputPad value={pin} onChange={setPin} />
      <FullSubmitButton disabled={loading}>
        {loading ? "Menyimpan..." : "Simpan"}
      </FullSubmitButton>
    </form>
  );
}
