// src/pages/TransferPage.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import { useTransfer } from "../context/TransferContext";

import TransferStepGuard from "../components/transfer/TransferStepGuard";

import StepSelectContacts from "../components/transfer/StepSelectContacts";
import StepVerifyContact from "../components/transfer/StepVerifyContact";
import StepContactDetails from "../components/transfer/StepContactDetails";
import StepEnterAmount from "../components/transfer/StepEnterAmount";
import StepConfirm from "../components/transfer/StepConfirm";
import StepPin from "../components/transfer/StepPin";
import StepSuccess from "../components/transfer/StepSuccess";

export default function TransferPage() {
  const { step, prevStep, reset, goBack } = useTransfer();
  const navigate = useNavigate();
  const location = useLocation();

  const headerTitle = {
    select: "Transfer",
    details: "Transfer",
    amount: "Transfer",
    confirm: "Transfer",
    pin: "Enter PIN",
    success: "Transfer",
  }[step] || "Transfer";

  const handleBack = () => {
    // If we're at the first step, clear flow and go back to dashboard
    if (step === "select") {
      reset();
      navigate("/app/dashboard");
      return;
    }

    // Otherwise prefer history-aware goBack; fallback to prevStep.
    if (typeof goBack === "function") {
      goBack();
      return;
    }
    if (typeof prevStep === "function") {
      prevStep();
      return;
    }

    // As a last fallback, clear and navigate
    reset();
    navigate("/app/dashboard");
  };

  // If the URL is /app/transfer/success then render StepSuccess regardless of context.step
  const path = location.pathname || "";
  const isSuccessPath = path.endsWith("/success");

  return (
    <div className="p-6">
      <Header title={headerTitle} onBack={handleBack} showBack centerTitle />

      {isSuccessPath ? (
        <StepSuccess />
      ) : (
        <>
          {/* Select and Verify are entry steps — Verify is not recorded in history when you navigate there */}
          {step === "select" && <StepSelectContacts />}

          {step === "verify" && <StepVerifyContact />}

          {step === "details" && (
            <TransferStepGuard require={{ requireData: ["phone"], step: "details" }}>
              <StepContactDetails />
            </TransferStepGuard>
          )}

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
    </div>
  );
}
