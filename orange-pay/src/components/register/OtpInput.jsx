import React from "react";

export default function OtpInput({
  otp,
  inputRefs,
  isError,
  onChange,
  onKeyDown,
  onPaste,
}) {
  return (
    <div className="flex justify-center gap-3 mb-3" onPaste={onPaste}>
      {otp.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => (inputRefs.current[idx] = el)}
          value={digit}
          onChange={(e) => onChange(e.target.value.slice(-1), idx)}
          onKeyDown={(e) => onKeyDown(e, idx)}
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          aria-label={`Digit OTP ${idx + 1}`}
          className={`w-12 h-12 md:w-14 md:h-14 text-center text-xl rounded-lg
                      bg-white border ${
                        isError ? "border-red-500" : "border-gray-300"
                      }
                      focus:outline-none focus:border-[#1C6C79] text-black`}
        />
      ))}
    </div>
  );
}
