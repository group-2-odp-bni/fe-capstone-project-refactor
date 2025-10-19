import { Outlet } from "react-router-dom";
import MobileShell from "../components/layout/MobileShell";

export default function LoginPage() {
  return (
    <div className="min-h-dvh w-full flex items-center justify-center bg-slate-100 p-4">
      <MobileShell bg="bg-white">
        <Outlet />
      </MobileShell>
    </div>
  );
}
