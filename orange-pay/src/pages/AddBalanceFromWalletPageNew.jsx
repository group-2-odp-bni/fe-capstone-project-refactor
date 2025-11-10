import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useBalanceCards from "../hooks/api/useCardBalances";
import PinKeypad from "../components/register/PinKeypad";
import PinDots from "../components/register/PinDots";
import axios from "axios";

const AddBalanceFromWalletPage = () => {
  const navigate = useNavigate();
  const { baseCards = [], loading } = useBalanceCards();
  const [selected, setSelected] = useState("");

  useEffect(() => {
    if (baseCards && baseCards.length && !selected) setSelected(baseCards[0].title);
  }, [baseCards, selected]);

  const onSubmit = (e) => {
    e.preventDefault();
    // show PIN input modal when user clicks Lanjut
    setShowPin(true);
  };

  // PIN modal state (local, reusing presentational components)
  const [showPin, setShowPin] = useState(false);
  const [step, setStep] = useState(1); // 1 = enter, 2 = confirm
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleNumber = (n) => {
    setErrorMsg("");
    if (step === 1 && pin.length < 6) setPin((p) => p + String(n));
    if (step === 2 && confirmPin.length < 6) setConfirmPin((p) => p + String(n));
  };

  const handleDelete = () => {
    setErrorMsg("");
    if (step === 1) setPin((p) => p.slice(0, -1));
    else setConfirmPin((p) => p.slice(0, -1));
  };

  const canEnter = (step === 1 ? pin.length === 6 : confirmPin.length === 6);
  //Menambahkan fungsi ketika user menekan tombol “Enter” di keypad PIN
  const handleEnter = async () => {
  if (!canEnter) return;
  if (step === 1) {
    setStep(2);
    return;
  }

  if (pin !== confirmPin) {
    setErrorMsg("PIN tidak cocok. Coba lagi.");
    setConfirmPin("");
    return;
  }

  try {
    const payload = {
      sourceWallet: selected,
      targetWallet: "other_wallet",
      amount: 50000, 
      pin: pin,
    };

    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/wallet/add-balance`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (res.data.success) {
      alert("Saldo berhasil ditransfer ke wallet lain!");
      setShowPin(false);
      navigate("/app/dashboard");
    } else {
      setErrorMsg(res.data.message || "Gagal menambah saldo.");
    }
  } catch (err) {
    console.error(err);
    setErrorMsg("Terjadi kesalahan saat mengirim data ke server.");
  }
};
//hingga sini

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src="/orangepay_card.svg" alt="logo" className="h-6" />
          <h1 className="text-lg font-semibold">Pilih Sumber Dana</h1>
        </div>
        <Link to="/app/dashboard" className="text-sm text-gray-600 hover:underline">
          Kembali
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-md">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg">
            <p className="text-sm text-gray-500 mb-4">Pilih wallet yang akan menjadi sumber dana untuk top up dari wallet lain.</p>

            <label className="block text-xs font-medium text-gray-700 mb-2">Sumber Wallet</label>
            <div className="relative">
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="appearance-none w-full bg-white border border-gray-200 rounded-xl py-3 px-4 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                aria-label="Pilih sumber wallet"
              >
                {loading && <option>Memuat...</option>}
                {!loading && baseCards.length === 0 && <option>Tidak ada wallet</option>}
                {!loading && baseCards.map((w) => (
                  <option key={w.id} value={w.title}>
                    {w.title} {w.walletName ? `— ${w.walletName}` : ""}
                  </option>
                ))}
              </select>

              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-500">Dipilih: <span className="font-medium text-gray-700">{selected || "-"}</span></div>
              <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-xl shadow hover:bg-orange-600 active:scale-[.99]">
                Lanjut
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* PIN modal (reuses PinDots + PinKeypad from registration) */}
      {showPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-lg">
            <h3 className="text-center font-semibold mb-4">Masukkan PIN</h3>
            <div className="flex flex-col items-center">
              <PinDots length={6} value={step === 1 ? pin : confirmPin} />
              {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}
            </div>
            <div className="mt-6">
              <PinKeypad onNumber={handleNumber} onDelete={handleDelete} onEnter={handleEnter} canEnter={canEnter} />
            </div>
            <div className="mt-4 flex justify-between">
              <button onClick={() => { setShowPin(false); setStep(1); setPin(""); setConfirmPin(""); }} className="text-sm text-gray-600 underline">
                Batal
              </button>
              <button onClick={() => { setStep(1); setPin(""); setConfirmPin(""); setErrorMsg(""); }} className="text-sm text-gray-600">
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddBalanceFromWalletPage;
