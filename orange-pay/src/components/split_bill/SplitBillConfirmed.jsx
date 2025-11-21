import { useState, useRef } from "react";
import { toPng } from "html-to-image";
import { useNavigate } from "react-router-dom";
import Header from "../Header";
import View from "../view/View";

export default function SplitBillConfirmed({
  data,
  onRefresh,
  onMarkPaid,
  onBackToHome,
}) {
  const receiptRef = useRef(null);
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    title: "",
    message: "",
    type: "success",
  });

  const [confirmModal, setConfirmModal] = useState({
    show: false,
    memberId: null,
    memberName: "",
  });

  const showToast = (title, message, type = "success") => {
    setToast({ show: true, title, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3500);
  };

  const currency = (n) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n || 0);

  const handleDownload = async () => {
    if (isDownloading || !receiptRef.current) return;
    setIsDownloading(true);

    try {
      await new Promise((r) => setTimeout(r, 500));
      const dataUrl = await toPng(receiptRef.current, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `Tagihan-${data.title || "SplitBill"}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Berhasil!", "Gambar struk telah disimpan.", "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal", "Tidak dapat menyimpan gambar.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const onVerifyClick = (memberId, currentStatus, memberName) => {
    if (currentStatus === "PAID" || updating) return;
    setConfirmModal({ show: true, memberId, memberName });
  };

  const executeMarkPaid = async () => {
    if (!confirmModal.memberId) return;

    setUpdating(true);
    setConfirmModal((prev) => ({ ...prev, show: false })); // Tutup modal

    try {
      await onMarkPaid([confirmModal.memberId]);
      showToast(
        "Sukses",
        `Status pembayaran ${confirmModal.memberName} diperbarui.`,
        "success"
      );
    } catch (err) {
      showToast("Gagal", err.message || "Gagal update status.", "error");
    } finally {
      setUpdating(false);
      setConfirmModal({ show: false, memberId: null, memberName: "" });
    }
  };

  const ownerId = data.creatorUserId;
  const totalAmount = data.totals.total;
  const paidAmount = data.totals.paidTotal;
  const progressPercent =
    totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  return (
    <View>
      <div
        className={`fixed top-6 left-0 right-0 z-[100] flex justify-center px-4 transition-all duration-500 ease-in-out pointer-events-none ${
          toast.show ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0"
        }`}
      >
        <div
          className={`bg-white shadow-2xl border border-gray-100 rounded-2xl p-4 flex items-start gap-4 max-w-sm w-full pointer-events-auto ${
            toast.type === "error"
              ? "border-l-4 border-l-red-500"
              : "border-l-4 border-l-green-500"
          }`}
        >
          <div
            className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === "error"
                ? "bg-red-100 text-red-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            {toast.type === "error" ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm text-gray-900">{toast.title}</h4>
            <p className="text-xs text-gray-500 mt-1">{toast.message}</p>
          </div>
        </div>
      </div>

      {confirmModal.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() =>
              setConfirmModal({ show: false, memberId: null, memberName: "" })
            }
          ></div>

          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 relative z-10 scale-100 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-orange-500"
              >
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
              Konfirmasi Pembayaran
            </h3>
            <p className="text-gray-500 text-sm mb-6 text-center leading-relaxed">
              Apakah Anda yakin ingin menandai tagihan{" "}
              <b>{confirmModal.memberName}</b> sebagai lunas secara manual?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setConfirmModal({
                    show: false,
                    memberId: null,
                    memberName: "",
                  })
                }
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={executeMarkPaid}
                className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition shadow-lg"
              >
                Ya, Lunas
              </button>
            </div>
          </div>
        </div>
      )}

      <Header title ="Rincian Tagihan"/>

      <div className="flex-1 p-4 overflow-y-auto pb-24">
        <div className="max-w-md mx-auto space-y-5">
          <div
            ref={receiptRef}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative"
            style={{ backgroundColor: "#ffffff" }}
          >
            {/* Header Struk */}
            <div className="bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] p-6 text-white text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-1">{data.title}</h2>
                <div className="text-orange-50 text-sm mb-4 opacity-90">
                  Dibuat oleh Kamu
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 inline-block min-w-[180px]">
                  <div className="text-xs text-orange-50 mb-1 uppercase tracking-wider">
                    Total Terkumpul
                  </div>
                  <div className="text-2xl font-black">
                    {currency(paidAmount)}
                    <span className="text-sm font-normal opacity-70">
                      {" "}
                      / {currency(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Body Struk */}
            <div className="p-5">
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs mb-2 font-medium text-gray-500">
                  <span>Progress Pembayaran</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FF9A25] transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* List Member */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Daftar Anggota ({data.members.length})
                </h3>

                {data.members.map((m) => {
                  const isPaid = m.status === "PAID";
                  const isMe = m.memberId === ownerId;

                  return (
                    <div
                      key={m.memberId}
                      className="flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                            isPaid
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {m.initial}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-800 flex items-center gap-1">
                            {m.name}
                            {isMe && (
                              <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">
                                KAMU
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 font-medium">
                            {currency(m.amount)}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          onVerifyClick(m.memberId, m.status, m.name)
                        }
                        disabled={isPaid || updating}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                          isPaid
                            ? "bg-green-50 text-green-600 cursor-default"
                            : isMe
                            ? "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
                            : "bg-orange-50 text-[#FF9A25] hover:bg-[#FF9A25] hover:text-white border border-orange-100 cursor-pointer"
                        }`}
                      >
                        {isPaid ? (
                          <>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="4"
                            >
                              <path
                                d="M20 6L9 17l-5-5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            LUNAS
                          </>
                        ) : isMe ? (
                          "Verifikasi"
                        ) : (
                          "Tandai Lunas"
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-4 border-t border-dashed border-gray-200 text-center">
                <p className="text-[10px] text-gray-400">
                  ID Tagihan: {data.billId.substring(0, 8)}... <br />
                  Terima kasih telah menggunakan OrangePay
                </p>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-[radial-gradient(circle,transparent_50%,#ffffff_50%)] bg-[length:10px_10px] rotate-180"></div>
            <button
              onClick={() => navigate("/app/splitbill")}
              className="w-full py-3 rounded-xl border border-orange-200 text-orange-600 font-semibold text-sm hover:bg-orange-50 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              Kembali ke Daftar Bill
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t border-gray-200 flex justify-center z-20">
        <div className="flex gap-3 w-full max-w-md">
          <button
            onClick={onRefresh}
            className="px-4 py-3.5 bg-gray-100 rounded-xl text-gray-600 font-semibold active:scale-95 transition"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 py-3.5 bg-gray-900 text-white rounded-xl font-bold shadow-lg active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isDownloading ? (
              "Menyimpan..."
            ) : (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Simpan Struk
              </>
            )}
          </button>
        </div>
      </div>
    </View>
  );
}
