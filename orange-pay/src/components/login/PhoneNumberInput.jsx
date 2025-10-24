import React from "react";

export default function PhoneNumberInput({
  label = "No. Handphone :",
  phone,
  onChange,
  inputRef,
  err,
}) {
  return (
    <div className="w-full mt-6 mb-6">
      <label className="block text-sm text-gray-700 mb-1">{label}</label>
      <div className="flex">
        <span className="bg-[#FE9923] text-white px-4 rounded-l-md grid place-items-center text-sm">
          +62
        </span>
        <input
          ref={inputRef}
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="8xx xxxx xxxx"
          value={phone}
          onChange={onChange}
          className="flex-1 border border-[#FE9923] border-l-0 rounded-r-md px-3 py-2 outline-none focus:ring-2 focus:ring-[#FE9923]"
        />
      </div>
      {err && <p className="text-red-500 text-xs mt-1">{err}</p>}
    </div>
  );
}
