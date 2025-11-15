import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import TransactionList from "../components/history_transaksi/AllHistory";
import Header from "../components/Header";

export default function HistoryTransactionPage() {
  const { walletId } = useParams(); // optional: /app/wallets/:walletId
  const navigate = useNavigate();

  // Navigate to receipt page for the clicked transaction
  const handleTransactionClick = (tx) => {
    if (!tx) return;
    const trxId = tx.trxId || tx.id; // prefer trxId from mock
    if (!trxId) return;

    const base = walletId
      ? `/app/wallets/${walletId}/receipt/${trxId}`
      : `/app/receipt/${trxId}`;

    navigate(base, { state: { transfer: tx } });
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <Header title="Transfer History" subtitle="" showBack />

      <main>
        <div className="mb-4">
          <h2 className="pl-3 pt-3 text-black text-l font-bold">All transaction</h2>
        </div>

        <TransactionList
          walletId={walletId ?? null}
          onTransactionClick={handleTransactionClick}
        />
      </main>
    </div>
  );
}
