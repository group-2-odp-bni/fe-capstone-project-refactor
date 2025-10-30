import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DynamicShell from "../components/layout/DynamicShell";
import BackBar from "../components/add_wallet/BackBar";
import WalletTypeOption from "../components/add_wallet/WalletTypeOption";
import WalletCardPreview from "../components/add_wallet/WalletCardPreview";
import WalletColorPicker, {
  DEFAULT_GRADIENT,
} from "../components/add_wallet/WalletColorPicker";
import WalletNameField from "../components/add_wallet/WalletNameField";
import CreateButton from "../components/add_wallet/CreateButton";

export default function AddWalletPage() {
  const [step, setStep] = useState(1);
  const [type, setType] = useState("personal");
  const [name, setName] = useState("");
  const [gradient, setGradient] = useState(DEFAULT_GRADIENT);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const subtitle = useMemo(
    () =>
      type === "personal"
        ? "Personal wallet for your personal needs and everyday transactions"
        : "Shared wallet for groups savings",
    [type]
  );

  const canContinue = step === 1 ? !!type : name.trim().length > 0;

  const handleCreate = async () => {
    if (!canContinue) return;
    try {
      setSubmitting(true);
      //   await createWalletApi({
      //     type: type === "personal" ? "PERSONAL" : "SHARED",
      //     name: name.trim(),
      //     currency: "IDR",
      //     color: gradient,
      //     metadata: { theme: "gradient-v1" },
      //   });
      const from = location.state?.from?.pathname || location.state?.from;
      navigate(from || "/app/dashboard", { replace: true });
    } catch (e) {
      alert(e.message || "Failed to create wallet");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DynamicShell>
      <div className="mx-auto w-full max-w-md sm:max-w-lg">
        <BackBar />
        {step === 1 && (
          <section className="px-4 sm:px-6 pt-2 pb-6">
            <h2 className="text-sm text-gray-800 font-semibold mb-3">
              Pick your Wallet Type
            </h2>
            <div className="space-y-4">
              <WalletTypeOption
                value="personal"
                active={type === "personal"}
                badge="Personal"
                label="Personal wallet"
                subtitle="Personal wallet for your personal needs and everyday transactions"
                onSelect={setType}
              />
              <WalletTypeOption
                value="shared"
                active={type === "shared"}
                badge="Shared"
                label="Shared wallet"
                subtitle="Shared wallet for groups savings"
                onSelect={setType}
              />
            </div>
            <div className="mt-6">
              <CreateButton onClick={() => setStep(2)} disabled={!canContinue}>
                Continue
              </CreateButton>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="px-4 sm:px-6 pt-2 pb-8">
            <h2 className="text-sm text-gray-800 font-semibold mb-3">
              {type === "personal" ? "Personal Wallet" : "Shared Wallet"}
            </h2>

            <div className="mb-5">
              <WalletCardPreview
                variant={type}
                name={name}
                balance={0}
                gradient={gradient}
                rightBadge={type === "personal" || type ==="shared" && name ? name : ""}
              />
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-600 mb-2">
                Pick your wallet color
              </p>
              <WalletColorPicker value={gradient} onChange={setGradient} />
            </div>

            <div className="mb-6">
              <WalletNameField value={name} onChange={setName} max={15} />
            </div>

            <CreateButton
              onClick={handleCreate}
              disabled={!canContinue || submitting}
            >
              {submitting ? "Creating..." : "Create Wallet"}
            </CreateButton>
          </section>
        )}
      </div>
    </DynamicShell>
  );
}
