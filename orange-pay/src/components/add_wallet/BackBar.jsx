import { useNavigate } from "react-router-dom";

export default function BackBar({ title = "Add New Wallet" }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3 py-3 px-4 sm:px-6">
      <button
        onClick={() => navigate(-1)}
        className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:scale-95 transition"
        aria-label="Back"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <h1 className="text-lg sm:text-xl font-extrabold">
        <span className="bg-yellow-300 px-1.5 rounded-sm mr-1">Add New</span>{" "}
        Wallet
      </h1>
    </div>
  );
}
