import { useLocation, useNavigate } from "react-router-dom";
import ReceiptResult from "../components/split_bill/ReceiptResult";
import { useEffect } from "react";
import View from "../components/view/View";
export default function SplitBillReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const ocrResult = location.state;
  useEffect(() => {
    if (!ocrResult) {
      console.error(
        "Tidak ada data OCR untuk di-review, kembali ke splitbill."
      );
      navigate("/app/splitbill");
    }
  }, [ocrResult, navigate]);

  const handleBack = () => {
    navigate("/app/splitbill");
  };

  const handleConfirm = (finalBillData) => {
    console.log(
      "Split bill selesai, navigasi ke halaman confirmed:",
      finalBillData
    );
    navigate(`/app/splitbill/${finalBillData.billId}`);
  };

  if (!ocrResult) {
    return <div>Mengarahkan...</div>;
  }

  return (
    <View>
      <ReceiptResult
        receiptData={ocrResult}
        onBack={handleBack}
        onConfirm={handleConfirm}
      />
    </View>
  );
}
