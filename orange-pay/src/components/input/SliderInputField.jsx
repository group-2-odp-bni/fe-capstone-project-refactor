import React from "react";
import clsx from "clsx";

export default function SliderInputField({
  id,
  name,
  label,
  value = 0,
  onChange,
  error,
  required = false,
  className,
  min = 0,
  max = 100,
  step = 1, // custom increment step
  showValue = true,
  ...props
}) {
  const handleValueChange = (newValue) => {
    const clamped = Math.min(Math.max(newValue, min), max); // enforce range limits
    onChange({ target: { name, value: clamped } });
  };

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

      {/* Numeric input field */}
      <div className="flex justify-center mb-3">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => handleValueChange(Number(e.target.value))}
          className={clsx(
            "w-full text-center border border-gray-300 rounded-lg py-1.5 px-2 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF9A25]",
            error && "border-red-500 focus:ring-red-500"
          )}
        />
      </div>

      {/* Slider container */}
      <div className="flex items-center gap-3">
        <input
          id={id || name}
          name={name || id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => handleValueChange(Number(e.target.value))}
          className={clsx(
            "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF9A25]",
            error && "accent-red-500"
          )}
          {...props}
        />

        {/* Value display (optional) */}
        {showValue && (
          <span className="text-gray-800 font-semibold w-10 text-right">
            {value}
          </span>
        )}
      </div>

      {/* Range info */}
      <div className="flex justify-between text-gray-400 text-[11px] mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 mt-1 text-center">{error}</p>}
    </div>
  );
}
