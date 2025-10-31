import { useState, useMemo, useCallback, useEffect, useRef } from "react";

export default function TopUpAmount({
  onConfirm,
  loading,
  error,
  cards, // optional
}) {
  const [digits, setDigits] = useState("");
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // state khusus animasi Ahong
  const [ahongBurstKey, setAhongBurstKey] = useState(0);
  const [ahongActive, setAhongActive] = useState(false);

  // dummy cards kalau props.cards tidak disediakan
  const dummyCards = [
    { id: "card-1", logo: "/orange.jpg", brand: "Range-Pay", phone: "0812 6754 9123", owner: "Ahong" },
    { id: "card-2", logo: "/blue.jpg", brand: "Blue-Wallet", phone: "0813 9988 7766", owner: "Sari" },
    { id: "card-3", logo: "/green.jpg", brand: "Green-Pay", phone: "0819 1122 3344", owner: "Budi" },
    { id: "card-4", logo: "/purple.jpg", brand: "Violet-Pay", phone: "0817 4455 9900", owner: "Dina" },
    { id: "card-5", logo: "/red.jpg", brand: "Crimson-Pay", phone: "0812 3344 5566", owner: "Rio" },
  ];
  const cardList = Array.isArray(cards) && cards.length > 0 ? cards : dummyCards;

  // set default selected card on mount
  useEffect(() => {
    if (cardList.length > 0) setSelectedCardId((prev) => prev ?? cardList[0].id);
  }, [cardList]);

  const selectedCard = useMemo(
    () => cardList.find((c) => c.id === selectedCardId) ?? null,
    [cardList, selectedCardId]
  );

  const nAmount = useMemo(() => (digits ? Number(digits) : 0), [digits]);
  const disabled = !nAmount || loading;

  const pretty = useMemo(() => {
    if (!nAmount) return "";
    return new Intl.NumberFormat("id-ID").format(nAmount);
  }, [nAmount]);

  // responsif saat keyboard muncul
  const [vh, setVh] = useState(typeof window !== "undefined" ? window.innerHeight : 0);
  useEffect(() => {
    const handleResize = () => setVh(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleChange = useCallback((e) => {
    const onlyDigits = (e.target.value || "").replace(/\D+/g, "");
    setDigits(onlyDigits.slice(0, 12));
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !disabled) onConfirm?.(nAmount, selectedCard);
    },
    [disabled, nAmount, onConfirm, selectedCard]
  );

  // Bottom sheet a11y: close on Escape, return focus
  const triggerRef = useRef(null);
  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    triggerRef.current?.focus();
  }, []);
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e) => e.key === "Escape" && closeSheet();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen, closeSheet]);

  // handler pilih kartu dengan animasi khusus Ahong
  const handleSelectCard = useCallback(
    (card) => {
      const isAhong = card.owner?.toLowerCase() === "ahong" || card.id === "card-1";
      if (isAhong) {
        // trigger animasi khusus
        setAhongActive(true);
        setAhongBurstKey((k) => k + 1);
        // sedikit delay agar animasi terlihat sebelum close
        setTimeout(() => {
          setSelectedCardId(card.id);
          setAhongActive(false);
          closeSheet();
        }, 350);
      } else {
        setSelectedCardId(card.id);
        closeSheet();
      }
    },
    [closeSheet]
  );

  return (
    <div className="flex flex-col" style={{ minHeight: vh }}>
      {/* CONTENT */}
      <div className="p-4 pb-28 flex-1">
        {/* TRIGGER: Pilih Sumber (opens bottom sheet) */}
        <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Sumber</label>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setSheetOpen(true)}
          className="w-full flex items-center gap-3 border border-gray-200 rounded-2xl bg-white p-4 shadow-sm 
             hover:shadow-md active:scale-95 active:shadow-inner 
             transition-all duration-150 ease-out"
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          aria-controls="sheet-cards"
        >
          <div className="relative">
            {/* avatar */}
            <img
              src={selectedCard?.logo ?? "/orange.jpg"}
              alt={`${selectedCard?.brand ?? "Wallet"} logo`}
              className={`w-10 h-10 object-contain rounded-full ${
                selectedCard?.owner?.toLowerCase() === "ahong" && ahongActive ? "animate-ahong-bounce" : ""
              }`}
            />
            {/* ripple highlight saat trigger menunjukkan Ahong aktif */}
            {selectedCard?.owner?.toLowerCase() === "ahong" && ahongActive && (
              <span key={ahongBurstKey} className="pointer-events-none absolute inset-0 rounded-full border-2 border-orange-400/70 animate-ahong-ripple" />
            )}
          </div>

          <div className="flex-1 text-left">
            <p className="text-sm font-extrabold tracking-wider text-gray-900 uppercase">
              {selectedCard?.brand ?? "Pilih kartu"}
            </p>
            {selectedCard ? (
              <p className="text-sm text-gray-600 mt-0.5">
                <span className="underline underline-offset-2 text-sky-600">
                  {selectedCard.phone}
                </span>{" "}
                · {selectedCard.owner}
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-0.5">Ketuk untuk memilih</p>
            )}
          </div>
          <span className="text-xs text-gray-500">Ganti</span>
        </button>

        {/* Amount */}
        <label className="block mt-6 mb-2 text-sm font-medium text-gray-700">Amount</label>
        <div className="relative mb-1">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-semibold select-none">
            Rp
          </span>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="0"
            value={pretty}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            aria-invalid={!!error}
            aria-describedby={error ? "amount-error" : undefined}
            className="w-full border-b border-gray-200 focus:border-gray-400 transition pb-1 pl-12 text-3xl font-semibold tracking-tight outline-none appearance-none bg-transparent"
          />
        </div>

        {/* {pretty ? (
          <p className="text-xs text-gray-500">≈ Rp {pretty}</p>
        ) : (
          <div className="h-5" />
        )} */}

        {error && (
          <p id="amount-error" className="text-sm text-red-600 mt-2">
            {error}
          </p>
        )}
      </div>

      {/* FOOTER */}
      <div
        className="fixed inset-x-0 bottom-0 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        <div className="px-9 pt-8">
          <div className="mb-5 flex items-center justify-between">
            <div className="text-m text-gray-600">
              {selectedCard ? (
                <>From <span className="font-medium text-gray-900">{selectedCard.brand}</span></>
              ) : (
                "No card selected"
              )}
            </div>
            <div className="text-xl text-black-500">{pretty ? `Rp ${pretty}` : ""}</div>
          </div>

          <button
            type="button"
            onClick={() => onConfirm?.(nAmount, selectedCard)}
            disabled={disabled}
            className="w-full bg-[#FF9A25] hover:bg-orange-600 active:bg-orange-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Processing..." : "Confirm"}
          </button>
        </div>
      </div>

      {/* BOTTOM SHEET */}
      {/* Overlay */}
      {sheetOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40"
          onClick={closeSheet}
          aria-label="Tutup pemilihan kartu"
        />
      )}

      {/* Sheet Panel */}
      <div
        id="sheet-cards"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ${
          sheetOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ willChange: "transform" }}
      >
        <div className="bg-white rounded-t-2xl shadow-2xl">
          {/* drag handle visual */}
          <div className="py-2 flex justify-center">
            <span className="h-1.5 w-10 bg-gray-300 rounded-full" />
          </div>

          <div className="px-4">
            <div className="flex items-center justify-between mb-2">
              <h2 id="sheet-title" className="text-base font-semibold text-gray-900">
                Pilih Sumber
              </h2>
              <button
                type="button"
                onClick={closeSheet}
                className="text-sm text-gray-500 hover:text-gray-700"
                aria-label="Tutup"
              >
                Close
              </button>
            </div>
          </div>

          {/* scrollable list */}
          <div className="max-h-[60vh] overflow-y-auto px-4 pb-4">
            <div className="flex flex-col gap-3">
              {cardList.map((card) => {
                const isSelected = card.id === selectedCardId;
                const isAhong = card.owner?.toLowerCase() === "ahong" || card.id === "card-1";
                return (
                  <button
                    key={card.id}
                    type="button"
                    onMouseDown={(e) => {
                      // prevent text selection on long press
                      e.currentTarget.style.userSelect = "none";
                    }}
                    onTouchStart={() => {
                      if (isAhong) {
                        setAhongActive(true);
                        setAhongBurstKey((k) => k + 1);
                      }
                    }}
                    onClick={() => handleSelectCard(card)}
                    aria-pressed={isSelected}
                    className={`relative overflow-hidden flex items-center gap-3 rounded-2xl p-3 border w-full text-left 
                      transition-all duration-150 ease-out 
                      active:scale-95 active:shadow-inner
                      ${
                        isSelected
                          ? "border-[#FF9A25] bg-orange-50 shadow-sm"
                          : "border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100"
                      }`}
                  >
                    {/* ripple & confetti khusus Ahong */}
                    {isAhong && ahongActive && (
                      <>
                        <span
                          key={`ripple-${ahongBurstKey}`}
                          className="pointer-events-none absolute inset-0 rounded-2xl bg-orange-200/30 animate-ahong-ripple-soft"
                        />
                        <span
                          key={`burst1-${ahongBurstKey}`}
                          className="pointer-events-none absolute left-6 top-2 animate-ahong-burst1"
                        >
                          🍊
                        </span>
                        <span
                          key={`burst2-${ahongBurstKey}`}
                          className="pointer-events-none absolute left-10 top-3 animate-ahong-burst2"
                        >
                          ✨
                        </span>
                        <span
                          key={`burst3-${ahongBurstKey}`}
                          className="pointer-events-none absolute left-12 top-5 animate-ahong-burst3"
                        >
                          🪙
                        </span>
                      </>
                    )}

                    <div className="relative">
                      <img
                        src={card.logo}
                        alt={`${card.brand} logo`}
                        className={`w-10 h-10 object-contain rounded-full ${
                          isAhong && ahongActive ? "animate-ahong-bounce" : ""
                        }`}
                      />
                      {isAhong && ahongActive && (
                        <span className="pointer-events-none absolute inset-0 rounded-full border-2 border-orange-400/70 animate-ahong-ripple" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-baseline justify-between">
                        <p className="text-sm font-extrabold tracking-wider text-gray-900 uppercase">
                          {card.brand}
                        </p>
                        {isSelected && (
                          <span className="text-xs font-medium text-[#FF9A25]">Selected</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">
                        <span className="underline underline-offset-2 text-sky-600">
                          {card.phone}
                        </span>{" "}
                        · {card.owner}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* safe area bottom padding */}
          <div
            className="h-4"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom))" }}
          />
        </div>
      </div>

      {/* Keyframes khusus (inline) */}
      <style>{`
        @keyframes ahong-bounce {
          0% { transform: scale(1); }
          30% { transform: scale(0.9) rotate(-3deg); }
          60% { transform: scale(1.08) rotate(2deg); }
          100% { transform: scale(1); }
        }
        @keyframes ahong-ripple {
          0% { opacity: 0.6; transform: scale(0.8); }
          100% { opacity: 0; transform: scale(1.6); }
        }
        @keyframes ahong-ripple-soft {
          0% { opacity: 0.25; transform: scale(0.98); }
          100% { opacity: 0; transform: scale(1.05); }
        }
        @keyframes ahong-burst-up-1 {
          0% { transform: translateY(0) translateX(0) scale(0.8); opacity: 0.9; }
          100% { transform: translateY(-22px) translateX(-8px) scale(1.1); opacity: 0; }
        }
        @keyframes ahong-burst-up-2 {
          0% { transform: translateY(0) translateX(0) scale(0.8); opacity: 0.9; }
          100% { transform: translateY(-26px) translateX(6px) scale(1.15); opacity: 0; }
        }
        @keyframes ahong-burst-up-3 {
          0% { transform: translateY(0) translateX(0) scale(0.8); opacity: 0.9; }
          100% { transform: translateY(-30px) translateX(10px) scale(1.2); opacity: 0; }
        }

        .animate-ahong-bounce { animation: ahong-bounce 320ms ease-out; }
        .animate-ahong-ripple { animation: ahong-ripple 350ms ease-out forwards; }
        .animate-ahong-ripple-soft { animation: ahong-ripple-soft 280ms ease-out forwards; }
        .animate-ahong-burst1 { animation: ahong-burst-up-1 360ms ease-out forwards; }
        .animate-ahong-burst2 { animation: ahong-burst-up-2 380ms ease-out forwards; }
        .animate-ahong-burst3 { animation: ahong-burst-up-3 400ms ease-out forwards; }
      `}</style>
    </div>
  );
}
