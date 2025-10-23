"use client";

import { useState } from "react";
import Scanning from "./Scanning";

export default function NextStep({ image, onRetake, onConfirm }) {
  const [confirmed, setConfirmed] = useState(false);

  const handleRetake = () => {
    if (typeof onRetake === "function") onRetake();
    else if (typeof window !== "undefined") window.history.back();
  };

  const handleConfirm = () => {
    if (typeof onConfirm === "function") onConfirm(image);
    else setConfirmed(true); // tampilkan ResultPage tanpa routing
  };

  // Jika sudah dikonfirmasi, tampilkan halaman hasil
  if (confirmed) return <Scanning image={image} />;

  return (
    <div className="min-h-dvh w-full flex flex-col items-center text-white">

      {/* Preview */}
      <div className="w-full flex items-center justify-center mb-8 mt-6">
        <div className="w-full max-w-sm aspect-[9/16] rounded-2xl overflow-hidden relative shadow-[0_12px_40px_rgba(0,0,0,0.4)] sm:shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <img
            src={image}
            alt="Hasil tangkapan kamera"
            className="absolute inset-0 w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Action bar */}
      <div className="w-full pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <div className="max-w-sm mx-auto gap-3">
          {/* Tombol konfirmasi */}
          <button
            onClick={handleConfirm}
            className="w-full h-14 bg-[#FF9A25] hover:bg-[#FFB347]
                       text-white font-semibold text-base
                       rounded-full shadow-[0_4px_8px_rgba(0,0,0,0.15)]
                       active:scale-95 transition-all duration-200"
          >
            Pakai Foto Ini
          </button>
        </div>
      </div>
    </div>
  );
}