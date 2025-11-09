import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
const fmt = (n) => {
  const num = Number(n || 0);
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};
const currency = (n) => `Rp${fmt(n)}`;

export default function SplitBillMemberPage() {
  const { id: splitId, memberId } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  useEffect(() => {
    if (!splitId || !memberId) {
      setError("Split ID atau Member ID tidak valid.");
      setLoading(false);
      return;
    }

    const fetchInvoiceData = async () => {
      try {
        setLoading(true);
        console.log(
          `🔍 Mengambil data API untuk: /api/v1/split-bill/bills/${splitId}/members/${memberId}`
        );

        const response = await api.get(
          `/api/v1/split-bill/bills/${splitId}/members/${memberId}`
        );

        if (response.data && !response.data.error) {
          console.log("✅ Data API berhasil diambil:", response.data.data);
          setInvoice(response.data.data);
        } else {
          throw new Error(
            response.data.message || "Gagal mengambil data invoice"
          );
        }
      } catch (e) {
        console.error("❌ Gagal load data API:", e);
        setError(e.message || "Invoice tidak ditemukan");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [splitId, memberId]);

  const copyToClipboard = () => {
    const url = window.location.href; // Salin URL yang ada di browser
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9A25]"></div>
          <p className="text-gray-500 text-sm">Memuat invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-4 px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-700 font-semibold mb-2 text-lg">
            Invoice tidak ditemukan
          </p>
          <p className="text-gray-500 text-sm mb-4">
            {error ||
              "Data split bill mungkin sudah kedaluwarsa atau link tidak valid"}
          </p>
          <p className="text-xs text-gray-400 mb-4 font-mono bg-gray-100 px-3 py-2 rounded">
            Split ID: {splitId} | Member ID: {memberId}
          </p>
        </div>
        <button
          onClick={() => navigate("/app/splitbill")}
          className="px-6 py-3 bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] text-white rounded-xl font-semibold active:scale-95 transition-all"
        >
          Kembali ke Split Bill
        </button>
      </div>
    );
  }
  const memberTotal = invoice.totalDue || 0;
  const memberItems = invoice.myItems || [];
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const isPaid = invoice.status === "PAID";

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18l-6-6 6-6"
                stroke="#1F2937"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="flex-1 text-center">
            <div className="text-sm text-gray-900 font-semibold">
              Invoice Pembayaran
            </div>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="max-w-md w-full">
          {isPaid ? (
            <div className="bg-green-100 border-l-4 border-green-500 rounded-r-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="text-green-500 text-2xl">✅</div>
                <div>
                  <div className="font-bold text-green-900 text-sm">Lunas</div>
                  <div className="text-green-700 text-xs mt-1">
                    Anda sudah membayar tagihan ini.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-100 border-l-4 border-red-500 rounded-r-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="text-red-500 text-2xl">⚠️</div>
                <div>
                  <div className="font-bold text-red-900 text-sm">
                    Belum Dibayar
                  </div>
                  <div className="text-red-700 text-xs mt-1">
                    Anda masih memiliki tagihan untuk split bill ini
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-5 mb-6 border-2 border-orange-200">
              <div className="text-center">
                <div className="text-sm text-gray-600 font-medium mb-2">
                  Jumlah Pembayaran
                </div>
                <div className="text-4xl font-black text-orange-600 mb-1">
                  {currency(memberTotal)}
                </div>
                <div className="text-xs text-gray-500">Total tagihan Anda</div>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-sm font-bold text-gray-900 mb-3">
                💳 Bayar ke
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold"></div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {invoice.payTo?.userId || "Pembuat Bill"}
                    </div>
                    <div className="text-xs text-gray-600">
                      {invoice.payTo?.walletId || "Wallet ID"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ITEMS */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="text-sm font-bold text-gray-900 mb-3">
                🛒 Item Anda
              </div>
              <div className="space-y-2">
                {memberItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <span className="text-gray-700 font-medium">
                      {item.name}{" "}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {currency(item.price)}
                    </span>
                  </div>
                ))}
                {memberItems.length === 0 && (
                  <div className="text-sm text-gray-500 italic">
                    Tidak ada rincian item.
                  </div>
                )}
              </div>
            </div>

            {/* TODO: Tambahkan tombol Bayar di sini jika !isPaid */}
            {/* Tombol ini akan memanggil POST /pay-intent */}
            {!isPaid && (
              <button
                // onClick={handlePayIntent}
                className="w-full py-3.5 rounded-xl text-white font-semibold text-[14px] bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] hover:shadow-lg hover:shadow-[#FF9A25]/30 active:scale-[0.98] transition-all duration-200 mb-6"
              >
                Bayar Sekarang
              </button>
            )}
            <button
              onClick={copyToClipboard}
              className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition active:scale-95 ${
                copySuccess
                  ? "bg-green-100 border-2 border-green-500"
                  : "bg-gray-100 hover:bg-gray-200 border-2 border-gray-300"
              }`}
            >
              {copySuccess ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-green-700">
                    Link Berhasil Disalin!
                  </span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                      stroke="#1f2937"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                      stroke="#1f2937"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700">
                    Copy Link Invoice
                  </span>
                </>
              )}
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 space-y-1 bg-white rounded-xl p-4 shadow-sm">
            <div className="font-semibold text-gray-700">
              📄 {invoice.title}
            </div>
            <div>ID: {splitId.substring(0, 16)}...</div>
            <div>{dateStr}</div>
            <div className="text-[10px] text-gray-400 mt-2">
              Invoice ini valid sampai pembayaran selesai
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}