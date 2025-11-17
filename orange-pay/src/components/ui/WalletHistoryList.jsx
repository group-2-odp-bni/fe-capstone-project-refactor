// src/components/wallet/WalletHistoryList.jsx
export default function WalletHistoryList({ items = [] }) {
  return (
    <div className="flex flex-col gap-4 w-full mt-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex flex-col">
            <p className="text-sm font-medium text-gray-900">{item.title}</p>
            <p className="text-xs text-gray-500">{item.date}</p>
          </div>

          <p
            className={`text-sm font-semibold ${
              item.type === "credit" ? "text-green-600" : "text-red-600"
            }`}
          >
            {item.amount}
          </p>
        </div>
      ))}
    </div>
  );
}
