import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PinKeypad from "../components/register/PinKeypad";
import PinDots from "../components/register/PinDots";

const ConfirmAddBalancePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showPin, setShowPin] = useState(false);
  const [step, setStep] = useState(1); // 1 = Masukkan PIN, 2 = Konfirmasi PIN
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { selected, amount } = location.state || {};

  if (!selected || !amount) {
    navigate("/app/add-balance", { replace: true });
    return null;
  }

  const formatRupiah = (val) =>
    new Intl.NumberFormat("id-ID", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(val);

  const biayaTransaksi = 0;
  const total = parseInt(amount.replace(/\./g, "")) + biayaTransaksi;

  // PIN Logic
  const handleNumber = (n) => {
    setErrorMsg("");
    if (step === 1 && pin.length < 6) setPin((p) => p + String(n));
    if (step === 2 && confirmPin.length < 6)
      setConfirmPin((p) => p + String(n));
  };

  const handleDelete = () => {
    setErrorMsg("");
    if (step === 1) setPin((p) => p.slice(0, -1));
    else setConfirmPin((p) => p.slice(0, -1));
  };

  const canEnter =
    (step === 1 && pin.length === 6) || (step === 2 && confirmPin.length === 6);

  const handleEnter = () => {
    if (step === 1 && pin.length < 6) {
      setErrorMsg("PIN harus 6 digit");
      return;
    }

    if (step === 1 && pin.length === 6) {
      setStep(2);
      setErrorMsg("");
      return;
    }

    if (step === 2) {
      if (confirmPin !== pin) {
        setErrorMsg("PIN tidak cocok, coba lagi");
        setConfirmPin("");
      } else {
        // Jika cocok, sukses
        alert(`Menambahkan Rp${formatRupiah(total)} ke ${selected}`);
        setShowPin(false);
        setStep(1);
        setPin("");
        setConfirmPin("");
        navigate("/app/dashboard");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between relative">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="w-9 h-9 grid place-items-center rounded-full bg-white text-[#FF9A25] shadow-md font-semibold"
        >
          🡨
        </button>

        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-xl font-bold text-center text-gray-800">
          Confirm Add Balance
        </h1>

        <div className="w-9 h-9" />
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6">
          {/* FROM */}
          <p className="text-sm text-gray-500 mb-1">From:</p>
          <div className="border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
            <p className="text-base font-bold text-gray-800">
              Ahong - Kantong Utama
            </p>
            <p className="text-sm text-gray-600">0812 9533 5662</p>
          </div>

          {/* TO */}
          <p className="text-sm text-gray-500 mb-1">To:</p>
          <div className="border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
            <p className="text-base font-bold text-gray-800">{selected}</p>
          </div>

          {/* ADD BALANCE */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6 shadow-inner">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Add Balance
            </h2>

            <div className="divide-y divide-gray-300">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Nominal</span>
                <span className="text-gray-800 font-medium">
                  Rp{formatRupiah(amount.replace(/\./g, ""))}
                </span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-gray-600">Biaya Transaksi</span>
                <span className="text-gray-800 font-medium">Rp0</span>
              </div>

              <div className="flex justify-between py-3 font-bold text-gray-900 text-lg">
                <span>Total</span>
                <span>Rp{formatRupiah(total)}</span>
              </div>
            </div>
          </div>

          {/* BUTTON KONFIRMASI */}
          <button
            onClick={() => setShowPin(true)}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold shadow-md hover:bg-orange-600 active:scale-[.99] transition"
          >
            Konfirmasi
          </button>
        </div>
      </main>

      {/* MODAL PIN */}
      {showPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-lg">
            <h3 className="text-center font-semibold mb-4">
              {step === 1 ? "Masukkan PIN" : "Konfirmasi PIN"}
            </h3>

            <div className="flex flex-col items-center">
              <PinDots length={6} value={step === 1 ? pin : confirmPin} />
              {errorMsg && (
                <p className="text-red-500 text-sm mt-2">{errorMsg}</p>
              )}
            </div>

            <div className="mt-6">
              <PinKeypad
                onNumber={handleNumber}
                onDelete={handleDelete}
                onEnter={handleEnter}
                canEnter={canEnter}
              />
            </div>

            <div className="mt-4 flex justify-between">
              <button
                onClick={() => {
                  setShowPin(false);
                  setStep(1);
                  setPin("");
                  setConfirmPin("");
                  setErrorMsg("");
                }}
                className="text-sm text-gray-600 underline"
              >
                Batal
              </button>

              <button
                onClick={() => {
                  setStep(1);
                  setPin("");
                  setConfirmPin("");
                  setErrorMsg("");
                }}
                className="text-sm text-gray-600"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfirmAddBalancePage;