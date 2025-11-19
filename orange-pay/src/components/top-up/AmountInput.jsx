import React, { useState, useEffect } from "react";

export default function AmountInput({
  label = "",
  prefix = "Rp",
  value,
  onChange,       // Parent gets raw numeric value (e.g. 10000)
  min = 10000,    // Default minimum
  max,            // Optional max limit
  id = "amount-input",
}) {
  const [display, setDisplay] = useState("");
  const [error, setError] = useState("");

  // Format number nicely (e.g. 10000 → 10,000)
  const formatNumber = (num) =>
    num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Sync display with prop value
  useEffect(() => {
    if (value !== undefined && value !== null && !Number.isNaN(value)) {
      setDisplay(formatNumber(value));
    }
  }, [value]);

  // Handle user typing
  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, ""); // only digits
    setDisplay(formatNumber(raw));

    const numericValue = Number(raw);
    if (Number.isNaN(numericValue)) {
      setError("Invalid number");
    } else if (min && numericValue < min) {
      setError(`Minimum topup is Rp${formatNumber(min)}`);
    } else if (max && numericValue > max) {
      setError(`Maximum topup is Rp${formatNumber(max)}`);
    } else {
      setError("");
    }

    onChange?.(numericValue); // send back raw number
  };

  // Handle Enter key to confirm amount
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!error && value >= min) {
        // Optionally trigger form submit
        e.target.blur();
      }
    }
  };

  return (
    <div className="w-full">
      {/* Label */}
      <label
        htmlFor={id}
        className="block mt-6 mb-2 text-sm font-medium text-gray-700"
      >
        {label}
      </label>

      {/* Input wrapper */}
      <div className="relative mb-1">
        {prefix && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-semibold select-none">
            {prefix}
          </span>
        )}

        <input
          id={id}
          type="tel"
          inputMode="numeric"
          placeholder="0"
          value={display}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full border-b transition pb-1 pl-12 text-3xl font-semibold tracking-tight outline-none appearance-none bg-transparent ${
            error
              ? "border-red-400 focus:border-red-500"
              : "border-gray-200 focus:border-gray-400"
          }`}
        />
      </div>

      {/* Error message */}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-500 mt-4 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
