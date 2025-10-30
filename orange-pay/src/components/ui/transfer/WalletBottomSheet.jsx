// src/components/ui/WalletBottomSheet.jsx
import React, { useEffect, useRef } from "react";

/**
 * WalletBottomSheet
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - wallets: array
 * - selectedId: string (optional) - highlights current wallet
 * - onSelect: (wallet) => void
 *
 * This component is presentational and handles escape + outside click.
 * It uses fixed positioning and a simple slide-up transition using Tailwind classes.
 */
export default function WalletBottomSheet({
  open,
  onClose,
  wallets = [],
  selectedId,
  onSelect,
}) {
  const sheetRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    function onDocClick(e) {
      if (!sheetRef.current) return;
      // if click is outside sheetRef element, close
      if (!sheetRef.current.contains(e.target)) onClose();
    }
    if (open) {
      document.body.style.overflow = "hidden"; // prevent background scroll
      document.addEventListener("keydown", onKey);
      document.addEventListener("mousedown", onDocClick);
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* dim overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      />
      {/* sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-2xl rounded-t-2xl bg-white shadow-2xl transform transition-all duration-300 translate-y-0"
        style={{ maxHeight: "72vh" }}
      >
        {/* drag indicator */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 rounded-full bg-gray-300" />
        </div>

        {/* header */}
        <div className="px-5 pb-2">
          <div className="text-base font-semibold">Pilih Sumber Dana</div>
          <div className="text-sm text-gray-500 mt-1">
            Pilih dari daftar dompet kamu
          </div>
        </div>

        {/* list */}
        <div className="overflow-auto divide-y" style={{ maxHeight: "56vh" }}>
          {wallets.map((w) => {
            const isSelected = selectedId && selectedId === w.id;
            return (
              <button
                key={w.id}
                onClick={() => onSelect(w)}
                className={`w-full px-5 py-4 text-left flex items-center justify-between hover:bg-gray-50 ${
                  isSelected ? "bg-orange-50" : ""
                }`}
                type="button"
              >
                <div>
                  <div className="text-sm font-medium">{w.title || w.walletName}</div>
                  <div className="text-xs text-gray-500">
                    {typeof w.balance === "number"
                      ? `Balance: ${Number(w.balance).toLocaleString()}`
                      : ""}
                  </div>
                </div>
                <div className="text-xs text-gray-400">{w.type}</div>
              </button>
            );
          })}
        </div>

        {/* footer */}
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg border text-sm"
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
