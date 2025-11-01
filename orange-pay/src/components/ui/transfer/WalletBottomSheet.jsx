// src/components/ui/WalletBottomSheet.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

const SNAP_THRESHOLD_RATIO = 0.25;

export default function WalletBottomSheet({ open = true, onClose, onSelect, dynamicTop }) {
  // Dummy wallets
  const wallets = useMemo(
    () => [
      { id: "w1", walletName: "Dompet Utama", balance: 1250000, type: "Utama" },
      { id: "w2", walletName: "Dompet Pribadi", balance: 350000, type: "Personal" },
      { id: "w3", walletName: "Dompet Keluarga", balance: 78000, type: "Shared" },
      { id: "w4", walletName: "Budget Harian", balance: 110000, type: "Personal" },
      { id: "w5", walletName: "Tabungan Wedding", balance: 5000000, type: "Shared" },
      { id: "w6", walletName: "Dana Darurat", balance: 2500000, type: "Utama" },
      { id: "w7", walletName: "Kebutuhan Bulanan", balance: 900000, type: "Personal" },
      { id: "w8", walletName: "Jajan Weekend", balance: 240000, type: "Personal" },
      { id: "w9", walletName: "Biaya Rumah", balance: 3100000, type: "Shared" },
      { id: "w10", walletName: "Liburan", balance: 4500000, type: "Shared" },
    ],
    []
  );

  // Top positioning
  const initialTop = Math.round(window.innerHeight * 0.45);
  const [sheetTop, setSheetTop] = useState(
    typeof dynamicTop === "number" ? dynamicTop : initialTop
  );
  const baseTop = useRef(typeof dynamicTop === "number" ? dynamicTop : initialTop);

  useEffect(() => {
    if (typeof dynamicTop === "number") {
      setSheetTop(dynamicTop);
      baseTop.current = dynamicTop;
    }
  }, [dynamicTop]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Drag handling
  const draggingRef = useRef(false);
  const startY = useRef(0);
  const startTop = useRef(0);

  const startDrag = (y) => {
    draggingRef.current = true;
    startY.current = y;
    startTop.current = sheetTop;
    document.body.style.userSelect = "none";
  };

  const moveDrag = (y) => {
    const delta = y - startY.current;
    const BOTTOM_LIMIT_PX = window.innerHeight * 0.65;
    const nextTop = Math.min(Math.max(startTop.current + delta, 80), BOTTOM_LIMIT_PX);
    setSheetTop(nextTop);
  };

  const endDrag = () => {
    draggingRef.current = false;
    document.body.style.userSelect = "";
    const isExpanded = sheetTop < window.innerHeight * SNAP_THRESHOLD_RATIO;
    setSheetTop(isExpanded ? 80 : baseTop.current);
  };

  // 📱 TOUCH header drag
  const headerTouchStart = (e) => startDrag(e.touches[0].clientY);
  const headerTouchMove = (e) => {
    if (!draggingRef.current) return;
    moveDrag(e.touches[0].clientY);
  };
  const headerTouchEnd = () => draggingRef.current && endDrag();

  // 🖱️ MOUSE header drag
  const headerMouseDown = (e) => e.button === 0 && startDrag(e.clientY);
  useEffect(() => {
    if (!open) return;
    const onMove = (e) => draggingRef.current && moveDrag(e.clientY);
    const onUp = () => draggingRef.current && endDrag();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [open, sheetTop]);

  const toggleExpand = () => {
    const isExpanded = sheetTop < window.innerHeight * 0.25;
    setSheetTop(isExpanded ? baseTop.current : 80);
  };

  if (!open) return null;

  return (
    <section className="relative">
      <div className="fixed inset-0 z-40 bg-transparent" aria-hidden="true" onClick={onClose} />

      <div
        className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl border-t border-gray-200 shadow-xl flex flex-col transition-[top] duration-200 ease-out"
        style={{ top: sheetTop }}
      >
        {/* FULL header is draggable */}
        <div
          className="select-none"
          onMouseDown={headerMouseDown}
          onTouchStart={headerTouchStart}
          onTouchMove={headerTouchMove}
          onTouchEnd={headerTouchEnd}
          onDoubleClick={toggleExpand}
        >
          <div className="pt-3 pb-2 flex justify-center">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          <div className="px-5 pb-3 bg-gradient-to-b from-white to-orange-50/40 border-b border-gray-100">
            <div className="text-base font-semibold text-gray-900">Pilih Sumber Dana</div>
            <div className="text-sm text-gray-500">Klik wallet untuk ambil ID</div>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 divide-y divide-gray-100">
          {wallets.map((w) => (
            <button
              key={w.id}
              type="button"
              className="w-full py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
              onClick={() => {
                console.log("Selected Wallet ID:", w.id);
                onSelect?.(w.id, w); // <-- if parent wants the callback
              }}
            >
              <div className="min-w-0 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-[11px] font-semibold text-orange-700">
                  {(w.walletName || "W").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{w.walletName}</div>
                  <div className="text-xs text-gray-500 truncate">
                    Balance: {Number(w.balance).toLocaleString("id-ID")}
                  </div>
                </div>
              </div>
              <span className="text-[11px] px-2 py-1 rounded-full border text-gray-600">
                {w.type}
              </span>
            </button>
          ))}
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border text-sm hover:bg-gray-50 active:scale-[0.99] transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </section>
  );
}
