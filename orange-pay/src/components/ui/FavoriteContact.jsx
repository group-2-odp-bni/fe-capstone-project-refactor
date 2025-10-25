import React from "react";


export default function FavoriteContacts({ items = [], onPick }) {
if (!items || items.length === 0) return <div className="text-xs text-gray-400">No favorites</div>;


return (
    <div className="mb-4 flex-shrink-0">
        <div className="text-sm font-medium mb-3">Favorite</div>
        <div className="flex gap-3 overflow-x-auto pb-2">
            {items.map((f) => {
            const firstName = f.name?.split(" ")[0] || f.name || "";
            const initials = (firstName[0] || "").toUpperCase();
            return (
                <button key={f.phone} onClick={() => onPick(f)} className="flex-shrink-0 w-20 text-center">
                    <div className="mx-auto h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-sm font-semibold text-orange-700">
                    {initials}
                    </div>
                    <div className="mt-2 text-xs text-gray-700 truncate">{firstName}</div>
                </button>
            );
        })}
        </div>
    </div>
);
}