export default function Toast({ toast }) {
  const isError = toast.type === "error";
  const isSuccess = toast.type === "success";

  return (
    <div
      className={`fixed top-6 left-0 right-0 z-[100] flex justify-center px-4 transition-all duration-500 ease-in-out pointer-events-none
        ${toast.show ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0"}
      `}
    >
      <div
        className={`
          bg-white/95 backdrop-blur shadow-2xl border rounded-2xl p-4 flex items-start gap-4 max-w-sm w-full pointer-events-auto
          ${isError ? "border-l-4 border-l-red-500" : ""}
          ${isSuccess ? "border-l-4 border-l-emerald-500" : ""}
        `}
      >
        {/* Icon */}
        <div
          className={`
            mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0
            ${isError ? "bg-red-100 text-red-600" : ""}
            ${isSuccess ? "bg-emerald-100 text-emerald-600" : ""}
          `}
        >
          {isError ? (
            // Icon error (X)
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            // Icon sukses (check)
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
        </div>

        {/* Text */}
        <div className="flex-1">
          <h4 className="font-bold text-sm text-gray-900">
            {toast.title}
          </h4>
          {toast.message && (
            <p className="text-xs text-gray-500 mt-1">
              {toast.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
