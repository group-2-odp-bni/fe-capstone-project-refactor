// src/components/account/AccountGeneralInput.jsx
import React from "react";
import clsx from "clsx";

/**
 * Controlled input that forwards a native event by default,
 * but also supports callers that expect (name, value) or (value).
 */
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
  // ensure controlled input always receives string (prevents caret/focus issues)
  const safeValue = value ?? "";

  // Normalize and forward change events in multiple shapes:
  // - default: forward native event -> onChange(event)
  // - if parent expects (name, value): we also call onChange(name, value)
  // - if parent expects just value: we also call onChange(value)
  const handleChange = (e) => {
    if (!onChange) return;

    // always forward the native event first (preferred)
    try {
      onChange(e);
    } catch (err) {
      // swallow - still try other shapes below
    }

    const val = e?.target?.value;
    const fieldName = e?.target?.name || id || name;

    // call fallback shapes if the parent relies on them
    try {
      // onChange(name, value)
      onChange(fieldName, val);
    } catch (err) {
      // ignore
    }

    try {
      // onChange(value)
      onChange(val);
    } catch (err) {
      // ignore
    }
  };

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
        value={safeValue}
        onChange={handleChange}
        required={required}
        readOnly={readOnly}
        className={clsx(
          "mb-4 w-full text-gray-800 border border-gray-200 rounded-lg p-3",
          "focus:outline-none focus:border-[#FF9A25] focus:ring-1 focus:ring-[#FF9A25]",
          // remove always cursor-default; show text cursor when editable
          !readOnly ? "cursor-text bg-white" : "cursor-default bg-gray-50",
          "transition-all",
          error && "border-red-500 focus:ring-red-500 focus:border-red-500"
        )}
        {...props}
      />

      {/* Error */}
      {error && <p className="text-red-500 mt-1 text-sm">{error}</p>}
    </div>
  );
}
