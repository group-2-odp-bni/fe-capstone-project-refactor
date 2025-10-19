// HeaderSection.jsx
import { Link } from "react-router-dom";

export default function HeaderSection() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img src="/avatar.png" alt="avatar" className="w-9 h-9 rounded-full object-cover" />
        <div>
          <p className="text-sm text-brand-subtext">Hi, Bolabale 👋</p>
          <p className="text-xs text-brand-subtext">Welcome back</p>
        </div>
      </div>
      <Link to="/app/dashboard" className="text-sm font-medium text-brand-subtext hover:text-black">
        Riwayat
      </Link>
    </div>
  );
}
