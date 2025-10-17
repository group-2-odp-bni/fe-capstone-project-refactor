import useRecentTransfer from "../../hooks/api/useRecentTransfer";

const letterColorMap = {
  A: "bg-red-200",
  B: "bg-orange-200",
  C: "bg-amber-200",
  D: "bg-yellow-200",
  E: "bg-lime-200",
  F: "bg-green-200",
  G: "bg-emerald-200",
  H: "bg-teal-200",
  I: "bg-cyan-200",
  J: "bg-sky-200",
  K: "bg-blue-200",
  L: "bg-indigo-200",
  M: "bg-violet-200",
  N: "bg-purple-200",
  O: "bg-fuchsia-200",
  P: "bg-pink-200",
  Q: "bg-rose-200",
  R: "bg-red-300",
  S: "bg-orange-300",
  T: "bg-amber-300",
  U: "bg-yellow-300",
  V: "bg-lime-300",
  W: "bg-green-300",
  X: "bg-emerald-300",
  Y: "bg-teal-300",
  Z: "bg-cyan-300",
};

const getColorForName = (name = "") => {
  const first = name.charAt(0).toUpperCase();
  return letterColorMap[first] || "bg-gray-200";
};

export default function QuickTransfer() {
  const { users = [], loading } = useRecentTransfer();

  // Ensure always 4 slots for consistent layout
  const padded = [...users, ...Array(Math.max(0, 4 - users.length)).fill({ name: "" })].slice(0, 4);

  return (
    <div className="mt-6">
      {/* Title */}
      <h3 className="px-3 font-semibold text-lg text-gray-900 mb-3 text-left">Quick Transfer</h3>

      {/* Card container */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        {loading ? (
          // ✅ Loading skeleton
          <div className="flex justify-between">
            {[1, 2, 3, 4].map((_, i) => (
              <div key={i} className="flex flex-col items-center space-y-2">
                <div className="w-14 h-14 bg-gray-200 animate-pulse rounded-full" />
                <div className="w-12 h-3 bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : (
          // ✅ Always 4 slots
          <div className="flex justify-between">
            {users.map((user, index) => (
              <div key={index} className="flex flex-col items-center space-y-1">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-gray-700 font-bold text-xl ${getColorForName(
                    user.name
                  )}`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gray-800 font-medium">
                  {user.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
