import React from "react";

export default function PinDots({ length = 6, value = "" }) {
  return (
    <div className="flex gap-3">
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className={`w-4 h-4 rounded-full ${
            value.length > i
              ? "bg-orange-500"
              : "bg-white outline outline-2 outline-gray-400"
          }`}
        />
      ))}
    </div>
  );
}
