import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
// import PageHeader from "../components/page_header/PageHeader";
import BalanceCard from "../components/history_transaksi/BalanceCard";
import RecentHistory from "../components/history_transaksi/RecentHistory";
import ArrowButton from "../components/common/ArrowButton";
import DynamicShell from "../components/layout/dynamicShell";
import { PlusIcon, UserIcon } from "@heroicons/react/24/solid";
import useCardBalances from "../hooks/api/useCardBalances";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function HistoryTransactionPage() {
  const { walletId } = useParams();
  const navigate = useNavigate();

  const [pageTitle, setPageTitle] = useState("Wallet Detail");
  const { items: allWallets, loading: walletsLoading } = useCardBalances();
  const wallet = useMemo(
    () => allWallets.find((w) => w.id === walletId && !w.isAddCard),
    [allWallets, walletId]
  );

  const isMainCard = wallet?.isMain || false;

  const [buttonGroupY, setButtonGroupY] = useState(null);
  const buttonGroupRef = useRef(null);
  useEffect(() => {
    const measureButton = () => {
      if (buttonGroupRef.current) {
        const rect = buttonGroupRef.current.getBoundingClientRect();
        setButtonGroupY(rect.bottom + 18);
      }
    };
    const timer = setTimeout(measureButton, 0);
    window.addEventListener("resize", measureButton);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measureButton);
    };
  }, [isMainCard, wallet]);

  const handleAddBalanceFromWallet = () => {
    navigate(`/app/wallets/${walletId}/add`);
  };

  const handleViewPeople = () => {
    navigate(`/app/wallets/${walletId}/members`);
  };
  if (walletsLoading) {
    return (
      <DynamicShell>
        <PageHeader>Wallet Detail</PageHeader>
        <LoadingSpinner />
      </DynamicShell>
    );
  }

  if (!wallet) {
    return (
      <DynamicShell>
        <PageHeader>Error</PageHeader>
        <p className="text-center text-gray-600">Wallet tidak ditemukan.</p>
      </DynamicShell>
    );
  }

  return (
    <DynamicShell>
      <div className="space-y-4 md:space-y-6" style={{ overflow: "hidden" }}>
        <PageHeader>{pageTitle}</PageHeader>

        <div className="-mt-2 md:-mt-3">
          <BalanceCard
            title={wallet.title}
            balance={wallet.balance}
            bg={wallet.bg}
            accent={wallet.accent}
            type={wallet.type}
            isMain={wallet.isMain}
          />
        </div>

        {isMainCard ? (
          <div
            ref={buttonGroupRef}
            className="arrow-button-container mt-2 md:mt-3"
          >
            <ArrowButton />
          </div>
        ) : (
          <div
            ref={buttonGroupRef}
            className="button-group flex justify-center gap-3 mt-3 md:mt-4 relative z-10"
          >
            <button
              onClick={handleAddBalanceFromWallet}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-orange-500 text-white shadow-md active:scale-95 transition"
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
          walletId={wallet.id}
          onExpandChange={(expanded) =>
            setPageTitle(expanded ? "Transfer History" : "Wallet Detail")
          }
          dynamicTop={buttonGroupY}
        />
      </div>
    </DynamicShell>
  );
}
