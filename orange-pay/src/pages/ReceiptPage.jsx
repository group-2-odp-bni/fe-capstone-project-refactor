// src/pages/ReceiptPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShareIcon } from "@heroicons/react/24/outline";   // ← use Heroicons
import { getTrxById } from "../hooks/api/useHistoryTrx";
import ReceiptCard from "../components/receipt/ReceiptCard";
import Header from "../components/Header";
import View from "../components/view/View";

export default function ReceiptPage() {
  const { trxId } = useParams();
  const navigate = useNavigate();
  const [trx, setTrx] = useState(null);
  const [loading, setLoading] = useState(true);
  const shareRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const res = await getTrxById(trxId);
      if (alive) { setTrx(res); setLoading(false); }
    })();
    return () => { alive = false; };
  }, [trxId]);

  const RightShareBtn = (
    <button
      onClick={() => shareRef.current?.()}
      aria-label="Share receipt"
      className="p-1.5 rounded-full hover:bg-gray-100 active:scale-95 transition"
    >
      <ShareIcon className="w-6 h-6 text-gray-900" />
    </button>
  );

  return (
    <View>
      <Header
        title="Transfer History"
        onBack={() => navigate(-1)}
        showBack
        centerTitle
        right={RightShareBtn}   
      />

      {loading ? (
        <div className="animate-pulse rounded-2xl bg-white shadow p-8 space-y-4">
          <div className="h-6 w-24 bg-gray-200 rounded" />
          <div className="h-8 w-40 bg-gray-200 rounded" />
          <div className="h-16 w-full bg-gray-200 rounded" />
          <div className="h-16 w-full bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-200 rounded" />
        </div>
      ) : (
        <ReceiptCard trx={trx} externalShareRef={shareRef} hideInlineShare />
      )}
    </View>
  );
}
