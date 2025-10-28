// src/components/ProfileCard.jsx
import React from "react";
import { useProfile } from "../../context/ProfileContext";

function ProfileCard({ maxWidth = 380 }) {
  const { user, logout, setView } = useProfile();

  if (!user) {
    return (
      <div
        style={{
          padding: 24,
          fontFamily: "'Poppins', sans-serif",
          textAlign: "center",
        }}
      >
        <p>Session ended. Please log in again.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#FE9F2E",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ marginTop: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "#6EC6CA",
              width: 96,
              height: 96,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "4px solid #fff",
            }}
          >
            <span style={{ fontSize: 48 }}>{user.avatarEmoji}</span>
          </div>
          <div style={{ color: "#fff" }}>
            <div style={{ fontWeight: 600, fontSize: 18 }}>{user.name}</div>
            <div style={{ fontSize: 13 }}>{user.email}</div>
            <div style={{ fontSize: 13 }}>{user.phone}</div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div
        style={{
          background: "#fff",
          width: "90%",
          borderRadius: 28,
          marginTop: 28,
          padding: 24,
          boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h3 style={{ fontWeight: 600, fontSize: 18 }}>Akun Saya</h3>
        <div
          style={{
            borderTop: "1px solid #f0f0f0",
            borderBottom: "1px solid #f0f0f0",
            padding: "12px 0",
            cursor: "pointer",
          }}
          onClick={() => setView("details")}
        >
          Data Pribadi →
        </div>
      </div>

      {/* Logout */}
        <button
        onClick={logout}
        style={{
        backgroundColor: "#000",
        color: "#fff",
        border: "none",
        borderRadius: 12,
        padding: "12px 48px",
        fontSize: 16,
        fontWeight: 500,
        cursor: "pointer",
        transition: "0.3s",
        }}
        >
        Keluar
        </button>
    </div>
  );
}

export default ProfileCard;
