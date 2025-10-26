import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function EditProfilePage() {
  const navigate = useNavigate();

  
  const [name, setName] = useState("Ahong");
  const [email, setEmail] = useState("rullyaisyah34@gmail.com");
  const [phone, setPhone] = useState("856776122661");
  const [countryCode] = useState("+62");

  const onSubmit = (e) => {
    e.preventDefault();
    
    navigate("/app/profile/otp", { state: { phone: `${countryCode}${phone}` } });
  };

  return (
    <div className="min-h-screen bg-orange-400 p-6">
      <div className="max-w-md mx-auto bg-white rounded-3xl p-6">
        <button onClick={() => navigate(-1)} className="mb-4 text-lg">← Kembali</button>
        <h1 className="text-center text-2xl font-bold mb-6">Akun Saya</h1>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="font-medium">Nama Lengkap</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full border rounded-lg p-3 shadow-sm"
            />
          </div>

          <div>
            <label className="font-medium">Alamat Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full border rounded-lg p-3 shadow-sm"
            />
          </div>

          <div>
            <label className="font-medium">Nomor HP</label>
            <div className="flex gap-2 mt-2">
              <div className="px-4 py-3 border rounded-l-lg bg-gray-100">{countryCode}</div>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 border rounded-r-lg p-3 shadow-sm"
              />
            </div>
          </div>

          <div className="mt-8">
            <button
              type="submit"
              className="w-full bg-emerald-800 text-white py-4 rounded-full text-lg"
            >
              Ubah Akun Saya
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
