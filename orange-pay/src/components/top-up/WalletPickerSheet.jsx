import { X } from "lucide-react";
import { useEffect } from "react";

export default function WalletPickerSheet({ onClose, walletList = [], onSelectWallet }) {
  // Close with ESC key
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    // Backdrop
    <div
      className="absolute inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      {/* Bottom Sheet */}
      <div
        className="relative w-full bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Pilih Wallet</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={18} />
          </button>
        </div>

        {/* Wallet List */}
        <div className="max-h-[60vh] overflow-y-auto px-4 pb-4">
          <div className="flex flex-col gap-3 mt-3">
            {walletList.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Tidak ada wallet</p>
            ) : (
              walletList.map((wallet) => (
                <button
                  key={wallet.id}
                  type="button"
                  onClick={() => {
                    onSelectWallet?.(wallet);
                    onClose();
                  }}
                  className="p-3 border border-gray-200 rounded-2xl text-left hover:bg-gray-50 transition-all"
                >
                  <p className="font-medium text-gray-900">{wallet.name}</p>
                  <p className="text-sm text-gray-500">Saldo : Rp {wallet.amount.toLocaleString("id-ID")}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Safe area padding */}
        <div
          className="h-4"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom))" }}
        />
      </div>
    </div>
  );
}
