// TopUpPage.jsx (atau TopUp.jsx)
import HeaderSection from "../components/dashboard/HeaderSection";
import TopUpFlow from "../components/top-up/TopUpFlow";
import DynamicShell from "../components/layout/dynamicShell";
import BackButton from "../components/common/BackButton";
import PageHeader from "../components/page_header/PageHeader";

export default function TopUpPage() {
  return (
    <DynamicShell>
      <PageHeader>Topup</PageHeader>
    </DynamicShell>
  );
}
