import OpenSplitBill from "../components/split_bill/SplitBill";
import PageHeader from "../components/page_header/PageHeader";
import DynamicShell from "../components/layout/DynamicShell";


export default function SplitBillPage() {
  return (
    <DynamicShell>
      <PageHeader>Split Bill</PageHeader>
      <OpenSplitBill />
    </DynamicShell>
  );
}