// src/pages/HistoryTransactionPage.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BalanceCard from "../components/history_transaksi/BalanceCard";
import RecentHistory from "../components/history_transaksi/RecentHistory";
import ArrowButton from "../components/common/ArrowButton";
import { PlusIcon, UserIcon } from "@heroicons/react/24/solid";
import useCardBalances from "../hooks/api/useCardBalances";
import LoadingSpinner from "../components/common/LoadingSpinner";
import PageHeader from "../components/Header";
import View from "../components/view/View";
import HeaderMenu from "../components/HeaderMenu";
import useWalletApi from "../hooks/api/useWalletApi";

export default function HistoryTransactionPage() {
  const { walletId } = useParams();
  const navigate = useNavigate();

  const { renameWallet, deleteWallet } = useWalletApi();
  const { items: allWallets, loading: walletsLoading } = useCardBalances();

  const [pageTitle, setPageTitle] = useState("Wallet Detail");
  const [actionLoading, setActionLoading] = useState(false);

  const wallet = useMemo(
    () => allWallets.find((w) => w.id === walletId && !w.isAddCard),
    [allWallets, walletId]
  );

  const isMainCard = wallet?.isMain || false;

  const [buttonGroupY, setButtonGroupY] = useState(null);
  const buttonGroupRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const measureButton = () => {
      if (buttonGroupRef.current) {
        const rect = buttonGroupRef.current.getBoundingClientRect();
        setButtonGroupY(rect.bottom + 18);
      } else {
        setButtonGroupY(null);
      }
    };

    // measure on next paint
    rafRef.current = requestAnimationFrame(measureButton);

    const onResizeOrScroll = () => {
      // schedule measurement on next frame
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measureButton);
    };

    window.addEventListener("resize", onResizeOrScroll);
    window.addEventListener("scroll", onResizeOrScroll, true);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResizeOrScroll);
      window.removeEventListener("scroll", onResizeOrScroll, true);
    };
  }, [isMainCard, wallet]);

  const handleAddBalanceFromWallet = () => {
    navigate(`/app/wallets/${walletId}/add`);
  };

  const handleViewPeople = () => {
    navigate(`/app/wallets/${walletId}/members`);
  };

  // ----- Header menu action handlers -----
  const handleRename = async (newName) => {
    if (!newName || !walletId) return;
    try {
      setActionLoading(true);
      await renameWallet(walletId, newName);
      // refresh to reflect changes. If your useCardBalances has refetch, call it instead.
      window.location.reload();
    } catch (err) {
      console.error("rename failed", err);
      // TODO: show toast/error to user
      throw err; // rethrow so HeaderMenu can catch and stop loading
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!walletId) return;
    try {
      setActionLoading(true);
      await deleteWallet(walletId);
      // navigate away after delete
    } catch (err) {
      console.error("delete failed", err);
      // TODO: show toast/error to user
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // ----- render states -----
  if (walletsLoading) {
    return (
      <View>
        <PageHeader title="Wallet Detail" />
        <div className="p-6">
          <LoadingSpinner />
        </div>
      </View>
    );
  }

  if (!wallet) {
    return (
      <View>
        <PageHeader title="Error" />
        <div className="p-6">
          <p className="text-center text-gray-600">Wallet tidak ditemukan.</p>
        </div>
      </View>
    );
  }

  return (
    <View>
      {/* NOTE: removed inline overflow:hidden so popouts/modals can render/click properly.
          If you must keep overflow:hidden here for layout, use the portal-based HeaderMenu
          (renders menu into document.body) and keep overflow:hidden. */}
      <div className="space-y-4 md:space-y-6">
        <PageHeader
          title={pageTitle}
          right={
            <HeaderMenu
              currentName={wallet?.title}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          }
        />

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
          <div ref={buttonGroupRef} className="arrow-button-container mt-2 md:mt-3">
            <ArrowButton />
          </div>
        ) : (
          <div
            ref={buttonGroupRef}
            className="button-group flex justify-center gap-3 mt-3 md:mt-4 relative z-10"
          >
            {/* Tombol plus tetap muncul */}
            <button
              onClick={handleAddBalanceFromWallet}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-orange-500 text-white shadow-md active:scale-95 transition"
            >
              <PlusIcon className="w-5 h-5" />
            </button>

            {/* Icon Person hanya muncul untuk Shared Wallet */}
            {wallet.type === "Shared" && (
              <button
                onClick={handleViewPeople}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-orange-400 text-[#FF9A25] bg-white shadow-sm active:scale-95 transition"
              >
                <UserIcon className="w-5 h-5" />
              </button>
            )}
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
    </View>
  );
}
