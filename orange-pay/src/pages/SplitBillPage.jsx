import OpenSplitBill from "../components/split_bill/SplitBill";
import PageHeader from "../components/page_header/PageHeader";
import View from "../components/view/View";


export default function SplitBillPage() {
  return (
    <View>
      <PageHeader>Split Bill</PageHeader>
      <OpenSplitBill />
    </View>
  );
}