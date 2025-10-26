export default function Logo({ size = 10, titleClass = "" }) {
  const sizeClass = `h-${size} w-${size}`;

  return (
    <div className="w-full flex items-center justify-center gap-2">
      <img
        src="/logo512.png"
        alt="Orange"
        className={`${sizeClass} object-contain inline-block align-middle`}
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
      <span
        className={`inline-block align-middle text-slate-800 font-extrabold tracking-wide
                    text-2xl sm:text-3xl ${titleClass}`}
      >
        RANGE-PAY
      </span>
    </div>
  );
}
