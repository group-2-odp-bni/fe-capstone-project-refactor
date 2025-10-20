// src/components/transfer/StepPin.jsx
import React, { useState } from "react";
import { useTransfer } from "../../context/TransferContext";
import useTransferApi from "../../hooks/api/useTransferApi";
import { useNavigate } from "react-router-dom";

const Key = ({ children, onClick, className }) => (
  <button onClick={onClick} className={`w-16 h-16 rounded-full text-lg ${className || ""}`}>{children}</button>
);

export default function StepPin() {
  const { flow, data, setData, setStep, setFlow } = useTransfer();
  const { performTransfer } = useTransferApi();
  const [pin, setPinLocal] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

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

    // local mock validation quick check
    if (pin !== "123456") {
      setError("Invalid PIN");
      return;
    }

    if (!data.phone || !data.amount) {
      setError("Recipient or amount missing");
      return;
    }

    setLoading(true);

    // store PIN in memory (ephemeral) so performTransfer can use it
    setFlow((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        pin,
      },
    }));

    try {
      const res = await performTransfer({
        phone: data.phone,
        amount: data.amount,
        note: data.note,
        pin,
      });

      if (res?.status === "success") {
        // persist transactionId
        setData({ transactionId: res.transactionId });
        // remove ephemeral PIN from memory
        setFlow((prev) => ({
          ...prev,
          data: {
            ...prev.data,
            pin: undefined,
          },
        }));
        setStep("success");
        navigate("/app/transfer/success");
      } else {
        setError(res?.message || "Transfer failed");
        // remove ephemeral PIN on failure too for safety
        setFlow((prev) => ({
          ...prev,
          data: {
            ...prev.data,
            pin: undefined,
          },
        }));
      }
    } catch (err) {
      console.error(err);
      setError("Transfer error");
      setFlow((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          pin: undefined,
        },
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      <div className="mb-3 text-sm text-gray-500">Enter your 6-digit PIN to confirm transfer</div>

      <div className="mb-4 flex justify-center">
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-4 h-4 rounded-full border" style={{ background: i < pin.length ? "#111827" : "transparent" }} />
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
        <button onClick={() => { setStep("confirm"); navigate("/app/transfer"); }} className="flex-1 py-3 rounded-lg border">Back</button>
        <button onClick={submitPinAndTransfer} disabled={loading} className="flex-1 py-3 rounded-lg bg-orange-500 text-white">
          {loading ? "Processing..." : "Confirm & Send"}
        </button>
      </div>
    </div>
  );
}
