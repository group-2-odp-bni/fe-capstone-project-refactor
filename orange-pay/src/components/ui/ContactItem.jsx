import React from "react";


export default function ContactItem({ contact, onClick }) {
const initials = (contact?.name || "U").split(" ")[0][0]?.toUpperCase() || "U";
return (
    <button
    onClick={() => onClick(contact)}
    className="w-full text-left py-3 flex items-center justify-between border-b border-gray-50 hover:bg-gray-50"
    >
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">{initials}</div>
            <div>
                <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                <div className="text-xs text-gray-500">{contact.phone}</div>
            </div>
        </div>
    </button>
);
}