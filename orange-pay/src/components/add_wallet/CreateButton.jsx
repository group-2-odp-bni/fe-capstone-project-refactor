export default function CreateButton({
  disabled,
  onClick,
  children = "Create Wallet",
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "w-full rounded-full py-3.5 text-white text-sm sm:text-base font-semibold",
        "shadow-sm transition active:scale-[.98]",
        disabled
          ? "bg-gray-300 cursor-not-allowed"
          : "bg-[#FFAE51] hover:bg-[#CF7309]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
