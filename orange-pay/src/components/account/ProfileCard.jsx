// src/components/ProfileCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../../context/ProfileContext";

function ProfileCard({
  showBack = true,
  backAriaLabel = "Back",
}) {
  const { user, logout, setView } = useProfile();

  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof onBack === "function") return onBack();
    navigate(-1);
  }; 

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

        <div className="w-10 flex justify-start">
          {showBack ? (
            <button
              onClick={handleBack}
              aria-label={backAriaLabel}
              className="p-1 rounded-full hover:bg-gray-100 active:scale-95 transition"
            >
              <svg
                width="22"
                height="18"
                viewBox="0 0 22 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-gray-900"
              >
                <path
                  d="M1.3999 9H20.5999M1.3999 9L9.3999 1M1.3999 9L9.3999 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : (
            <div aria-hidden="true" />
          )}
        </div>

          <div
            style={{
              background: "#FFFFFF",
              width: 96,
              height: 96,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "4px solid #c2c2c2ff",
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
          backgroundColor: "#A72703",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          padding: "12px 48px",
          fontSize: 16,
          fontWeight: 500,
          cursor: "pointer",
          transition: "0.3s",
          marginTop: "auto", 
          marginBottom: 48,
        }}
        >
        Keluar
        </button>
    </div>
  );
}

export default ProfileCard;
