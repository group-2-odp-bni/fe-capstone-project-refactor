import React, { useState } from "react";

export default function MemberRow({ member, onRemove }) {
  const [menu, setMenu] = useState(false);
  return (
    <div className="row-card">
      <div className="avatar">
        {member.initials || member.name?.[0]?.toUpperCase() || "?"}
      </div>
      <div className="col">
        <div className="title">{member.name}</div>
        <div className="subtitle">{member.phone}</div>
      </div>
      <button
        className="dots"
        onClick={() => setMenu((v) => !v)}
        aria-label="More"
      >
        ⋯
      </button>
      {menu && (
        <div className="menu">
          <button
            className="menu-item danger"
            onClick={() => {
              setMenu(false);
              onRemove?.();
            }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
