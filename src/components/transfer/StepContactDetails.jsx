// src/components/transfer/StepContactDetails.jsx
import React from "react";
import { useTransfer } from "../../context/TransferContext";

export default function StepContactDetails() {
  const { data, setData, setStep, prevStep } = useTransfer();

  return (
    <div>
      <div className="mb-4">
        <div className="text-sm text-gray-500">To</div>
        <div className="font-semibold text-lg">{data.contactName}</div>
        <div className="text-xs text-gray-400">{data.phone}</div>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-600">
          You can now enter the amount to send to {data.contactName}.
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={prevStep} className="flex-1 py-3 rounded-lg border">
          Back
        </button>
        <button onClick={() => setStep("amount")} className="flex-1 py-3 rounded-lg bg-orange-500 text-white">
          Continue
        </button>
      </div>
    </div>
  );
}
