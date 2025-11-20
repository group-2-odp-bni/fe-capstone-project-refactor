import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBillMember } from "../hooks/useSplitbill";
import PaymentModal from "../components/ui/transfer/PaymentSplitBillModal";

// create struck
import { applyWatermarkPattern } from "../util/createStuck/applyWatermark";
import { downloadCanvas } from "../util/createStuck/downloadCanvas";
import { htmlToCanvas } from "../util/createStuck/htmlToCanvas";

export default function SplitBillMemberPage() {
  const { id: splitId, memberId } = useParams();
  const navigate = useNavigate();
  const receiptRef = useRef(null);
  const { showToast } = useToast();

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const {
    data: invoice,
    loading,
    error,
    refetch,
  } = useBillMember(splitId, memberId);

  const [downloading, setDownloading] = useState(false);

  const currency = (n) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n || 0);


  const handleDownloadStruk = async () => {
    setDownloading(true);
    // init struck canvas
    const canvas = await htmlToCanvas(receiptRef.current);

    // apply pattern
    await applyWatermarkPattern(
      canvas,
      "/Orangepay.svg"
    );

    // download
    downloadCanvas(canvas, "struk.png");
    setDownloading(false);
  };


  const handleFinish = () => {
    navigate("/app/splitbill");
  };
  const handlePaymentSuccess = () => {
    setIsPaymentOpen(false);
    refetch();
    setShowSuccess(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#FF9A25]" />
          <p className="text-gray-500 text-sm font-medium">Memuat tagihan...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-4 px-4">
        <div className="text-6xl mb-2">🙈</div>
        <h2 className="text-xl font-bold text-gray-800">Akses Ditolak</h2>
        <p className="text-gray-500 text-center max-w-xs">
          {error || "Data tidak ditemukan."}
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-gray-100 rounded-lg font-medium text-sm"
        >
          Kembali ke Home
        </button>
      </div>
    );
  }

  const isPaid = invoice.status === "PAID";
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col relative">
      {showSuccess && (
        <div className="fixed inset-0 z-[99] bg-white flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          {/* Icon Centang Animasi */}
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-100">
            <svg
              className="w-12 h-12 text-green-600 animate-bounce"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">
            Pembayaran Berhasil!
          </h2>

          <p className="text-gray-500 text-center text-sm mb-8 max-w-xs leading-relaxed">
            Pembayaran kamu sebesar{" "}
            <span className="font-bold text-gray-900">
              {currency(invoice.totalDue)}
            </span>{" "}
            telah berhasil diverifikasi.
          </p>
          <div className="w-full max-w-xs space-y-3">
            <button
              onClick={handleFinish}
              className="w-full py-4 bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] text-white font-bold rounded-xl shadow-lg shadow-orange-200 active:scale-95 transition-all"
            >
              Selesai & Kembali
            </button>
          </div>
        </div>
      )}

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        invoice={invoice}
      />

      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <button
            onClick={() => navigate("/")}
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
              Invoice Personal
            </div>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-6 pb-24">
        {" "}
        <div className="max-w-md w-full space-y-6">
          {isPaid ? (
            <div className="bg-green-100 border-l-4 border-green-500 rounded-r-lg p-4">
              <div className="flex items-center gap-3">
                <div className="text-green-600 text-xl">✅</div>
                <div>
                  <div className="font-bold text-green-900 text-sm">LUNAS</div>
                  <div className="text-green-700 text-xs">
                    Tagihan ini sudah lunas.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-100 border-l-4 border-red-500 rounded-r-lg p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="text-red-500 text-2xl">⚠️</div>
                <div>
                  <div className="font-bold text-red-900 text-sm">
                    Belum Dibayar
                  </div>
                  <div className="text-red-700 text-xs mt-1">
                    Segera selesaikan pembayaranmu.
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            id="capture"
            ref={receiptRef}
            className="bg-white p-6 border border-dashed border-gray-100 rounded-lg"
            style={{
              backgroundColor: "#ffffff",
              color: "#1f2937",
              borderColor: "#e5e7eb",
            }}
          >
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF9A25] to-[#FF7A25] flex items-center justify-center text-white text-xl font-bold shadow-md">
                {invoice.memberProfile?.initial || "?"}
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {invoice.memberProfile?.name}
                </div>
                <div className="text-sm text-gray-500">
                  {invoice.memberProfile?.phone || "Member"}
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-xl p-5 mb-6 border border-orange-100 text-center">
              <div className="text-sm text-gray-600 font-medium mb-1">
                Total Tagihan
              </div>
              <div className="text-3xl font-black text-orange-600">
                {currency(invoice.totalDue)}
              </div>
              <div className="text-[10px] text-gray-400 mt-2">
                {invoice.title} • {dateStr}
              </div>
            </div>

            <div className="mb-6">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Rincian Item
              </div>
              <div className="space-y-3">
                {invoice.myItems.length === 0 && (
                  <div className="text-sm text-gray-400 italic">
                    Tidak ada item.
                  </div>
                )}
                {invoice.myItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.name}{" "}
                      <span className="text-gray-400">x{item.qty || 1}</span>
                    </span>
                    <span className="font-semibold text-gray-900">
                      {currency(
                        item.line_subtotal_rp ||
                        item.total ||
                        item.price * (item.qty || 1)
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-2">
              {invoice.feesShare?.tax > 0 && (
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Pajak</span>
                  <span>{currency(invoice.feesShare.tax)}</span>
                </div>
              )}
              {invoice.feesShare?.service > 0 && (
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Layanan</span>
                  <span>{currency(invoice.feesShare.service)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-200 mt-2">
                <span>Total Bayar</span>
                <span className="text-orange-600">
                  {currency(invoice.totalDue)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleDownloadStruk}
            disabled={downloading}
            className="w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition active:scale-95 text-gray-700 font-medium text-sm"
          >
            {downloading ? (
              "Memproses..."
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 10l5 5 5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 15V3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Download Struk
              </>
            )}
          </button>

          <div className="text-center text-xs text-gray-400 pb-4">
            Invoice valid sampai lunas
          </div>
        </div>
      </div>

      {!isPaid && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 flex justify-center">
          <div className="max-w-md w-full">
            <button
              onClick={() => setIsPaymentOpen(true)}
              className="w-full py-4 bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] text-white rounded-xl font-bold text-lg shadow-lg shadow-orange-200 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>💸</span> Bayar Sekarang
            </button>
          </div>
        </div>
      )}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        invoice={invoice}
      />
    </div>
  );
}
