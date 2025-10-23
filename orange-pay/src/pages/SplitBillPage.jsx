import DynamicShell from "../components/layout/dynamicShell";
import PageHeader from "../components/page_header/PageHeader";
import OpenSplitBill from "../components/split_bill/SplitBill.jsx";

export default function SplitBillPage() {
  return (
    <DynamicShell>
      <PageHeader>Split Bill</PageHeader>
      <OpenSplitBill />
    </DynamicShell>
  );
}