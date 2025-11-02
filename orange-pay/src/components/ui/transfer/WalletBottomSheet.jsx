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
            <div className="text-sm text-gray-500">Pilih Wallet</div>
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
                <div className="h-8 w-8 flex items-center justify-center">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 46 45"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M26.0596 0.1967C28.6981 -0.45257 31.5525 0.511911 33.0057 2.99497C33.379 3.63277 33.788 4.37637 34.2213 5.23236C31.1827 5.03171 26.6758 4.8418 20.4996 4.8418C17.0163 4.8418 14.0639 4.90221 11.6064 4.99088C16.2278 3.06271 21.2574 1.37841 26.0596 0.1967ZM6.55744 43.9306C9.5337 44.1365 14.1048 44.3418 20.5 44.3418C26.8951 44.3418 31.4663 44.1365 34.4426 43.9306C37.721 43.7038 40.3071 41.2137 40.5762 37.9086C40.6276 37.2772 40.6783 36.5744 40.7258 35.7977C39.7973 35.8246 38.7249 35.8418 37.5 35.8418C35.8257 35.8418 34.4364 35.8097 33.3102 35.7645C29.671 35.6186 26.7328 32.8321 26.5674 29.0979C26.5269 28.185 26.5 27.1035 26.5 25.8418C26.5 24.5801 26.5269 23.4986 26.5674 22.5857C26.7328 18.8515 29.671 16.065 33.3102 15.9191C34.4364 15.8739 35.8257 15.8418 37.5 15.8418C38.7249 15.8418 39.7973 15.859 40.7258 15.8859C40.6783 15.1092 40.6276 14.4064 40.5762 13.775C40.3071 10.4699 37.721 7.9798 34.4426 7.753C31.4663 7.54712 26.8952 7.3418 20.5 7.3418C14.1048 7.3418 9.5337 7.54712 6.55744 7.753C3.279 7.9798 0.69294 10.4699 0.42384 13.775C0.20583 16.4527 0 20.4171 0 25.8418C0 31.2665 0.20583 35.2309 0.42384 37.9086C0.69294 41.2137 3.279 43.7038 6.55744 43.9306ZM29.5644 28.9651C29.6588 31.0944 31.3007 32.6816 33.4304 32.767C34.5148 32.8104 35.864 32.8418 37.5 32.8418C39.136 32.8418 40.4852 32.8104 41.5696 32.767C43.6993 32.6816 45.3412 31.0944 45.4356 28.9651C45.474 28.0981 45.5 27.0609 45.5 25.8418C45.5 24.6227 45.474 23.5855 45.4356 22.7185C45.3412 20.5892 43.6993 19.002 41.5696 18.9167C40.4852 18.8732 39.136 18.8418 37.5 18.8418C35.864 18.8418 34.5148 18.8732 33.4304 18.9166C31.3007 19.002 29.6588 20.5892 29.5644 22.7185C29.526 23.5855 29.5 24.6227 29.5 25.8418C29.5 27.0609 29.526 28.0981 29.5644 28.9651ZM36.5 23.3418C37.3284 23.3418 38 24.0134 38 24.8418V26.8418C38 27.6702 37.3284 28.3418 36.5 28.3418C35.6716 28.3418 35 27.6702 35 26.8418V24.8418C35 24.0134 35.6716 23.3418 36.5 23.3418Z"
                      fill="#FF9A25"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{w.walletName}</div>
                  <div className="text-xs text-gray-500 truncate">
                    Balance: {Number(w.balance).toLocaleString("id-ID")}
                  </div>
                </div>
              </div>
              <span className="text-[11px] px-2 py-1 rounded-full border border-gray-200 text-gray-600">
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
