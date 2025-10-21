// src/pages/TransferPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
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

  const headerTitle = {
    select: "Transfer",
    details: "Transfer",
    amount: "Transfer",
    confirm: "Transfer",
    pin: "Enter PIN",
    success: "Transfer",
  }[step] || "Transfer";

  const handleBack = () => {
    // if inside flow (not at first step), go to previous step
    if (step && step !== "select") {
      prevStep();
      return;
    }
    // otherwise, user is at entry of transfer — clear flow and go back to dashboard
    reset();
    navigate("/app/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden p-6">
        <Header title={headerTitle} onBack={handleBack} showBack centerTitle />

        {step === "select" && <StepSelectContacts />}
        {step === "details" && <StepContactDetails />}
        {step === "amount" && <StepEnterAmount />}
        {step === "confirm" && <StepConfirm />}
        {step === "pin" && <StepPin />}
        {step === "success" && <StepSuccess />}
      </div>
    </div>
  );
}
