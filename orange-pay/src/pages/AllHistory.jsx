import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import TransactionList from "../components/history_transaksi/AllHistory";
import Header from "../components/Header";

export default function HistoryTransactionPage() {
  const { walletId } = useParams(); // optional: route /app/wallets/:walletId
  const navigate = useNavigate();

  // handle click to receipt
  const handleTransactionClick = (tx) => {
    if (walletId) {
      navigate(`/app/wallets/${walletId}/transfer/${tx.id}`, {
        state: { transfer: tx },
      });
    } else {
      navigate(`/app/transactions/${tx.id}`, {
        state: { transfer: tx },
      });
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Reusable header */}
      <Header title="Transfer History" subtitle="" showBack={true} />

      {/* Body */}
      <main className="">
        <div className="mb-4">
          <h2 className="text-l text-black font-bold pl-3 pt-3">All transaction</h2>
        </div>

        <div>
          {/* Pass click handler to TransactionList */}
          <TransactionList
            walletId={walletId ?? null}
            onTransactionClick={handleTransactionClick}
          />
        </div>
      </main>
    </div>
  );
}
