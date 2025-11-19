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

/**
 * Small, local toast implementation (no external libs)
 */
function Toast({ open, title, description, onClose }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), 2000);
    return () => clearTimeout(t);
  }, [open, onClose]);

  return (
    <div
      aria-live="polite"
      className="fixed right-4 bottom-6 z-[60] pointer-events-none"
    >
      <div
        className={`pointer-events-auto transform transition-all duration-300 ${
          open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="max-w-sm w-80 rounded-xl shadow-lg bg-white ring-1 ring-black/5 overflow-hidden">
          <div className="p-3 flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {/* check icon */}
              <svg
                className="w-6 h-6 text-green-600"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">{title}</div>
              {description && (
                <div className="text-xs text-gray-500 mt-0.5">{description}</div>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-3 text-gray-400 hover:text-gray-600"
              aria-label="close"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Success Modal / Popout shown after deletion.
 * It is non-blocking but centered and clearly visible.
 */
function SuccessPopout({ open, title = "Deleted", description, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
      <div className="pointer-events-auto bg-white rounded-2xl p-6 shadow-2xl w-[90%] max-w-sm mx-auto z-10 text-center transform transition-all">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mx-auto">
          <svg className="w-9 h-9 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
      </div>
    </div>
  );
}

export default function HistoryTransactionPage() {
  const { walletId } = useParams();
  const navigate = useNavigate();

  // NOTE: getMyRole added from useWalletApi
  const { renameWallet, deleteWallet, getMyRole } = useWalletApi();
  const { items: allWallets, loading: walletsLoading } = useCardBalances();

  const [pageTitle, setPageTitle] = useState("Wallet Detail");
  const [actionLoading, setActionLoading] = useState(false);

  const [showSuccessPopout, setShowSuccessPopout] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // role states
  const [myRole, setMyRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);

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

  // Fetch role when walletId changes
  useEffect(() => {
    let mounted = true;
    async function loadRole() {
      if (!walletId) return;
      setRoleLoading(true);
      try {
        const role = await getMyRole(walletId);
        if (mounted) setMyRole(role);
      } catch (err) {
        if (mounted) setMyRole(null);
      } finally {
        if (mounted) setRoleLoading(false);
      }
    }
    loadRole();
    return () => {
      mounted = false;
    };
  }, [walletId, getMyRole]);

  // normalize role check helpers
  const normalizedRole = useMemo(() => (myRole ? String(myRole).trim().toLowerCase() : null), [myRole]);

  // treat OWNER and ADMIN as full-permission roles
  const isAdminOrOwner = normalizedRole === "admin" || normalizedRole === "owner";
  const isSpender = normalizedRole === "spender";
  const isViewer = normalizedRole === "viewer";

  const handleAddBalanceFromWallet = () => {
    // permission guard (defensive): Admin/Owner and Spender can add
    if (!(isAdminOrOwner || isSpender)) return;
    navigate(`/app/wallets/${walletId}/add`);
  };

  const handleViewPeople = () => {
    // only Admin/Owner can view/manage members
    if (!isAdminOrOwner) return;
    navigate(`/app/wallets/${walletId}/members`);
  };

  // ----- Header menu action handlers -----
  const handleRename = async (newName) => {
    if (!newName || !walletId) return;
    // only Admin/Owner may rename
    if (!isAdminOrOwner) return;
    try {
      setActionLoading(true);
      await renameWallet(walletId, newName);
      // update can be done via refetch; fallback to reload if you prefer
      window.location.reload();
    } catch (err) {
      console.error("rename failed", err);
      throw err; // rethrow so HeaderMenu can catch and stop loading
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!walletId) return;
    // only Admin/Owner may delete
    if (!isAdminOrOwner) return;

    try {
      setActionLoading(true);
      await deleteWallet(walletId);

      // show both popout and toast
      setShowSuccessPopout(true);
      setShowToast(true);

      // auto-close popout and navigate after short delay
      setTimeout(() => {
        setShowSuccessPopout(false);
      }, 900);

      setTimeout(() => {
        setShowToast(false);
        navigate("/app/dashboard");
      }, 1400);
    } catch (err) {
      console.error("delete failed", err);
      // show a quick error toast as fallback
      setShowToast(true);
      // override with error message - reuse toast UI for simplicity
      setTimeout(() => setShowToast(false), 1800);
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
          // only show HeaderMenu for Admin/Owner (can do everything)
          right={
            isAdminOrOwner ? (
              <HeaderMenu
                currentName={wallet?.title}
                onRename={handleRename}
                onDelete={handleDelete}
                loading={actionLoading}
              />
            ) : null
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
          <div ref={buttonGroupRef} className="arrow-button-container mt-2 md:mt-3" />
        ) : (
          <div
            ref={buttonGroupRef}
            className="button-group flex justify-center gap-3 mt-3 md:mt-4 relative z-10"
          >
            {/* Add balance: allowed for Admin/Owner and Spender */}
            <button
              onClick={handleAddBalanceFromWallet}
              disabled={roleLoading || !(isAdminOrOwner || isSpender)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl shadow-md active:scale-95 transition
                ${roleLoading ? "opacity-60 cursor-wait bg-gray-100 text-gray-400" : isAdminOrOwner || isSpender ? "bg-orange-400 text-white" : "bg-white text-gray-300 border border-gray-200 cursor-not-allowed"}`}
              title={
                roleLoading
                  ? "Checking permissions..."
                  : isAdminOrOwner || isSpender
                  ? "Add balance"
                  : "You don't have permission to add balance"
              }
            >
              <PlusIcon className="w-5 h-5" />
            </button>

            {/* Icon Person (view members) only for Shared wallet AND Admin/Owner */}
            {wallet.type === "Shared" && (
              <button
                onClick={handleViewPeople}
                disabled={roleLoading || !isAdminOrOwner}
                className={`w-10 h-10 flex items-center justify-center rounded-xl border shadow-sm active:scale-95 transition
                  ${roleLoading ? "opacity-60 cursor-wait border-gray-200 text-gray-300 bg-white" : isAdminOrOwner ? "border-orange-400 text-[#FF9A25] bg-white" : "border-gray-200 text-gray-300 bg-white cursor-not-allowed"}`}
                title={
                  roleLoading
                    ? "Checking permissions..."
                    : isAdminOrOwner
                    ? "View members"
                    : "You don't have permission to view members"
                }
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

      {/* Success popout + toast */}
      <SuccessPopout
        open={showSuccessPopout}
        title="Wallet Deleted"
        description="The wallet has been removed successfully."
        onClose={() => setShowSuccessPopout(false)}
      />

      <Toast
        open={showToast}
        title="Wallet Deleted"
        description="Your wallet has been removed successfully."
        onClose={() => setShowToast(false)}
      />
    </View>
  );
}
