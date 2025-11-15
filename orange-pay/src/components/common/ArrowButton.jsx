export default function ExpandArrowButton({ onClick, rotated = false }) {
  return (
    <div className="w-full flex justify-center mt-2 mb-3">
      <button
        type="button"
        onClick={onClick}
        aria-label="Lihat riwayat transaksi"
        className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FF9A25"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-7 h-7 transition-transform duration-300 ${
            rotated ? "rotate-180" : ""
          }`}
        >
          <path d="M12 3v13m0 0l-5-5m5 5l5-5" />
        </svg>
      </button>
    </div>
  );
}
