import React from "react";
import { useNavigate } from "react-router-dom";

export default function SuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-orange-400 p-6 flex items-center justify-center">
      <div className="max-w-xs bg-white rounded-3xl p-8 text-center shadow">
        <div className="w-28 h-28 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="text-lg font-medium">Data Anda Berhasil Diperbarui</p>

        <div className="mt-6">
          <button className="px-6 py-3 bg-emerald-800 text-white rounded-full" onClick={() => navigate("/app/profile")}>
            Kembali ke Profil
          </button>
        </div>
      </div>
    </div>
  );
}
