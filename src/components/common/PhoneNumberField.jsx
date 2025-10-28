import React from "react";

export default function PhoneNumberField({ value, error, onChange }) {
  return (
    <div className="w-full">
      <div className="relative">
        <span
          className="absolute left-1.5 top-1.5 z-10
                         bg-orange-500 text-white text-sm font-semibold
                         rounded-lg px-3 h-8 grid place-items-center select-none"
        >
          +62
        </span>

        <input
          type="tel"
          name="phoneNumber"
          value={value}
          onChange={onChange}
          placeholder=" "
          className={`peer w-full h-12 rounded-xl border ${
            error ? "border-red-500" : "border-slate-300"
          } bg-white text-slate-800 text-base
                     pl-16 pr-4 pt-5 pb-2
                     shadow-[0_1px_0_rgba(2,6,23,.02)]
                     focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none`}
          required
        />

        <label
          className="pointer-events-none absolute left-16 top-2.5 text-slate-500 transition-all
                     peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base
                     peer-focus:top-1.5 peer-focus:text-xs
                     peer-[&:not(:placeholder-shown)]:top-1.5 peer-[&:not(:placeholder-shown)]:text-xs"
        >
          Nomor Telepon
        </label>
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
