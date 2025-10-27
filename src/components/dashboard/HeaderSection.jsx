import { useNavigate } from "react-router-dom";

export default function HeaderSection() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img
          src="/avatar.png" 
          alt="profile"
          className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition"
          onClick={() => navigate("/app/profile/edit")} 
          title="Lihat & Edit Profil"
        />
        <div>
          <h2 className="font-bold text-lg">Hi Ahong!</h2>
          <p className="text-orange-500">Welcome back</p>
        </div>
      </div>
    </div>
  );
}
