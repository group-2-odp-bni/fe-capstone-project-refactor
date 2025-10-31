import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
// import PageHeader from "../components/page_header/PageHeader";
import BalanceCard from "../components/history_transaksi/BalanceCard";
import RecentHistory from "../components/history_transaksi/RecentHistory";
import ArrowButton from "../components/common/ArrowButton";
import DynamicShell from "../components/layout/DynamicShell";
import { PlusIcon, UserIcon } from "@heroicons/react/24/solid";
import Header from "../components/Header";

export default function HistoryTransactionPage() {
  const { walletId } = useParams();
  const navigate = useNavigate();

  const [pageTitle, setPageTitle] = useState("Wallet Detail");
  const [isMainCard, setIsMainCard] = useState(false);

  const handleBack = () => {
    navigate("/app/dashboard");
  }
  
  useEffect(() => {
    setIsMainCard(walletId === "wallet-001");
  }, [walletId]);

  // ✅ navigate to Add Balance From Wallet
  const handleAddBalanceFromWallet = () => {
    navigate(`/add-balance-from-wallet?wallet=${walletId}`);
  };

  const handleViewPeople = () => {
    alert(`Lihat daftar orang untuk kartu ${walletId}`);
  };

  const mappedWalletId =
    walletId === "wallet-001"
      ? "main"
      : walletId === "wallet-002"
      ? "personal"
      : "business";

  return (
    <DynamicShell>
      <div>
      <Header title="Wallet Detail" onBack={handleBack} showBack centerTitle />

        <div className="-mt-2 md:-mt-3">
          <BalanceCard walletId={walletId} />
        </div>

        {isMainCard ? (
          <div className="arrow-button-container mt-2 md:mt-3">
            <ArrowButton />
          </div>
        ) : (
          <div className="button-group flex justify-center gap-3 mt-3 md:mt-4 relative">
            <button
              onClick={handleAddBalanceFromWallet} // ✅ HERE
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#FF9A25] text-white active:scale-95 transition"
            >
              <PlusIcon className="w-5 h-5" />
            </button>

            <button
              onClick={handleViewPeople}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-orange-400 text-[#FF9A25] bg-white shadow-sm active:scale-95 transition"
            >
              <UserIcon className="w-5 h-5" />
            </button>
          </div>
        )}

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
