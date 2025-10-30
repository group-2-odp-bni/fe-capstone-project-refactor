// TopUpPage.jsx (atau TopUp.jsx)
import HeaderSection from "../components/dashboard/HeaderSection";
import TopUpFlow from "../components/top-up/TopUpFlow";
import DynamicShell from "../components/layout/DynamicShell";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

export default function TopUpPage() {

  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof onBack === "function") return onBack();
    navigate(-1);
  };

  return (  
    <DynamicShell>
      <Header title="Top Up" onBack={handleBack} showBack centerTitle />
      <TopUpFlow />
    </DynamicShell>
  );
}