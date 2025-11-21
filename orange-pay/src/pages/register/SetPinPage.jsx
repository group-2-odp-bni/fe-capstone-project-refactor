import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import CenteredNumberInputPad from "../../components/register/CenteredNumberInputPad";
import PageHeader from "../../components/page_header/PageHeader";
import { useRegistrationContext } from "../../context/RegistrationContext";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import { saveTokens } from "../../services/auth/authService";
import View from "../../components/view/View";
import axios from "axios";
import { useToast } from "../../context/ToastContext";

export default function SetPinPage() {
  return (
    <div>
      <PageHeader className="mt-5 mb-5">Input Pin</PageHeader>
      <WhiteCardContainer>
        <SetPinContent />
      </WhiteCardContainer>
    </div>
  );
}
const API_BASE = import.meta.env.VITE_API_BASE || "";

function SetPinContent() {
  const navigate = useNavigate();
  const { userData } = useRegistrationContext();

  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState(null);
  const [step, setStep] = useState("create"); // "create" | "confirm"
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { showToast } = useToast();

  const submitPin = async () => {
    setAttempt((x) => x + 1);

    if (pin.length !== 6) {
      showToast({
        type: "error",
        title: "Error",
        message: "PIN harus 6 digit",
      })
      return;
    }

    // Step 1 — Create
    if (step === "create") {
      setFirstPin(pin);
      setPin("");
      setStep("confirm");
      return;
    }

    // Step 2 — Confirm
    if (pin !== firstPin) {
      showToast({
        type: "error",
        title: "Error",
        message: "PIN tidak cocok, silakan coba lagi.",
      })
      setPin("");
      setFirstPin(null);
      setStep("create");
      return;
    }

    // Step 3 — Send to backend
    if (!userData?.stateToken) {
      showToast({
        type: "error",
        title: "Error",
        message: "Sesi registrasi tidak valid. Silakan ulangi.",
      })
      return;
    }

    setLoading(true);
    try {
      const pinRes = await axios.post(
        `${API_BASE}/api/v1/auth/pin`,
        { pin },
        {
          headers: {
            Authorization: `Bearer ${userData.stateToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const { accessToken, refreshToken } = pinRes.data?.data || {};
      if (!accessToken) throw new Error("Access token tidak ditemukan");

      saveTokens(accessToken, refreshToken);
      navigate("/app/dashboard");
    } catch (err) {
      const errorCode = err?.response?.data?.error?.code;

      if (errorCode === "AUTH-3002") {
        showToast({
          type: "error",
          title: "Error",
          message: "Pin yang dibuat terlalu lemah. Mohon buat ulang.",
        })
      } else {
        showToast({
          type: "error",
          title: "Error",
          message: "Terjadi kesalahan. Silakan coba lagi.",
        })
      }

      setPin("");
      setFirstPin(null);
      setStep("create");
    } finally {
      setLoading(false);
    }
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
        loading={loading}
        title={step === "create" ? "Buat PIN Anda" : "Konfirmasi PIN Anda"}
        attemptKey={attempt}
        onBack={() => navigate("/register")}
        onForgot={() => { }}
      />
    </form>
  );
}
