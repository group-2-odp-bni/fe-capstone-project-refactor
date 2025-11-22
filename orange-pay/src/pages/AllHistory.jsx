import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import TransactionList from "../components/history_transaksi/AllHistory";
import Header from "../components/Header";
import View from "../components/view/View";

export default function HistoryTransactionPage() {
  const { walletId } = useParams();
  const navigate = useNavigate();

  const handleTransactionClick = (tx) => {
    if (!tx) return;
    const trxId = tx.trxId || tx.id;
    if (!trxId) return;

    const base = walletId
      ? `/app/wallets/${walletId}/receipt/${trxId}`
      : `/app/receipt/${trxId}`;

    navigate(base, { state: { transfer: tx } });
  };

  return (
    <View>
      <Header title="Riwayat Transaksi" subtitle="" />
      <main>
        <div className="mb-4">
          <h2 className="pl-3 pt-3 text-black text-l font-bold">
            Semua Transaksi
          </h2>
        </div>

        <TransactionList
          walletId={walletId ?? null}
          onTransactionClick={handleTransactionClick}
        />
      </main>
    </View>
  );
}
