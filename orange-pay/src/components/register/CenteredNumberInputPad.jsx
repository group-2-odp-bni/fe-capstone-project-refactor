import React, { useState } from "react";
import { Delete } from "lucide-react";

export default function CenteredNumberInputPad() {
  const [value, setValue] = useState("");

  const handlePress = (num) => {
    if (value.length < 6) setValue((prev) => prev + num);
  };

  const handleDelete = () => {
    setValue((prev) => prev.slice(0, -1));
  };

  return (
    <div className="relative w-full h-dvh max-w-[393px] pb-6 rounded-[28px] flex flex-col justify-between overflow-y-auto overscroll-contain scroll-smooth">
      {/* Centered input field */}
      <div className="flex flex-col items-center justify-center flex-1">
        <label htmlFor="pin" className="text-gray-500 mb-3 text-base">
          Masukkan PIN Anda
        </label>

        <input
          id="pin"
          type="password"
          value={value}
          readOnly
          placeholder="••••••"
          className="text-4xl text-center tracking-[1rem] bg-transparent outline-none font-semibold text-gray-800 w-52"
        />
      </div>

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-y-4 text-center text-2xl font-medium text-gray-800 px-12 pb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handlePress(num.toString())}
            className="aspect-square rounded-full bg-gray-100 active:bg-gray-200 transition-all flex items-center justify-center"
          >
            {num}
          </button>
        ))}

        {/* Empty placeholder for alignment */}
        <div />

        {/* 0 button */}
        <button
          onClick={() => handlePress("0")}
          className="aspect-square rounded-full bg-gray-100 active:bg-gray-200 transition-all flex items-center justify-center"
        >
          0
        </button>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="aspect-square rounded-full bg-gray-100 active:bg-gray-200 transition-all flex items-center justify-center"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
