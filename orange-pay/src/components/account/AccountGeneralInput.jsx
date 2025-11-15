import React from "react";
import clsx from "clsx";

export default function InputField({
  id,
  name,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  className,
  required = false,
  readOnly = false,
  ...props
}) {
  return (
    <div className={clsx("w-full text-base", className)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id || name}
          className="block text-sm font-medium text-gray-600 mb-1"
        >
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}

      {/* Input */}
      <input
        id={id || name}
        name={name || id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        readOnly={readOnly}
        className={clsx(
          "mb-4 w-full bg-gray-50 text-gray-800 border border-gray-200 rounded-lg p-3",
          "focus:outline-none focus:border-[#FF9A25] focus:ring-1 focus:ring-[#FF9A25]",
          "transition-all cursor-default",
          error && "border-red-500 focus:ring-red-500 focus:border-red-500",
          !readOnly && "cursor-text bg-white"
        )}
        {...props}
      />

      {/* Error */}
      {error && (
        <p className="text-red-500 mt-1 text-sm">{error}</p>
      )}
    </div>
  );
}
