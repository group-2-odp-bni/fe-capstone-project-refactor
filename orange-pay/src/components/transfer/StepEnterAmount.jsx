// src/components/transfer/StepEnterAmount.jsx
import React, { useEffect, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useTransfer } from "../../context/TransferContext";
import useCardBalances from "../../hooks/api/useCardBalances";
import ConfirmButton from "../ui/ConfirmButton";
import WalletBottomSheet from "../ui/transfer/WalletBottomSheet";

/**
 * Helpers:
 * - formatAmountDisplay("1000") => "1.000"
 * - normalizeToDigits("1.000") => "1000"
 */
const normalizeToDigits = (value = "") => {
  return String(value).replace(/\D+/g, "");
};

const formatAmountDisplay = (digits = "") => {
  if (digits === "") return "";
  // remove leading zeros except keep single 0
  digits = digits.replace(/^0+(?=\d)/, "");
  // insert dot every 3 digits from right
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function StepEnterAmount() {
  const { data, setData, setStep } = useTransfer();
  const { data: wallets = [] } = useCardBalances();

  const [isSheetOpen, setSheetOpen] = useState(false);
  // local display value with separators
  const [displayAmount, setDisplayAmount] = useState(() =>
    data.amount ? formatAmountDisplay(String(data.amount)) : ""
  );
  const [showTooLarge, setShowTooLarge] = useState(false);

  const noteLength = (data.note || "").length;
  // canConfirm when amount > 0 and not larger than wallet balance (if balance known)
  const numericAmount = Number(normalizeToDigits(displayAmount) || 0);
  const sourceBalance = typeof data.sourceBalance === "number" ? data.sourceBalance : null;
  const canConfirm = numericAmount > 0 && (sourceBalance === null || numericAmount <= sourceBalance);

  // initialize default sumber dana (utama or first) if not yet set
  useEffect(() => {
    if (!wallets || wallets.length === 0) return;
    if (data.sourceId) return;

    const utama = wallets.find((w) => w.type === "utama");
    const defaultWallet = utama || wallets[0];

    if (defaultWallet) {
      setData({
        sourceId: defaultWallet.id,
        sourceName: defaultWallet.title || defaultWallet.walletName || "UTAMA",
        sourceBalance: Number(defaultWallet.balance ?? 0),
        ...(defaultWallet.phone ? { sourcePhone: defaultWallet.phone } : {}),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallets, setData]);

  // keep displayAmount synced if external data.amount changes (e.g. coming from context)
  useEffect(() => {
    if (data?.amount === undefined || data?.amount === null) return;
    const digits = normalizeToDigits(String(data.amount));
    const formatted = formatAmountDisplay(digits);
    setDisplayAmount(formatted);
  }, [data.amount]);

  useEffect(() => {
    // mark too-large state for UX (used to show message)
    if (sourceBalance !== null && numericAmount > sourceBalance) {
      setShowTooLarge(true);
    } else {
      setShowTooLarge(false);
    }
  }, [numericAmount, sourceBalance]);

  const handleAmountChange = (rawValue) => {
    // rawValue may contain dots/commas/others; normalize to digits
    const digits = normalizeToDigits(rawValue);

    // limit: prevent extremely long numbers (optional; you can adjust maxLen)
    const maxLen = 15;
    const safeDigits = digits.slice(0, maxLen);

    const formatted = formatAmountDisplay(safeDigits);
    setDisplayAmount(formatted);

    // keep the actual transfer data.amount as a plain numeric string (no separators)
    // this preserves existing logic which uses Number(data.amount)
    setData({ amount: safeDigits === "" ? "" : safeDigits });
  };

  const handlePaste = (e) => {
    // sanitize pasted content
    const pasted = e.clipboardData?.getData("text") ?? "";
    const digits = normalizeToDigits(pasted);
    if (digits) {
      e.preventDefault();
      handleAmountChange(digits);
    }
  };

  const handleSelectWallet = (wallet) => {
    setData({
      sourceId: wallet.id,
      sourceName: wallet.title || wallet.walletName || "UTAMA",
      sourceBalance: Number(wallet.balance ?? 0),
      ...(wallet.phone ? { sourcePhone: wallet.phone } : {}),
    });
    setSheetOpen(false);

    // re-check amount against new balance
    const digits = normalizeToDigits(displayAmount);
    const amt = Number(digits || 0);
    if (wallet.balance !== undefined && amt > Number(wallet.balance)) {
      setShowTooLarge(true);
    } else {
      setShowTooLarge(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 px-5 pt-6 pb-5">
        {/* Recipient card */}
        <div className="mb-5 p-4 border rounded-xl bg-white shadow-sm border-gray-200">
          <div className="text-black font-semibold">{data.contactName}</div>
          <div className="text-xs text-gray-400">{data.phone}</div>
        </div>

        {/* Amount input */}
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
              // responsive font sizes: base large on mobile, bigger on md+
              className="flex-1 text-black text-left font-extrabold outline-none bg-transparent text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
            />
          </div>

          {/* small helper row: show raw numeric + formatted balance */}
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

          {showTooLarge && (
            <div className="mt-2 text-sm text-red-600">Insufficient balance</div>
          )}
        </div>

        {/* Source / Sumber dana card */}
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-2">Sumber dana</div>
          <button
            type="button"
            className="w-full flex justify-between p-4 border rounded-xl bg-white shadow-sm"
            onClick={() => setSheetOpen(true)}
          >
            <div>
              <div className="text-sm font-semibold text-left">
                {data.sourceName}
              </div>
              <div className="text-xs text-gray-400 text-left">
                {data.sourcePhone
                  ? data.sourcePhone
                  : typeof data.sourceBalance === "number"
                  ? `Balance: ${Number(data.sourceBalance).toLocaleString()}`
                  : "0812 6754 9123"}
              </div>
            </div>
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Note input */}
        <div className="mb-6">
          <textarea
            maxLength={25}
            value={data.note || ""}
            onChange={(e) => setData({ note: e.target.value })}
            placeholder="Notes: (optional)"
            className="w-full p-3 border rounded-lg resize-none h-20 focus:outline-none"
          />
          <div className="text-xs text-gray-400 mt-1 text-right">{noteLength}/25</div>
        </div>
      </div>

      {/* Confirm button fixed at bottom */}
      <div className="bottom-0 px-5 pb-6">
        <ConfirmButton onClick={() => setStep("confirm")} disabled={!canConfirm}>
          Confirm
        </ConfirmButton>
      </div>

      {/* Bottom sheet picker */}
      <WalletBottomSheet
        open={isSheetOpen}
        onClose={() => setSheetOpen(false)}
        wallets={wallets}
        selectedId={data.sourceId}
        onSelect={handleSelectWallet}
      />
    </div>
  );
}
