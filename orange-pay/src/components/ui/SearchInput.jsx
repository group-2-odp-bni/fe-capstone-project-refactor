// src/components/ui/SearchInput.jsx
import React from "react";

/**
 * Reusable search input with built-in icon.
 * Calls onChange(newValue) directly — not the DOM event.
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = "Search name or phone (e.g. 0812...)",
  inputMode = "tel",
}) {
  const handleChange = (e) => {
    if (typeof onChange === "function") {
      onChange(e.target?.value ?? "");
    }
  };

  return (
    <div className="mb-5 px-4">
      <div className="relative">
        {/* Search icon */}
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 21l-4.35-4.35"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="11"
              cy="11"
              r="6"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </span>

        {/* Input field */}
        <input
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-100"
          inputMode={inputMode}
        />
      </div>
    </div>
  );
}
