// src/components/transfer/StepSuccess.jsx
import React, { useEffect, useState } from "react";
import { useTransfer } from "../../context/TransferContext";
import { useNavigate } from "react-router-dom";
import useTransferApi from "../../hooks/api/useTransferApi";

export default function StepSuccess() {
  const { data, reset } = useTransfer();
  const navigate = useNavigate();
  const { lookupContactByPhone } = useTransferApi();
  const [freshReceiver, setFreshReceiver] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!data.phone) return;
      const r = await lookupContactByPhone(data.phone);
      if (!mounted) return;
      setFreshReceiver(r);
    })();
    return () => (mounted = false);
  }, [data.phone]); // lookupContactByPhone is stable here

  const done = () => {
    reset();
    navigate("/app/dashboard");
  };

  return (
    <div className="text-center p-4">
      <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <div className="text-3xl text-green-600">✓</div>
      </div>

      <div className="text-lg font-semibold mb-2">Transfer Successful</div>
      <div className="text-sm text-gray-500 mb-4">Rp{Number(data.amount || 0).toLocaleString("id-ID")}</div>

      <div className="p-3 bg-gray-50 rounded-lg mb-4 text-left text-sm">
        <div className="mb-2"><strong>To:</strong> {data.contactName} ({data.phone})</div>
        <div className="mb-2"><strong>Transaction ID:</strong> {data.transactionId}</div>
        <div className="mb-2"><strong>Note:</strong> {data.note || "-"}</div>
        <div className="mb-2"><strong>Recipient balance (now):</strong> Rp{Number(freshReceiver?.balance ?? 0).toLocaleString("id-ID")}</div>
      </div>

      <div className="flex gap-3">
        <button onClick={done} className="flex-1 py-3 rounded-lg bg-orange-500 text-white">Done</button>
        <button onClick={() => navigate("/app/transactions")} className="flex-1 py-3 rounded-lg border">View receipt</button>
      </div>
    </div>
  );
}
