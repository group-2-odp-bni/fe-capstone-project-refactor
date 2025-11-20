import { useEffect, useMemo, useState } from "react";
import api from "../../../lib/api";
import generateIdempotencyKey from "../../../lib/generateIdempotencyKey";
const fmtIDR = (n) =>
  `Rp${Number(n || 0).toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

export default function PaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  invoice,
}) {
  const [pin, setPin] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const [wallets, setWallets] = useState([]);
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [isWalletsLoading, setIsWalletsLoading] = useState(false);
  const [walletsError, setWalletsError] = useState(null);

  const amountNumber = Number(invoice?.totalDue || 0);
  const receiverUserId =
    invoice?.payTo?.userId || invoice?.ownerUserId || "User";
  const receiverWalletId = invoice?.payTo?.walletId;
  const billId = invoice?.billId;
  const memberId = invoice?.memberId;
  const billTitle = invoice?.title || "Split Bill";
  const billOwnerUserId = invoice?.payTo?.userId;

  const notes = `Bayar Split Bill: ${billTitle}`;

  useEffect(() => {
    const fetchWallets = async () => {
      if (!isOpen) return;
      try {
        setIsWalletsLoading(true);
        setWalletsError(null);

        const response = await api.get("/api/v1/wallets");
        const userWallets = response.data?.data || [];

        if (userWallets.length > 0) {
          setWallets(userWallets);
          const defaultW =
            userWallets.find((w) => w.defaultForUser) || userWallets[0];
          setSelectedWalletId(defaultW.id);
        } else {
          setWallets([]);
          setSelectedWalletId("");
          setWalletsError("Anda tidak memiliki wallet aktif.");
        }
      } catch (err) {
        console.error(err);
        setWalletsError("Gagal memuat daftar wallet.");
      } finally {
        setIsWalletsLoading(false);
      }
    };

    fetchWallets();
  }, [isOpen]);

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!pin || pin.length < 6) return setError("PIN harus 6 digit.");
    if (!selectedWalletId) return setError("Pilih wallet sumber.");
    if (!billId || !memberId) return setError("Data tagihan tidak valid.");
    if (!receiverWalletId)
      return setError("Tujuan pembayaran tidak ditemukan.");

    setIsProcessing(true);
    setError(null);

    try {
      const idempotencyKey = generateIdempotencyKey();

      const initiatePayload = {
        billId,
        memberId,
        billTitle,
        billOwnerUserId,
        sourceWalletId: selectedWalletId,
        destinationWalletId: receiverWalletId,
        amount: Math.round(amountNumber),
      };

      const initiateRes = await api.post(
        "/api/v1/split-bill-payments/initiate",
        initiatePayload,
        { headers: { "Idempotency-Key": idempotencyKey } }
      );

      const transactionId = initiateRes?.data?.data?.id;
      if (!transactionId) throw new Error("Gagal memulai transaksi.");

      await api.post(`/api/v1/split-bill-payments/${transactionId}/execute`, {
        pin,
      });

      onPaymentSuccess?.();
      onClose?.();
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Pembayaran gagal.";
      setError(msg);
    } finally {
      setIsProcessing(false);
      setPin("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-all">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Konfirmasi Bayar</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleSubmitPayment}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="p-5 space-y-6 overflow-y-auto">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Total Tagihan</div>
              <div className="text-3xl font-black text-gray-900 tracking-tight">
                {fmtIDR(amountNumber)}
              </div>
              <div className="text-xs text-gray-400 mt-1 bg-gray-50 inline-block px-2 py-1 rounded">
                {billTitle}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Bayar Pakai Wallet
              </label>

              {isWalletsLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-16 bg-gray-100 rounded-xl w-full"></div>
                  <div className="h-16 bg-gray-100 rounded-xl w-full"></div>
                </div>
              ) : walletsError ? (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                  {walletsError}
                </div>
              ) : (
                <div
                  className="space-y-3 overflow-y-auto pr-1"
                  style={{ maxHeight: "220px" }}
                >
                  {wallets.map((w) => {
                    const isSelected = selectedWalletId === w.id;
                    const isBalanceSufficient =
                      (w.balanceSnapshot || 0) >= amountNumber;

                    return (
                      <div
                        key={w.id}
                        onClick={() =>
                          isBalanceSufficient && setSelectedWalletId(w.id)
                        }
                        className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group ${
                          isSelected
                            ? "border-[#FF9A25] bg-orange-50"
                            : "border-gray-100 hover:border-orange-200 bg-white"
                        } ${
                          !isBalanceSufficient
                            ? "opacity-60 grayscale cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isSelected
                                ? "bg-orange-200 text-orange-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect x="2" y="5" width="20" height="14" rx="2" />
                              <line x1="2" y1="10" x2="22" y2="10" />
                            </svg>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-bold text-sm ${
                                  isSelected ? "text-gray-900" : "text-gray-700"
                                }`}
                              >
                                {w.name}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                  w.type === "PERSONAL"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-purple-100 text-purple-700"
                                }`}
                              >
                                {w.type}
                              </span>
                            </div>
                            <div
                              className={`text-xs mt-0.5 font-medium ${
                                isBalanceSufficient
                                  ? "text-gray-500"
                                  : "text-red-500"
                              }`}
                            >
                              {fmtIDR(w.balanceSnapshot || 0)}
                              {!isBalanceSufficient && " (Saldo Kurang)"}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 bg-[#FF9A25] rounded-full flex items-center justify-center text-white shadow-sm">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Masukkan PIN Keamanan
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="new-password"
                placeholder="• • • • • •"
                className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold rounded-xl border border-gray-300 focus:border-[#FF9A25] focus:ring-2 focus:ring-orange-100 outline-none transition-all placeholder-gray-300 text-gray-800"
                required
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 p-3 rounded-lg">
                <svg
                  className="w-5 h-5 text-red-500 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="text-xs text-red-600 leading-tight pt-0.5">
                  {error}
                </div>
              </div>
            )}
          </div>

          <div className="p-5 bg-gray-50 border-t border-gray-100 rounded-b-2xl mt-auto">
            <button
              type="submit"
              disabled={
                isProcessing ||
                isWalletsLoading ||
                !selectedWalletId ||
                !!walletsError
              }
              className="w-full py-3.5 rounded-xl text-white font-bold text-base bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] shadow-lg shadow-orange-200 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Memproses...
                </>
              ) : (
                `Bayar Sekarang`
              )}
            </button>
            <div className="text-center mt-3 text-[10px] text-gray-400">
              Dilindungi dengan enkripsi end-to-end
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
