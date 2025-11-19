import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import { useAddBalanceContext } from "../../context/AddBalanceContext";
import useBalanceCards from "../../hooks/api/useCardBalances";
import api from "../../lib/api";
import generateIdempotencyKey from "../../lib/generateIdempotencyKey";

const formatRp = (n) => `Rp${(n || 0).toLocaleString("id-ID")}`;
const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-center text-sm py-3">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-900">{value}</span>
  </div>
);

export default function ConfirmAddBalancePage() {
  const navigate = useNavigate();
  const { addBalanceData } = useAddBalanceContext();
  const idempotencyKey = generateIdempotencyKey();

  const { items } = useBalanceCards();
  const destinationWallet = items.find(
    (w) => w.id === addBalanceData.destinationWalletId
  );
  const sourceWallet = items.find(
    (w) => w.id === addBalanceData.sourceWalletId
  );

  const [errorMessage, setErrorMessage] = useState(""); // 🧠 store error message

  const fee = 0;
  const total = addBalanceData.amount + fee;

  const handleConfirm = async () => {
    try {
      setErrorMessage(""); // reset previous errors

      const response = await api.post(
        "/api/v1/transfers/internal",
        {
          sourceWalletId: addBalanceData.sourceWalletId,
          destinationWalletId: addBalanceData.destinationWalletId,
          amount: addBalanceData.amount,
        },
        {
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
        }
      );

      // check if backend returned error message in response
      if (response.data?.error?.message) {
        setErrorMessage(response.data.error.message);
        return;
      }

      // navigate if success
      navigate("/app/dashboard");
    } catch (error) {
      console.error("Error adding balance:", error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Something went wrong. Please try again.";
      setErrorMessage(msg);
    }
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
            {sourceWallet?.title || "Unknown Wallet"}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mt-4">
          <label className="text-xs text-gray-500 mb-1 block">To:</label>
          <span className="text-base font-semibold text-gray-900">
            {destinationWallet?.title || "Unknown Wallet"}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mt-6">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Add Balance</h3>
          <div className="divide-y divide-gray-100">
            <InfoRow label="Nominal" value={formatRp(addBalanceData.amount)} />
            <InfoRow label="Biaya Transaksi" value={formatRp(fee)} />
          </div>
        </div>

        {/* Error message display */}
        {errorMessage && (
          <div className="mt-4 text-center text-red-600 font-medium bg-red-50 border border-red-200 rounded-lg p-3">
            {errorMessage}
          </div>
        )}
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
          className="w-full bg-orange-400 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:bg-orange-400 active:scale-[.99] transition text-center"
        >
          Confirm
        </button>
      </footer>
    </div>
  );
}
