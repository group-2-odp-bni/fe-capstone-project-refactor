
import React from "react";
import clsx from "clsx";

export default function OtpInputField({
  id,
  name,
  label,
  value = "",
  onChange,
  error,
  required = false,
  className,
  length = 6, // number of boxes
  ...props
}) {
  const chars = value.split("").slice(0, length);
  const emptySlots = Array(length - chars.length).fill("");

  return (
    <div className={clsx("w-full text-xs", className)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id || name}
          className="block font-medium text-gray-700 mb-2"
        >
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}

      {/* Visual boxes */}
      <div
        className="flex justify-center gap-3 cursor-text"
        onClick={() => document.getElementById(id || name)?.focus()}
      >
        {[...chars, ...emptySlots].map((char, index) => (
          <div
            key={index}
            className={clsx(
              "w-12 h-14 rounded-lg border text-2xl font-semibold flex items-center justify-center",
              "transition-colors duration-150",
              char
                ? "border-[#FF9A25] text-gray-900"
                : "border-gray-300 text-gray-400",
              error && "border-red-500"
            )}
          >
            {char || ""}
          </div>
        ))}
      </div>

      {/* Hidden actual input */}
      <input
        id={id || name}
        name={name || id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={length}
        value={value}
        onChange={(e) => {
          const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, length);
          onChange({ target: { name, value: digitsOnly } });
        }}
        required={required}
        className="opacity-0 absolute pointer-events-none"
        {...props}
      />

      {/* Error Message */}
      {error && <p className="text-red-500 mt-1 text-center">{error}</p>}
    </div>
  );
}
