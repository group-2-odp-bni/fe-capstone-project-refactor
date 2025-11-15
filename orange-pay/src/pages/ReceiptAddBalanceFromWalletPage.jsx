import React, { useMemo } from "react";
import {
  useLocation,
  useNavigate,
  Navigate,
  useSearchParams,
} from "react-router-dom";
import useBalanceCards from "../hooks/api/useCardBalances";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import Header from "../components/Header";

const formatRp = (n) => `Rp${(n || 0).toLocaleString("id-ID")}`;
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ReceiptPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { status, receiptData, errorMsg } = location.state || {};

  const { items: allWallets, loading: walletsLoading } = useBalanceCards();
  const transactionType = searchParams.get("type");
  const isSelfTransfer = transactionType === "SELF_TRANSFER";

  const fromWallet = useMemo(
    () => allWallets.find((w) => w.id === receiptData?.fromWallet),
    [allWallets, receiptData]
  );

  const toWallet = useMemo(
    () => allWallets.find((w) => w.id === receiptData?.toWallet),
    [allWallets, receiptData]
  );
  if (!status) {
    return <Navigate to="/app/dashboard" replace />;
  }
  if (walletsLoading && status === "success") {
    return <LoadingSpinner />;
  }
  if (status === "failure") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-white">
        <XCircleIcon className="w-24 h-24 text-red-500" />
        <h2 className="text-3xl font-bold mt-6 mb-2 text-gray-900">
          Transfer Anda Gagal!
        </h2>
        <p className="text-base text-gray-600 max-w-xs">
          {errorMsg || "Terjadi kesalahan. Silakan coba lagi."}
        </p>

        <div className="mt-12 w-full max-w-xs space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:bg-orange-600 transition"
          >
            Coba Lagi
          </button>
          <button
            onClick={() => navigate("/app/dashboard")}
            className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-200 transition"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header onBack={() => navigate("/app/dashboard")} showBack />

      <main className="flex-1 flex flex-col items-center text-center p-5 pb-10">
        <CheckCircleIcon className="w-24 h-24 text-green-500" />
        <h2 className="text-2xl font-bold mt-6 mb-4 text-gray-900">
          Success Move to Another Wallet
        </h2>

        <img src="/orangepay_card.svg" alt="Logo" className="h-7 w-auto" />
        <p className="text-sm text-gray-500 mt-2">Detail Transaction</p>
        <p className="text-4xl font-bold text-gray-900 mt-1">
          {formatRp(receiptData.amount)}
        </p>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mt-6 text-left">
          <div className="pb-4 border-b border-gray-100">
            <label className="text-xs text-gray-500 block">From</label>
            <span className="text-base font-semibold text-gray-800">
              {fromWallet?.title || "..."}
            </span>
          </div>
          <div className="mt-4">
            <label className="text-xs text-gray-500 block">To</label>
            <span className="text-base font-semibold text-gray-800">
              {toWallet?.title || "..."}
            </span>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Ref ID</span>
              <span className="font-medium font-mono text-gray-700">
                {receiptData.transactionId.split("_")[1]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-700">
                {formatDate(receiptData.timestamp)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Time</span>
              <span className="font-medium text-gray-700">
                {formatTime(receiptData.timestamp)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Type of Transactions</span>
              <span className="font-medium text-gray-700">
                {isSelfTransfer ? "Add Balance (Self)" : "Add Balance"}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-10 w-full max-w-md">
          <button
            onClick={() => navigate("/app/dashboard")}
            className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:bg-orange-600 transition"
          >
            Selesai
          </button>
        </div>
      </main>
    </div>
  );
}
