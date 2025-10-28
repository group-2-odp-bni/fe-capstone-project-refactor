import { useEffect, useState, useMemo } from "react";
import TopUpMethod from "./TopUpMethod";
import TopUpAmount from "./TopUpAmount";
import TopUpConfirmationStep from "./TopUpConfirmationStep";
import TopUpSuccessPage from "./TopUpSuccessPage"; // ⬅️ tambahkan file ini (yang mirip screenshot sukses)
import { useTopUp } from "../../hooks/api/useTopUp";

const SS_KEY = "topupFlowState";

export default function TopUpFlow() {
  // 'method' | 'amount' | 'confirmation' | 'success'
  const [step, setStep] = useState("method");
  const [method, setMethod] = useState({ code: "BNI_VA", name: "BNI Virtual Account" });
  const [amount, setAmount] = useState(""); // simpan input apa adanya, kirim ke API sebagai number
  const [confirmData, setConfirmData] = useState(null); // { va, expiresAt, trxId, completedAt? }

  const { createTopUpSafe, loading, error } = useTopUp();

  // Restore state (opsional)
  useEffect(() => {
    try {
      const s = sessionStorage.getItem(SS_KEY);
      if (!s) return;
      const parsed = JSON.parse(s);
      if (parsed?.step) setStep(parsed.step);
      if (parsed?.method) setMethod(parsed.method);
      if (parsed?.amount) setAmount(parsed.amount);
      if (parsed?.confirmData) setConfirmData(parsed.confirmData);
    } catch {}
  }, []);

  // Persist state (opsional)
  useEffect(() => {
    sessionStorage.setItem(SS_KEY, JSON.stringify({ step, method, amount, confirmData }));
  }, [step, method, amount, confirmData]);

  const handleSelectMethod = (m) => {
    setMethod(m || { code: "BNI_VA", name: "BNI Virtual Account" });
    setStep("amount");
  };

  const handleConfirmAmount = async (amt) => {
    const nAmt = Number(amt);
    if (!nAmt || Number.isNaN(nAmt)) return;

    setAmount(nAmt);

    // Panggil API → tampilkan konfirmasi
    const r = await createTopUpSafe({ amount: nAmt, methodCode: method.code });
    if (!r) return; // error tampil via props di Amount

    setConfirmData({
      va: r.virtualAccount || "7152635469183646",
      expiresAt: r.expiresAt || null,
      trxId: r.trxId || r.referenceId || "",
      completedAt: r.completedAt || new Date().toISOString(),
    });
    setStep("confirmation");
  };

  const backFromAmount = () => setStep("method");
  const backFromConfirm = () => setStep("amount");

  // Dari konfirmasi → sukses (tanpa routing)
  const goSuccess = () => setStep("success");

  // Selesai di halaman sukses → reset ke awal
  const resetFlow = () => {
    setStep("method");
    setAmount("");
    setConfirmData(null);
    sessionStorage.removeItem(SS_KEY);
  };

  // Format data untuk halaman sukses (bisa ambil dari confirmData/API)
  const successProps = useMemo(
    () => ({
      amount: Number(amount) || 0,
      brand: "RANGE-PAY",
      brandIcon: "/orange.jpg",
      recipientName: "Ahong",            // kalau punya data penerima nyata, ganti dari state/props
      recipientPhone: "+62 8567 7122 534",
      refId: confirmData?.trxId || "",
      completedAt: confirmData?.completedAt || new Date().toISOString(),
      txType: "Top Up",
    }),
    [amount, confirmData]
  );

  return (
    <div className="w-full">
      {step === "method" && (
        <TopUpMethod defaultMethod={method} onSelect={handleSelectMethod} />
      )}

      {step === "amount" && (
        <TopUpAmount
          method={method}
          loading={loading}
          error={error}
          onBack={loading ? undefined : backFromAmount}
          onConfirm={handleConfirmAmount}
        />
      )}

      {step === "confirmation" && confirmData && (
        <TopUpConfirmationStep
          amount={amount}
          va={confirmData.va}
          expiresAt={confirmData.expiresAt}
          onBack={backFromConfirm}
          onDone={goSuccess}   // ⬅️ klik Done langsung ganti ke halaman sukses
        />
      )}

      {step === "success" && confirmData && (
        <TopUpSuccessPage
          {...successProps}
          onPrimary={resetFlow} // tombol "Done" pada halaman sukses
        />
      )}
    </div>
  );
}
