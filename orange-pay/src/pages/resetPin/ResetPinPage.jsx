import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CenteredNumberInputPad from "../../components/register/CenteredNumberInputPad";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import { saveTokens } from "../../services/auth/authService";
import api from "../../lib/api";
import View from "../../components/view/View";
import { useToast } from "../../context/ToastContext";

export default function SetPinPage() {
  return (
    <View>
      <WhiteCardContainer>
        <SetPinContent />
      </WhiteCardContainer>
    </View>
  );
}

function SetPinContent() {
  const navigate = useNavigate();

  const [oldPin, setOldPin] = useState("");
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState(null);
  const [step, setStep] = useState("inputOldPin");
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { showToast } = useToast()

  const submitPin = async () => {
    setAttempt((x) => x + 1);

    // hanldle pin lenght
    if (pin.length !== 6) {
      showToast({
        type: "error",
        title: "Error",
        message: "PIN harus 6 digit",
      })
      return;
    }

    // Step 1 — Input old pin
    if (step === "inputOldPin") {
      setOldPin(pin);
      setPin("");
      setStep("inputNewPin");

      return;
    }

    // Step 2 — Create new PIN
    if (step === "inputNewPin") {
      setNewPin(pin);
      setPin("");
      setStep("confirm");
      return;
    }

    // Step 3 — Confirm new PIN
    if (step === "confirm") {


      // if pin not the same, return to step 1 else pass to step 4
      if (pin !== newPin) {
        showToast({
          type: "error",
          title: "Error",
          message: "PIN tidak cocok, silakan coba lagi.",
        })
        setPin("");
        setNewPin(null);
        setStep("inputNewPin");
        return;
      }
    }

    // Step 4 — Send to backend
    setLoading(true);
    try {
      const response = await api.post("/api/v1/pin/change", {
        newPin: newPin,
        currentPin: oldPin,
      });

      const { accessToken, refreshToken } = response.data?.data || {};
      if (!accessToken) throw new Error("Access token tidak ditemukan");

      saveTokens(accessToken, refreshToken);
      navigate("/app/dashboard");

    } catch (err) {
      const errorCode = err?.response?.data?.error?.code;

      if (errorCode === "AUTH-3003") {
        showToast({
          type: "error",
          title: "Error",
          message: "Pin lama salah, mohon input ulang pin.",
        })
        setStep("inputOldPin");

      } else if (errorCode === "AUTH-3002") {
        showToast({
          type: "error",
          title: "Error",
          message: "Pin baru terlalu lemah, mohon input ulang pin baru.",
        })

        setStep("inputNewPin");

      } else {
        showToast({
          type: "error",
          title: "Error",
          message: err?.response?.data?.error?.message,
        })
        setStep("inputNewPin");

      }

      setPin("");
      setNewPin(null);

    } finally {
      setLoading(false);
    }
  };

  const onFormSubmit = (e) => {
    e.preventDefault();
    submitPin();
  };

  const getTitle = () => {
    if (step === "inputOldPin") return "Masukkan PIN Lama";
    if (step === "inputNewPin") return "Buat PIN Baru";
    return "Konfirmasi PIN Baru";
  };

  return (
    <form className="pb-10">
      <CenteredNumberInputPad
        value={pin}
        onChange={setPin}
        onConfirm={submitPin}
        loading={loading}
        title={getTitle()}
        attemptKey={attempt}
        onBack={() => navigate("/app/account")}

      />


    </form>
  );
}
