// src/pages/TransferPage.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import { useTransfer } from "../context/TransferContext";

import StepSelectContacts from "../components/transfer/StepSelectContacts";
import StepContactDetails from "../components/transfer/StepContactDetails";
import StepEnterAmount from "../components/transfer/StepEnterAmount";
import StepConfirm from "../components/transfer/StepConfirm";
import StepPin from "../components/transfer/StepPin";
import StepSuccess from "../components/transfer/StepSuccess";

export default function TransferPage() {
  const { step, prevStep, reset } = useTransfer();
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
    // If inside flow (not at the first step), go to previous step
    if (step && step !== "select") {
      prevStep();
      return;
    }

    // Otherwise, user is at the first step — clear flow and go back to dashboard
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
          {step === "select" && <StepSelectContacts />}
          {step === "details" && <StepContactDetails />}
          {step === "amount" && <StepEnterAmount />}
          {step === "confirm" && <StepConfirm />}
          {step === "pin" && <StepPin />}
        </>
      )}
    </div>
  );
}
