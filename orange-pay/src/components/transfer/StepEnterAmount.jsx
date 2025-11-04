// src/components/transfer/StepEnterAmount.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useTransfer } from "../../context/TransferContext";
import useCardBalances from "../../hooks/api/useCardBalances";
import ConfirmButton from "../ui/ConfirmButton";
import WalletBottomSheet from "../ui/transfer/WalletBottomSheet";

const MIN_AMOUNT = 10000;
const MAX_AMOUNT = 10000000;

const normalizeToDigits = (value = "") => String(value).replace(/\D+/g, "");
const formatAmountDisplay = (digits = "") => {
  if (digits === "") return "";
  let d = digits.replace(/^0+(?=\d)/, "");
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function StepEnterAmount() {
  const { data, setData, setStep } = useTransfer();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    items: walletCards = [],
    loading: walletsLoading,
    error: walletsError,
  } = useCardBalances();

  const wallets = useMemo(
    () => walletCards.filter((w) => !w.isAddCard),
    [walletCards]
  );

  const [isSheetOpen, setSheetOpen] = useState(false);
  const [displayAmount, setDisplayAmount] = useState(() =>
    data.amount ? formatAmountDisplay(String(data.amount)) : ""
  );
  const [showTooLarge, setShowTooLarge] = useState(false);
  const [showMinError, setShowMinError] = useState(false);
  const [showMaxError, setShowMaxError] = useState(false);

  const noteLength = (data.note || "").length;
  const numericAmount = Number(normalizeToDigits(displayAmount) || 0);
  const sourceBalance =
    typeof data.sourceBalance === "number" ? data.sourceBalance : null;

  const canConfirm =
    numericAmount >= MIN_AMOUNT &&
    numericAmount <= MAX_AMOUNT &&
    numericAmount > 0 &&
    (sourceBalance === null || numericAmount <= sourceBalance);

  /** Hydrate sender wallet */
  useEffect(() => {
    if (wallets.length === 0) return;

    const urlWalletId = searchParams.get("wallet");
    const ctxWalletId = data.senderWalletId || null;

    if (ctxWalletId) {
      const chosen = wallets.find((w) => w.id === ctxWalletId);
      if (chosen) {
        const needHydrate =
          !data.sourceName || typeof data.sourceBalance !== "number";

        if (needHydrate) {
          setData({
            senderWalletId: chosen.id,
            sourceName: chosen.title || chosen.walletName || "UTAMA",
            sourceBalance: Number(chosen.balance ?? 0),
          });
        }
        if (urlWalletId !== chosen.id) {
          const next = new URLSearchParams(searchParams);
          next.set("wallet", chosen.id);
          setSearchParams(next, { replace: true });
        }
      }
      return;
    }

    let picked =
      (urlWalletId && wallets.find((w) => w.id === urlWalletId)) || null;

    if (!picked) {
      picked =
        wallets.find((w) => w.defaultForUser === true) ||
        wallets[0] ||
        null;
    }

    if (picked) {
      setData({
        senderWalletId: picked.id,
        sourceName: picked.title || picked.walletName || "UTAMA",
        sourceBalance: Number(picked.balance ?? 0),
      });

      if (urlWalletId !== picked.id) {
        const next = new URLSearchParams(searchParams);
        next.set("wallet", picked.id);
        setSearchParams(next, { replace: true });
      }
    }
  }, [wallets, data.senderWalletId, data.sourceName, data.sourceBalance]);

  useEffect(() => {
    if (data?.amount === undefined || data?.amount === null) return;
    const digits = normalizeToDigits(String(data.amount));
    setDisplayAmount(formatAmountDisplay(digits));
  }, [data.amount]);

  useEffect(() => {
    setShowTooLarge(sourceBalance !== null && numericAmount > sourceBalance);
    setShowMinError(numericAmount > 0 && numericAmount < MIN_AMOUNT);
    setShowMaxError(numericAmount > MAX_AMOUNT);
  }, [numericAmount, sourceBalance]);

  const handleAmountChange = (rawValue) => {
    const digits = normalizeToDigits(rawValue);
    const safeDigits = digits.slice(0, 15);
    setDisplayAmount(formatAmountDisplay(safeDigits));
    setData({ amount: safeDigits === "" ? "" : safeDigits });
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData?.getData("text") ?? "";
    const digits = normalizeToDigits(pasted);
    if (digits) {
      e.preventDefault();
      handleAmountChange(digits);
    }
  };

  const handleSelectWallet = (wallet) => {
    setData({
      senderWalletId: wallet.id,
      sourceName: wallet.title || wallet.walletName || "UTAMA",
      sourceBalance: Number(wallet.balance ?? 0),
    });
    setSheetOpen(false);

    const next = new URLSearchParams(searchParams);
    next.set("wallet", wallet.id);
    setSearchParams(next, { replace: true });

    const digits = normalizeToDigits(displayAmount);
    const amt = Number(digits || 0);
    setShowTooLarge(wallet.balance !== undefined && amt > Number(wallet.balance));
  };

  const buildInitiatePayload = () => ({
    receiverUserId: data.receiverUserId ?? null,
    receiverWalletId: data.receiverWalletId ?? null,
    senderWalletId: data.senderWalletId ?? null,
    amount: numericAmount,
    notes: data.note || "",
    currency: "IDR",
  });

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 px-5 pt-6 pb-5">
        {walletsLoading && (
          <div className="mb-3 text-xs text-gray-400">Loading wallets…</div>
        )}
        {walletsError && (
          <div className="mb-3 text-xs text-red-500">{walletsError}</div>
        )}

        <div className="mb-5 p-4 border rounded-xl bg-white border-gray-200">
          <div className="text-black font-semibold">{data.contactName}</div>
          <div className="text-xs text-gray-400">{data.phone}</div>
        </div>

        <div className="mb-6">
          <label className="text-sm text-gray-500 mb-2 block">Amount</label>
          <div className="flex items-center border-b border-gray-200 pb-2">
            <span className="text-black font-semibold mr-3 text-2xl">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={displayAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              onPaste={handlePaste}
              placeholder="0"
              className="flex-1 text-black text-left font-extrabold outline-none bg-transparent text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
            />
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="text-xs text-gray-400">
              {displayAmount ? `Entered: ${displayAmount}` : "Enter amount"}
            </div>
            <div className="text-xs text-gray-500">
              {typeof sourceBalance === "number"
                ? `Balance: ${Number(sourceBalance).toLocaleString()}`
                : ""}
            </div>
          </div>

          {showMinError && (
            <div className="mt-2 text-sm text-red-600">
              Minimum transfer is Rp10.000
            </div>
          )}

          {showMaxError && (
            <div className="mt-2 text-sm text-red-600">
              Maximum transfer is Rp10.000.000
            </div>
          )}

          {showTooLarge && (
            <div className="mt-2 text-sm text-red-600">
              Insufficient balance
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-2">Sumber dana</div>
          <button
            type="button"
            className="w-full flex justify-between p-4 border border-gray-200 rounded-xl bg-white "
            onClick={() => setSheetOpen(true)}
            disabled={wallets.length === 0}
          >
            <div>
              <div className="text-sm font-semibold text-left">
                {data.sourceName || "—"}
              </div>
              <div className="text-xs text-gray-400 text-left">
                {typeof data.sourceBalance === "number"
                  ? `Balance: ${Number(data.sourceBalance).toLocaleString()}`
                  : ""}
              </div>
            </div>
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="mb-6">
          <textarea
            maxLength={25}
            value={data.note || ""}
            onChange={(e) => setData({ note: e.target.value })}
            placeholder="Notes: (optional)"
            className="w-full p-3 border border-gray-200 rounded-lg resize-none h-20 focus:outline-none"
          />
          <div className="text-xs text-gray-400 mt-1 text-right">
            {noteLength}/25
          </div>
        </div>
      </div>

      <div className="bottom-0 px-5 pb-6">
        <ConfirmButton
          onClick={() => {
            const payload = buildInitiatePayload();
            setData({ transfer: payload });
            setStep("confirm");
          }}
          disabled={!canConfirm}
        >
          Confirm
        </ConfirmButton>
      </div>

      <WalletBottomSheet
        open={isSheetOpen}
        onClose={() => setSheetOpen(false)}
        wallets={wallets}
        selectedId={data.senderWalletId}
        onSelect={handleSelectWallet}
      />
    </div>
  );
}
