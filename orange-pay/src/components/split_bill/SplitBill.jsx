import { useState } from "react";
import Camera from "./CameraPage"; // Komponen kamera

export default function ReceiptUploadCard() {
  const [next, setNext] = useState(false);

  const handleClick = () => {
    // Langsung menuju halaman kamera tanpa upload file
    setNext(true);
  };

  // Jika sudah klik, langsung render CameraPage
  if (next) return <Camera />;

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      {/* Judul utama */}
      <h2 className="text-1xl font-semibold text-center text-gray-900 leading-snug mb-8">
        Mau patungan? Cukup foto bon, <br /> langsung kelar!
      </h2>

      {/* Kartu utama */}
      <button
        onClick={handleClick}
        className="w-full flex items-center p-4 bg-[#FAFAFA] rounded-[5px]
                   shadow-[0_4px_4px_rgba(0,0,0,0.25)]
                   transition-all duration-300 ease-out
                   hover:shadow-[0_6px_8px_rgba(0,0,0,0.3)] hover:-translate-y-[2px]
                   active:scale-[0.98] focus:outline-none mx-auto"
      >
        {/* Ikon kamera */}
        <div
          className="flex items-center justify-center w-9 h-9 bg-[#FAFAFA] rounded-full 
                     shadow-[0_3px_6px_rgba(0,0,0,0.15)] mr-3 shrink-0
                     transition-transform duration-300 ease-out hover:scale-105"
          style={{
            filter: "drop-shadow(0px 3px 3px rgba(0, 0, 0, 0.25))",
          }}
        >
          <img
            src="/camera-icon.svg"
            alt="Camera icon"
            className="w-5 h-5"
          />
        </div>

        {/* Teks */}
        <div className="flex flex-col text-left">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Hitung cepat pakai struk
          </h3>
          <p className="text-xs italic text-gray-600 leading-snug">
            Foto struk belanjamu, kami bantu hitung patungannya.
          </p>
        </div>
      </button>
    </div>
  );
}
