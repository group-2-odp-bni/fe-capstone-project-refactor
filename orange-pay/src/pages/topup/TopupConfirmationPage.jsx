import { useState } from "react";
import ConfirmButton from "../../components/top-up/ConfirmButton";
import TopUpIcon from "../../components/top-up/TopUpIcon";
import { useTopupContext } from "../../context/TopupContext";
import VirtualAccountBox from "../../components/top-up/VirtualAccountBox";
import CountdownTimer from "../../components/dashboard/CountdownTimer";
import { useNavigate } from "react-router-dom";
import View from "../../components/view/View";
import WhiteHeader from "../../components/register/WhiteHeader";
import api from "../../lib/api";
import { useCountdown } from "../../hooks/useCountDown";

export default function TopUpConfirmationPage() {
  const { topupData } = useTopupContext();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { secondsLeft } = useCountdown(86400);

  // format number coming from context
  const formatAmount = (amount) => {
    return `Rp ${Number(amount || 0).toLocaleString("id-ID")}`;
  };

  // get topup status
  const handleGetTopupStatus = async () => {
    +setError("");
    +setLoading(true);

    try {
      const response = await api.get(
        `/api/v1/topup/${topupData.transactionId}/status`
      );

      const status = response.data?.data?.status;

      // handle no status
      if (!status) {
        throw new Error("Status tidak valid dari server");
      }

      if (status === "PAID") {
        navigate("/app/topup/result");
      } else {
        setError("Pembayaran belum dilakukan.");
      }
    } catch (err) {
      console.error("Failed to get status:", err);
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          "Gagal memeriksa status."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <WhiteHeader title="Konfirmasi Topup" />
      <div className="flex items-center justify-center px-4">
        {/* Card */}
        <div className="w-full max-w-sm rounded-[28px] border border-gray-200 shadow-sm min-h-[500px]">
          <div className="p-6 md:p-8">
            {/* Top icon */}
            <TopUpIcon />

            {/* Amount */}
            <div className="mt-4 text-center">
              <div className="text-[28px] leading-[34px] font-extrabold text-gray-900">
                {formatAmount(topupData.amount)}
              </div>

              {/* Description */}
              <div className="space-y-1 mt-8">
                <p className="text-xs text-gray-800">Orange-Pay Top Up</p>
                <p className="text-xs text-gray-800">Via BNI Virtual Account</p>
              </div>
            </div>

            {/* VA box */}
            <VirtualAccountBox vaNumber={topupData.vaNumber} />

            {/* Expiry */}
            <CountdownTimer
              initialSeconds={secondsLeft}
              className="mt-5 mb-5"
            />

            {error && (
              <p className="text-red-500 text-sm text-center mt-2">{error}</p>
            )}

            {/* Done button */}
            <ConfirmButton
              onClick={handleGetTopupStatus}
              label={loading ? "Memeriksa..." : "Cek Status Pembayaran"}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </View>
  );
}
