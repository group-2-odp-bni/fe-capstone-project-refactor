import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "../components/page_header/PageHeader";
import BalanceCard from "../components/history_transaksi/BalanceCard";
import RecentHistory from "../components/history_transaksi/RecentHistory";
import ArrowButton from "../components/common/ArrowButton";
import DynamicShell from "../components/layout/DynamicShell";
import { PlusIcon, UserIcon } from "@heroicons/react/24/solid";

export default function HistoryTransactionPage() {
  const { walletId } = useParams();
  const navigate = useNavigate();

  const [pageTitle, setPageTitle] = useState("Wallet Detail");
  const [isMainCard, setIsMainCard] = useState(false);

  useEffect(() => {
    setIsMainCard(walletId === "wallet-001");
  }, [walletId]);

  const handleAddPerson = () => {
    alert(`Tambah orang untuk kartu ${walletId}`);
  };

  const handleViewPeople = () => {
    alert(`Lihat daftar orang untuk kartu ${walletId}`);
  };

  // ✅ Mapping walletId ke tipe wallet
  const mappedWalletId =
    walletId === "wallet-001"
      ? "main"
      : walletId === "wallet-002"
      ? "personal"
      : "business";

  return (
    <DynamicShell>
      <div className="space-y-4 md:space-y-6">
        {/* Judul */}
        <PageHeader>{pageTitle}</PageHeader>

        {/* ✅ Kartu saldo */}
        <div className="-mt-2 md:-mt-3">
          <BalanceCard walletId={walletId} />
        </div>

        {/* ✅ Tombol bawah kartu */}
        {isMainCard ? (
          // Kartu utama: tetap gunakan class lama (jangan diubah)
          <div className="arrow-button-container mt-2 md:mt-3">
            <ArrowButton />
          </div>
        ) : (
          // Kartu lain: gunakan .button-group agar RecentHistory tahu posisinya
          <div className="button-group flex justify-center gap-3 mt-3 md:mt-4 relative">
            <button
              onClick={handleAddPerson}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-orange-500 text-white shadow-md active:scale-95 transition"
            >
              <PlusIcon className="w-5 h-5" />
            </button>

            <button
              onClick={handleViewPeople}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-orange-400 text-orange-500 bg-white shadow-sm active:scale-95 transition"
            >
              <UserIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ✅ Riwayat transaksi (bottom sheet) */}
        <RecentHistory
          walletId={mappedWalletId}
          onExpandChange={(expanded) =>
            setPageTitle(expanded ? "Transfer History" : "Wallet Detail")
          }
        />
      </div>
    </DynamicShell>
  );
}
