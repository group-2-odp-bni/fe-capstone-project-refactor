import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useBalanceCards from "../../hooks/api/useCardBalances";
import Header from "../../components/Header";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAddBalanceContext } from "../../context/AddBalanceContext";
import {
  CardTopBar,
  PillBadge,
  GradientCardShell,
  BalanceRow,
} from "../../components/ui/BalanceCardUI";

export default function AddBalancePage() {
  const navigate = useNavigate();
  const { walletId: toWalletId } = useParams();
  const { addBalanceData, setAddBalanceData } = useAddBalanceContext();

  const { items = [], loading } = useBalanceCards();

  const allWallets = useMemo(() => items.filter((w) => !w.isAddCard), [items]);
  const toWallet = useMemo(
    () => allWallets.find((w) => w.id === toWalletId),
    [allWallets, toWalletId]
  );
  const fromWalletOptions = useMemo(
    () => allWallets.filter((w) => w.id !== toWalletId),
    [allWallets, toWalletId]
  );

  const [fromWalletId, setFromWalletId] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isHidden, setIsHidden] = useState(false);

  // Clip exclusions to match AtomicBalanceCard visuals
  const EXCLUDE = {
    sm: { bottom: 64, right: 120 },
    md: { bottom: 80, right: 160 },
  };

  useEffect(() => {
    if (loading || allWallets.length === 0) return;
    const mainWallet = allWallets.find((w) => w.isMain);

    if (mainWallet && mainWallet.id !== toWalletId) {
      setFromWalletId(mainWallet.id);
    } else if (fromWalletOptions.length > 0) {
      setFromWalletId(fromWalletOptions[0].id);
    }
  }, [allWallets, toWalletId, fromWalletOptions, loading]);

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const formatted = raw ? parseInt(raw, 10).toLocaleString("id-ID") : "";
    setAmount(formatted);
  };

  const handleSubmit = async () => {
    const numericAmount = parseInt(amount.replace(/\D/g, ""), 10);
    setErrorMsg("");

    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg("Masukkan jumlah yang valid.");
      return;
    }
    if (!fromWalletId) {
      setErrorMsg("Pilih wallet sumber.");
      return;
    }
    if (fromWalletId === toWalletId) {
      setErrorMsg("Wallet 'From' dan 'To' tidak boleh sama.");
      return;
    }

    setAddBalanceData({
      sourceWalletId: fromWalletId,
      destinationWalletId: toWalletId,
      amount: numericAmount,
    });

    navigate("/app/wallets/confirm-add-balance");
  };

  const selectedFromWallet = useMemo(
    () => allWallets.find((w) => w.id === fromWalletId),
    [allWallets, fromWalletId]
  );

  const formattedToWalletBalance = (b) =>
    typeof b === "number" ? b.toLocaleString("id-ID") : "0";

  // amount to show inside the BalanceRow (match AtomicBalanceCard behavior)
  const displayAmount = Number(
    toWallet?.displayBalance ?? toWallet?.balance ?? toWallet?.initialBalance ?? 0
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header title="Add Balance" onBack={() => navigate(-1)} showBack centerTitle />

      {loading ? (
        <main className="flex-1 p-5">
          <LoadingSpinner />
        </main>
      ) : (
        <main className="flex-1 p-5">
          <p className="text-sm mb-4 font-bold text-gray-700">Personal Wallet</p>

          {toWallet ? (
            <GradientCardShell bg={toWallet.bg}>
              <div className="relative" style={{ transformStyle: "preserve-3d" }}>
                {/* mobile overlay — visual only (no onClick) */}
                <div
                  role="presentation"
                  aria-hidden
                  data-allow-drag="true"
                  className="absolute inset-0 md:hidden z-20 rounded-[22px] focus:outline-none pointer-events-none"
                  style={{
                    clipPath: `polygon(
                      0% 0%,
                      100% 0%,
                      100% calc(100% - ${EXCLUDE.sm.bottom}px),
                      calc(100% - ${EXCLUDE.sm.right}px) calc(100% - ${EXCLUDE.sm.bottom}px),
                      calc(100% - ${EXCLUDE.sm.right}px) 100%,
                      0% 100%,
                      0% 0%
                    )`,
                  }}
                />

                {/* desktop overlay — visual only (no onClick) */}
                <div
                  role="presentation"
                  aria-hidden
                  data-allow-drag="true"
                  className="absolute inset-0 hidden md:block z-20 rounded-[22px] focus:outline-none pointer-events-none"
                  style={{
                    clipPath: `polygon(
                      0% 0%,
                      100% 0%,
                      100% calc(100% - ${EXCLUDE.md.bottom}px),
                      calc(100% - ${EXCLUDE.md.right}px) calc(100% - ${EXCLUDE.md.bottom}px),
                      calc(100% - ${EXCLUDE.md.right}px) 100%,
                      0% 100%,
                      0% 0%
                    )`,
                  }}
                />

                <div>
                  <CardTopBar
                    title={toWallet.title}
                    type={toWallet.type}
                    isMain={toWallet?.defaultForUser === true}
                    // purely visual; badge click intentionally omitted here
                  />
                  {toWallet.walletName &&
                    String(toWallet.walletName).trim().toUpperCase() !== "MAIN" && (
                      <div className="absolute top-1 right-4 z-10 text-white font-semibold text-sm md:text-base leading-none pointer-events-none flex flex-col items-end space-y-1">
                        <PillBadge
                          label={toWallet.type}
                          active={toWallet?.defaultForUser === true}
                          style={{ transform: "translateZ(35px)" }}
                          // purely visual; onClick omitted
                        />
                        <div className="mt-2 text-right w-full">{toWallet.walletName}</div>
                      </div>
                    )}
                </div>

                <div className="relative z-10">
                  <BalanceRow
                    amount={displayAmount}
                    isHidden={isHidden}
                    onToggleHidden={() => setIsHidden((v) => !v)}
                    loading={Boolean(loading)}
                    active={true}
                  />
                </div>
              </div>
            </GradientCardShell>
          ) : (
            <div className="text-center py-4 text-red-500">Wallet tujuan tidak ditemukan.</div>
          )}

          {/* Dropdown Input - New UI */}
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sumber Dana</label>

            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full bg-white border border-gray-300 rounded-2xl px-5 py-4 flex justify-between items-center shadow-sm focus:ring-2 focus:ring-orange-400 transition"
              >
                <div className="flex flex-col text-left">
                  <span className="font-bold text-gray-900 text-base">
                    {selectedFromWallet?.title || "Pilih Wallet"}
                  </span>
                  <span className="text-xs text-gray-500">
                    Balance: Rp{selectedFromWallet?.balance?.toLocaleString("id-ID") || "0"}
                  </span>
                </div>

                <ChevronDownIcon
                  className={`w-5 h-5 text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {dropdownOpen && (
                <ul className="absolute w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-2 overflow-hidden z-30">
                  {fromWalletOptions.map((w) => (
                    <li
                      key={w.id}
                      onClick={() => {
                        setFromWalletId(w.id);
                        setDropdownOpen(false);
                      }}
                      className={`px-5 py-3 cursor-pointer hover:bg-orange-50 transition ${
                        fromWalletId === w.id ? "bg-orange-100 font-medium" : ""
                      }`}
                    >
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-gray-800 text-sm">{w.title}</span>
                        <span className="text-xs text-gray-500">
                          Balance: Rp{(typeof w.balance === "number" ? w.balance : 0).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium mb-2 text-gray-700">Amount</label>
            <div className="flex items-center border-b-2 border-gray-300 pb-2 focus-within:border-orange-400 transition">
              <span className="text-xl font-bold mr-2 text-gray-900">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full outline-none text-2xl font-bold bg-transparent text-gray-900"
              />
            </div>
          </div>

          {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}

          <div className="mt-8">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-orange-400 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:bg-orange-600 active:scale-[.99] transition text-center"
            >
              Add
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
