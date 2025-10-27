import React from "react";

export default function PinKeypad({ onNumber, onDelete, onEnter, canEnter }) {
  return (
    <div className="w-full bg-white p-5 rounded-t-xl">
      <div className="grid grid-cols-3 gap-6 justify-items-center text-gray-800">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => onNumber(n)}
            className="w-20 h-20 flex items-center justify-center rounded-full bg-gray-100 text-2xl font-semibold shadow-lg hover:bg-gray-200 active:scale-95 transition-transform"
          >
            {n}
          </button>
        ))}

        {/* Enter */}
        <button
          onClick={onEnter}
          disabled={!canEnter}
          className={`w-20 h-20 flex items-center justify-center rounded-full text-2xl font-semibold shadow-lg active:scale-95 transition-transform
            ${
              canEnter
                ? "bg-[#305856] hover:bg-[#15555F] text-white"
                : "bg-gray-300 text-gray-600"
            }
          `}
          title={canEnter ? "Enter" : "Isi PIN 6 digit terlebih dahulu"}
        >
          ↩
        </button>

        {/* 0 */}
        <button
          onClick={() => onNumber(0)}
          className="w-20 h-20 flex items-center justify-center rounded-full bg-gray-100 text-2xl font-semibold shadow-lg hover:bg-gray-200 active:scale-95 transition-transform"
        >
          0
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="w-20 h-20 flex items-center justify-center rounded-full bg-gray-100 text-2xl font-semibold shadow-lg hover:bg-gray-200 active:scale-95 transition-transform"
          aria-label="Hapus"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
