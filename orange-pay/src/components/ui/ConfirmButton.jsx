export default function ConfirmButton({
    onClick,
    disabled = false,
    children = "Confirm",
    className = "",
  }) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white px-5 pb-6 pt-3  z-50">
        <button
          onClick={onClick}
          disabled={disabled}
          className={`w-full py-3 rounded-2xl text-lg font-medium transition ${className} ${
            disabled
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-orange-400 text-white"
          }`}
        >
          {children}
        </button>
      </div>
    );
  }
  