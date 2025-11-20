"use client";

import { useState, useEffect } from "react";
import Scanning from "./Scanning";
import { useOCRImage } from "../../hooks/api/useOCRImage";
import { useToast } from "../../context/ToastContext";

export default function NextStep({ image, onRetake, onConfirm }) {
  const { showToast } = useToast();
  const [confirmed, setConfirmed] = useState(false);
  const [imageAspect, setImageAspect] = useState(9 / 16);

  // Ambil SEMUA state dari hook, termasuk 'isError'
  const { processOCRAsync, ocrData, isSuccess, isError, ocrError } =
    useOCRImage();

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const aspect = img.width / img.height;
      setImageAspect(aspect || 9 / 16);
    };
    img.src = image;
  }, [image]);

  const handleRetake = () => {
    if (typeof onRetake === "function") onRetake();
    else if (typeof window !== "undefined") window.history.back();
  };

  // --- GANTI FUNGSI 'handleConfirm' DENGAN INI ---
  const handleConfirm = async () => {
    // 1. Tampilkan layar <Scanning /> SEKARANG
    setConfirmed(true);

    try {
      // 2. TUNGGU (await) sampai API call selesai
      const result = await processOCRAsync(image);

      // 3. API Sukses. Log dan panggil onConfirm untuk navigasi
      console.log("📦 OCR Result:", result);
      if (typeof onConfirm === "function") {
        onConfirm(result);
      }
    } catch (error) {
      // 4. API Gagal.
      console.error("OCR error:", error);
            showToast({
        type: "error",
        title: "Gagal memproses gambar",
        message: `Terjadi kesalahan saat memproses gambar : ${error.message}`
      });
      setConfirmed(false); // Sembunyikan lagi layar <Scanning />
    }
  };
  // --- AKHIR FUNGSI YANG DIGANTI ---

  if (confirmed) {
    // 'Scanning' sekarang HANYA jadi loader.
    // 'ocrData' dan 'isSuccess' akan di-pass, tapi komponen
    // 'onConfirm' di atas yang akan memicu navigasi.
    return (
      <Scanning
        image={image}
        ocrData={isSuccess ? ocrData : null}
        isError={isError}
        error={ocrError}
      />
    );
  }

  return (
    // ... sisa JSX Anda (<div>, <button>, <h1>, <img>, dll.)
    // tidak perlu diubah ...
    <div className="min-h-screen w-full bg-white flex flex-col relative overflow-hidden">
      <div className="relative z-30 px-4 sm:px-6 pt-6 pb-4 bg-white">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={handleRetake}
            aria-label="Retake"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center
                       bg-white border-2 border-gray-200 shadow-lg shadow-gray-300/30
                       hover:bg-gray-50 hover:scale-105 hover:border-gray-300
                       active:scale-95 transition-all duration-300 group"
            style={{ animation: "fadeInLeft 0.6s ease-out both" }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="transition-transform group-hover:-translate-x-0.5"
            >
              <path
                d="M15 6l-6 6 6 6"
                stroke="#1F2937"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <h1
            className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#FF9A25] to-[#FF7A25] bg-clip-text text-transparent"
            style={{ animation: "fadeInDown 0.6s ease-out 0.1s both" }}
          >
            Preview Foto
          </h1>

          <div className="w-11 h-11 sm:w-12 sm:h-12" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-6 relative z-10">
        <div
          className="w-full max-w-md rounded-3xl overflow-hidden relative border-2 border-gray-200 shadow-2xl shadow-gray-400/30"
          style={{
            aspectRatio: imageAspect,
            animation:
              "zoomIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both",
          }}
        >
          <img
            src={image}
            alt="Hasil tangkapan kamera"
            className="absolute inset-0 w-full h-full object-contain"
          />
          <div className="absolute inset-0 pointer-events-none">
            <svg
              className="absolute inset-4 w-[calc(100%-32px)] h-[calc(100%-32px)]"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                d="M 0,12 L 0,0 L 12,0"
                stroke="url(#gradient2)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 88,0 L 100,0 L 100,12"
                stroke="url(#gradient2)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 0,88 L 0,100 L 12,100"
                stroke="url(#gradient2)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 100,88 L 100,100 L 88,100"
                stroke="url(#gradient2)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient
                  id="gradient2"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#FF9A25" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#FFCE52" stopOpacity="0.6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      <div
        className="px-4 pb-6 pt-4 relative z-10"
        style={{ animation: "fadeInUp 0.6s ease-out 0.5s both" }}
      >
        <div className="max-w-md mx-auto">
          <button
            onClick={handleConfirm}
            className="w-full h-14 bg-gradient-to-r from-[#FF9A25] to-[#FF9A25]
                       hover:from-[#FF7A25] hover:to-[#FF9A25]
                       text-white font-bold text-base rounded-2xl
                       shadow-xl
                       hover:scale-[1.02] active:scale-[0.98]
                       transition-all duration-300 relative overflow-hidden group"
          >
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                           translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"
            />
            <span className="relative z-10 flex items-center justify-center gap-2">
              Pakai Foto Ini
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="transition-transform group-hover:translate-x-1"
              >
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
