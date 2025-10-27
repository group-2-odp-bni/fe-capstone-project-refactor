import { Link, useLocation } from "react-router-dom";

export default function AddNewWalletCard() {
  const location = useLocation();

  return (
    <div className="rounded-[22px] bg-white/60 border-2 border-dashed border-gray-300 h-[168px] md:h-[190px] flex items-center justify-center">
      <Link
        to="/app/wallets/new"
        state={{ from: location }}
        className="flex items-center gap-2 text-gray-800 font-semibold hover:opacity-90 active:scale-95"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M11 11V6a1 1 0 1 1 2 0v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H6a1 1 0 1 1 0-2h5z" />
        </svg>
        <span>
          <span className="bg-yellow-300 px-1 rounded">Add New</span> Wallet
        </span>
      </Link>
    </div>
  );
}
