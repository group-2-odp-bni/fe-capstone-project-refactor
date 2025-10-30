import React from "react";

export default function PendingRow({ member }) {
  return (
    <div className="row-card">
      <div className="avatar">
        {member.initials || member.name?.[0]?.toUpperCase() || "?"}
      </div>
      <div className="col">
        <div className="title">{member.name}</div>
        <div className="subtitle">{member.phone}</div>
      </div>
      <span className="pill pill-waiting">{member.status || "Waiting"}</span>
    </div>
  );
}
