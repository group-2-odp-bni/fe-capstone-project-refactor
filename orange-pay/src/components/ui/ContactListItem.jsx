// src/components/ui/ContactListItem.jsx
export default function ContactListItem({ contact = {}, onPick = () => {}, className = "" }) {
  const name = contact.name || "Unknown";
  const phone = contact.phone || "";
  const firstWord = (name || "").split(" ")[0] || "";
  const initial = (firstWord[0] || "").toUpperCase() || "U";

  return (
    <button
      type="button"
      onClick={() => onPick(contact)} // ✅ correct prop usage
      className={[
        "w-full text-left py-3 flex items-center justify-between border-b border-gray-50 hover:bg-gray-50 focus:outline-none",
        className,
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
          {initial}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">{name}</div>
          <div className="text-xs text-gray-500 truncate">{phone}</div>
        </div>
      </div>
      <div className="ml-3 text-gray-300" aria-hidden>›</div>
    </button>
  );
}
