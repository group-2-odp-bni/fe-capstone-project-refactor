import React from "react";

export default function ContactSearch({ value, onChange }) {
  return (
    <div className="searchbox">
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Name or number"
        aria-label="Search contacts"
      />
    </div>
  );
}
