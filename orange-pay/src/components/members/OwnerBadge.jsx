import React from "react";

export default function OwnerBadge({ name, initials = "?" }) {
  return (
    <div className="row-card">
      <div className="avatar">{initials}</div>
      <div className="col">
        <div className="title">{name}</div>
      </div>
    </div>
  );
}
