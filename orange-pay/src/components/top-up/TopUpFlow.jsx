import { useEffect, useState } from "react";
import TopUpMethod from "./TopUpMethod";
import TopUpAmount from "./TopUpAmount";
import TopUpConfirmationStep from "./TopUpConfirmationStep";
import { useTopUp } from "../../hooks/api/useTopUp";

const SS_KEY = "topupFlowState"; // simpan step di sessionStorage (opsional)

export default function TopUpFlow() {
  const [step, setStep] = useState("method"); // 'method' | 'amount' | 'confirmation'
  const [method, setMethod] = useState({ code: "BNI_VA", name: "BNI Virtual Account" });
  const [amount, setAmount] = useState("");
  const [confirmData, setConfirmData] = useState(null); // { va, expiresAt, trxId }

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

  // Persist state
  useEffect(() => {
    sessionStorage.setItem(SS_KEY, JSON.stringify({ step, method, amount, confirmData }));
  }, [step, method, amount, confirmData]);

  const handleSelectMethod = (m) => {
    setMethod(m || { code: "BNI_VA", name: "BNI Virtual Account" });
    setStep("amount");
  };

  const handleConfirmAmount = async (amt) => {
    if (!amt) return;
    setAmount(amt);

    // Panggil API → tampilkan konfirmasi
    const r = await createTopUpSafe({ amount: amt, methodCode: method.code });
    if (!r) return; // error akan ditampilkan di Amount (via props)

    setConfirmData({
      va: r.virtualAccount || "7152635469183646",
      expiresAt: r.expiresAt,
      trxId: r.trxId,
    });
    setStep("confirmation");
  };

  const backFromAmount = () => setStep("method");
  const backFromConfirm = () => setStep("amount");

  const finish = () => {
    // reset flow (atau redirect ke dashboard)
    setStep("method");
    setAmount("");
    setConfirmData(null);
    sessionStorage.removeItem(SS_KEY);
  };

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
          onBack={backFromAmount}
          onConfirm={handleConfirmAmount}
        />
      )}

      {step === "confirmation" && confirmData && (
        <TopUpConfirmationStep
          amount={amount}
          va={confirmData.va}
          expiresAt={confirmData.expiresAt}
          onBack={backFromConfirm}
          onDone={finish}
        />
      )}
    </div>
  );
}
