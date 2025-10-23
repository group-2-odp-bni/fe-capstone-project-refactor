import React, { useState } from "react";
import { Delete } from "lucide-react";

export default function NumberPad() {
  const [value, setValue] = useState("");

  const handlePress = (num) => {
    if (value.length < 6) setValue((prev) => prev + num);
  };

  const handleDelete = () => {
    setValue((prev) => prev.slice(0, -1));
  };

  return (
    <div className="relative w-full h-dvh max-w-[393px] bg-white pb-4 rounded-[28px] shadow-[0_20px_60px_rgba(2,6,23,.18)] ring-1 ring-black/10 flex flex-col justify-between overflow-y-auto overscroll-contain scroll-smooth">
      {/* Input display */}
      <div className="flex flex-col items-center justify-center flex-1">
        <input
          type="password"
          value={value}
          readOnly
          className="text-4xl tracking-[1rem] text-center outline-none bg-transparent font-semibold"
        />
      </div>

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-y-3 text-center text-2xl font-medium text-gray-800 px-12 pb-4">
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
