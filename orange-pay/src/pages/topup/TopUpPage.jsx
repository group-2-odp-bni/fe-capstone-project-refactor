// TopUpPage.jsx (atau TopUp.jsx)
import TopUpFlow from "../../components/top-up/TopUpFlow";
import DynamicShell from "../../components/layout/dynamicShell";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";
import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import MobileShell from "../../components/layout/MobileShell";

export default function TopUpPage() {

  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof onBack === "function") return onBack();
    navigate(-1);
  };

  return (
    <PhoneLayoutBackground>
      <MobileShell>
        <Header title="Top Up" onBack={handleBack} showBack centerTitle />
      <TopUpFlow />
      </MobileShell>

    </PhoneLayoutBackground>
      
  );
}