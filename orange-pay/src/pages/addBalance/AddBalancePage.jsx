import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useBalanceCards from "../../hooks/api/useCardBalances";
import Header from "../../components/Header";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import BalanceCard from "../../components/history_transaksi/BalanceCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAddBalanceContext } from "../../context/AddBalanceContext";



export default function AddBalancePage() {

  const navigate = useNavigate();

  const { walletId: toWalletId } = useParams();
  const { addBalanceData, setAddBalanceData } = useAddBalanceContext();


  const { items, loading } = useBalanceCards();
  
  const allWallets = useMemo(() => items.filter((w) => !w.isAddCard), [items]);
  const toWallet = useMemo(
    () => allWallets.find((w) => w.id === toWalletId),
    [allWallets, toWalletId]
  );
  const fromWalletOptions = useMemo(
    () => allWallets.filter((w) => w.id !== toWalletId),
    [allWallets, toWalletId]
  );
  const [fromWalletId, setFromWalletId] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [errorMsg, setErrorMsg] = useState("");



  useEffect(() => {
    if (loading || allWallets.length === 0) return;
    const mainWallet = allWallets.find((w) => w.isMain);

    if (mainWallet && mainWallet.id !== toWalletId) {
      setFromWalletId(mainWallet.id);
    } else if (fromWalletOptions.length > 0) {
      setFromWalletId(fromWalletOptions[0].id);
    }
  }, [allWallets, toWalletId, fromWalletOptions, loading]);

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const formatted = raw ? parseInt(raw, 10).toLocaleString("id-ID") : "";
    setAmount(formatted);
  };

  const handleSubmit = async () => {

    // reformat input
    const numericAmount = parseInt(amount.replace(/\D/g, ""), 10);
    setErrorMsg("");

    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg("Masukkan jumlah yang valid.");
      return;
    }
    if (!fromWalletId) {
      setErrorMsg("Pilih wallet sumber.");
      return;
    }
    if (fromWalletId === toWalletId) {
      setErrorMsg("Wallet 'From' dan 'To' tidak boleh sama.");
      return;
    }

    //save data
    setAddBalanceData({
      sourceWalletId: fromWalletId,
      destinationWalletId: toWalletId,
      amount: numericAmount,

    });


    //navigate to confirmation page
    navigate("/app/wallets/confirm-add-balance")


  };

  const selectedFromWallet = useMemo(
    () => allWallets.find((w) => w.id === fromWalletId),
    [allWallets, fromWalletId]
  );

  return (


    <div className="min-h-screen flex flex-col bg-white">
      <Header
        title="Add Balance"
        onBack={() => navigate(-1)}
        showBack
        centerTitle
      />

      {loading ? (
        <main className="flex-1 p-5">
          <LoadingSpinner />
        </main>
      ) : (
        <main className="flex-1 p-5">
          <p className="text-sm mb-4 font-bold text-gray-700">
            Personal Wallet
          </p>

          {toWallet ? (
            <BalanceCard
              title={toWallet.title}
              balance={toWallet.balance}
              bg={toWallet.bg}
              accent={toWallet.accent}
              type={toWallet.type}
              isMain={toWallet.isMain}
            />
          ) : (
            <div className="text-center py-4 text-red-500">
              Wallet tujuan tidak ditemukan.
            </div>
          )}

          <label className="block text-sm font-bold mb-2 text-gray-700">
            Add Balance
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex justify-between items-center bg-gray-100 border border-gray-200 rounded-xl py-4 px-5 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <div className="flex items-center gap-3">
                <img
                  src="/orangepay_card.svg"
                  alt="Logo"
                  className="h-5 w-auto"
                />
                <span className="font-semibold text-gray-800">
                  {selectedFromWallet?.title || "Pilih Wallet Sumber"}
                </span>
              </div>
              <ChevronDownIcon
                className={`w-5 h-5 text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {dropdownOpen && (
              <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {fromWalletOptions.length === 0 && (
                  <li className="px-4 py-3 text-sm text-gray-500">
                    Tidak ada wallet lain yang tersedia.
                  </li>
                )}
                {fromWalletOptions.map((w) => (
                  <li
                    key={w.id}
                    onClick={() => {
                      setFromWalletId(w.id);
                      setDropdownOpen(false);
                    }}
                    className={`px-4 py-3 text-sm cursor-pointer hover:bg-orange-50 ${fromWalletId === w.id ? "bg-orange-100 font-medium" : ""
                      }`}
                  >
                    {w.title} (Rp{w.balance.toLocaleString("id-ID")})
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Amount
            </label>
            <div className="flex items-center border-b-2 border-gray-300 pb-2 focus-within:border-orange-500 transition">
              <span className="text-xl font-bold mr-2 text-gray-900">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full outline-none text-2xl font-bold bg-transparent text-gray-900"
              />
            </div>
          </div>

          {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}

          <div className="mt-8">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:bg-orange-600 active:scale-[.99] transition text-center"
            >
              Add
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
