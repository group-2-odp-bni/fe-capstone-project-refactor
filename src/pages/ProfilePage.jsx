import React from "react";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const navigate = useNavigate();

  // mock data
  const user = {
    name: "Ahong",
    email: "rullyaisyah34@gmail.com",
    phone: "085514113111",
    avatar: "/avatar.png", 
  };

  //function logout
  const handleLogout = () => {
    
    alert("Mock: logout berhasil ✅");
    navigate("/app/dashboard", { replace: true }); 
  };

  return (
    <div className="min-h-screen bg-orange-400 p-6">
      <div className="max-w-md mx-auto">
        {/* header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center text-2xl"
            aria-label="back"
          >
            ←
          </button>

          <img
            src={user.avatar}
            alt="avatar"
            className="w-20 h-20 rounded-full border-4 border-orange-300"
          />

          <div className="text-white">
            <h1 className="text-2xl font-semibold">{user.name}</h1>
            <p className="text-sm">{user.email}</p>
            <p className="text-sm">{user.phone}</p>
          </div>
        </div>

        {/* card */}
        <div className="bg-white rounded-3xl mt-6 p-6">
          <h2 className="text-2xl font-bold mb-6">Akun Saya</h2>

          <button
            onClick={() => navigate("/app/profile/edit")}
            className="w-full text-left py-4 flex justify-between items-center border-b"
          >
            <span className="text-lg">Akun & Keamanan</span>
            <span className="text-gray-400">›</span>
          </button>

          <h3 className="text-2xl font-bold mt-6 mb-4">Support</h3>

          <button className="w-full text-left py-4 flex justify-between items-center border-b">
            <span className="text-lg">Call Centre</span>
            <span className="text-gray-400">›</span>
          </button>

          <div className="mt-10">
            <button
              className="w-full bg-emerald-800 text-white py-4 rounded-full text-lg hover:bg-emerald-900 transition"
              onClick={handleLogout} 
            >
              Keluar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
