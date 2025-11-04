import WalletAvatar from "./WalletAvatar";

export default function WalletSelectorButton({
  walletName = "Pilih wallet",
  walletId = "-",
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 border border-gray-200 rounded-2xl bg-white p-4 shadow-sm 
         hover:shadow-md active:scale-95 active:shadow-inner 
         transition-all duration-150 ease-out"
    >
      <WalletAvatar />
      <div className="flex-1 text-left">
        <p className="text-sm font-bold text-gray-900">{walletName}</p>
        <p className="text-xs text-gray-500">ID: {walletId}</p>
      </div>
      <span className="text-xs text-gray-500">Ganti</span>
    </button>
  );
}
