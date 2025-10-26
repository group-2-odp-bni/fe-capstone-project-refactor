"use client";
import { useMemo, useState, useEffect } from "react";
import EditRincian from "./EditRincian";
import CameraPage from "./CameraPage";

export default function ReceiptResult({
  receiptData,
  onBack,
  onConfirm,
}) {
  const [showEditPage, setShowEditPage] = useState(false);
  const [showCameraPage, setShowCameraPage] = useState(false);
  const [showImagePopup, setShowImagePopup] = useState(false); // ✅ New: Image popup state
  const [imageAspect, setImageAspect] = useState(9 / 16);

  const [editableData, setEditableData] = useState(receiptData);
  const [splitName, setSplitName] = useState(
    editableData?.splitName || editableData?.merchantName || ""
  );

  const receiptImage = editableData?.imageUrl || receiptData?.imageUrl || null;

  // Calculate actual image aspect ratio
  useEffect(() => {
    if (receiptImage) {
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        setImageAspect(aspect || 9 / 16);
      };
      img.src = receiptImage;
    }
  }, [receiptImage]);

  // ✅ Prevent body scroll when popup is open
  useEffect(() => {
    if (showImagePopup) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showImagePopup]);

  const fmt = (n) => Number(n || 0).toLocaleString("id-ID");

  const items = editableData?.items || [];
  const subtotal = useMemo(
    () => items.reduce((s, it) => s + Number(it.total || 0), 0),
    [items]
  );
  const pajak = Number(editableData?.pajak ?? 0);
  const service = Number(editableData?.service ?? 0);
  const discount = Number(editableData?.discount ?? 0);
  const other = Number(editableData?.other ?? 0);
  const total = subtotal + pajak + service + discount + other;

  const handleProceed = () => {
    onConfirm?.({ splitName, subtotal, total, receiptData: editableData });
  };

  // Edit handlers
  const handleEdit = () => setShowEditPage(true);
  const handleSaveEdit = (updatedData) => {
    setEditableData(updatedData);
    setShowEditPage(false);
  };
  const handleBackFromEdit = () => setShowEditPage(false);

  // Retake handlers
  const handleRetake = () => setShowCameraPage(true);
  const handleCameraDone = (newImageUrl) => {
    if (newImageUrl) {
      setEditableData((prev) => ({ ...prev, imageUrl: newImageUrl }));
    }
    setShowCameraPage(false);
  };
  const handleCameraBack = () => setShowCameraPage(false);

  // ✅ Image popup handlers
  const handleImageClick = () => setShowImagePopup(true);
  const handleClosePopup = () => setShowImagePopup(false);

  // Routing
  if (showCameraPage) {
    return <CameraPage onBack={handleCameraBack} onDone={handleCameraDone} />;
  }
  if (showEditPage) {
    return (
      <EditRincian
        receiptData={editableData}
        onBack={handleBackFromEdit}
        onSave={handleSaveEdit}
      />
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full flex items-center justify-center 
                         hover:bg-gray-100 active:scale-95 transition"
              aria-label="Kembali"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="#1F2937" strokeWidth="2" 
                      strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-800">Split Bill</h1>
            <div className="w-10" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-4 py-6">
          <div className="max-w-2xl mx-auto space-y-6">

            {/* Nama Split Bill */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <label className="text-sm font-semibold text-gray-800 block mb-2">
                Nama Split Bill
              </label>
              <input
                type="text"
                value={splitName}
                onChange={(e) => setSplitName(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 
                           text-gray-900
                           focus:outline-none focus:ring-2 focus:ring-[#FF9A25]/30 
                           focus:border-[#FF9A25]"
              />
            </div>

            {/* Struk berhasil di-scan */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="font-semibold text-gray-800 mb-1">
                Struk berhasil di-scan
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Klik gambar di bawah buat liat foto struk lebih jelas
              </p>

              <div className="mt-4 flex items-center justify-center gap-6">
                {/* ✅ Thumbnail - Opens popup instead of new tab */}
                {receiptImage ? (
                  <button
                    type="button"
                    onClick={handleImageClick}
                    className="rounded-md overflow-hidden shadow-md hover:shadow-lg 
                               hover:scale-105 active:scale-95 transition-all duration-200"
                    style={{
                      width: '80px',
                      aspectRatio: imageAspect,
                    }}
                  >
                    <img 
                      src={receiptImage}
                      alt="Struk" 
                      className="w-full h-full object-cover"
                    />
                  </button>
                ) : (
                  <div 
                    className="rounded-xl bg-gray-100 flex items-center justify-center"
                    style={{
                      width: '80px',
                      aspectRatio: '9 / 16',
                    }}
                  >
                    <span className="text-xs text-gray-400">No Image</span>
                  </div>
                )}

                {/* Foto ulang button */}
                {/* Foto ulang button */}
<button
  type="button"
  onClick={handleRetake}
  className="inline-flex items-center gap-2 px-4 h-10 rounded-xl 
             bg-white border border-gray-200
             shadow-[0_4px_0_rgba(0,0,0,0.06)] hover:shadow-md 
             active:translate-y-[1px] transition-all"
>
  {/* pakai file .svg dari folder public */}
  <img
    src="/camera-icon.svg"
    alt="Ikon kamera"
    className="w-[18px] h-[18px]"
  />
  <span className="font-semibold text-sm text-gray-800">Foto ulang</span>
</button>

              </div>
            </div>

            {/* Items + Ringkasan */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              {/* Items */}
              <div className="space-y-3 mb-4">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <p className="flex-1 pr-2 text-gray-900 font-semibold uppercase 
                                 tracking-wide text-[13px] leading-tight">
                      {it.name}
                    </p>
                    <span className="w-12 shrink-0 text-right text-gray-700 
                                   font-medium tabular-nums">
                      x{it.quantity}
                    </span>
                    <span className="w-24 shrink-0 text-right text-gray-800 
                                   font-semibold tabular-nums">
                      {fmt(it.total)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="space-y-2 text-sm">
                <Row label="Subtotal" value={fmt(subtotal)} />
                <Row label="Pajak" value={fmt(pajak)} hideIfZero />
                <Row label="Servis" value={fmt(service)} hideIfZero />
                <Row 
                  label="Diskon" 
                  value={fmt(discount)} 
                  hideIfZero 
                  valueClass={discount < 0 ? "text-red-600" : ""} 
                />
                <Row 
                  label="Lainnya" 
                  value={fmt(other)} 
                  hideIfZero 
                  valueClass={other < 0 ? "text-red-600" : ""} 
                />

                <p className="text-[#FF9A25] text-xs italic pt-1">
                  Pastikan jumlah sudah benar
                </p>

                <div className="flex justify-between items-center pt-3 border-t-2 
                              border-gray-200 font-bold text-base">
                  <span className="text-gray-900">Jumlah Total</span>
                  <span className="text-[#FF9A25] text-lg">{fmt(total)}</span>
                </div>

                {/* Ubah Rincian */}
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="w-full h-11 rounded-xl bg-white border border-gray-200
                               shadow-[0_4px_0_rgba(0,0,0,0.06)] hover:shadow-md
                               active:translate-y-[1px] transition-all 
                               flex items-center justify-center gap-2"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M12 20h9" stroke="#FF9A25" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M16.5 3.5a2.121 2.121 0 013 3L8 18l-4 1 1-4 11.5-11.5z"
                            stroke="#FF9A25" strokeWidth="2" strokeLinecap="round" 
                            strokeLinejoin="round"/>
                    </svg>
                    <span className="font-semibold text-gray-800">Ubah Rincian</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 px-4 py-4 sticky bottom-0">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleProceed}
              className="w-full py-4 rounded-xl text-white font-semibold
                         bg-gradient-to-r from-[#FF9A25] to-[#FF7A25]
                         hover:shadow-lg hover:shadow-[#FF9A25]/30
                         active:scale-[0.98] transition-all duration-200"
            >
              Lanjut ke Split Bill
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Image Popup Modal */}
      {showImagePopup && receiptImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center 
                     bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={handleClosePopup}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] mx-4"
            onClick={(e) => e.stopPropagation()} // Prevent close when clicking image
          >
            {/* Close button */}
            <button
              onClick={handleClosePopup}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full 
                         bg-white/10 hover:bg-white/20 backdrop-blur-md
                         flex items-center justify-center transition-all
                         active:scale-95"
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 6L18 18M6 18L18 6" stroke="white" strokeWidth="2.5" 
                      strokeLinecap="round"/>
              </svg>
            </button>

            {/* Image */}
            <img 
              src={receiptImage}
              alt="Struk Detail"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              style={{ animation: 'zoomIn 0.3s ease-out' }}
            />
          </div>
        </div>
      )}

      {/* ✅ Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}

/* Row component */
function Row({ label, value, valueClass = "", hideIfZero = false }) {
  const numeric = Number(String(value).replace(/[^\d-]/g, "")) || 0;
  if (hideIfZero && numeric === 0) return null;
  return (
    <div className="flex justify-between text-gray-700">
      <span>{label}</span>
      <span className={`tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}
