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
  ...props
}) {
  return (
    <div className={clsx("w-full text-sm", className)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id || name}
          className="block text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}

      {/* Input Field */}
      <input
        id={id || name}
        name={name || id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={clsx(
          "mt-1 block w-full rounded-md border border-gray-300",
          "px-3 py-2 shadow-sm focus:border-[#FF9A25]",
          "focus:ring-[#FF9A25] focus:outline-none transition",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500"
        )}
        {...props}
      />

      {/* Error Message */}
      {error && (
        <p className="text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
