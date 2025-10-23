// TopUpPage.jsx (atau TopUp.jsx)
import TopUpFlow from "../components/top-up/TopUpFlow";
import DynamicShell from "../components/layout/dynamicShell";
import PageHeader from "../components/page_header/PageHeader";

export default function TopUpPage() {
  return (
    <DynamicShell>
      <PageHeader>Topup</PageHeader>
      <TopUpFlow />
    </DynamicShell>
  );
}