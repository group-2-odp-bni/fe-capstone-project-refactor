import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { saveTokens } from "../services/auth/authService";
import Header from "../components/Header";
import PinDots from "../components/register/PinDots";
import PinKeypad from "../components/register/PinKeypad";

const mockAddBalanceAPI = (fromId, toId, amount, token) => {
  console.log("Memanggil API Add Balance (Mockup):", {
    fromId,
    toId,
    amount,
    token,
  });
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          transactionId: `txn_${Date.now()}`,
          status: "SUCCESS",
          fromWallet: fromId,
          toWallet: toId,
          amount: amount,
          timestamp: new Date().toISOString(),
        },
      });
    }, 1000);
  });
};

export default function AddBalancePinPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fromId, toId, amount } = location.state || {};

  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleNumber = (n) => {
    if (loading || pin.length >= 6) return;
    setErrorMsg("");
    setPin((p) => p + String(n));
  };

  const handleDelete = () => {
    if (loading) return;
    setErrorMsg("");
    setPin((p) => p.slice(0, -1));
  };
  useEffect(() => {
    if (pin.length === 6) {
      handleSubmitPin();
    }
  }, [pin]);

  const handleSubmitPin = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      // const authRes = await api.post("/api/v1/auth/pin", { pin });
      // const { accessToken, refreshToken } = authRes.data.data;
      // saveTokens(accessToken, refreshToken);

      const accessToken = "bypass-token";
      const addBalanceRes = await mockAddBalanceAPI(
        fromId,
        toId,
        amount,
        accessToken
      );
      navigate(
        `/app/receipt/${addBalanceRes.data.transactionId}?type=SELF_TRANSFER`,
        {
          replace: true,
          state: {
            status: "success",
            receiptData: addBalanceRes.data,
          },
        }
      );
      console.error("Gagal:", err);
      const message =
        err.response?.data?.message || "PIN salah atau transaksi gagal.";
      setErrorMsg(message);
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  if (!fromId || !toId || !amount) {
    useEffect(() => navigate("/app/dashboard"), [navigate]);
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header onBack={() => navigate(-1)} showBack />

      <main className="flex-1 flex flex-col items-center justify-between p-5">
        <div className="text-center mt-8">
          <h2 className="text-xl font-bold text-gray-900">Enter your PIN</h2>

          <div className="my-6">
            <PinDots length={pin.length} />
          </div>

          {errorMsg && <p className="text-red-500 text-sm h-5">{errorMsg}</p>}
          {loading && !errorMsg && (
            <p className="text-gray-500 text-sm h-5">Memproses...</p>
          )}
        </div>

        <div className="w-full max-w-xs">
          <PinKeypad onNumber={handleNumber} onDelete={handleDelete} />
        </div>
      </main>
    </div>
  );
}
