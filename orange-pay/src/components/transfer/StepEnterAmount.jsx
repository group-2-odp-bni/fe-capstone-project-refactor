// src/components/transfer/StepEnterAmount.jsx
import React from "react";
import { useTransfer } from "../../context/TransferContext";

export default function StepEnterAmount() {
  const { data, setData, setStep, prevStep } = useTransfer();

  return (
    <div>
      <div className="mb-4">
        <div className="text-sm text-gray-500">To</div>
        <div className="font-medium">{data.contactName}</div>
        <div className="text-xs text-gray-400">{data.phone}</div>
      </div>

      <div className="mb-4">
        <input
          type="number"
          value={data.amount || ""}
          onChange={(e) => setData({ amount: e.target.value })}
          placeholder="0"
          className="w-full text-right text-3xl font-bold p-3 border rounded-lg"
        />
      </div>

      <div className="mb-4">
        <input
          value={data.note || ""}
          onChange={(e) => setData({ note: e.target.value })}
          placeholder="Add a note (optional)"
          className="w-full p-3 border rounded-lg"
        />
      </div>

      <div className="flex gap-3">
        <button onClick={prevStep} className="flex-1 py-3 rounded-lg border">
          Back
        </button>
        <button
          onClick={() => setStep("confirm")}
          disabled={!data.amount || Number(data.amount) <= 0}
          className={`flex-1 py-3 rounded-lg ${data.amount ? "bg-orange-500 text-white" : "bg-gray-200"}`}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
