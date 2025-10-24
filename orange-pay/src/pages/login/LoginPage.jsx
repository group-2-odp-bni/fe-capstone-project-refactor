import { Outlet } from "react-router-dom";
import MobileShell from "../../components/layout/MobileShell";
import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";

export default function LoginPage() {
  return (
    <PhoneLayoutBackground>
      <MobileShell bg="bg-white">
        
        <Outlet />
      </MobileShell>
    </PhoneLayoutBackground>
  );
}
