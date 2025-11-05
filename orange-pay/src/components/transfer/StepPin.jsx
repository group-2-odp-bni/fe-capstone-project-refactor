// src/components/transfer/StepPin.jsx
import React, { useState, useEffect } from "react";
import { useTransfer } from "../../context/TransferContext";
import useTransferApi from "../../hooks/api/useTransfer";
import { useNavigate } from "react-router-dom";

const Key = ({ children, onClick, className }) => (
  <button type="button" onClick={onClick} className={`w-16 h-16 rounded-full text-lg ${className || ""}`}>{children}</button>
);

export default function StepPin() {
  // ----- hooks first -----
  const { data, setStep, reset } = useTransfer();
  const { executeTransfer } = useTransferApi();
  const navigate = useNavigate();

  const [pin, setPinLocal] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // redirect if required data missing
  useEffect(() => {
    if (!data || !data.phone || !data.amount || !data.transactionId) {
      navigate("/app/transfer", { replace: true });
    }
  }, [data, navigate]);

  const addDigit = (d) => {
    if (pin.length >= 6) return;
    setPinLocal((p) => p + d);
  };
  const backspace = () => setPinLocal((p) => p.slice(0, -1));
  const clear = () => setPinLocal("");

  const submitPinAndTransfer = async () => {
    setError(null);

    if (pin.length !== 6) {
      setError("PIN must be 6 digits");
      return;
    }

    if (!data || !data.phone || !data.amount) {
      setError("Recipient or amount missing");
      return;
    }

    if (!data.transactionId) {
      setError("Missing transaction ID");
      return;
    }

    setLoading(true);

    try {
      // ✅ pass transactionId to execute endpoint
      const res = await executeTransfer({ transactionId: data.transactionId, pin });
      console.log("StepPin: performTransfer result:", res);

      if (!res) {
        setError("Unknown error from server");
        return;
      }

      if (res.status === "error") {
        setError(res.message || "Transfer failed");
        return;
      }

      // Prefer transactionId returned, fallback to initiated one
      const tx =
        res.transactionId ||
        res.transaction_id ||
        res.id ||
        data.transactionId;

      console.log("StepPin: navigating to success tx=", tx);
      navigate(`/app/transfer/success?tx=${encodeURIComponent(tx)}`, { replace: false });
    } catch (err) {
      console.error("submitPinAndTransfer error:", err);
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message;
      setError(apiMsg || "Transfer error");
    } finally {
      setPinLocal("");
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      <div className="mb-3 text-sm text-gray-500">Enter your 6-digit PIN to confirm transfer</div>

      <div className="mb-4 flex justify-center">
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full border"
              style={{ background: i < pin.length ? "#111827" : "transparent" }}
            />
          ))}
        </div>
      </div>

      {error && <div className="mb-2 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-3 gap-3 justify-center mb-4">
        {["1","2","3","4","5","6","7","8","9","clear","0","⌫"].map((k) => (
          <div key={k} className="flex justify-center">
            {k === "clear" ? (
              <Key onClick={clear} className="bg-gray-100">C</Key>
            ) : k === "⌫" ? (
              <Key onClick={backspace} className="bg-gray-100">{k}</Key>
            ) : (
              <Key onClick={() => addDigit(k)} className="bg-gray-50">{k}</Key>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            setStep("confirm");
            navigate("/app/transfer");
          }}
          className="flex-1 py-3 rounded-lg border"
        >
          Back
        </button>

        <button
          type="button"
          onClick={submitPinAndTransfer}
          disabled={loading}
          className="flex-1 py-3 rounded-lg bg-orange-500 text-white"
        >
          {loading ? "Processing..." : "Confirm & Send"}
        </button>
      </div>
    </div>
  );
}
