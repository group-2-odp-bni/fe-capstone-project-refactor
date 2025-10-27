export default function TopUpMethod({ onSelect, defaultMethod }) {
  const selectBNI = () =>
    onSelect?.({ code: "BNI_VA", name: "BNI Virtual Account" });

  return (
    <div className="p-4">
      <p className="text-sm text-gray-600 mb-4 font-semibold mb-6">
        Top Up di app orange-pay
      </p>

      <button
        onClick={selectBNI}
        className="w-full flex justify-between items-center p-4 gap-3 border border-gray-200 rounded-2xl bg-white shadow-sm 
                   transition-all duration-200 ease-in-out hover:shadow-md hover:border-orange-400 hover:bg-orange-50 active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <img
            src="/logo-bni-46.webp"
            alt="BNI 46"
            className="w-6 h-6 rounded-sm transition-transform duration-200 group-hover:scale-110"
          />
          <span className="font-medium text-gray-800 group-hover:text-orange-600">
            BNI Virtual Account
          </span>
        </div>
        <span className="text-gray-400 group-hover:text-orange-500">›</span>
      </button>

      {defaultMethod?.name && (
        <p className="text-xs text-gray-500 mt-3">
          Default: {defaultMethod.name}
        </p>
      )}
    </div>
  );
}
