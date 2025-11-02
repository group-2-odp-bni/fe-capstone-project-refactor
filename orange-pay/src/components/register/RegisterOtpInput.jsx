import React from "react";

export default function RegisterOtpInput() {
  const [otp, setOtp] = useState("");
  const inputRef = useRef(null);

  const handleInput = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, length);
    setOtp(value);
    onChange && onChange(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Backspace") {
      setOtp((prev) => prev.slice(0, -1));
      onChange && onChange(otp.slice(0, -1));
    }
  };

  return (
    <div
      className="flex justify-center gap-2"
      onClick={() => inputRef.current.focus()}
    >
      {/* Visual boxes */}
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className={`w-10 h-12 border-2 rounded-lg flex items-center justify-center text-xl font-semibold ${
            i < otp.length
              ? "border-[#FF9A25] text-gray-900"
              : "border-gray-300 text-gray-400"
          }`}
        >
          {otp[i] || ""}
        </div>
      ))}

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoFocus
        value={otp}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        className="absolute opacity-0 pointer-events-none"
      />
    </div>
    );
}
