// src/pages/ReceiptPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTrxById } from "../hooks/api/useHistoryTrx";
import ReceiptCard from "../components/receipt/ReceiptCard";
import Header from "../components/Header";

export default function ReceiptPage() {
  const { trxId } = useParams();
  const navigate = useNavigate();
  const [trx, setTrx] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const res = await getTrxById(trxId);
      if (alive) {
        setTrx(res);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [trxId]);

  const handleBack = () => navigate(-1);

  return (
    <div className="p-6">
      <Header title="Transfer History" onBack={handleBack} showBack centerTitle />
      {loading ? (
        <div className="">
          <div className="animate-pulse rounded-2xl bg-white shadow p-8 space-y-4">
            <div className="h-6 w-24 bg-gray-200 rounded" />
            <div className="h-8 w-40 bg-gray-200 rounded" />
            <div className="h-16 w-full bg-gray-200 rounded" />
            <div className="h-16 w-full bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-200 rounded" />
          </div>
        </div>
      ) : (
        <ReceiptCard trx={trx} />
      )}
    </div>
  );
}
