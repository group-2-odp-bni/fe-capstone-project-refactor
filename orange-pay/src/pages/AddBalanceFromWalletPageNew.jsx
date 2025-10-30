import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useBalanceCards from "../hooks/api/useCardBalances";
import PinKeypad from "../components/register/PinKeypad";
import PinDots from "../components/register/PinDots";
import Header from "../components/Header";
import { EyeIcon, EyeSlashIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

/* ===== Komponen Kartu Balance ===== */
const GradientCard = ({ title, balance, bg, accent }) => {
  const [hidden, setHidden] = useState(false);

  return (
    <div
      className="rounded-[22px] p-[1px] transition-all duration-300 shadow-lg hover:translate-y-[1px] mb-6"
      style={{
        background: bg,
        boxShadow: `0 10px 28px rgba(0,0,0,0.22), 0 0 24px ${accent}55, 0 0 64px ${accent}33`,
      }}
    >
      <div className="relative text-white rounded-[22px] p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-5">
          <img
            src="/orangepay_card.svg"
            alt="Logo"
            className="h-5 md:h-6 w-auto drop-shadow"
          />
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white backdrop-blur-md shadow-sm bg-white/30">
            {title}
          </span>
        </div>

        {/* Balance */}
        <div className="flex items-center space-x-2">
          <span className="text-2xl md:text-3xl font-bold font-[Poppins] drop-shadow">
            {hidden ? "Rp••••••••" : `Rp${balance.toLocaleString("id-ID")}`}
          </span>

          <button onClick={() => setHidden(!hidden)} className="active:scale-95">
            {hidden ? (
              <EyeSlashIcon className="w-6 h-6 text-white/85" />
            ) : (
              <EyeIcon className="w-6 h-6 text-white/95" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
/* ================================== */

const AddBalanceFromWalletPage = () => {
  const navigate = useNavigate();
  const { baseCards = [], loading } = useBalanceCards();
  const [selected, setSelected] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [showPin, setShowPin] = useState(false);
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [amount, setAmount] = useState("");

  // Auto pilih wallet pertama
  useEffect(() => {
    if (baseCards && baseCards.length && !selected)
      setSelected(baseCards[0].title);
  }, [baseCards, selected]);

  const handleBack = () => navigate(-1);
  // Handle keypad
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

  const canEnter = step === 1 ? pin.length === 6 : confirmPin.length === 6;

  const handleEnter = () => {
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

    navigate("/app/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* HEADER */}
      <Header title="Add Balance" onBack={handleBack} showBack centerTitle />

      {/* MAIN CONTENT */}
      <main className=" justify-center">
          <div className="p-5">
            <p className="text-sm mb-4 font-bold">
              Personal Wallet
            </p>

            {/* Kartu balance */}
            {baseCards.length > 0 && (
              <GradientCard
                title={selected || baseCards[0].title}
                balance={baseCards.find((c) => c.title === selected)?.balance || 0}
                bg="linear-gradient(101.06deg, #2F5755 23.71%, #1A3A38 60.76%, #041D1C 97.82%)"
                accent="#2F5755"
              />
            )}

            {/* Custom Dropdown dengan Icon */}
            <label className="block text-xs font-bold mb-2">
              Add Balance
            </label>
            <div className="flex-col leading-tight">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex justify-between items-center bg-white border border-gray-200 rounded-2xl py-4 px-6 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all duration-200"
              >
                <div className="">
                  <div>
                    <img
                      src="/Orangepay.svg"
                      alt="Logo"
                      className="block h-5 md:h-6 w-auto drop-shadow"
                    />
                  </div>
                <div className="flex flex-col items-start pl-5">
                  <span className="text-lg font-semibold text-gray-800">
                    {selected || "Pilih Wallet"}
                  </span>
                </div>
                </div>
                <ChevronDownIcon className="w-7 h-7 text-gray-500" />
              </button>

              {dropdownOpen && (
                <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {loading && (
                    <li className="px-4 py-2 text-sm text-gray-500">
                      Memuat...
                    </li>
                  )}
                  {!loading && baseCards.length === 0 && (
                    <li className="px-4 py-2 text-sm text-gray-500">
                      Tidak ada wallet
                    </li>
                  )}
                  {!loading &&
                    baseCards.map((w) => (
                      <li
                        key={w.id}
                        onClick={() => {
                          setSelected(w.title);
                          setDropdownOpen(false);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer hover:bg-orange-50 ${selected === w.title ? "bg-orange-100" : ""
                          }`}
                      >
                        <span className="text-gray-700">
                          {w.title}{" "}
                          {w.walletName ? `— ${w.walletName}` : ""}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            {/* Tombol Lanjut
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Dipilih:{" "}
                <span className="font-medium text-gray-700">
                  {selected || "-"}
                </span>
              </div>
              <button
                type="submit"
                className="bg-orange-500 text-white px-4 py-2 rounded-xl shadow hover:bg-orange-600 active:scale-[.99] transition"
              >
                Lanjut
              </button>
            </div> */}

            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">
                Amount
              </label>
              <div className="flex items-center border-b-2 border-gray-300 pb-2 focus-within:border-orange-500 transition">
                <span className="font-bold mr-2">Rp</span>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, ""); // hapus semua non-digit
                    const formatted = raw
                      ? parseInt(raw, 10).toLocaleString("id-ID")
                      : "";
                    setAmount(formatted);
                  }}
                  placeholder="0"
                  className="w-full outline-none text-lg font-semibold bg-transparent"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button" // <--- ubah dari submit ke button
                onClick={() => {
                  if (!amount || !selected) return alert("Isi amount dan pilih wallet dulu!");
                  navigate("/app/confirm-add-balance", {
                    state: { selected, amount },
                  });
                }}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold shadow hover:bg-orange-600 active:scale-[.99] transition text-center"
              >
                Add
              </button>
            </div>
          </div>
      </main>
    </div>
  );
};

export default AddBalanceFromWalletPage;