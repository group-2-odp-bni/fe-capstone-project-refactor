import { useState } from "react";
import api from "../../../lib/api";
const useAuth = () => ({
  user: {
    walletId: "WALLET_ID_SAYA_YANG_SEDANG_LOGIN",
  },
});

export default function PaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  invoice,
}) {
  const { user } = useAuth();

  const [pin, setPin] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) {
    return null;
  }

  const amount = invoice.totalDue || 0;
  const receiverUserId = invoice.payTo?.userId;
  const receiverWalletId = invoice.payTo?.walletId;
  const notes = `Bayar Split Bill: ${invoice.title || "Split Bill"}`;

  const currency = (n) =>
    `Rp${Number(n || 0).toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!pin || pin.length < 6) {
      setError("PIN harus 6 digit.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const senderWalletId = user.walletId;
      if (!senderWalletId) {
        throw new Error("Gagal mendapatkan wallet Anda. Silakan login ulang.");
      }

      console.log("🚀 Memulai transfer...");
      const idempotencyKey = crypto.randomUUID();
      const initiateResponse = await api.post(
        "/api/v1/transfers/initiate",
        {
          receiverUserId,
          receiverWalletId,
          senderWalletId,
          amount,
          notes,
          currency: "IDR",
        },
        {
          headers: { "Idempotency-Key": idempotencyKey },
        }
      );

      const transferId = initiateResponse.data?.data?.transferId;
      if (!transferId) {
        throw new Error("Gagal memulai transaksi.");
      }
      console.log(`✅ Transfer dimulai, ID: ${transferId}`);

      console.log("🔒 Mengeksekusi transfer...");
      await api.post(`/api/v1/transfers/${transferId}/execute`, { pin });
      console.log("🎉 Pembayaran Berhasil!");
      onPaymentSuccess();
      onClose();
    } catch (err) {
      console.error("❌ Pembayaran Gagal:", err);
      const apiMessage = err.response?.data?.message || err.message;
      setError(apiMessage || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsProcessing(false);
      setPin("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Konfirmasi Pembayaran</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmitPayment}>
          <div className="p-6 space-y-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Anda akan membayar ke</div>
              <div className="text-base font-semibold">
                {receiverUserId || "Pembuat Bill"}
              </div>
              <div className="text-3xl font-bold text-orange-600 mt-2">
                {currency(amount)}
              </div>
            </div>

            <div className="pt-2">
              <label
                htmlFor="pin"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Masukkan PIN Anda
              </label>
              <input
                type="password"
                id="pin"
                name="pin"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={6}
                autoComplete="off"
                placeholder="******"
                className="w-full px-4 py-3 text-center text-lg tracking-[0.5em] rounded-lg border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-center text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-b-2xl">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl text-white font-semibold bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
            >
              {isProcessing ? "Memproses..." : `Bayar ${currency(amount)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
