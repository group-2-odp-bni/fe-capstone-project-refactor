// src/pages/TransferPage.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import { useTransfer } from "../context/TransferContext";
import TransferStepGuard from "../components/transfer/TransferStepGuard";
import StepSelectContacts from "../components/transfer/StepSelectContacts";
import StepVerifyContact from "../components/transfer/StepVerifyContact";
import StepEnterAmount from "../components/transfer/StepEnterAmount";
import StepConfirm from "../components/transfer/StepConfirm";
import StepPin from "../components/transfer/StepPin";
import StepSuccess from "../components/transfer/StepSuccess";
import View from "../components/view/View";

export default function TransferPage() {
  const { step, prevStep, reset, goBack } = useTransfer();
  const navigate = useNavigate();
  const location = useLocation();

  const headerTitle = {
    select: "Transfer",
    amount: "Transfer",
    confirm: "Transfer",
    pin: "Enter PIN",
    success: "Transfer",
  }[step] || "Transfer";

  // If the URL is /app/transfer/success then render StepSuccess regardless of context.step
  const path = location.pathname || "";
  const isSuccessPath = path.endsWith("/success");

  const handleBack = () => {
    const inTransferPath = path.startsWith("/app/transfer");

    // If we're on the success route (deterministic end), always clear flow and go to dashboard.
    if (inTransferPath && isSuccessPath) {
      reset();
      navigate("/app/dashboard");
      return;
    }

    // If we're at the first step, prefer navigating browser history first.
    if (step === "select") {
      // try history back; if no previous entry, fallback to reset + dashboard
      if (window.history.length > 1) {
        navigate(-1);
        return;
      }
      reset();
      navigate("/app/dashboard");
      return;
    }

    // If we're inside transfer path for other steps, prefer in-flow goBack (keeps user inside flow)
    if (inTransferPath && typeof goBack === "function") {
      goBack();
      return;
    }

    // fallback to prevStep (in-memory step change)
    if (typeof prevStep === "function") {
      prevStep();
      return;
    }

    // Last fallback: clear and navigate
    reset();
    navigate("/app/dashboard");
  };

  return (
    <View>
      <Header title={headerTitle} onBack={handleBack} showBack centerTitle />

      {isSuccessPath ? (
        <StepSuccess />
      ) : (
        <>
          {/* Select and Verify are entry steps — Verify is not recorded in history when you navigate there */}
          {step === "select" && <StepSelectContacts />}

          {step === "verify" && <StepVerifyContact />}

          {step === "amount" && (
            <TransferStepGuard require={{ requireData: ["phone"], step: "amount" }}>
              <StepEnterAmount />
            </TransferStepGuard>
          )}

          {step === "confirm" && (
            <TransferStepGuard require={{ requireData: ["phone", "amount"], step: "confirm" }}>
              <StepConfirm />
            </TransferStepGuard>
          )}

          {step === "pin" && (
            <TransferStepGuard require={{ requireData: ["phone", "amount"], step: "pin" }}>
              <StepPin />
            </TransferStepGuard>
          )}

          {step === "success" && (
            <TransferStepGuard require={{ requireData: ["phone", "amount"], step: "success" }}>
              <StepSuccess />
            </TransferStepGuard>
          )}
        </>
      )}
    </View>
  );
}
