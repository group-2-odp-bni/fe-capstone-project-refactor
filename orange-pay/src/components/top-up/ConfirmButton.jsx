export default function ConfirmButton({
  label = "Confirm",
  onClick,
  disabled = false,
  loading = false,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full bg-[#FF9A25] hover:bg-orange-600 active:bg-orange-700 
                  text-white py-3 rounded-xl font-semibold 
                  disabled:opacity-50 disabled:cursor-not-allowed 
                  transition ${className}`}
    >
      {loading ? "Processing..." : label}
    </button>
  );
}
