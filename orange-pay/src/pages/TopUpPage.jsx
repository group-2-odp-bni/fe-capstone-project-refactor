// TopUpPage.jsx (atau TopUp.jsx)
import HeaderSection from "../components/dashboard/HeaderSection";
import TopUpFlow from "../components/top-up/TopUpFlow";
import DynamicShell from "../components/layout/dynamicShell";

export default function TopUpPage() {
  return (
    <DynamicShell>
      <HeaderSection />
      <TopUpFlow />
    </DynamicShell>
  );
}
