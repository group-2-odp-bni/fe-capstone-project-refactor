import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useBalanceCards from "../hooks/api/useCardBalances";
import Header from "../components/Header";

const formatRp = (n) => `Rp${(n || 0).toLocaleString("id-ID")}`;
const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-center text-sm py-3">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-900">{value}</span>
  </div>
);

export default function ConfirmAddBalancePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fromId, toId, amount } = location.state || {};
  const { items, loading } = useBalanceCards();
  const allWallets = useMemo(() => items.filter((w) => !w.isAddCard), [items]);

  const fromWallet = useMemo(
    () => allWallets.find((w) => w.id === fromId),
    [allWallets, fromId]
  );

  const toWallet = useMemo(
    () => allWallets.find((w) => w.id === toId),
    [allWallets, toId]
  );

  if (!fromId || !toId || !amount) {
    useEffect(() => navigate(-1), [navigate]);
    return null;
  }
  const fee = 0;
  const total = amount + fee;

  const handleConfirm = () => {
    navigate("/app/add-balance-pin", {
      state: { fromId, toId, amount, fee, total },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header
        title="Confirm Add Balance"
        onBack={() => navigate(-1)}
        showBack
        centerTitle
      />

      <main className="flex-1 p-5">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <label className="text-xs text-gray-500 mb-1 block">From:</label>
          <span className="text-base font-semibold text-gray-900">
            {loading ? "Memuat..." : fromWallet?.title}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mt-4">
          <label className="text-xs text-gray-500 mb-1 block">To:</label>
          <span className="text-base font-semibold text-gray-900">
            {loading ? "Memuat..." : toWallet?.title}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mt-6">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Add Balance</h3>
          <div className="divide-y divide-gray-100">
            <InfoRow label="Nominal" value={formatRp(amount)} />
            <InfoRow label="Biaya Transaksi" value={formatRp(fee)} />
          </div>
        </div>
      </main>

      <footer className="p-5 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.05)] border-t border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <span className="text-base text-gray-500">Total</span>
          <span className="text-xl font-bold text-gray-900">
            {formatRp(total)}
          </span>
        </div>
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:bg-orange-600 active:scale-[.99] transition text-center"
        >
          Confirm
        </button>
      </footer>
    </div>
  );
}
