import React from "react";

export default function InputField({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  variant = "float", // "float" | "box" (fallback)
}) {
  if (variant === "float") {
    return (
      <div className="w-full">
        <div className="relative">
          <input
            id={id}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder=" " // penting untuk floating
            className="peer block w-full h-12 rounded-xl border border-slate-300 bg-white
                       px-4 pt-5 pb-2 text-base text-slate-800
                       shadow-[0_1px_0_rgba(2,6,23,.02)]
                       focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none"
          />
          <label
            htmlFor={id}
            className="pointer-events-none absolute left-4 top-2.5 text-slate-500 transition-all
                       peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base
                       peer-focus:top-1.5 peer-focus:text-xs
                       peer-[&:not(:placeholder-shown)]:top-1.5 peer-[&:not(:placeholder-shown)]:text-xs"
          >
            {label}
          </label>
        </div>
      </div>
    );
  }

  // fallback "box"
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm text-gray-600 mb-1">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 py-2 px-3"
      />
    </div>
  );
}
