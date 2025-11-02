import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import AmountInput from "./components/AmountInput";
import WalletAvatar from "./components/walletAvatar";
import api from "../../lib/api";

export default function TopUpAmount({ onConfirm, loading, error }) {
  const [walletList, setWalletList] = useState([]);
  const [selectedWalletId, setSelectedWalletId] = useState(null);
  const [digits, setDigits] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [vh, setVh] = useState(typeof window !== "undefined" ? window.innerHeight : 0);

  /** === Fetch Wallets === */
  useEffect(() => {
    const getUserWalletList = async () => {
      try {
        const res = await api.get("/api/v1/wallets");
        const walletData = res.data.data.map((w) => ({
          id: w.id,
          name: w.name,
        }));
        setWalletList(walletData);
        // set default selected wallet
        if (walletData.length > 0) setSelectedWalletId(walletData[0].id);
        console.log("Wallets:", walletData);
      } catch (err) {
        console.error("Failed to load wallets:", err);
      }
    };
    getUserWalletList();
  }, []);

  /** === Derived values === */
  const selectedWallet = useMemo(
    () => walletList.find((w) => w.id === selectedWalletId) ?? null,
    [walletList, selectedWalletId]
  );

  const nAmount = useMemo(() => (digits ? Number(digits) : 0), [digits]);
  const pretty = useMemo(() => {
    if (!nAmount) return "";
    return new Intl.NumberFormat("id-ID").format(nAmount);
  }, [nAmount]);
  const disabled = !nAmount || loading;

  /** === Handlers === */
  const handleChange = useCallback((e) => {
    const onlyDigits = (e.target.value || "").replace(/\D+/g, "");
    setDigits(onlyDigits.slice(0, 12));
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !disabled) onConfirm?.(nAmount, selectedWallet);
    },
    [disabled, nAmount, onConfirm, selectedWallet]
  );

  const triggerRef = useRef(null);
  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleResize = () => setVh(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex flex-col" style={{ minHeight: vh }}>
      <div className="p-4 pb-28 flex-1">
        {/* Select Wallet */}
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pilih Wallet
        </label>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setSheetOpen(true)}
          className="w-full flex items-center gap-3 border border-gray-200 rounded-2xl bg-white p-4 shadow-sm 
             hover:shadow-md active:scale-95 active:shadow-inner 
             transition-all duration-150 ease-out"
        >
          <WalletAvatar />
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-gray-900">
              {selectedWallet?.name ?? "Pilih wallet"}
            </p>
            <p className="text-xs text-gray-500">
              ID: {selectedWallet?.id ?? "-"}
            </p>
          </div>
          <span className="text-xs text-gray-500">Ganti</span>
        </button>

        {/* Amount Input */}
        <label className="block mt-6 mb-2 text-sm font-medium text-gray-700">
          Amount
        </label>
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

        {error && (
          <p id="amount-error" className="text-sm text-red-600 mt-2">
            {error}
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        className="fixed inset-x-0 bottom-0 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        <div className="px-9 pt-8">
          <div className="mb-5 flex items-center justify-between">
            <div className="text-m text-gray-600">
              {selectedWallet ? (
                <>
                  From <span className="font-medium text-gray-900">{selectedWallet.name}</span>
                </>
              ) : (
                "No wallet selected"
              )}
            </div>
            <div className="text-xl text-black-500">{pretty ? `Rp ${pretty}` : ""}</div>
          </div>

          <button
            type="button"
            onClick={() => onConfirm?.(nAmount, selectedWallet)}
            disabled={disabled}
            className="w-full bg-[#FF9A25] hover:bg-orange-600 active:bg-orange-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Processing..." : "Confirm"}
          </button>
        </div>
      </div>

      {/* Wallet Picker Sheet */}
      {sheetOpen && (
        <>
          {/* Overlay */}
          <button
            type="button"
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40"
            onClick={closeSheet}
          />
          {/* Panel */}
          <div
            className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ${
              sheetOpen ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="py-2 flex justify-center">
              <span className="h-1.5 w-10 bg-gray-300 rounded-full" />
            </div>
            <h2 className="px-4 text-base font-semibold text-gray-900 mb-2">Pilih Wallet</h2>

            <div className="max-h-[60vh] overflow-y-auto px-4 pb-4">
              <div className="flex flex-col gap-3">
                {walletList.map((wallet) => (
                  <button
                    key={wallet.id}
                    type="button"
                    onClick={() => {
                      setSelectedWalletId(wallet.id);
                      closeSheet();
                    }}
                    className={`p-3 border rounded-2xl text-left transition-all ${
                      wallet.id === selectedWalletId
                        ? "border-[#FF9A25] bg-orange-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <p className="font-medium text-gray-900">{wallet.name}</p>
                    <p className="text-sm text-gray-500">{wallet.id}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom))" }} />
          </div>
        </>
      )}
    </div>
  );
}
